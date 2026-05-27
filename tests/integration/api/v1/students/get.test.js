import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/students", () => {
  describe("Anonymous user", () => {
    test("Without session cookie", async () => {
      const response = await fetch("http://localhost:3000/api/v1/students");

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:student".',
        status_code: 403,
      });
    });
  });

  describe("Supervisor user", () => {
    test("With empty list", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch("http://localhost:3000/api/v1/students", {
        headers: {
          Cookie: `session_id=${supervisorSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual([]);
    });

    test("After creating 2 students", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      await orchestrator.createStudent({ name: "Ana Lima", class: "1A" });
      await orchestrator.createStudent({ name: "Bruno Costa", class: "2B" });

      const response = await fetch("http://localhost:3000/api/v1/students", {
        headers: {
          Cookie: `session_id=${supervisorSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toHaveLength(2);
      expect(uuidVersion(responseBody[0].id)).toBe(4);
      expect(uuidVersion(responseBody[1].id)).toBe(4);
      expect(responseBody[0].name).toBe("Ana Lima");
      expect(responseBody[1].name).toBe("Bruno Costa");
    });
  });
});
