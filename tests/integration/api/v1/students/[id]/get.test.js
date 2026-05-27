import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/students/[id]", () => {
  describe("Operador user", () => {
    test("Fetching an existing student", async () => {
      const operador = await orchestrator.createUser({ role: "operador" });
      const operadorSession = await orchestrator.createSession(operador.id);

      const createdStudent = await orchestrator.createStudent({
        name: "Carlos Pereira",
        class: "4C",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/students/${createdStudent.id}`,
        {
          headers: {
            Cookie: `session_id=${operadorSession.token}`,
          },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdStudent.id,
        name: "Carlos Pereira",
        class: "4C",
        is_full_time: false,
        balance: "0.00",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });
  });

  describe("Supervisor user", () => {
    test("With nonexistent id", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/students/00000000-0000-0000-0000-000000000000",
        {
          headers: {
            Cookie: `session_id=${supervisorSession.token}`,
          },
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody.name).toBe("NotFoundError");
      expect(responseBody.status_code).toBe(404);
    });
  });
});
