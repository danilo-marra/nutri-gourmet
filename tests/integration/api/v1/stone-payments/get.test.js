import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";

const BASE_URL = "http://localhost:3000/api/v1";
const WEBHOOK_URL = `${BASE_URL}/webhooks/stone/payment`;
const LIST_URL = `${BASE_URL}/stone-payments`;
const TEST_SECRET = "test-stone-secret";
const STONE_OPERATOR_ID = "00000000-0000-4000-8000-000000000001";

function basicAuthHeader(secret) {
  return "Basic " + Buffer.from(`webhook:${secret}`).toString("base64");
}

async function postWebhook(orderId, amountCentavos = 2000) {
  const payload = {
    id: "hook_list_test",
    event: "order.paid",
    data: {
      id: orderId,
      amount: amountCentavos,
      currency: "BRL",
      status: "paid",
      customer: { name: "Pai Teste", email: "pai@example.com" },
      charge: { payment_method: "pix" },
    },
  };
  return fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(TEST_SECRET),
    },
    body: JSON.stringify(payload),
  });
}

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();

  await database.query({
    text: `
      INSERT INTO users (id, username, email, password, role)
      VALUES ($1, 'stone-system', 'stone@system.local',
              '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
              'operador')
    `,
    values: [STONE_OPERATOR_ID],
  });
}, 60000);

describe("GET /api/v1/stone-payments", () => {
  describe("Controle de acesso", () => {
    test("Anônimo recebe 403", async () => {
      const response = await fetch(LIST_URL);
      expect(response.status).toBe(403);
    });

    test("Operador recebe 403", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operador.id);

      const response = await fetch(LIST_URL, {
        headers: { Cookie: `session_id=${session.token}` },
      });
      expect(response.status).toBe(403);
    });
  });

  describe("Supervisor autenticado", () => {
    test("Lista pagamentos pendentes", async () => {
      await postWebhook("or_list_001", 5000);

      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(LIST_URL, {
        headers: { Cookie: `session_id=${session.token}` },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);

      const found = body.find((p) => p.stone_payment_id === "or_list_001");
      expect(found).toBeDefined();
      expect(found.amount).toBe("50.00");
      expect(found.matched_at).toBeNull();
    });
  });
});
