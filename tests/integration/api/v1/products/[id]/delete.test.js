import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/products/[id]", () => {
  describe("Operador user", () => {
    test("Should return 403 ForbiddenError", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);

      const createdProduct = await orchestrator.createProduct();

      const response = await fetch(
        `http://localhost:3000/api/v1/products/${createdProduct.id}`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${operadorSession.token}` },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "delete:product".',
        status_code: 403,
      });
    });
  });

  describe("Supervisor user", () => {
    test("Should deactivate product and return 200 with active: false", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const createdProduct = await orchestrator.createProduct({
        name: "Refeição do dia",
        category: "refeicao",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/products/${createdProduct.id}`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${supervisorSession.token}` },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: createdProduct.id,
        name: "Refeição do dia",
        price: responseBody.price,
        category: "refeicao",
        active: false,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("Calling DELETE again on already-inactive product should return 200 with active: false (idempotent)", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const createdProduct = await orchestrator.createProduct({
        name: "Produto já inativo",
        category: "lanche",
        active: false,
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/products/${createdProduct.id}`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${supervisorSession.token}` },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.active).toBe(false);
    });

    test("Non-existent id should return 404 NotFoundError", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/products/00000000-0000-0000-0000-000000000000",
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${supervisorSession.token}` },
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
