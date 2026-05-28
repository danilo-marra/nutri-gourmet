import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/reports/cash-closes", () => {
  describe("Anonymous user", () => {
    test("Returns 403 without session", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/reports/cash-closes",
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Operador user", () => {
    test("Returns 403", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operador.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/cash-closes",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Supervisor user", () => {
    test("Returns 400 when start_date has invalid format", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/cash-closes?start_date=01-01-2026",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);
    });

    test("Returns 400 when start_date is not a real calendar date", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/cash-closes?start_date=2026-99-99",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.name).toBe("ValidationError");
    });

    test("Returns 400 when operator_id is not a valid UUID", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/cash-closes?operator_id=invalid",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(400);
    });

    test("Returns empty array when no closes exist", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/cash-closes",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
    });

    test("Returns cash closes with correct shape", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      await orchestrator.createCashClose(operador.id, supervisor.id, {
        date: "2026-03-15",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/cash-closes",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.length).toBeGreaterThanOrEqual(1);

      const close = body.find((c) => c.operator_id === operador.id);
      expect(close).toBeDefined();
      expect(close.operator_username).toBe(operador.username);
      expect(close.closed_by_username).toBe(supervisor.username);
      expect(close.date).toBe("2026-03-15");
      expect(close.status).toBe("closed");
      expect(close).toHaveProperty("total_sales");
      expect(close).toHaveProperty("total_cash");
      expect(close).toHaveProperty("total_card");
      expect(close).toHaveProperty("total_credit");
    });

    test("Returns pending row for day with sales but no close", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      await orchestrator.createSale(null, operador.id, {
        payment_method: "cash",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/cash-closes?start_date=2026-01-01&end_date=2026-12-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      const pending = body.find(
        (c) => c.operator_id === operador.id && c.status === "pending",
      );
      expect(pending).toBeDefined();
      expect(pending.id).toBeNull();
      expect(pending.closed_by_id).toBeNull();
      expect(pending.closed_by_username).toBeNull();
      expect(pending.total_sales).toBeNull();
    });

    test("Filters by operator_id", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador1 = await orchestrator.createUser({ role: "operador" });
      const operador2 = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      await orchestrator.createCashClose(operador1.id, supervisor.id, {
        date: "2026-04-01",
      });
      await orchestrator.createCashClose(operador2.id, supervisor.id, {
        date: "2026-04-01",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/reports/cash-closes?operator_id=${operador1.id}`,
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.every((c) => c.operator_id === operador1.id)).toBe(true);
    });

    test("Filters by date range", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(supervisor.id);

      await orchestrator.createCashClose(operador.id, supervisor.id, {
        date: "2026-05-01",
      });
      await orchestrator.createCashClose(operador.id, supervisor.id, {
        date: "2026-06-01",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/cash-closes?start_date=2026-05-01&end_date=2026-05-31",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(
        body.every((c) => c.date >= "2026-05-01" && c.date <= "2026-05-31"),
      ).toBe(true);
    });
  });

  describe("Admin user", () => {
    test("Can access cash-closes report", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const session = await orchestrator.createSession(admin.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/reports/cash-closes",
        { headers: { Cookie: `session_id=${session.token}` } },
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(await response.json())).toBe(true);
    });
  });
});
