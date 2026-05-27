import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/sales", () => {
  describe("Usuário anônimo", () => {
    test("Deve retornar 403", async () => {
      const response = await fetch("http://localhost:3000/api/v1/sales");
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.name).toBe("ForbiddenError");
    });
  });

  describe("Usuário com role 'operador'", () => {
    test("Deve retornar apenas as próprias vendas", async () => {
      const operator1 = await orchestrator.createUser({ role: "operador" });
      const operator2 = await orchestrator.createUser({ role: "operador" });
      const session1 = await orchestrator.createSession(operator1.id);
      const student = await orchestrator.createStudent();

      await orchestrator.createSale(student.id, operator1.id);
      await orchestrator.createSale(student.id, operator1.id);
      await orchestrator.createSale(student.id, operator2.id);

      const response = await fetch("http://localhost:3000/api/v1/sales", {
        headers: { Cookie: `session_id=${session1.token}` },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveLength(2);
      body.forEach((s) => expect(s.operator_id).toBe(operator1.id));
    });

    test("Cada venda deve conter items embutidos", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operator.id);
      const student = await orchestrator.createStudent();
      const prod = await orchestrator.createProduct({ price: 4.0 });

      await orchestrator.createSale(student.id, operator.id, {
        items: [{ product_id: prod.id, qty: 3 }],
      });

      const response = await fetch("http://localhost:3000/api/v1/sales", {
        headers: { Cookie: `session_id=${session.token}` },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      const latest = body[0];
      expect(Array.isArray(latest.items)).toBe(true);
      expect(latest.items[0].product_id).toBe(prod.id);
      expect(latest.items[0].qty).toBe(3);
    });
  });

  describe("Usuário com role 'supervisor'", () => {
    test("Deve retornar todas as vendas", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const student = await orchestrator.createStudent();

      await orchestrator.createSale(student.id, operator.id);
      await orchestrator.createSale(student.id, supervisor.id);

      const response = await fetch("http://localhost:3000/api/v1/sales", {
        headers: { Cookie: `session_id=${supervisorSession.token}` },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      const operatorIds = body.map((s) => s.operator_id);
      expect(operatorIds).toContain(operator.id);
      expect(operatorIds).toContain(supervisor.id);
    });
  });
});
