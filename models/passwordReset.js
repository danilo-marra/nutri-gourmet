import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import { NotFoundError } from "infra/errors.js";
import password from "models/password.js";

const EXPIRATION_IN_MILISECONDS = 30 * 60 * 1000;

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          password_reset_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
        ;`,
      values: [userId, expiresAt],
    });
    return results.rows[0];
  }
}

async function findOneValidById(tokenId) {
  const token = await runSelectQuery(tokenId);
  return token;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          password_reset_tokens
        WHERE
          id = $1
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT
          1
        ;`,
      values: [tokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de recuperação de senha utilizado não foi encontrado no sistema ou expirou.",
        action: "Solicite um novo link de recuperação de senha.",
      });
    }

    return results.rows[0];
  }
}

async function markTokenAsUsed(tokenId) {
  const usedToken = await runUpdateQuery(tokenId);
  return usedToken;

  async function runUpdateQuery(tokenId) {
    const results = await database.query({
      text: `
        UPDATE
          password_reset_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [tokenId],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, resetToken) {
  const appName = process.env.APP_NAME;
  const appEmail = process.env.APP_EMAIL;
  const recoveryPath = process.env.PASSWORD_RECOVERY_PATH || "/recovery";

  await email.send({
    from: `${appName} <${appEmail}>`,
    to: user.email,
    subject: `Recuperação de senha — ${appName}`,
    text: `Olá, ${user.username}!

Clique no link abaixo para redefinir sua senha no ${appName}:

${webserver.origin}${recoveryPath}/${resetToken.id}

Este link expira em 30 minutos.

Se você não solicitou a recuperação de senha, ignore este email.

Atenciosamente,
Equipe ${appName}`,
  });
}

async function resetPassword(userId, newPassword) {
  const hashedPassword = await password.hash(newPassword);

  await database.query({
    text: `
      UPDATE
        users
      SET
        password = $2,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      ;`,
    values: [userId, hashedPassword],
  });
}

const passwordReset = {
  create,
  findOneValidById,
  markTokenAsUsed,
  sendEmailToUser,
  resetPassword,
  EXPIRATION_IN_MILISECONDS,
};

export default passwordReset;
