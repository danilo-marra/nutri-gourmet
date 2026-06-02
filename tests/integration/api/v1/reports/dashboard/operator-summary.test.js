import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/reports/dashboard/operator-summary", () => {
  describe("Anonymous user", () => {
    test("Returns 403 without session", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/operator-summary?start_date=2026-01-01&end_date=2026-12-31",
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
        "http://localhost:3000/api/v1/reports/dashboard/operator-summary?start_date=2026-01-01&end_date=2026-12-31",
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
        "http://localhost:3000/api/v1/reports/dashboard/operator-summary?end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.name).toBe("ValidationError");
    });

    test("Returns 400 when start_date is a non-existent calendar date (e.g. Feb 30)", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/operator-summary?start_date=2026-02-30&end_date=2026-12-31",
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
        "http://localhost:3000/api/v1/reports/dashboard/operator-summary?start_date=2026-12-31&end_date=2026-01-01",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);
    });

    test("Returns empty array when no sales in period", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/operator-summary?start_date=2020-01-01&end_date=2020-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
    });

    test("Returns operators with sale counts and revenue", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operadorA = await orchestrator.createUser({ role: "operador" });
      const operadorB = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      const product = await orchestrator.createProduct({ price: 10.0 });

      await orchestrator.createSale(null, operadorA.id, {
        payment_method: "cash",
        items: [{ product_id: product.id, qty: 3 }],
      });
      await orchestrator.createSale(null, operadorA.id, {
        payment_method: "cash",
        items: [{ product_id: product.id, qty: 1 }],
      });
      await orchestrator.createSale(null, operadorB.id, {
        payment_method: "card",
        items: [{ product_id: product.id, qty: 1 }],
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/operator-summary?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);

      const rowA = body.find((r) => r.operator_id === operadorA.id);
      const rowB = body.find((r) => r.operator_id === operadorB.id);
      expect(rowA).toBeDefined();
      expect(rowB).toBeDefined();

      expect(rowA.sale_count).toBe(2);
      expect(parseFloat(rowA.revenue)).toBe(40.0);
      expect(rowB.sale_count).toBe(1);
      expect(parseFloat(rowB.revenue)).toBe(10.0);

      expect(rowA).toHaveProperty("operator_username");

      const revenues = body.map((r) => parseFloat(r.revenue));
      const sorted = [...revenues].sort((a, b) => b - a);
      expect(revenues).toEqual(sorted);
    });
  });

  describe("Admin user", () => {
    test("Can access operator summary", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const session = await orchestrator.createSession(admin.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/operator-summary?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(await response.json())).toBe(true);
    });
  });
});
