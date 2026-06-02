import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/reports/dashboard/revenue-trend", () => {
  describe("Anonymous user", () => {
    test("Returns 403 without session", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/revenue-trend",
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
        "http://localhost:3000/api/v1/reports/dashboard/revenue-trend",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Supervisor user", () => {
    test("Returns 400 when days is not a number", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/revenue-trend?days=abc",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.name).toBe("ValidationError");
    });

    test("Returns 400 when days is 0", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/revenue-trend?days=0",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);
    });

    test("Returns 400 when days exceeds 365", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/revenue-trend?days=366",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);
    });

    test("Returns 30 entries by default", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/revenue-trend",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(30);
    });

    test("Returns N entries when days=N is given", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/revenue-trend?days=7",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.length).toBe(7);
    });

    test("Returns entries with date and total fields", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/revenue-trend?days=1",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.length).toBe(1);
      expect(body[0]).toHaveProperty("date");
      expect(body[0]).toHaveProperty("total");
      expect(/^\d{4}-\d{2}-\d{2}$/.test(body[0].date)).toBe(true);
    });

    test("Today's sales appear in trend", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      const product = await orchestrator.createProduct({ price: 20.0 });
      await orchestrator.createSale(null, operador.id, {
        payment_method: "cash",
        items: [{ product_id: product.id, qty: 1 }],
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/revenue-trend?days=1",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(parseFloat(body[0].total)).toBeGreaterThanOrEqual(20.0);
    });
  });

  describe("Admin user", () => {
    test("Can access revenue trend", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const session = await orchestrator.createSession(admin.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/dashboard/revenue-trend?days=7",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(await response.json())).toBe(true);
    });
  });
});
