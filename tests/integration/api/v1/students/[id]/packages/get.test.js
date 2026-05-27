import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/students/:id/packages", () => {
  describe("Anonymous user", () => {
    test("Without session cookie", async () => {
      const student = await orchestrator.createStudent();

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/packages`,
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:package".',
        status_code: 403,
      });
    });
  });

  describe("Operador user", () => {
    test("Without read:package permission", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);
      const student = await orchestrator.createStudent();

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/packages`,
        {
          headers: { Cookie: `session_id=${operadorSession.token}` },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:package".',
        status_code: 403,
      });
    });
  });

  describe("Supervisor user", () => {
    test("Non-existent student", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/students/00000000-0000-0000-0000-000000000000/packages",
        {
          headers: { Cookie: `session_id=${supervisorSession.token}` },
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("NotFoundError");
    });

    test("Student with no packages", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const student = await orchestrator.createStudent();

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/packages`,
        {
          headers: { Cookie: `session_id=${supervisorSession.token}` },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual([]);
    });

    test("Student with manual credit only (not returned)", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const student = await orchestrator.createStudent();

      await orchestrator.createCreditTransaction(student.id, supervisor.id, {
        type: "manual",
        amount: 20,
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/packages`,
        {
          headers: { Cookie: `session_id=${supervisorSession.token}` },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual([]);
    });

    test("Student with a package (without expires_at)", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const student = await orchestrator.createStudent();

      await orchestrator.createCreditTransaction(student.id, supervisor.id, {
        type: "package",
        amount: 50,
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/packages`,
        {
          headers: { Cookie: `session_id=${supervisorSession.token}` },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toHaveLength(1);

      const pkg = responseBody[0];
      expect(pkg).toEqual({
        id: pkg.id,
        student_id: student.id,
        operator_id: supervisor.id,
        amount: "50.00",
        type: "package",
        balance_after: "50.00",
        expires_at: null,
        created_at: pkg.created_at,
        updated_at: pkg.updated_at,
      });

      expect(uuidVersion(pkg.id)).toBe(4);
      expect(Date.parse(pkg.created_at)).not.toBeNaN();
    });

    test("Student with a package with expires_at", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const student = await orchestrator.createStudent();

      const expiresAt = "2026-12-31T00:00:00.000Z";

      await orchestrator.createCreditTransaction(student.id, supervisor.id, {
        type: "package",
        amount: 100,
        expires_at: expiresAt,
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/packages`,
        {
          headers: { Cookie: `session_id=${supervisorSession.token}` },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toHaveLength(1);
      expect(responseBody[0].expires_at).toBe(expiresAt);
      expect(responseBody[0].type).toBe("package");
    });

    test("Returns only packages, not manual credits", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);
      const student = await orchestrator.createStudent();

      await orchestrator.createCreditTransaction(student.id, supervisor.id, {
        type: "manual",
        amount: 10,
      });
      await orchestrator.createCreditTransaction(student.id, supervisor.id, {
        type: "package",
        amount: 80,
      });
      await orchestrator.createCreditTransaction(student.id, supervisor.id, {
        type: "manual",
        amount: 5,
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/packages`,
        {
          headers: { Cookie: `session_id=${supervisorSession.token}` },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toHaveLength(1);
      expect(responseBody[0].type).toBe("package");
      expect(responseBody[0].amount).toBe("80.00");
    });
  });

  describe("Admin user", () => {
    test("Can read packages", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const student = await orchestrator.createStudent();

      await orchestrator.createCreditTransaction(student.id, admin.id, {
        type: "package",
        amount: 60,
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${student.id}/packages`,
        {
          headers: { Cookie: `session_id=${adminSession.token}` },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toHaveLength(1);
      expect(responseBody[0].type).toBe("package");
    });
  });
});
