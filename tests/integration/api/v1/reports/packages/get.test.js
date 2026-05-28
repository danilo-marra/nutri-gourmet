import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/reports/packages", () => {
  describe("Anonymous user", () => {
    test("Returns 403 without session", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/reports/packages",
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Operador user", () => {
    test("Returns 403", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operador.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/packages",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Supervisor user", () => {
    test("Returns empty array when no active packages exist", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/packages",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
    });

    test("Returns active packages with correct shape", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const student = await orchestrator.createStudent();
      const session = await orchestrator.createSession(supervisor.id);

      await orchestrator.createCreditTransaction(student.id, operador.id, {
        amount: 100.0,
        type: "package",
        expires_at: null,
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/packages",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.length).toBeGreaterThanOrEqual(1);

      const pkg = body.find((p) => p.student_id === student.id);
      expect(pkg).toBeDefined();
      expect(pkg.student_name).toBe(student.name);
      expect(parseFloat(pkg.amount)).toBe(100.0);
      expect(pkg.operator_username).toBe(operador.username);
      expect(pkg).toHaveProperty("expires_at");
      expect(pkg).toHaveProperty("created_at");
    });

    test("Excludes expired packages", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const student = await orchestrator.createStudent();
      const session = await orchestrator.createSession(supervisor.id);

      await orchestrator.createCreditTransaction(student.id, operador.id, {
        amount: 50.0,
        type: "package",
        expires_at: "2020-01-01T00:00:00Z",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/packages",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      const expiredPkg = body.find(
        (p) => p.student_id === student.id && parseFloat(p.amount) === 50.0,
      );
      expect(expiredPkg).toBeUndefined();
    });
  });

  describe("Admin user", () => {
    test("Can access packages report", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const session = await orchestrator.createSession(admin.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/packages",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(await response.json())).toBe(true);
    });
  });
});
