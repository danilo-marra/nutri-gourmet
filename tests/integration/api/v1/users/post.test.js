import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import password from "models/password.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "john_doe",
          email: "contato@john_doe.com",
          password: "senha123",
        }),
      });

      expect(response.status).toBe(201); // created

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "john_doe",
        role: "pending",
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername("john_doe");
      const correctPasswordMatch = await password.compare(
        "senha123",
        userInDatabase.password,
      );
      const inCorrectPasswordMatch = await password.compare(
        "senha1234",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(inCorrectPasswordMatch).toBe(false);
    });
    test("With duplicated 'email'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado1",
          email: "duplicado@john_doe.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201); // created

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado2",
          email: "Duplicado@john_doe.com",
          password: "senha123",
        }),
      });

      expect(response2.status).toBe(400); // bad request

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
      // 409 - conflict
      // 422 - unprocessable entity
      // 404 - not found
      // 401 - unauthorized
      // 403 - forbidden
    });
    test("With duplicated 'username'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "usernameduplicado",
          email: "usernameduplicado1@john_doe.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201); // created

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "UsernameDuplicado",
          email: "usernameduplicado2@john_doe.com",
          password: "senha123",
        }),
      });

      expect(response2.status).toBe(400); // bad request

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });
  });
  describe("Default user", () => {
    test("With unique and valid data", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);
      const user1SessionObject = await orchestrator.createSession(user1.id);

      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user1SessionObject.token}`,
        },
        body: JSON.stringify({
          username: "usuariologado",
          email: "usuariologado@curso.dev",
          password: "senha123",
        }),
      });

      expect(user2Response.status).toBe(403); // forbidden

      const user2ResponseBody = await user2Response.json();

      expect(user2ResponseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: `Verifique se o seu usuário possui a feature "create:user".`,
        status_code: 403,
      });
    });
  });

  describe("Supervisor user", () => {
    test("Creates operador account (role omitted)", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${supervisorSession.token}`,
        },
        body: JSON.stringify({
          username: "novooperador",
          email: "novooperador@cantina.dev",
          password: "senha123",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody.username).toBe("novooperador");
      expect(responseBody.role).toBe("pending");
      expect(responseBody).not.toHaveProperty("email");
      expect(responseBody).not.toHaveProperty("password");
    });

    test("Creates operador account (role: operador)", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${supervisorSession.token}`,
        },
        body: JSON.stringify({
          username: "operadorexplicito",
          email: "operadorexplicito@cantina.dev",
          password: "senha123",
          role: "operador",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody.username).toBe("operadorexplicito");
    });

    test("Cannot create supervisor account", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${supervisorSession.token}`,
        },
        body: JSON.stringify({
          username: "tentativasupervisor",
          email: "tentativasupervisor@cantina.dev",
          password: "senha123",
          role: "supervisor",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não pode atribuir este nível de acesso.",
        action:
          'Defina o campo "role" como "operador" ou "pending", ou omita-o.',
        status_code: 403,
      });
    });

    test("Cannot create admin account", async () => {
      const supervisor = await orchestrator.createUser({ role: "supervisor" });
      const supervisorSession = await orchestrator.createSession(supervisor.id);

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${supervisorSession.token}`,
        },
        body: JSON.stringify({
          username: "tentativaadmin",
          email: "tentativaadmin@cantina.dev",
          password: "senha123",
          role: "admin",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ForbiddenError");
    });
  });

  describe("Feature-privileged user", () => {
    test("With manual `create:user` cannot create an admin account", async () => {
      const operador = await orchestrator.createUser();
      const activatedOperador = await orchestrator.activateUser(operador);
      await orchestrator.addFeaturesToUser(operador, ["create:user"]);
      const operadorSession = await orchestrator.createSession(
        activatedOperador.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${operadorSession.token}`,
        },
        body: JSON.stringify({
          username: "tentativaadminoperador",
          email: "tentativaadminoperador@cantina.dev",
          password: "senha123",
          role: "admin",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ForbiddenError");
      expect(responseBody.message).toBe(
        "Você não pode atribuir este nível de acesso.",
      );
    });
  });
});
