import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/products", () => {
  describe("Anonymous user", () => {
    test("Should return 403 ForbiddenError", async () => {
      const response = await fetch("http://localhost:3000/api/v1/products");

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:product".',
        status_code: 403,
      });
    });
  });

  describe("Supervisor user", () => {
    test("With empty list should return 200 and empty array", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch("http://localhost:3000/api/v1/products", {
        headers: { Cookie: `session_id=${supervisorSession.token}` },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual([]);
    });

    test("After creating 2 products (1 active, 1 inactive) should return both", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      await orchestrator.createProduct({
        name: "Suco de laranja",
        category: "bebida",
      });
      await orchestrator.createProduct({
        name: "Bolo de chocolate",
        category: "sobremesa",
        active: false,
      });

      const response = await fetch("http://localhost:3000/api/v1/products", {
        headers: { Cookie: `session_id=${supervisorSession.token}` },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toHaveLength(2);
    });
  });

  describe("Operador user", () => {
    test("Should see only active products", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);

      const response = await fetch("http://localhost:3000/api/v1/products", {
        headers: { Cookie: `session_id=${operadorSession.token}` },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toHaveLength(1);
      expect(responseBody[0].active).toBe(true);
    });
  });
});
