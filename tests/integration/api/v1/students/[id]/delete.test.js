import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/students/[id]", () => {
  describe("Operador user", () => {
    test("Trying to delete a student", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);

      const createdStudent = await orchestrator.createStudent({
        name: "Fernanda Gomes",
        class: "2A",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${createdStudent.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${operadorSession.token}`,
          },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "delete:student".',
        status_code: 403,
      });
    });
  });

  describe("Supervisor user", () => {
    test("Deleting an existing student", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const createdStudent = await orchestrator.createStudent({
        name: "Gabriel Santos",
        class: "5B",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${createdStudent.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${supervisorSession.token}`,
          },
        },
      );

      expect(response.status).toBe(204);
    });

    test("Trying to delete the same student again", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const createdStudent = await orchestrator.createStudent({
        name: "Helena Rocha",
        class: "1C",
      });

      const firstDelete = await fetch(
        `http://localhost:3000/api/v1/students/${createdStudent.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${supervisorSession.token}`,
          },
        },
      );

      expect(firstDelete.status).toBe(204);

      const secondDelete = await fetch(
        `http://localhost:3000/api/v1/students/${createdStudent.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${supervisorSession.token}`,
          },
        },
      );

      expect(secondDelete.status).toBe(404);

      const responseBody = await secondDelete.json();

      expect(responseBody.name).toBe("NotFoundError");
      expect(responseBody.status_code).toBe(404);
    });
  });
});
