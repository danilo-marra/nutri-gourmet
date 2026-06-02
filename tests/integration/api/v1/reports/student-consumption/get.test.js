import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/reports/student-consumption", () => {
  describe("Anonymous user", () => {
    test("Returns 403 without session", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/reports/student-consumption?start_date=2026-01-01&end_date=2026-12-31",
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
        "http://localhost:3000/api/v1/reports/student-consumption?start_date=2026-01-01&end_date=2026-12-31",
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
        "http://localhost:3000/api/v1/reports/student-consumption?end_date=2026-12-31",
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
        "http://localhost:3000/api/v1/reports/student-consumption?start_date=2026-12-31&end_date=2026-01-01",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);
    });

    test("Returns empty array when no sales in period", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/student-consumption?start_date=2020-01-01&end_date=2020-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual([]);
    });

    test("Aggregates all payment methods per student", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      const student = await orchestrator.createStudent({ name: "Aluno Teste" });

      await orchestrator.createCreditTransaction(student.id, operador.id, {
        amount: 100,
      });

      await orchestrator.createSale(student.id, operador.id, {
        payment_method: "credit",
      });
      await orchestrator.createSale(student.id, operador.id, {
        payment_method: "cash",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/student-consumption?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      const entry = body.find((r) => r.student_name === "Aluno Teste");
      expect(entry).toBeDefined();
      expect(entry.sale_count).toBe(2);
      expect(parseFloat(entry.total_consumed)).toBeGreaterThan(0);
    });

    test("Excludes sales with no student (anonymous)", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      await orchestrator.createSale(null, operador.id, {
        payment_method: "cash",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/student-consumption?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      const hasNull = body.some((r) => r.student_id === null);
      expect(hasNull).toBe(false);
    });

    test("Orders results by total_consumed descending", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      const studentSmall = await orchestrator.createStudent({
        name: "Consumo Pequeno",
      });
      const studentBig = await orchestrator.createStudent({
        name: "Consumo Grande",
      });
      const expensive = await orchestrator.createProduct({ price: 80 });

      await orchestrator.createCreditTransaction(studentBig.id, operador.id, {
        amount: 200,
      });

      await orchestrator.createSale(studentSmall.id, operador.id, {
        payment_method: "cash",
      });
      await orchestrator.createSale(studentBig.id, operador.id, {
        payment_method: "credit",
        items: [{ product_id: expensive.id, qty: 2 }],
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/student-consumption?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      const big = body.find((r) => r.student_name === "Consumo Grande");
      const small = body.find((r) => r.student_name === "Consumo Pequeno");

      expect(big).toBeDefined();
      expect(small).toBeDefined();
      expect(body.indexOf(big)).toBeLessThan(body.indexOf(small));
    });
  });

  describe("Admin user", () => {
    test("Can access student-consumption report", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const session = await orchestrator.createSession(admin.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/student-consumption?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });
  });
});
