import database from "infra/database.js";

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 10;

// Inserts the attempt and returns whether the IP should be blocked, in a single
// DB round-trip. The CTE INSERT and the COUNT share the same MVCC snapshot, so
// the new row is not visible to the SELECT; we add 1 manually to account for it.
// This collapses the race window from an application-level gap (check, then insert)
// to a near-zero DB-level snapshot boundary.
async function recordAndCheck(ip: string): Promise<boolean> {
  const result = await database.query<{ count: string }>({
    text: `
      WITH new_attempt AS (
        INSERT INTO login_attempts (ip) VALUES ($1) RETURNING 1 AS n
      )
      SELECT
        (SELECT COUNT(*) FROM login_attempts
         WHERE ip = $1
           AND attempted_at > NOW() - INTERVAL '${WINDOW_MINUTES} minutes') +
        new_attempt.n AS count
      FROM new_attempt
    `,
    values: [ip],
  });

  // Best-effort cleanup to avoid unbounded table growth.
  database
    .query({
      text: `DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '1 hour'`,
    })
    .catch(() => {});

  // count = (existing rows in window) + 1 (just inserted); block when it exceeds MAX_ATTEMPTS.
  return parseInt(result.rows[0].count, 10) > MAX_ATTEMPTS;
}

const loginAttempt = { recordAndCheck, WINDOW_MINUTES, MAX_ATTEMPTS };

export default loginAttempt;
