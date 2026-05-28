import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/reports/balances", () => {
  describe("Anonymous user", () => {
    test("Returns 403 without session", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/reports/balances",
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Operador user", () => {
    test("Returns 403", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operador.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/balances",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Supervisor user", () => {
    test("Returns empty array when no students exist", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/balances",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
    });

    test("Returns students with balance in correct shape", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      const student = await orchestrator.createStudent({ name: "Ana" });
      await orchestrator.createCreditTransaction(student.id, operador.id, {
        amount: 25.0,
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/balances",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.length).toBeGreaterThanOrEqual(1);

      const found = body.find((s) => s.id === student.id);
      expect(found).toBeDefined();
      expect(found.name).toBe("Ana");
      expect(found).toHaveProperty("class");
      expect(found).toHaveProperty("is_full_time");
      expect(parseFloat(found.balance)).toBe(25.0);
    });

    test("Returns students ordered by name", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      await orchestrator.createStudent({ name: "Zilda" });
      await orchestrator.createStudent({ name: "Alice" });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/balances",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      const body = await response.json();
      const names = body.map((s) => s.name);
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });
  });

  describe("Admin user", () => {
    test("Can access balances report", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const session = await orchestrator.createSession(admin.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/balances",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(await response.json())).toBe(true);
    });
  });
});
