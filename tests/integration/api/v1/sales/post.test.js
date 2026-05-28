import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sales", () => {
  describe("Usuário anônimo", () => {
    test("Deve retornar 403", async () => {
      const response = await fetch("http://localhost:3000/api/v1/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.name).toBe("ForbiddenError");
    });
  });

  describe("Usuário com role 'operador'", () => {
    test("Deve criar venda com pagamento cash", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operator.id);
      const student = await orchestrator.createStudent();
      const prod = await orchestrator.createProduct({ price: 5.0 });

      const response = await fetch("http://localhost:3000/api/v1/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          student_id: student.id,
          payment_method: "cash",
          items: [{ product_id: prod.id, qty: 2 }],
        }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(uuidVersion(body.id)).toBe(4);
      expect(body.student_id).toBe(student.id);
      expect(body.operator_id).toBe(operator.id);
      expect(body.payment_method).toBe("cash");
      expect(body.total).toBe("10.00");
      expect(body.reversed_at).toBeNull();
      expect(body.reversed_by).toBeNull();
      expect(body.items).toHaveLength(1);
      expect(body.items[0].product_id).toBe(prod.id);
      expect(body.items[0].qty).toBe(2);
      expect(body.items[0].unit_price).toBe("5.00");
      expect(Date.parse(body.created_at)).not.toBeNaN();
    });

    test("Deve criar venda com pagamento card", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operator.id);
      const student = await orchestrator.createStudent();
      const prod = await orchestrator.createProduct({ price: 3.5 });

      const response = await fetch("http://localhost:3000/api/v1/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          student_id: student.id,
          payment_method: "card",
          items: [{ product_id: prod.id, qty: 1 }],
        }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.payment_method).toBe("card");
      expect(body.total).toBe("3.50");
    });

    test("Deve criar venda com pagamento credit e debitar saldo", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const operatorSession = await orchestrator.createSession(operator.id);
      const student = await orchestrator.createStudent();
      await orchestrator.createCreditTransaction(student.id, operator.id, {
        amount: 20.0,
      });
      const prod = await orchestrator.createProduct({ price: 7.0 });

      const response = await fetch("http://localhost:3000/api/v1/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${operatorSession.token}`,
        },
        body: JSON.stringify({
          student_id: student.id,
          payment_method: "credit",
          items: [{ product_id: prod.id, qty: 1 }],
        }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.total).toBe("7.00");

      const studentAfter = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}`,
        { headers: { Cookie: `session_id=${operatorSession.token}` } },
      );
      const studentBody = await studentAfter.json();
      expect(studentBody.balance).toBe("13.00");
    });

    test("Deve retornar 400 com saldo insuficiente para pagamento credit", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operator.id);
      const student = await orchestrator.createStudent();
      const prod = await orchestrator.createProduct({ price: 10.0 });

      const response = await fetch("http://localhost:3000/api/v1/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          student_id: student.id,
          payment_method: "credit",
          items: [{ product_id: prod.id, qty: 1 }],
        }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.name).toBe("ValidationError");
    });

    test("Deve retornar 400 quando saldo parcial é insuficiente (balance < total)", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operator.id);
      const student = await orchestrator.createStudent();
      await orchestrator.createCreditTransaction(student.id, operator.id, {
        amount: 5.0,
      });
      const prod = await orchestrator.createProduct({ price: 10.0 });

      const response = await fetch("http://localhost:3000/api/v1/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          student_id: student.id,
          payment_method: "credit",
          items: [{ product_id: prod.id, qty: 1 }],
        }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.name).toBe("ValidationError");
      expect(body.message).toBe("Saldo insuficiente para realizar a venda.");

      const studentAfter = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}`,
        { headers: { Cookie: `session_id=${session.token}` } },
      );
      const studentBody = await studentAfter.json();
      expect(studentBody.balance).toBe("5.00");
    });

    test("Deve retornar 400 com produto inativo", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operator.id);
      const student = await orchestrator.createStudent();
      const prod = await orchestrator.createProduct({ active: false });

      const response = await fetch("http://localhost:3000/api/v1/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          student_id: student.id,
          payment_method: "cash",
          items: [{ product_id: prod.id, qty: 1 }],
        }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.name).toBe("ValidationError");
    });

    test("Deve retornar 400 com items vazio", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operator.id);
      const student = await orchestrator.createStudent();

      const response = await fetch("http://localhost:3000/api/v1/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          student_id: student.id,
          payment_method: "cash",
          items: [],
        }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.name).toBe("ValidationError");
    });

    test("Deve retornar 400 com payment_method inválido", async () => {
      const operator = await orchestrator.createUser({ role: "operador" });
      const session = await orchestrator.createSession(operator.id);
      const student = await orchestrator.createStudent();
      const prod = await orchestrator.createProduct();

      const response = await fetch("http://localhost:3000/api/v1/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          student_id: student.id,
          payment_method: "pix",
          items: [{ product_id: prod.id, qty: 1 }],
        }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.name).toBe("ValidationError");
    });
  });
});
