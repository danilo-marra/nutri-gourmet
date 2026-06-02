import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/reports/credits-consumed", () => {
  describe("Anonymous user", () => {
    test("Returns 403 without session", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/reports/credits-consumed?start_date=2026-01-01&end_date=2026-12-31",
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
        "http://localhost:3000/api/v1/reports/credits-consumed?start_date=2026-01-01&end_date=2026-12-31",
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
        "http://localhost:3000/api/v1/reports/credits-consumed?end_date=2026-12-31",
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
        "http://localhost:3000/api/v1/reports/credits-consumed?start_date=2026-12-31&end_date=2026-01-01",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);
    });

    test("Returns empty array when no credit sales in period", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/credits-consumed?start_date=2020-01-01&end_date=2020-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual([]);
    });

    test("Only includes sales with payment_method=credit", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      const studentA = await orchestrator.createStudent({ name: "Ana Souza" });
      const studentB = await orchestrator.createStudent({ name: "Bruno Lima" });

      await orchestrator.createCreditTransaction(studentA.id, operador.id, {
        amount: 100,
      });
      await orchestrator.createCreditTransaction(studentB.id, operador.id, {
        amount: 100,
      });

      await orchestrator.createSale(studentA.id, operador.id, {
        payment_method: "credit",
      });
      await orchestrator.createSale(studentA.id, operador.id, {
        payment_method: "credit",
      });
      await orchestrator.createSale(studentB.id, operador.id, {
        payment_method: "cash",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/credits-consumed?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);

      const ana = body.find((r) => r.student_name === "Ana Souza");
      expect(ana).toBeDefined();
      expect(ana.sale_count).toBe(2);
      expect(parseFloat(ana.total_consumed)).toBeGreaterThan(0);

      const bruno = body.find((r) => r.student_name === "Bruno Lima");
      expect(bruno).toBeUndefined();
    });

    test("Orders results by total_consumed descending", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      const studentC = await orchestrator.createStudent({
        name: "Carlos Menor",
      });
      const studentD = await orchestrator.createStudent({
        name: "Diana Maior",
      });
      const expensiveProduct = await orchestrator.createProduct({ price: 50 });

      await orchestrator.createCreditTransaction(studentC.id, operador.id, {
        amount: 200,
      });
      await orchestrator.createCreditTransaction(studentD.id, operador.id, {
        amount: 200,
      });

      await orchestrator.createSale(studentC.id, operador.id, {
        payment_method: "credit",
        items: [{ product_id: expensiveProduct.id, qty: 1 }],
      });
      await orchestrator.createSale(studentD.id, operador.id, {
        payment_method: "credit",
        items: [{ product_id: expensiveProduct.id, qty: 3 }],
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/credits-consumed?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      const diana = body.find((r) => r.student_name === "Diana Maior");
      const carlos = body.find((r) => r.student_name === "Carlos Menor");

      expect(diana).toBeDefined();
      expect(carlos).toBeDefined();
      expect(body.indexOf(diana)).toBeLessThan(body.indexOf(carlos));
    });
  });

  describe("Admin user", () => {
    test("Can access credits-consumed report", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const session = await orchestrator.createSession(admin.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/credits-consumed?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });
  });
});
