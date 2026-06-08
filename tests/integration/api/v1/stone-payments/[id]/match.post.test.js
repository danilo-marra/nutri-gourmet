import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";

const BASE_URL = "http://localhost:3000/api/v1";
const WEBHOOK_URL = `${BASE_URL}/webhooks/stone/payment`;
const TEST_SECRET = "test-stone-secret";
const STONE_OPERATOR_ID = "00000000-0000-4000-8000-000000000001";

function basicAuthHeader(secret) {
  return "Basic " + Buffer.from(`webhook:${secret}`).toString("base64");
}

async function postWebhookAndGetPending(orderId, amountCentavos = 4000) {
  const payload = {
    id: "hook_match_test",
    event: "order.paid",
    data: {
      id: orderId,
      amount: amountCentavos,
      currency: "BRL",
      status: "paid",
      customer: { name: "Pai Match", email: "match@example.com" },
      charge: { payment_method: "credit_card" },
    },
  };
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(TEST_SECRET),
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

function matchUrl(pendingId) {
  return `${BASE_URL}/stone-payments/${pendingId}/match`;
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

describe("POST /api/v1/stone-payments/:id/match", () => {
  describe("Controle de acesso", () => {
    test("Anônimo recebe 403", async () => {
      const response = await fetch(
        matchUrl("00000000-0000-4000-8000-000000000099"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: "00000000-0000-4000-8000-000000000000",
          }),
        },
      );
      expect(response.status).toBe(403);
    });

    test("Operador recebe 403", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operador.id);

      const response = await fetch(
        matchUrl("00000000-0000-4000-8000-000000000099"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            student_id: "00000000-0000-4000-8000-000000000000",
          }),
        },
      );
      expect(response.status).toBe(403);
    });
  });

  describe("Supervisor autenticado", () => {
    test("Match válido cria credit_transaction e aumenta saldo do aluno", async () => {
      const pending = await postWebhookAndGetPending("or_match_001", 8000);
      const student = await orchestrator.createStudent();
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(matchUrl(pending.id), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ student_id: student.id }),
      });

      expect(response.status).toBe(200);
      const tx = await response.json();

      expect(uuidVersion(tx.id)).toBe(4);
      expect(tx.student_id).toBe(student.id);
      expect(tx.amount).toBe("80.00");
      expect(tx.type).toBe("stone");
      expect(tx.stone_payment_id).toBe("or_match_001");
      expect(tx.balance_after).toBe("80.00");

      const studentRow = await database.query({
        text: "SELECT balance FROM students WHERE id = $1",
        values: [student.id],
      });
      expect(studentRow.rows[0].balance).toBe("80.00");

      const pendingRow = await database.query({
        text: "SELECT matched_at, credit_transaction_id FROM pending_stone_payments WHERE id = $1",
        values: [pending.id],
      });
      expect(pendingRow.rows[0].matched_at).not.toBeNull();
      expect(pendingRow.rows[0].credit_transaction_id).toBe(tx.id);
    });

    test("Match duplicado retorna 200 com a mesma transaction", async () => {
      const pending = await postWebhookAndGetPending("or_match_002", 3000);
      const student = await orchestrator.createStudent();
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const opts = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ student_id: student.id }),
      };

      const first = await (await fetch(matchUrl(pending.id), opts)).json();
      const second = await (await fetch(matchUrl(pending.id), opts)).json();

      expect(first.id).toBe(second.id);
    });

    test("ID inválido retorna 404", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        matchUrl("00000000-0000-4000-8888-000000000000"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            student_id: "00000000-0000-4000-8000-000000000000",
          }),
        },
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.name).toBe("NotFoundError");
    });
  });
});
