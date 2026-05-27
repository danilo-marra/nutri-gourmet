import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/students/:id/credits", () => {
  describe("Anonymous user", () => {
    test("Without session cookie", async () => {
      const student = await orchestrator.createStudent();

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/credits`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 10, type: "manual" }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "create:credit".',
        status_code: 403,
      });
    });
  });

  describe("Operador user", () => {
    test("Trying to create a package (no permission)", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);
      const student = await orchestrator.createStudent();

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/credits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${operadorSession.token}`,
          },
          body: JSON.stringify({ amount: 50, type: "package" }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para registrar um pacote.",
        action: 'Verifique se o seu usuário possui a feature "create:package".',
        status_code: 403,
      });
    });

    test("With student balance < 0 (blocked)", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);
      const student = await orchestrator.createStudent();

      await database.query({
        text: "UPDATE students SET balance = -10 WHERE id = $1",
        values: [student.id],
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/credits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${operadorSession.token}`,
          },
          body: JSON.stringify({ amount: 10, type: "manual" }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Saldo negativo: apenas supervisor ou admin pode creditar.",
        action:
          "Entre em contato com o supervisor ou administrador para adicionar crédito.",
        status_code: 403,
      });
    });

    test("With valid manual credit", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);
      const student = await orchestrator.createStudent();

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/credits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${operadorSession.token}`,
          },
          body: JSON.stringify({ amount: 15.5, type: "manual" }),
        },
      );

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        student_id: student.id,
        operator_id: operador.id,
        amount: "15.50",
        type: "manual",
        balance_after: "15.50",
        expires_at: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
    });
  });

  describe("Supervisor user", () => {
    test("Non-existent student", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/students/00000000-0000-0000-0000-000000000000/credits",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${supervisorSession.token}`,
          },
          body: JSON.stringify({ amount: 10, type: "manual" }),
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("NotFoundError");
    });

    test("With missing 'amount'", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const student = await orchestrator.createStudent();

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/credits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${supervisorSession.token}`,
          },
          body: JSON.stringify({ type: "manual" }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O campo 'amount' é obrigatório.",
        action: "Informe o valor do crédito e tente novamente.",
        status_code: 400,
      });
    });

    test("With amount = 0", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const student = await orchestrator.createStudent();

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/credits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${supervisorSession.token}`,
          },
          body: JSON.stringify({ amount: 0, type: "manual" }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O campo 'amount' deve ser um número maior que zero.",
        action: "Informe um valor positivo para o crédito.",
        status_code: 400,
      });
    });

    test("With invalid 'type'", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const student = await orchestrator.createStudent();

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/credits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${supervisorSession.token}`,
          },
          body: JSON.stringify({ amount: 10, type: "invalido" }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O campo 'type' deve ser 'manual' ou 'package'.",
        action: "Informe um tipo válido para o crédito.",
        status_code: 400,
      });
    });

    test("With valid package and expires_at", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const student = await orchestrator.createStudent();

      const expiresAt = "2026-12-31T00:00:00.000Z";

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/credits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${supervisorSession.token}`,
          },
          body: JSON.stringify({
            amount: 100,
            type: "package",
            expires_at: expiresAt,
          }),
        },
      );

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        student_id: student.id,
        operator_id: supervisor.id,
        amount: "100.00",
        type: "package",
        balance_after: "100.00",
        expires_at: expiresAt,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
    });

    test("With student balance < 0, supervisor can credit", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const student = await orchestrator.createStudent();

      await database.query({
        text: "UPDATE students SET balance = -5 WHERE id = $1",
        values: [student.id],
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/credits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${supervisorSession.token}`,
          },
          body: JSON.stringify({ amount: 20, type: "manual" }),
        },
      );

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody.amount).toBe("20.00");
      expect(responseBody.balance_after).toBe("15.00");
    });
  });
});
