import crypto from "node:crypto";
import database from "infra/database.js";
import { UnauthorizedError } from "infra/errors";
import type { Session } from "@/types/index";

const EXPIRATION_IN_MILISECONDS = 60 * 60 * 24 * 30 * 1000; // 30 days

async function findOneValidByToken(sessionToken: string): Promise<Session> {
  const sessionFound = await runSelectQuery(sessionToken);

  return sessionFound;

  async function runSelectQuery(sessionToken: string): Promise<Session> {
    const results = await database.query<Session>({
      text: `
        SELECT
          *
        FROM
          sessions
        WHERE
          token = $1
          AND expires_at > NOW()
        LIMIT 1
      ;`,
      values: [sessionToken],
    });

    if (results.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
      });
    }

    return results.rows[0];
  }
}

async function create(userId: string): Promise<Session> {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);

  const newSession = await runInsertQuery(token, userId, expiresAt);
  return newSession;

  async function runInsertQuery(
    token: string,
    userId: string,
    expiresAt: Date,
  ): Promise<Session> {
    const results = await database.query<Session>({
      text: `
        INSERT INTO
          sessions (token, user_id, expires_at)
        VALUES
          ($1, $2, $3)
        RETURNING
        *
      ;`,
      values: [token, userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function renew(sessionId: string): Promise<Session> {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);

  const renewedSessionObject = await runUpdateQuery(sessionId, expiresAt);
  return renewedSessionObject;

  async function runUpdateQuery(
    sessionId: string,
    expiresAt: Date,
  ): Promise<Session> {
    const results = await database.query<Session>({
      text: `
        UPDATE
          sessions
        SET
          expires_at = $2,
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [sessionId, expiresAt],
    });

    return results.rows[0];
  }
}

async function expireById(sessionId: string): Promise<Session> {
  const expiredSessionObject = await runUpdateQuery(sessionId);
  return expiredSessionObject;

  async function runUpdateQuery(sessionId: string): Promise<Session> {
    const results = await database.query<Session>({
      text: `
        UPDATE
          sessions
        SET
          expires_at = expires_at - INTERVAL '1 year',
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [sessionId],
    });

    return results.rows[0];
  }
}

const session = {
  create,
  EXPIRATION_IN_MILISECONDS,
  findOneValidByToken,
  renew,
  expireById,
};

export default session;
