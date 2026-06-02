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

async function dashboardSummary() {
  const result = await database.query({
    text: `
      WITH
      today_sales AS (
        SELECT
          COALESCE(SUM(total), 0) AS revenue_today,
          COUNT(*)::int            AS count_today
        FROM sales
        WHERE reversed_at IS NULL
          AND created_at::date = CURRENT_DATE
      ),
      week_sales AS (
        SELECT
          COALESCE(SUM(total), 0) AS revenue_week,
          COUNT(*)::int            AS count_week
        FROM sales
        WHERE reversed_at IS NULL
          AND created_at::date >= date_trunc('week', CURRENT_DATE)::date
      ),
      month_sales AS (
        SELECT
          COALESCE(SUM(total), 0) AS revenue_month,
          COUNT(*)::int            AS count_month
        FROM sales
        WHERE reversed_at IS NULL
          AND created_at::date >= date_trunc('month', CURRENT_DATE)::date
      ),
      negative_balances AS (
        SELECT COUNT(*)::int AS count_negative_balances
        FROM students
        WHERE balance < 0
      ),
      pending_closes AS (
        SELECT COUNT(DISTINCT operator_id)::int AS count_pending_closes
        FROM sales
        WHERE reversed_at IS NULL
          AND created_at::date = CURRENT_DATE
          AND operator_id NOT IN (
            SELECT operator_id FROM cash_closes WHERE date = CURRENT_DATE
          )
      )
      SELECT
        t.revenue_today,
        t.count_today,
        w.revenue_week,
        w.count_week,
        m.revenue_month,
        m.count_month,
        nb.count_negative_balances,
        pc.count_pending_closes
      FROM today_sales t, week_sales w, month_sales m, negative_balances nb, pending_closes pc
    `,
  });

  return result.rows[0];
}

async function revenueTrend({ days }) {
  const result = await database.query({
    text: `
      SELECT
        d.date::date::text            AS date,
        COALESCE(SUM(s.total), 0)     AS total
      FROM generate_series(
        (CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day')::date,
        CURRENT_DATE,
        INTERVAL '1 day'
      ) AS d(date)
      LEFT JOIN sales s
        ON s.created_at::date = d.date
        AND s.reversed_at IS NULL
      GROUP BY d.date
      ORDER BY d.date ASC
    `,
    values: [days],
  });

  return result.rows;
}

async function topProducts({ startDate, endDate, limit }) {
  const result = await database.query({
    text: `
      SELECT
        p.id           AS product_id,
        p.name         AS product_name,
        p.category,
        SUM(si.qty)::int                  AS qty_sold,
        SUM(si.qty * si.unit_price)       AS revenue
      FROM sale_items si
      JOIN products p ON p.id = si.product_id
      JOIN sales    s ON s.id = si.sale_id
      WHERE s.reversed_at IS NULL
        AND s.created_at::date BETWEEN $1 AND $2
      GROUP BY p.id, p.name, p.category
      ORDER BY qty_sold DESC
      LIMIT $3
    `,
    values: [startDate, endDate, limit],
  });

  return result.rows;
}

async function salesByProduct({ startDate, endDate }) {
  const result = await database.query({
    text: `
      SELECT
        p.id                              AS product_id,
        p.name                            AS product_name,
        p.category,
        SUM(si.qty)::int                  AS qty_sold,
        SUM(si.qty * si.unit_price)       AS revenue
      FROM sale_items si
      JOIN products p ON p.id = si.product_id
      JOIN sales    s ON s.id = si.sale_id
      WHERE s.reversed_at IS NULL
        AND s.created_at::date BETWEEN $1 AND $2
      GROUP BY p.id, p.name, p.category
      ORDER BY revenue DESC
    `,
    values: [startDate, endDate],
  });

  return result.rows;
}

async function creditsConsumed({ startDate, endDate }) {
  const result = await database.query({
    text: `
      SELECT
        s.student_id,
        st.name           AS student_name,
        st.class,
        COUNT(s.id)::int  AS sale_count,
        SUM(s.total)      AS total_consumed
      FROM sales s
      JOIN students st ON st.id = s.student_id
      WHERE s.payment_method = 'credit'
        AND s.reversed_at IS NULL
        AND s.created_at::date BETWEEN $1 AND $2
      GROUP BY s.student_id, st.name, st.class
      ORDER BY total_consumed DESC
    `,
    values: [startDate, endDate],
  });

  return result.rows;
}

async function studentConsumption({ startDate, endDate }) {
  const result = await database.query({
    text: `
      SELECT
        s.student_id,
        st.name           AS student_name,
        st.class,
        COUNT(s.id)::int  AS sale_count,
        SUM(s.total)      AS total_consumed
      FROM sales s
      JOIN students st ON st.id = s.student_id
      WHERE s.reversed_at IS NULL
        AND s.created_at::date BETWEEN $1 AND $2
      GROUP BY s.student_id, st.name, st.class
      ORDER BY total_consumed DESC
    `,
    values: [startDate, endDate],
  });

  return result.rows;
}

async function categoryBreakdown({ startDate, endDate }) {
  const result = await database.query({
    text: `
      SELECT
        p.category,
        SUM(si.qty)::int                  AS qty_sold,
        SUM(si.qty * si.unit_price)       AS revenue
      FROM sale_items si
      JOIN products p ON p.id = si.product_id
      JOIN sales    s ON s.id = si.sale_id
      WHERE s.reversed_at IS NULL
        AND s.created_at::date BETWEEN $1 AND $2
      GROUP BY p.category
      ORDER BY revenue DESC
    `,
    values: [startDate, endDate],
  });

  return result.rows;
}

async function operatorSummary({ startDate, endDate }) {
  const result = await database.query({
    text: `
      SELECT
        u.id                          AS operator_id,
        u.username                    AS operator_username,
        COUNT(s.id)::int              AS sale_count,
        COALESCE(SUM(s.total), 0)     AS revenue
      FROM sales s
      JOIN users u ON u.id = s.operator_id
      WHERE s.reversed_at IS NULL
        AND s.created_at::date BETWEEN $1 AND $2
      GROUP BY u.id, u.username
      ORDER BY revenue DESC
    `,
    values: [startDate, endDate],
  });

  return result.rows;
}

async function myShiftSummary({ operatorId }) {
  const [salesResult, closeResult, studentsResult] = await Promise.all([
    database.query({
      text: `
        SELECT
          COALESCE(SUM(total), 0) AS revenue_today,
          COUNT(*)::int            AS count_today
        FROM sales
        WHERE reversed_at IS NULL
          AND operator_id = $1
          AND created_at::date = CURRENT_DATE
      `,
      values: [operatorId],
    }),
    database.query({
      text: `
        SELECT id, date::text, total_sales, total_credit, total_cash, total_card, created_at
        FROM cash_closes
        WHERE operator_id = $1
          AND date = CURRENT_DATE
      `,
      values: [operatorId],
    }),
    database.query({
      text: `
        SELECT DISTINCT st.id, st.name, st.class
        FROM sales sa
        JOIN students st ON st.id = sa.student_id
        WHERE sa.reversed_at IS NULL
          AND sa.operator_id = $1
          AND sa.created_at::date = CURRENT_DATE
          AND sa.student_id IS NOT NULL
      `,
      values: [operatorId],
    }),
  ]);

  return {
    revenue_today: salesResult.rows[0].revenue_today,
    count_today: salesResult.rows[0].count_today,
    cash_close: closeResult.rows[0] ?? null,
    students_served: studentsResult.rows,
  };
}

const report = {
  salesByPeriod,
  creditsAdded,
  balanceByStudent,
  cashCloses,
  activePackages,
  dashboardSummary,
  revenueTrend,
  topProducts,
  salesByProduct,
  creditsConsumed,
  studentConsumption,
  categoryBreakdown,
  operatorSummary,
  myShiftSummary,
};

export default report;
