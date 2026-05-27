import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/products/[id]", () => {
  describe("Operador user", () => {
    test("Should return 403 ForbiddenError", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);

      const createdProduct = await orchestrator.createProduct();

      const response = await fetch(
        `http://localhost:3000/api/v1/products/${createdProduct.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${operadorSession.token}`,
          },
          body: JSON.stringify({ name: "Novo nome" }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "update:product".',
        status_code: 403,
      });
    });
  });

  describe("Supervisor user", () => {
    test("Should update name and price and return 200 with updated data", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const createdProduct = await orchestrator.createProduct({
        name: "Suco de maracujá",
        price: 6.0,
        category: "bebida",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/products/${createdProduct.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${supervisorSession.token}`,
          },
          body: JSON.stringify({ name: "Suco de acerola", price: 7.5 }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: createdProduct.id,
        name: "Suco de acerola",
        price: "7.50",
        category: "bebida",
        active: true,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("Non-existent id should return 404 NotFoundError", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/products/00000000-0000-0000-0000-000000000000",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${supervisorSession.token}`,
          },
          body: JSON.stringify({ name: "Novo nome" }),
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Produto não encontrado.",
        action: "Verifique se o ID do produto está correto.",
        status_code: 404,
      });
    });
  });
});
