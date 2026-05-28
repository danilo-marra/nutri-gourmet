import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/password/recovery", () => {
  describe("Anonymous user", () => {
    test("With existing email", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      await orchestrator.deleteAllEmails();

      const response = await fetch(
        "http://localhost:3000/api/v1/password/recovery",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: createdUser.email }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        message:
          "Se o email informado estiver cadastrado, você receberá um link de recuperação em breve.",
      });

      const lastEmail = await orchestrator.getLastEmail();
      expect(lastEmail).not.toBeNull();
      expect(lastEmail.text).toContain(createdUser.username);
      expect(lastEmail.text).toContain("/recovery/");
    });

    test("With non-existing email", async () => {
      await orchestrator.deleteAllEmails();

      const response = await fetch(
        "http://localhost:3000/api/v1/password/recovery",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: "naoexiste@example.com" }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        message:
          "Se o email informado estiver cadastrado, você receberá um link de recuperação em breve.",
      });

      const lastEmail = await orchestrator.getLastEmail();
      expect(lastEmail).toBeNull();
    });

    test("Without body", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/password/recovery",
        {
          method: "POST",
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        message:
          "Se o email informado estiver cadastrado, você receberá um link de recuperação em breve.",
      });
    });
  });
});
