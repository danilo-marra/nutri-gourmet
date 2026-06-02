import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/reports/dashboard/summary", () => {
  describe("Anonymous user", () => {
    test("Returns 403 without session", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/summary",
      );

      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.name).toBe("ForbiddenError");
    });
  });

  describe("Operador user", () => {
    test("Returns 403", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operador.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/summary",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Supervisor user", () => {
    test("Returns correct shape with zeros on empty database", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/summary",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty("revenue_today");
      expect(body).toHaveProperty("count_today");
      expect(body).toHaveProperty("revenue_week");
      expect(body).toHaveProperty("count_week");
      expect(body).toHaveProperty("revenue_month");
      expect(body).toHaveProperty("count_month");
      expect(body).toHaveProperty("count_negative_balances");
      expect(body).toHaveProperty("count_pending_closes");

      expect(parseFloat(body.revenue_today)).toBe(0);
      expect(body.count_today).toBe(0);
      expect(body.count_negative_balances).toBe(0);
      expect(body.count_pending_closes).toBe(0);
    });

    test("Counts today sales correctly", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      const product = await orchestrator.createProduct({ price: 15.0 });
      const items = [{ product_id: product.id, qty: 2 }];

      await orchestrator.createSale(null, operador.id, {
        payment_method: "cash",
        items,
      });
      await orchestrator.createSale(null, operador.id, {
        payment_method: "card",
        items,
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/summary",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.count_today).toBeGreaterThanOrEqual(2);
      expect(parseFloat(body.revenue_today)).toBeGreaterThanOrEqual(60.0);
    });

    test("Counts negative balances correctly", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      await orchestrator.createStudent();
      await orchestrator.createStudent();

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/summary",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.count_negative_balances).toBe(0);
    });
  });

  describe("Admin user", () => {
    test("Can access summary", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const session = await orchestrator.createSession(admin.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/summary",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty("revenue_today");
    });
  });
});
