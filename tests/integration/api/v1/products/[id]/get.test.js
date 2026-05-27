import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/products/[id]", () => {
  describe("Operador user", () => {
    test("Should return existing product with correct shape", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);

      const createdProduct = await orchestrator.createProduct({
        name: "Vitamina de banana",
        price: 8.5,
        category: "vitamina",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/products/${createdProduct.id}`,
        {
          headers: { Cookie: `session_id=${operadorSession.token}` },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: createdProduct.id,
        name: "Vitamina de banana",
        price: "8.50",
        category: "vitamina",
        active: true,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("Non-existent id should return 404 NotFoundError", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/products/00000000-0000-0000-0000-000000000000",
        {
          headers: { Cookie: `session_id=${operadorSession.token}` },
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
