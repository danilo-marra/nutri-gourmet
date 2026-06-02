import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/reports/sales-by-product", () => {
  describe("Anonymous user", () => {
    test("Returns 403 without session", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/reports/sales-by-product?start_date=2026-01-01&end_date=2026-12-31",
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
        "http://localhost:3000/api/v1/reports/sales-by-product?start_date=2026-01-01&end_date=2026-12-31",
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
        "http://localhost:3000/api/v1/reports/sales-by-product?end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.name).toBe("ValidationError");
    });

    test("Returns 400 when end_date is not a real calendar date", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/sales-by-product?start_date=2026-01-01&end_date=2026-02-30",
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
        "http://localhost:3000/api/v1/reports/sales-by-product?start_date=2026-12-31&end_date=2026-01-01",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);
    });

    test("Returns empty array when no sales in period", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/sales-by-product?start_date=2020-01-01&end_date=2020-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual([]);
    });

    test("Returns products aggregated by revenue descending", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      const productA = await orchestrator.createProduct({
        name: "Almoço Completo",
        price: 12.0,
        category: "refeicao",
      });
      const productB = await orchestrator.createProduct({
        name: "Suco",
        price: 5.0,
        category: "bebida",
      });

      await orchestrator.createSale(null, operador.id, {
        payment_method: "cash",
        items: [{ product_id: productA.id, qty: 3 }],
      });
      await orchestrator.createSale(null, operador.id, {
        payment_method: "card",
        items: [{ product_id: productB.id, qty: 2 }],
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/sales-by-product?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(2);

      const almoco = body.find((r) => r.product_name === "Almoço Completo");
      expect(almoco).toBeDefined();
      expect(almoco.qty_sold).toBe(3);
      expect(parseFloat(almoco.revenue)).toBe(36.0);
      expect(almoco.category).toBe("refeicao");

      const suco = body.find((r) => r.product_name === "Suco");
      expect(suco).toBeDefined();
      expect(suco.qty_sold).toBe(2);
      expect(parseFloat(suco.revenue)).toBe(10.0);

      const almocoIdx = body.indexOf(almoco);
      const sucoIdx = body.indexOf(suco);
      expect(almocoIdx).toBeLessThan(sucoIdx);
    });
  });

  describe("Admin user", () => {
    test("Can access sales-by-product report", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const session = await orchestrator.createSession(admin.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/sales-by-product?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });
  });
});
