import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/reports/credits", () => {
  describe("Anonymous user", () => {
    test("Returns 403 without session", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/reports/credits?start_date=2026-01-01&end_date=2026-12-31",
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Operador user", () => {
    test("Returns 403", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operador.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/credits?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Supervisor user", () => {
    test("Returns 400 when end_date is missing", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/credits?start_date=2026-01-01",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.name).toBe("ValidationError");
    });

    test("Returns 400 when student_id is not a valid UUID", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/credits?start_date=2026-01-01&end_date=2026-12-31&student_id=not-a-uuid",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);
    });

    test("Returns empty array when no credits in period", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/credits?start_date=2020-01-01&end_date=2020-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
    });

    test("Returns credit transactions with correct shape", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const student = await orchestrator.createStudent();
      const session = await orchestrator.createSession(supervisor.id);

      await orchestrator.createCreditTransaction(student.id, operador.id, {
        amount: 50.0,
        type: "manual",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/credits?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.length).toBeGreaterThanOrEqual(1);

      const tx = body.find((t) => t.student_id === student.id);
      expect(tx).toBeDefined();
      expect(tx.student_name).toBe(student.name);
      expect(parseFloat(tx.amount)).toBe(50.0);
      expect(tx.type).toBe("manual");
      expect(tx.operator_username).toBe(operador.username);
    });

    test("Filters by student_id", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const student1 = await orchestrator.createStudent();
      const student2 = await orchestrator.createStudent();
      const session = await orchestrator.createSession(supervisor.id);

      await orchestrator.createCreditTransaction(student1.id, operador.id, {
        amount: 20.0,
      });
      await orchestrator.createCreditTransaction(student2.id, operador.id, {
        amount: 30.0,
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/reports/credits?start_date=2026-01-01&end_date=2026-12-31&student_id=${student1.id}`,
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.every((t) => t.student_id === student1.id)).toBe(true);
    });
  });

  describe("Admin user", () => {
    test("Can access credits report", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const session = await orchestrator.createSession(admin.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/credits?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(await response.json())).toBe(true);
    });
  });
});
