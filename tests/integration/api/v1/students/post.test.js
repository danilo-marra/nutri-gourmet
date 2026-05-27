import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/students", () => {
  describe("Anonymous user", () => {
    test("Without session cookie", async () => {
      const response = await fetch("http://localhost:3000/api/v1/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "João Silva",
          class: "3A",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "create:student".',
        status_code: 403,
      });
    });
  });

  describe("Operador user", () => {
    test("Trying to create a student", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);

      const response = await fetch("http://localhost:3000/api/v1/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${operadorSession.token}`,
        },
        body: JSON.stringify({
          name: "João Silva",
          class: "3A",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "create:student".',
        status_code: 403,
      });
    });
  });

  describe("Supervisor user", () => {
    test("With valid data", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch("http://localhost:3000/api/v1/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${supervisorSession.token}`,
        },
        body: JSON.stringify({
          name: "Maria Oliveira",
          class: "2B",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        name: "Maria Oliveira",
        class: "2B",
        is_full_time: false,
        balance: "0.00",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With missing 'name' field", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch("http://localhost:3000/api/v1/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${supervisorSession.token}`,
        },
        body: JSON.stringify({
          class: "2B",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody.name).toBe("ValidationError");
      expect(responseBody.status_code).toBe(400);
    });
  });
});
