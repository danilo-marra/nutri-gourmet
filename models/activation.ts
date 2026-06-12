import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import user from "models/user.js";
import { ForbiddenError, NotFoundError } from "infra/errors";
import authorization from "./authorization";
import type { ActivationToken, User } from "@/types/index";

const EXPIRATION_IN_MILISECONDS = 60 * 15 * 1000; // 15 minutes

async function findOneValidById(tokenId: string): Promise<ActivationToken> {
  const activationTokenId = await runSelectQuery(tokenId);

  return activationTokenId;

  async function runSelectQuery(tokenId: string): Promise<ActivationToken> {
    const results = await database.query<ActivationToken>({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
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
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
      });
    }

    return results.rows[0];
  }
}

async function create(userId: string): Promise<ActivationToken> {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(
    userId: string,
    expiresAt: Date,
  ): Promise<ActivationToken> {
    const results = await database.query<ActivationToken>({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

async function sendEmailToUser(
  user: Pick<User, "username" | "email">,
  activationToken: Pick<ActivationToken, "id">,
): Promise<void> {
  const appName = process.env.APP_NAME;
  const appEmail = process.env.APP_EMAIL;
  const activationPath = process.env.ACTIVATION_PATH || "/activate";

  const activationUrl = `${webserver.origin}${activationPath}/${activationToken.id}`;
  const safeUsername = escapeHtml(user.username);

  await email.send({
    from: `${appName} <${appEmail}>`,
    to: user.email,
    subject: `Ative sua conta no ${appName}`,
    text: `Olá, ${user.username}!

Clique no link abaixo para ativar sua conta no ${appName}:

${activationUrl}

Este link expira em 15 minutos.

Atenciosamente,
Equipe ${appName}`,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px 36px;max-width:480px">
        <tr><td>
          <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#1a1a1a">${appName}</p>
          <p style="margin:0 0 24px;font-size:13px;color:#666">Sistema da cantina</p>
          <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a">Olá, <strong>${safeUsername}</strong>!</p>
          <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
            Sua conta foi criada no ${appName}. Clique no botão abaixo para ativá-la e acessar o sistema.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px">
            <tr><td style="border-radius:6px;background:#2e7d32">
              <a href="${activationUrl}" target="_blank"
                style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px">
                Ativar conta
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;color:#888;line-height:1.6">
            O link é válido por <strong>15 minutos</strong>. Se expirar, solicite um novo convite ao administrador.
          </p>
          <p style="margin:0 0 24px;font-size:12px;color:#888;line-height:1.6">
            Se você não esperava este e-mail, pode ignorá-lo com segurança.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
          <p style="margin:0;font-size:12px;color:#bbb">
            Você está recebendo este e-mail porque uma conta foi criada associada a este endereço.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

async function markTokenAsUsed(
  activationTokenId: string,
): Promise<ActivationToken> {
  const usedActivationToken = await runUpdateQuery(activationTokenId);
  return usedActivationToken;

  async function runUpdateQuery(
    activationTokenId: string,
  ): Promise<ActivationToken> {
    const results = await database.query<ActivationToken>({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [activationTokenId],
    });

    return results.rows[0];
  }
}

async function activateUserByUserId(userId: string): Promise<User> {
  const userToActivate = await user.findOneById(userId);

  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError({
      message: "Você não pode mais utilizar tokens de ativação.",
      action: "Entre em contato com o suporte.",
    });
  }
  const activatedUser = await user.activate(userId, "operador");
  return activatedUser;
}

const activation = {
  create,
  sendEmailToUser,
  markTokenAsUsed,
  findOneValidById,
  activateUserByUserId,
  EXPIRATION_IN_MILISECONDS,
};

export default activation;
