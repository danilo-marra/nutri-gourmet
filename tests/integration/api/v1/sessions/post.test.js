import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import loginAttempt from "models/loginAttempt.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With incorrect `email` but correct `password`", async () => {
      await orchestrator.createUser({
        password: "senha-correta",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.errado@john_doe.com",
          password: "senha-correta",
        }),
      });

      expect(response.status).toBe(401); // unauthorized

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de auntenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With correct `email` but incorrect `password`", async () => {
      await orchestrator.createUser({
        email: "email.correto@john_doe.com",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.correto@john_doe.com",
          password: "senha-incorreta",
        }),
      });

      expect(response.status).toBe(401); // unauthorized

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de auntenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With incorrect `email` and incorrect `password`", async () => {
      await orchestrator.createUser();

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.incorreto@john_doe.com",
          password: "senha-incorreta",
        }),
      });

      expect(response.status).toBe(401); // unauthorized

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de auntenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With correct `email` and correct `password`", async () => {
      const createdUser = await orchestrator.createUser({
        email: "tudo.correto@john_doe.com",
        password: "tudocorreto",
      });

      await orchestrator.activateUser(createdUser);

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "tudo.correto@john_doe.com",
          password: "tudocorreto",
        }),
      });

      expect(response.status).toBe(201); // created

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: createdUser.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      const actualDifference = expiresAt - createdAt;
      const expectedDifference = session.EXPIRATION_IN_MILISECONDS;
      const tolerance = 5000;

      expect(
        Math.abs(actualDifference - expectedDifference),
      ).toBeLessThanOrEqual(tolerance);

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: responseBody.token,
        maxAge: session.EXPIRATION_IN_MILISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });
  });

  describe("Rate limiting", () => {
    // TEST-NET-3 (RFC 5737) — never used by real traffic, won't collide with
    // the ::1 socket address used by the other tests above.
    const RATE_LIMIT_TEST_IP = "203.0.113.42";

    const makeAttempt = () =>
      fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-real-ip": RATE_LIMIT_TEST_IP,
        },
        body: JSON.stringify({
          email: "ratelimit@test.com",
          password: "wrong-password",
        }),
      });

    test("Retorna 429 após MAX_ATTEMPTS tentativas", async () => {
      for (let i = 0; i < loginAttempt.MAX_ATTEMPTS; i++) {
        const res = await makeAttempt();
        expect(res.status).toBe(401);
      }

      const blocked = await makeAttempt();
      expect(blocked.status).toBe(429);
    });

    test("Body do 429 segue contrato de erro", async () => {
      const res = await makeAttempt();
      expect(res.status).toBe(429);
      expect(await res.json()).toEqual({
        name: "TooManyRequestsError",
        message:
          "Muitas tentativas de acesso. Tente novamente em alguns minutos.",
        action: "Aguarde antes de tentar novamente.",
        status_code: 429,
      });
    });

    test("Resposta 429 inclui header Retry-After", async () => {
      const res = await makeAttempt();
      expect(res.status).toBe(429);
      expect(res.headers.get("retry-after")).toBe(
        String(loginAttempt.WINDOW_MINUTES * 60),
      );
    });
  });
});
