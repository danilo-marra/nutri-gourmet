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
      SELECT
        cc.id,
        cc.operator_id,
        u.username AS operator_username,
        cc.closed_by_id,
        cb.username AS closed_by_username,
        cc.date::text AS date,
        cc.total_sales,
        cc.total_credit,
        cc.total_cash,
        cc.total_card,
        cc.created_at,
        cc.updated_at
      FROM cash_closes cc
      JOIN users u ON u.id = cc.operator_id
      JOIN users cb ON cb.id = cc.closed_by_id
      WHERE ($1::date IS NULL OR cc.date >= $1)
        AND ($2::date IS NULL OR cc.date <= $2)
        AND ($3::uuid IS NULL OR cc.operator_id = $3)
      ORDER BY cc.date DESC, cc.created_at DESC
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
