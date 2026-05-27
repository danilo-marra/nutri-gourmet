import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/cash_closes", () => {
  describe("Anonymous user", () => {
    test("Without session cookie", async () => {
      const response = await fetch("http://localhost:3000/api/v1/cash_closes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action:
          'Verifique se o seu usuário possui a feature "create:cash_close".',
        status_code: 403,
      });
    });
  });

  describe("Pending user", () => {
    test("Without create:cash_close permission", async () => {
      const pending = await orchestrator.createUser({ role: "pending" });
      const pendingSession = await orchestrator.createSession(pending.id);

      const response = await fetch("http://localhost:3000/api/v1/cash_closes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${pendingSession.token}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("Operador user", () => {
    test("Invalid date returns 400", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);

      const response = await fetch("http://localhost:3000/api/v1/cash_closes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${operadorSession.token}`,
        },
        body: JSON.stringify({ date: "2026-99-99" }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ValidationError");
    });

    test("Closes own shift with no sales (totals are zero)", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);
      const date = "2026-01-01";

      const response = await fetch("http://localhost:3000/api/v1/cash_closes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${operadorSession.token}`,
        },
        body: JSON.stringify({ date }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        operator_id: operador.id,
        operator_username: operador.username,
        closed_by_id: operador.id,
        date: "2026-01-01",
        total_sales: "0.00",
        total_credit: "0.00",
        total_cash: "0.00",
        total_card: "0.00",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
    });

    test("Closes own shift aggregating sales by payment method", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const student = await orchestrator.createStudent();
      const date = new Date().toISOString().slice(0, 10);

      await orchestrator.createCreditTransaction(student.id, supervisor.id, {
        type: "manual",
        amount: 100,
      });

      await orchestrator.createSale(student.id, operador.id, {
        payment_method: "cash",
      });
      await orchestrator.createSale(student.id, operador.id, {
        payment_method: "card",
      });
      await orchestrator.createSale(student.id, operador.id, {
        payment_method: "credit",
      });

      const response = await fetch("http://localhost:3000/api/v1/cash_closes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${operadorSession.token}`,
        },
        body: JSON.stringify({ date }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      const totalSales =
        parseFloat(responseBody.total_cash) +
        parseFloat(responseBody.total_card) +
        parseFloat(responseBody.total_credit);
      expect(parseFloat(responseBody.total_sales)).toBeCloseTo(totalSales, 2);
      expect(parseFloat(responseBody.total_cash)).toBeGreaterThan(0);
      expect(parseFloat(responseBody.total_card)).toBeGreaterThan(0);
      expect(parseFloat(responseBody.total_credit)).toBeGreaterThan(0);
    });

    test("Provided operator_id is overridden with own id", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const otherOperador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);
      const date = "2026-01-03";

      const response = await fetch("http://localhost:3000/api/v1/cash_closes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${operadorSession.token}`,
        },
        body: JSON.stringify({ date, operator_id: otherOperador.id }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody.operator_id).toBe(operador.id);
    });

    test("Duplicate close for same operator and date returns 400", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);
      const date = "2026-01-04";

      await fetch("http://localhost:3000/api/v1/cash_closes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${operadorSession.token}`,
        },
        body: JSON.stringify({ date }),
      });

      const response = await fetch("http://localhost:3000/api/v1/cash_closes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${operadorSession.token}`,
        },
        body: JSON.stringify({ date }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ValidationError");
    });
  });

  describe("Supervisor user", () => {
    test("Closes on behalf of an operador", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const operador = await orchestrator.createUser({ role: "operador" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const date = "2026-01-05";

      const response = await fetch("http://localhost:3000/api/v1/cash_closes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${supervisorSession.token}`,
        },
        body: JSON.stringify({ date, operator_id: operador.id }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody.operator_id).toBe(operador.id);
      expect(responseBody.closed_by_id).toBe(supervisor.id);
    });
  });

  describe("Admin user", () => {
    test("Can close cash", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const date = "2026-01-06";

      const response = await fetch("http://localhost:3000/api/v1/cash_closes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminSession.token}`,
        },
        body: JSON.stringify({ date }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody.operator_id).toBe(admin.id);
      expect(responseBody.closed_by_id).toBe(admin.id);
    });
  });
});
