import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/sales/[id]", () => {
  describe("Usuário anônimo", () => {
    test("Deve retornar 403", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/sales/00000000-0000-0000-0000-000000000000",
      );
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.name).toBe("ForbiddenError");
    });
  });

  describe("Usuário com role 'operador'", () => {
    test("Deve retornar própria venda com items embutidos", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operator.id);
      const student = await orchestrator.createStudent();
      const prod = await orchestrator.createProduct({ price: 6.0 });

      const created = await orchestrator.createSale(student.id, operator.id, {
        items: [{ product_id: prod.id, qty: 1 }],
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/sales/${created.id}`,
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(uuidVersion(body.id)).toBe(4);
      expect(body.id).toBe(created.id);
      expect(body.operator_id).toBe(operator.id);
      expect(body.total).toBe("6.00");
      expect(body.items).toHaveLength(1);
      expect(body.items[0].qty).toBe(1);
      expect(body.items[0].unit_price).toBe("6.00");
    });

    test("Deve retornar 403 ao tentar ver venda de outro operador", async () => {
      const operator1 = await orchestrator.createUser({ role: "operador" });
      const operator2 = await orchestrator.createUser({ role: "operador" });
      const session2 = await orchestrator.createSession(operator2.id);
      const student = await orchestrator.createStudent();

      const created = await orchestrator.createSale(student.id, operator1.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/sales/${created.id}`,
        { headers: { Cookie: `session_id=${session2.token}` } },
      );

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.name).toBe("ForbiddenError");
    });

    test("Deve retornar 404 para venda inexistente", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operator.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/sales/00000000-0000-0000-0000-000000000000",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.name).toBe("NotFoundError");
    });
  });

  describe("Usuário com role 'supervisor'", () => {
    test("Deve retornar venda de qualquer operador", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const student = await orchestrator.createStudent();

      const created = await orchestrator.createSale(student.id, operator.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/sales/${created.id}`,
        { headers: { Cookie: `session_id=${supervisorSession.token}` } },
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.id).toBe(created.id);
      expect(body.operator_id).toBe(operator.id);
    });
  });
});
