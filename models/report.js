import database from "infra/database.js";

async function salesByPeriod({ startDate, endDate }) {
  const result = await database.query({
    text: `
      SELECT
        payment_method,
        COUNT(*)::int AS sale_count,
        SUM(total) AS total_amount
      FROM sales
      WHERE reversed_at IS NULL
        AND created_at::date BETWEEN $1 AND $2
      GROUP BY payment_method
      ORDER BY payment_method
    `,
    values: [startDate, endDate],
  });

  const grandTotalResult = await database.query({
    text: `
      SELECT COALESCE(SUM(total), 0) AS grand_total
      FROM sales
      WHERE reversed_at IS NULL
        AND created_at::date BETWEEN $1 AND $2
    `,
    values: [startDate, endDate],
  });

  return {
    by_payment_method: result.rows,
    grand_total: grandTotalResult.rows[0].grand_total,
  };
}

async function creditsAdded({ startDate, endDate, studentId }) {
  const result = await database.query({
    text: `
      SELECT
        ct.id,
        ct.student_id,
        s.name AS student_name,
        ct.amount,
        ct.type,
        ct.balance_after,
        ct.expires_at,
        ct.created_at,
        u.username AS operator_username
      FROM credit_transactions ct
      JOIN students s ON s.id = ct.student_id
      JOIN users u ON u.id = ct.operator_id
      WHERE ct.created_at::date BETWEEN $1 AND $2
        AND ($3::uuid IS NULL OR ct.student_id = $3)
      ORDER BY ct.created_at DESC
    `,
    values: [startDate, endDate, studentId ?? null],
  });

  return result.rows;
}

async function balanceByStudent() {
  const result = await database.query({
    text: `
      SELECT id, name, class, is_full_time, balance
      FROM students
      ORDER BY name ASC
    `,
  });

  return result.rows;
}

async function cashCloses({ startDate, endDate, operatorId }) {
  const result = await database.query({
    text: `
      WITH sales_dates AS (
        SELECT operator_id, created_at::date AS date
        FROM sales
        WHERE reversed_at IS NULL
          AND ($1::date IS NULL OR created_at::date >= $1)
          AND ($2::date IS NULL OR created_at::date <= $2)
          AND ($3::uuid IS NULL OR operator_id = $3)
        GROUP BY operator_id, created_at::date
      ),
      closed_days AS (
        SELECT
          cc.id,
          cc.operator_id,
          cc.closed_by_id,
          cc.date,
          'closed'           AS status,
          cc.total_sales,
          cc.total_credit,
          cc.total_cash,
          cc.total_card,
          cc.created_at
        FROM cash_closes cc
        WHERE ($1::date IS NULL OR cc.date >= $1)
          AND ($2::date IS NULL OR cc.date <= $2)
          AND ($3::uuid IS NULL OR cc.operator_id = $3)
      ),
      pending_days AS (
        SELECT
          NULL::uuid        AS id,
          sd.operator_id,
          NULL::uuid        AS closed_by_id,
          sd.date,
          'pending'         AS status,
          NULL::numeric     AS total_sales,
          NULL::numeric     AS total_credit,
          NULL::numeric     AS total_cash,
          NULL::numeric     AS total_card,
          NULL::timestamptz AS created_at
        FROM sales_dates sd
        WHERE NOT EXISTS (
          SELECT 1 FROM cash_closes cc
          WHERE cc.operator_id = sd.operator_id
            AND cc.date = sd.date
        )
      ),
      combined AS (
        SELECT * FROM closed_days
        UNION ALL
        SELECT * FROM pending_days
      )
      SELECT
        c.id,
        c.operator_id,
        u.username          AS operator_username,
        c.closed_by_id,
        cb.username         AS closed_by_username,
        c.date::text        AS date,
        c.status,
        c.total_sales,
        c.total_credit,
        c.total_cash,
        c.total_card,
        c.created_at
      FROM combined c
      JOIN users u ON u.id = c.operator_id
      LEFT JOIN users cb ON cb.id = c.closed_by_id
      ORDER BY c.date DESC, u.username ASC
    `,
    values: [startDate ?? null, endDate ?? null, operatorId ?? null],
  });

  return result.rows;
}

async function activePackages() {
  const result = await database.query({
    text: `
      SELECT
        ct.id,
        ct.student_id,
        s.name AS student_name,
        ct.amount,
        ct.expires_at,
        ct.created_at,
        u.username AS operator_username
      FROM credit_transactions ct
      JOIN students s ON s.id = ct.student_id
      JOIN users u ON u.id = ct.operator_id
      WHERE ct.type = 'package'
        AND (ct.expires_at IS NULL OR ct.expires_at > NOW())
      ORDER BY ct.expires_at ASC NULLS LAST, ct.created_at DESC
    `,
  });

  return result.rows;
}

const report = {
  salesByPeriod,
  creditsAdded,
  balanceByStudent,
  cashCloses,
  activePackages,
};

export default report;
