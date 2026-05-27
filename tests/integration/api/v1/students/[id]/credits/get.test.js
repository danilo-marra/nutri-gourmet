import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/students/:id/credits", () => {
  describe("Anonymous user", () => {
    test("Without session cookie", async () => {
      const student = await orchestrator.createStudent();

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/credits`,
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:credit".',
        status_code: 403,
      });
    });
  });

  describe("Operador user", () => {
    test("Non-existent student", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/students/00000000-0000-0000-0000-000000000000/credits",
        {
          headers: { Cookie: `session_id=${operadorSession.token}` },
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("NotFoundError");
    });

    test("Empty list", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);
      const student = await orchestrator.createStudent();

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/credits`,
        {
          headers: { Cookie: `session_id=${operadorSession.token}` },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual([]);
    });

    test("List with transactions", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);
      const student = await orchestrator.createStudent();

      await orchestrator.createCreditTransaction(student.id, operador.id, {
        amount: 10,
        type: "manual",
      });
      await orchestrator.createCreditTransaction(student.id, operador.id, {
        amount: 25,
        type: "manual",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/credits`,
        {
          headers: { Cookie: `session_id=${operadorSession.token}` },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toHaveLength(2);

      const first = responseBody[0];
      expect(first).toEqual({
        id: first.id,
        student_id: student.id,
        operator_id: operador.id,
        amount: "25.00",
        type: "manual",
        balance_after: "35.00",
        expires_at: null,
        created_at: first.created_at,
        updated_at: first.updated_at,
      });

      expect(uuidVersion(first.id)).toBe(4);
      expect(Date.parse(first.created_at)).not.toBeNaN();
    });
  });
});
