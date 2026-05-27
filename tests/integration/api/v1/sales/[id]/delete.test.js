import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sales/[id]", () => {
  describe("Usuário anônimo", () => {
    test("Deve retornar 403", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/sales/00000000-0000-0000-0000-000000000000",
        { method: "DELETE" },
      );
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.name).toBe("ForbiddenError");
    });
  });

  describe("Usuário com role 'operador'", () => {
    test("Deve cancelar própria venda (cash) dentro de 5 min", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operator.id);
      const student = await orchestrator.createStudent();
      const created = await orchestrator.createSale(student.id, operator.id, {
        payment_method: "cash",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/sales/${created.id}`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${session.token}` },
        },
      );

      expect(response.status).toBe(204);
    });

    test("Deve cancelar própria venda (credit) e devolver saldo", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const operatorSession = await orchestrator.createSession(operator.id);
      const student = await orchestrator.createStudent();
      await orchestrator.createCreditTransaction(student.id, operator.id, {
        amount: 20.0,
      });
      const prod = await orchestrator.createProduct({ price: 8.0 });

      const created = await orchestrator.createSale(student.id, operator.id, {
        payment_method: "credit",
        items: [{ product_id: prod.id, qty: 1 }],
      });

      const studentBefore = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}`,
        { headers: { Cookie: `session_id=${operatorSession.token}` } },
      );
      const balanceBefore = (await studentBefore.json()).balance;
      expect(balanceBefore).toBe("12.00");

      const response = await fetch(
        `http://localhost:3000/api/v1/sales/${created.id}`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${operatorSession.token}` },
        },
      );

      expect(response.status).toBe(204);

      const studentAfter = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}`,
        { headers: { Cookie: `session_id=${operatorSession.token}` } },
      );
      const balanceAfter = (await studentAfter.json()).balance;
      expect(balanceAfter).toBe("20.00");
    });

    test("Deve retornar 403 ao tentar cancelar venda de outro operador", async () => {
      const operator1 = await orchestrator.createUser({ role: "operador" });
      const operator2 = await orchestrator.createUser({ role: "operador" });
      const session2 = await orchestrator.createSession(operator2.id);
      const student = await orchestrator.createStudent();

      const created = await orchestrator.createSale(student.id, operator1.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/sales/${created.id}`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${session2.token}` },
        },
      );

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.name).toBe("ForbiddenError");
    });

    test("Deve retornar 403 após expirar janela de 5 min", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operator.id);
      const student = await orchestrator.createStudent();

      const created = await orchestrator.createSale(student.id, operator.id);

      await setCreatedAt(created.id, minutesAgo(6));

      const response = await fetch(
        `http://localhost:3000/api/v1/sales/${created.id}`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${session.token}` },
        },
      );

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.name).toBe("ForbiddenError");
    });
  });

  describe("Usuário com role 'supervisor'", () => {
    test("Deve estornar qualquer venda sem restrição de tempo", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const student = await orchestrator.createStudent();

      const created = await orchestrator.createSale(student.id, operator.id);
      await setCreatedAt(created.id, minutesAgo(60));

      const response = await fetch(
        `http://localhost:3000/api/v1/sales/${created.id}`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${supervisorSession.token}` },
        },
      );

      expect(response.status).toBe(204);
    });

    test("Deve retornar 403 ao tentar estornar venda já estornada", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const student = await orchestrator.createStudent();

      const created = await orchestrator.createSale(student.id, operator.id);

      await fetch(`http://localhost:3000/api/v1/sales/${created.id}`, {
        method: "DELETE",
        headers: { Cookie: `session_id=${supervisorSession.token}` },
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/sales/${created.id}`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${supervisorSession.token}` },
        },
      );

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.name).toBe("ForbiddenError");
    });
  });

  describe("Usuário com role 'admin'", () => {
    test("Deve estornar qualquer venda", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const student = await orchestrator.createStudent();

      const created = await orchestrator.createSale(student.id, operator.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/sales/${created.id}`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${adminSession.token}` },
        },
      );

      expect(response.status).toBe(204);
    });
  });

  describe("Venda inexistente", () => {
    test("Deve retornar 404", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const session = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/sales/00000000-0000-0000-0000-000000000000",
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${session.token}` },
        },
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.name).toBe("NotFoundError");
    });
  });
});

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function setCreatedAt(saleId, date) {
  const { default: database } = await import("infra/database.js");
  await database.query({
    text: "UPDATE sales SET created_at = $1 WHERE id = $2",
    values: [date, saleId],
  });
}
