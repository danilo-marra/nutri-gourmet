import orchestrator from "tests/orchestrator.js";
import passwordReset from "models/passwordReset.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/password/recovery/[token_id]", () => {
  describe("Anonymous user", () => {
    test("With valid token and new password", async () => {
      const createdUser = await orchestrator.createUser({
        password: "senhaantiga",
      });
      await orchestrator.activateUser(createdUser);
      const resetToken = await passwordReset.create(createdUser.id);

      const patchResponse = await fetch(
        `http://localhost:3000/api/v1/password/recovery/${resetToken.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: "novaSenha123" }),
        },
      );

      expect(patchResponse.status).toBe(204);

      const loginResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: createdUser.email,
            password: "novaSenha123",
          }),
        },
      );

      expect(loginResponse.status).toBe(201);
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - 2 * passwordReset.EXPIRATION_IN_MILISECONDS),
        doNotFake: [
          "setTimeout",
          "setInterval",
          "setImmediate",
          "clearTimeout",
          "clearInterval",
          "clearImmediate",
          "nextTick",
        ],
      });

      const createdUser = await orchestrator.createUser();
      const expiredToken = await passwordReset.create(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(
        `http://localhost:3000/api/v1/password/recovery/${expiredToken.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: "novaSenha123" }),
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de recuperação de senha utilizado não foi encontrado no sistema ou expirou.",
        action: "Solicite um novo link de recuperação de senha.",
        status_code: 404,
      });
    });

    test("With already used token", async () => {
      const createdUser = await orchestrator.createUser();
      const resetToken = await passwordReset.create(createdUser.id);

      const response1 = await fetch(
        `http://localhost:3000/api/v1/password/recovery/${resetToken.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: "novaSenha123" }),
        },
      );

      expect(response1.status).toBe(204);

      const response2 = await fetch(
        `http://localhost:3000/api/v1/password/recovery/${resetToken.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: "outraSenha456" }),
        },
      );

      expect(response2.status).toBe(404);

      const responseBody2 = await response2.json();
      expect(responseBody2).toEqual({
        name: "NotFoundError",
        message:
          "O token de recuperação de senha utilizado não foi encontrado no sistema ou expirou.",
        action: "Solicite um novo link de recuperação de senha.",
        status_code: 404,
      });
    });

    test("With non-existent token_id", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/password/recovery/00000000-0000-0000-0000-000000000000",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: "novaSenha123" }),
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de recuperação de senha utilizado não foi encontrado no sistema ou expirou.",
        action: "Solicite um novo link de recuperação de senha.",
        status_code: 404,
      });
    });
  });
});
