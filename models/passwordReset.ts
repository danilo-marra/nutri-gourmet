import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import { NotFoundError } from "infra/errors.js";
import password from "models/password.js";
import type { PasswordResetToken, User } from "@/types/index";

const EXPIRATION_IN_MILISECONDS = 30 * 60 * 1000;

async function create(userId: string): Promise<PasswordResetToken> {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(
    userId: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    const results = await database.query<PasswordResetToken>({
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

async function findOneValidById(tokenId: string): Promise<PasswordResetToken> {
  const token = await runSelectQuery(tokenId);
  return token;

  async function runSelectQuery(tokenId: string): Promise<PasswordResetToken> {
    const results = await database.query<PasswordResetToken>({
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

async function markTokenAsUsed(tokenId: string): Promise<PasswordResetToken> {
  const usedToken = await runUpdateQuery(tokenId);
  return usedToken;

  async function runUpdateQuery(tokenId: string): Promise<PasswordResetToken> {
    const results = await database.query<PasswordResetToken>({
      text: `
        UPDATE
          password_reset_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
          AND used_at IS NULL
          AND expires_at > NOW()
        RETURNING
          *
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

async function sendEmailToUser(
  user: Pick<User, "username" | "email">,
  resetToken: Pick<PasswordResetToken, "id">,
): Promise<void> {
  const appName = process.env.APP_NAME;
  const appEmail = process.env.APP_EMAIL;
  const recoveryPath = process.env.PASSWORD_RECOVERY_PATH || "/recovery";

  const resetUrl = `${webserver.origin}${recoveryPath}/${resetToken.id}`;

  await email.send({
    from: `${appName} <${appEmail}>`,
    to: user.email,
    subject: `Redefinição de senha — ${appName}`,
    text: `Olá, ${user.username}!

Recebemos uma solicitação para redefinir a senha da sua conta no ${appName}.

Acesse o link abaixo para criar uma nova senha:
${resetUrl}

O link é válido por 30 minutos. Após esse prazo, será necessário solicitar um novo.

Se você não fez essa solicitação, pode ignorar este e-mail com segurança — sua senha não será alterada.

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
          <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a">Olá, <strong>${user.username}</strong>!</p>
          <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
            Recebemos uma solicitação para redefinir a senha da sua conta. Use o botão abaixo para criar uma nova senha.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px">
            <tr><td style="border-radius:6px;background:#2e7d32">
              <a href="${resetUrl}" target="_blank"
                style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px">
                Redefinir senha
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;color:#888;line-height:1.6">
            O link é válido por <strong>30 minutos</strong>. Se expirar, solicite um novo na página de recuperação de senha.
          </p>
          <p style="margin:0 0 24px;font-size:12px;color:#888;line-height:1.6">
            Se você não fez essa solicitação, ignore este e-mail — sua senha não será alterada.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
          <p style="margin:0;font-size:12px;color:#bbb">
            Você está recebendo este e-mail porque uma solicitação de redefinição de senha foi feita para a conta associada a este endereço.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

async function resetPassword(
  userId: string,
  newPassword: string,
): Promise<void> {
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
