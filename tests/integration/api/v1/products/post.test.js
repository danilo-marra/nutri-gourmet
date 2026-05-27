import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/products", () => {
  describe("Anonymous user", () => {
    test("Should return 403 ForbiddenError", async () => {
      const response = await fetch("http://localhost:3000/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Pão de queijo",
          price: 5.0,
          category: "lanche",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "create:product".',
        status_code: 403,
      });
    });
  });

  describe("Operador user", () => {
    test("Should return 403 ForbiddenError", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);

      const response = await fetch("http://localhost:3000/api/v1/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${operadorSession.token}`,
        },
        body: JSON.stringify({
          name: "Pão de queijo",
          price: 5.0,
          category: "lanche",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "create:product".',
        status_code: 403,
      });
    });
  });

  describe("Supervisor user", () => {
    test("Should create product and return 201 with correct shape", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch("http://localhost:3000/api/v1/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${supervisorSession.token}`,
        },
        body: JSON.stringify({
          name: "Pão de queijo",
          price: 5.0,
          category: "lanche",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        name: "Pão de queijo",
        price: "5.00",
        category: "lanche",
        active: true,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("Missing 'name' should return 400 ValidationError", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch("http://localhost:3000/api/v1/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${supervisorSession.token}`,
        },
        body: JSON.stringify({ price: 5.0, category: "lanche" }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O campo 'name' é obrigatório.",
        action: "Informe o nome do produto.",
        status_code: 400,
      });
    });

    test("Invalid category should return 400 ValidationError", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch("http://localhost:3000/api/v1/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${supervisorSession.token}`,
        },
        body: JSON.stringify({
          name: "Pão de queijo",
          price: 5.0,
          category: "invalida",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "A categoria 'invalida' é inválida.",
        action:
          "Utilize uma das categorias válidas: lanche, bebida, vitamina, refeicao, sobremesa.",
        status_code: 400,
      });
    });
  });
});
