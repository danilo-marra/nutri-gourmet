import crypto from "crypto";
import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";

const WEBHOOK_URL = "http://localhost:3000/api/v1/webhooks/stone/payment";

// Deve ser igual ao STONE_WEBHOOK_SECRET em .env.development
const TEST_SECRET = "test-stone-secret";

// UUID fixo que corresponde ao STONE_OPERATOR_ID em .env.development.
// O sistema usa esse usuário como operador de transações automáticas Stone.
const STONE_OPERATOR_ID = "00000000-0000-4000-8000-000000000001";

function computeSignature(body) {
  return crypto.createHmac("sha256", TEST_SECRET).update(body).digest("hex");
}

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();

  // Insere o usuário-sistema referenciado por STONE_OPERATOR_ID.
  // Não usa user.create() porque precisamos de um UUID fixo.
  await database.query({
    text: `
      INSERT INTO users (id, username, email, password, role)
      VALUES ($1, 'stone-system', 'stone@system.local',
              '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
              'operador')
    `,
    values: [STONE_OPERATOR_ID],
  });
});

describe("POST /api/v1/webhooks/stone/payment", () => {
  describe("HMAC validation", () => {
    test("Missing signature header", async () => {
      const body = JSON.stringify({
        id: "txn_no_sig",
        amount: 50,
        metadata: { student_id: "00000000-0000-0000-0000-000000000000" },
      });

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("UnauthorizedError");
      expect(responseBody.status_code).toBe(401);
    });

    test("Invalid signature", async () => {
      const body = JSON.stringify({
        id: "txn_bad_sig",
        amount: 50,
        metadata: { student_id: "00000000-0000-0000-0000-000000000000" },
      });

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-stone-signature": "wrong-signature",
        },
        body,
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("UnauthorizedError");
    });
  });

  describe("Valid webhook", () => {
    test("Creates credit_transaction and increases student balance", async () => {
      const student = await orchestrator.createStudent();

      const payload = {
        id: "txn_valid_001",
        amount: 75.0,
        metadata: { student_id: student.id },
      };
      const body = JSON.stringify(payload);

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-stone-signature": computeSignature(body),
        },
        body,
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(responseBody.student_id).toBe(student.id);
      expect(responseBody.operator_id).toBe(STONE_OPERATOR_ID);
      expect(responseBody.amount).toBe("75.00");
      expect(responseBody.type).toBe("stone");
      expect(responseBody.stone_payment_id).toBe("txn_valid_001");
      expect(responseBody.balance_after).toBe("75.00");
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
    });

    test("Duplicate stone_payment_id returns 200 without creating duplicate", async () => {
      const student = await orchestrator.createStudent();

      const payload = {
        id: "txn_duplicate_001",
        amount: 30.0,
        metadata: { student_id: student.id },
      };
      const body = JSON.stringify(payload);
      const headers = {
        "Content-Type": "application/json",
        "x-stone-signature": computeSignature(body),
      };

      const firstResponse = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers,
        body,
      });
      expect(firstResponse.status).toBe(200);
      const firstBody = await firstResponse.json();

      const secondResponse = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers,
        body,
      });
      expect(secondResponse.status).toBe(200);
      const secondBody = await secondResponse.json();

      // Mesmo registro retornado — sem duplicata
      expect(firstBody.id).toBe(secondBody.id);
      expect(firstBody.stone_payment_id).toBe("txn_duplicate_001");

      // Saldo reflete apenas uma adição
      const studentResult = await database.query({
        text: "SELECT balance FROM students WHERE id = $1",
        values: [student.id],
      });
      expect(studentResult.rows[0].balance).toBe("30.00");
    });
  });
});
