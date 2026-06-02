import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/reports/dashboard/my-shift-summary", () => {
  describe("Anonymous user", () => {
    test("Returns 403 without session", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/my-shift-summary",
      );

      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.name).toBe("ForbiddenError");
    });
  });

  describe("Operador user", () => {
    test("Returns correct shape with no sales today", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operador.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/my-shift-summary",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(parseFloat(body.revenue_today)).toBe(0);
      expect(body.count_today).toBe(0);
      expect(body.cash_close).toBeNull();
      expect(Array.isArray(body.students_served)).toBe(true);
      expect(body.students_served.length).toBe(0);
    });

    test("Returns today sales for the logged-in operador only", async () => {
      const operadorA = await orchestrator.createUser({ role: "operador" });
      const operadorB = await orchestrator.createUser({ role: "operador" });
      const sessionA = await orchestrator.createSession(operadorA.id);

      const product = await orchestrator.createProduct({ price: 12.0 });

      await orchestrator.createSale(null, operadorA.id, {
        payment_method: "cash",
        items: [{ product_id: product.id, qty: 2 }],
      });
      await orchestrator.createSale(null, operadorB.id, {
        payment_method: "cash",
        items: [{ product_id: product.id, qty: 5 }],
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/my-shift-summary",
        { headers: { Cookie: `session_id=${sessionA.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.count_today).toBe(1);
      expect(parseFloat(body.revenue_today)).toBe(24.0);
    });

    test("Includes students served today via credit sales", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(operador.id);

      const student = await orchestrator.createStudent({ name: "Carlos" });
      await orchestrator.createCreditTransaction(student.id, supervisor.id, {
        amount: 50.0,
      });

      const product = await orchestrator.createProduct({ price: 8.0 });
      await orchestrator.createSale(student.id, operador.id, {
        payment_method: "credit",
        items: [{ product_id: product.id, qty: 1 }],
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/my-shift-summary",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      const served = body.students_served.find((s) => s.id === student.id);
      expect(served).toBeDefined();
      expect(served.name).toBe("Carlos");
    });

    test("Reflects cash_close when operador has closed today", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operador.id);

      const product = await orchestrator.createProduct({ price: 5.0 });
      await orchestrator.createSale(null, operador.id, {
        payment_method: "cash",
        items: [{ product_id: product.id, qty: 1 }],
      });

      await orchestrator.createCashClose(operador.id, operador.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/my-shift-summary",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.cash_close).not.toBeNull();
      expect(body.cash_close).toHaveProperty("id");
      expect(body.cash_close).toHaveProperty("date");
    });
  });

  describe("Supervisor user", () => {
    test("Can also access my-shift-summary", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/my-shift-summary",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty("revenue_today");
      expect(body).toHaveProperty("count_today");
    });
  });
});
