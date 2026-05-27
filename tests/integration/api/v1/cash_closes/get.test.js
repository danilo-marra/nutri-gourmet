import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/cash_closes", () => {
  describe("Anonymous user", () => {
    test("Without session cookie", async () => {
      const response = await fetch("http://localhost:3000/api/v1/cash_closes");

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action:
          'Verifique se o seu usuário possui a feature "read:cash_close".',
        status_code: 403,
      });
    });
  });

  describe("Operador user", () => {
    test("Without read:cash_close permission", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);

      const response = await fetch("http://localhost:3000/api/v1/cash_closes", {
        headers: { Cookie: `session_id=${operadorSession.token}` },
      });

      expect(response.status).toBe(403);
    });
  });

  describe("Supervisor user", () => {
    test("Returns empty array when no closes exist", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch("http://localhost:3000/api/v1/cash_closes", {
        headers: { Cookie: `session_id=${supervisorSession.token}` },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual([]);
    });

    test("Returns closes with correct shape", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      await orchestrator.createCashClose(operador.id, supervisor.id, {
        date: "2026-02-01",
      });

      const response = await fetch("http://localhost:3000/api/v1/cash_closes", {
        headers: { Cookie: `session_id=${supervisorSession.token}` },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toHaveLength(1);

      const close = responseBody[0];
      expect(close).toEqual({
        id: close.id,
        operator_id: operador.id,
        closed_by_id: supervisor.id,
        date: "2026-02-01",
        total_sales: "0.00",
        total_credit: "0.00",
        total_cash: "0.00",
        total_card: "0.00",
        created_at: close.created_at,
        updated_at: close.updated_at,
      });

      expect(uuidVersion(close.id)).toBe(4);
      expect(Date.parse(close.created_at)).not.toBeNaN();
    });
  });

  describe("Admin user", () => {
    test("Can read cash closes", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);

      const response = await fetch("http://localhost:3000/api/v1/cash_closes", {
        headers: { Cookie: `session_id=${adminSession.token}` },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
