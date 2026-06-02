import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/reports/dashboard/top-products", () => {
  describe("Anonymous user", () => {
    test("Returns 403 without session", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/top-products?start_date=2026-01-01&end_date=2026-12-31",
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
        "http://localhost:3000/api/v1/reports/dashboard/top-products?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Supervisor user", () => {
    test("Returns 400 when start_date is missing", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/top-products?end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.name).toBe("ValidationError");
    });

    test("Returns 400 when end_date is missing", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/top-products?start_date=2026-01-01",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);
    });

    test("Returns 400 when start_date is a non-existent calendar date (e.g. Feb 30)", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/top-products?start_date=2026-02-30&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.name).toBe("ValidationError");
    });

    test("Returns 400 when start_date is after end_date", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/top-products?start_date=2026-12-31&end_date=2026-01-01",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);
    });

    test("Returns 400 when limit is invalid", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/top-products?start_date=2026-01-01&end_date=2026-12-31&limit=abc",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);
    });

    test("Returns empty array when no sales in period", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/top-products?start_date=2020-01-01&end_date=2020-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
    });

    test("Returns products ordered by qty_sold descending", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      const productA = await orchestrator.createProduct({
        name: "Produto A",
        price: 5.0,
        category: "lanche",
      });
      const productB = await orchestrator.createProduct({
        name: "Produto B",
        price: 3.0,
        category: "bebida",
      });

      await orchestrator.createSale(null, operador.id, {
        payment_method: "cash",
        items: [{ product_id: productA.id, qty: 3 }],
      });
      await orchestrator.createSale(null, operador.id, {
        payment_method: "cash",
        items: [{ product_id: productB.id, qty: 1 }],
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/top-products?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);

      const first = body.find((r) => r.product_id === productA.id);
      const second = body.find((r) => r.product_id === productB.id);
      expect(first).toBeDefined();
      expect(second).toBeDefined();
      expect(first.qty_sold).toBeGreaterThan(second.qty_sold);

      expect(first).toHaveProperty("product_name");
      expect(first).toHaveProperty("category");
      expect(first).toHaveProperty("revenue");
    });

    test("Respects limit parameter", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/top-products?start_date=2026-01-01&end_date=2026-12-31&limit=1",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.length).toBeLessThanOrEqual(1);
    });
  });

  describe("Admin user", () => {
    test("Can access top products", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const session = await orchestrator.createSession(admin.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/top-products?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(await response.json())).toBe(true);
    });
  });
});
