import database from "infra/database.js";
import { ValidationError } from "infra/errors.js";

async function create(closedById, { operator_id, date }) {
  try {
    const results = await database.query({
      text: `
      WITH totals AS (
        SELECT
          COALESCE(SUM(total), 0) AS total_sales,
          COALESCE(SUM(CASE WHEN payment_method = 'credit' THEN total ELSE 0 END), 0) AS total_credit,
          COALESCE(SUM(CASE WHEN payment_method = 'cash'   THEN total ELSE 0 END), 0) AS total_cash,
          COALESCE(SUM(CASE WHEN payment_method = 'card'   THEN total ELSE 0 END), 0) AS total_card
        FROM
          sales
        WHERE
          operator_id = $1
          AND DATE(created_at AT TIME ZONE 'UTC') = $3::date
          AND reversed_at IS NULL
      )
      INSERT INTO
        cash_closes (operator_id, closed_by_id, date, total_sales, total_credit, total_cash, total_card)
      SELECT
        $1, $2, $3, total_sales, total_credit, total_cash, total_card
      FROM
        totals
      RETURNING
        id, operator_id, closed_by_id, date::text AS date,
        total_sales, total_credit, total_cash, total_card,
        created_at, updated_at
      ;`,
      values: [operator_id, closedById, date],
    });
    return results.rows[0];
  } catch (error) {
    if (error.cause?.code === "23505") {
      throw new ValidationError({
        message:
          "Já existe um fechamento de caixa para este operador nesta data.",
        action:
          "Verifique a data informada ou consulte o fechamento já registrado.",
      });
    }
    throw error;
  }
}

async function findAll() {
  const results = await database.query({
    text: `
    SELECT
      id, operator_id, closed_by_id, date::text AS date,
      total_sales, total_credit, total_cash, total_card,
      created_at, updated_at
    FROM
      cash_closes
    ORDER BY
      date DESC,
      created_at DESC
    ;`,
  });
  return results.rows;
}

const cashClose = { create, findAll };

export default cashClose;
