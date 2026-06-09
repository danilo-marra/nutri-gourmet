import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";

const WEBHOOK_URL = "http://localhost:3000/api/v1/webhooks/stone/payment";

// Deve ser igual ao STONE_WEBHOOK_SECRET em .env.development
const TEST_SECRET = "test-stone-secret";

// UUID fixo que corresponde ao STONE_OPERATOR_ID em .env.development.
const STONE_OPERATOR_ID = "00000000-0000-4000-8000-000000000001";

function basicAuthHeader(secret) {
  return "Basic " + Buffer.from(`webhook:${secret}`).toString("base64");
}

function buildPayload(overrides = {}) {
  return {
    id: "hook_test001",
    event: "order.paid",
    data: {
      id: overrides.orderId ?? "or_test000000000001",
      code: "TESTCODE01",
      amount: overrides.amountCentavos ?? 5000,
      currency: "BRL",
      status: "paid",
      customer: {
        name: "João Responsável",
        email: "joao@example.com",
      },
      charge: {
        payment_method: "pix",
      },
    },
    ...overrides.top,
  };
}

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();

  // Insere o usuário-sistema referenciado por STONE_OPERATOR_ID.
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

describe("POST /api/v1/webhooks/stone/payment", () => {
  describe("Autenticação Basic Auth", () => {
    test("Sem header Authorization retorna 401", async () => {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.name).toBe("UnauthorizedError");
    });

    test("Secret incorreto retorna 401", async () => {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: basicAuthHeader("wrong-secret"),
        },
        body: JSON.stringify(buildPayload()),
      });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.name).toBe("UnauthorizedError");
    });
  });

  describe("Filtro de evento", () => {
    test("Evento diferente de order.paid retorna 200 sem criar registro", async () => {
      const payload = buildPayload({ top: { event: "order.created" } });

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: basicAuthHeader(TEST_SECRET),
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(200);

      const result = await database.query({
        text: "SELECT * FROM pending_stone_payments WHERE stone_payment_id = $1",
        values: [payload.data.id],
      });
      expect(result.rows).toHaveLength(0);
    });
  });

  describe("Pagamento válido", () => {
    test("Cria pending_stone_payment com campos corretos", async () => {
      const payload = buildPayload({
        orderId: "or_valid_001",
        amountCentavos: 7500,
      });

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: basicAuthHeader(TEST_SECRET),
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(uuidVersion(body.id)).toBe(4);
      expect(body.stone_payment_id).toBe("or_valid_001");
      expect(body.amount).toBe("75.00");
      expect(body.payer_name).toBe("João Responsável");
      expect(body.payer_email).toBe("joao@example.com");
      expect(body.payment_method).toBe("pix");
      expect(body.matched_at).toBeNull();
    });

    test("stone_payment_id duplicado retorna 200 sem criar duplicate", async () => {
      const payload = buildPayload({
        orderId: "or_dup_001",
        amountCentavos: 3000,
      });
      const opts = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: basicAuthHeader(TEST_SECRET),
        },
        body: JSON.stringify(payload),
      };

      const first = await (await fetch(WEBHOOK_URL, opts)).json();
      const second = await (await fetch(WEBHOOK_URL, opts)).json();

      expect(first.id).toBe(second.id);

      const count = await database.query({
        text: "SELECT COUNT(*) FROM pending_stone_payments WHERE stone_payment_id = $1",
        values: ["or_dup_001"],
      });
      expect(count.rows[0].count).toBe("1");
    });
  });
});
