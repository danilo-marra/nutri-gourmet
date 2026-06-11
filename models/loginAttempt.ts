import database from "infra/database.js";

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 10;

async function isLimitExceeded(ip: string): Promise<boolean> {
  const result = await database.query<{ count: string }>({
    text: `
      SELECT
        COUNT(*) AS count
      FROM
        login_attempts
      WHERE
        ip = $1
        AND attempted_at > NOW() - INTERVAL '${WINDOW_MINUTES} minutes'
    `,
    values: [ip],
  });
  return parseInt(result.rows[0].count, 10) >= MAX_ATTEMPTS;
}

async function record(ip: string): Promise<void> {
  await database.query({
    text: `INSERT INTO login_attempts (ip) VALUES ($1)`,
    values: [ip],
  });

  // Best-effort cleanup to avoid unbounded table growth.
  database
    .query({
      text: `DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '1 hour'`,
    })
    .catch(() => {});
}

const loginAttempt = { isLimitExceeded, record, WINDOW_MINUTES, MAX_ATTEMPTS };

export default loginAttempt;
