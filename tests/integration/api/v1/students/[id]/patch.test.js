import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/students/[id]", () => {
  describe("Operador user", () => {
    test("Trying to update a student", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);

      const createdStudent = await orchestrator.createStudent({
        name: "Diana Souza",
        class: "1B",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${createdStudent.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${operadorSession.token}`,
          },
          body: JSON.stringify({
            name: "Diana Souza Atualizada",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "update:student".',
        status_code: 403,
      });
    });
  });

  describe("Supervisor user", () => {
    test("Updating the 'name' field", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const createdStudent = await orchestrator.createStudent({
        name: "Eduardo Lima",
        class: "3A",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${createdStudent.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${supervisorSession.token}`,
          },
          body: JSON.stringify({
            name: "Eduardo Lima Atualizado",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdStudent.id,
        name: "Eduardo Lima Atualizado",
        class: "3A",
        is_full_time: false,
        balance: "0.00",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("Sending name: '' should return 400 ValidationError", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const createdStudent = await orchestrator.createStudent();

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${createdStudent.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${supervisorSession.token}`,
          },
          body: JSON.stringify({ name: "" }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ValidationError");
      expect(responseBody.status_code).toBe(400);
    });

    test("With nonexistent id", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/students/00000000-0000-0000-0000-000000000000",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${supervisorSession.token}`,
          },
          body: JSON.stringify({
            name: "Inexistente",
          }),
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody.name).toBe("NotFoundError");
      expect(responseBody.status_code).toBe(404);
    });
  });
});
