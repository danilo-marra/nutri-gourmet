import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("Returns 403", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users");

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: `Verifique se o seu usuário possui a feature "read:user".`,
        status_code: 403,
      });
    });
  });

  describe("Operador user", () => {
    test("Returns 403", async () => {
      const operador = await orchestrator.createUser();
      const activatedOperador = await orchestrator.activateUser(operador);
      const session = await orchestrator.createSession(activatedOperador.id);

      const response = await fetch("http://localhost:3000/api/v1/users", {
        headers: { Cookie: `session_id=${session.token}` },
      });

      expect(response.status).toBe(403);
    });
  });

  describe("Supervisor user", () => {
    test("Returns only operador and pending users", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const operador = await orchestrator.createUser();
      const activatedOperador = await orchestrator.activateUser(operador);

      const pendingUser = await orchestrator.createUser();

      await orchestrator.createUser({ role: "supervisor" });

      const response = await fetch("http://localhost:3000/api/v1/users", {
        headers: { Cookie: `session_id=${supervisorSession.token}` },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const roles = responseBody.map((u) => u.role);
      expect(roles.every((r) => ["operador", "pending"].includes(r))).toBe(
        true,
      );
      expect(responseBody.some((u) => u.id === activatedOperador.id)).toBe(
        true,
      );
      expect(responseBody.some((u) => u.id === pendingUser.id)).toBe(true);

      responseBody.forEach((u) => {
        expect(u).not.toHaveProperty("password");
        expect(u).not.toHaveProperty("email");
      });
    });
  });

  describe("Admin user", () => {
    test("Returns all users", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);

      const response = await fetch("http://localhost:3000/api/v1/users", {
        headers: { Cookie: `session_id=${adminSession.token}` },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const roles = responseBody.map((u) => u.role);
      expect(roles).toEqual(expect.arrayContaining(["operador", "pending"]));

      responseBody.forEach((u) => {
        expect(u).not.toHaveProperty("password");
        expect(u).not.toHaveProperty("email");
      });
    });
  });
});
