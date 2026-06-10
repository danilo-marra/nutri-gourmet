import database from "infra/database.js";
import { ValidationError } from "infra/errors.js";
import type { CashClose } from "@/types/index";

async function create(
  closedById: string,
  { operator_id, date }: { operator_id?: string; date?: string },
): Promise<CashClose> {
  if (
    !date ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    isNaN(new Date(date + "T00:00:00Z").getTime())
  ) {
    throw new ValidationError({
      message: "O campo 'date' deve ser uma data válida no formato YYYY-MM-DD.",
      action: "Informe uma data válida e tente novamente.",
    });
  }

  try {
    const results = await database.query<CashClose>({
      text: `
      WITH totals AS (
        SELECT
          COALESCE(SUM(total), 0) AS total_sales,
          COALESCE(SUM(CASE WHEN payment_method = 'credit' THEN total ELSE 0 END), 0) AS total_credit,
          COALESCE(SUM(CASE WHEN payment_method = 'cash'   THEN total ELSE 0 END), 0) AS total_cash,
          COALESCE(SUM(CASE WHEN payment_method = 'card'   THEN total ELSE 0 END), 0) AS total_card,
          COALESCE(SUM(CASE WHEN payment_method = 'pix'    THEN total ELSE 0 END), 0) AS total_pix
        FROM
          sales
        WHERE
          operator_id = $1
          AND DATE(created_at AT TIME ZONE 'UTC') = $3::date
          AND reversed_at IS NULL
      ),
      inserted AS (
        INSERT INTO
          cash_closes (operator_id, closed_by_id, date, total_sales, total_credit, total_cash, total_card, total_pix)
        SELECT
          $1, $2, $3, total_sales, total_credit, total_cash, total_card, total_pix
        FROM
          totals
        RETURNING *
      )
      SELECT
        ins.id,
        ins.operator_id,
        ins.closed_by_id,
        ins.date::text AS date,
        ins.total_sales,
        ins.total_credit,
        ins.total_cash,
        ins.total_card,
        ins.total_pix,
        ins.created_at,
        ins.updated_at,
        u.username AS operator_username
      FROM
        inserted ins
      JOIN
        users u ON u.id = ins.operator_id
      ;`,
      values: [operator_id, closedById, date],
    });
    return results.rows[0];
  } catch (error) {
    const cause =
      error instanceof Error
        ? (error.cause as { code?: string } | undefined)
        : undefined;
    if (cause?.code === "23505") {
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

async function findAll(): Promise<CashClose[]> {
  const results = await database.query<CashClose>({
    text: `
    SELECT
      cc.id,
      cc.operator_id,
      cc.closed_by_id,
      cc.date::text AS date,
      cc.total_sales,
      cc.total_credit,
      cc.total_cash,
      cc.total_card,
      cc.total_pix,
      cc.created_at,
      cc.updated_at,
      u.username AS operator_username
    FROM
      cash_closes cc
    JOIN
      users u ON u.id = cc.operator_id
    ORDER BY
      cc.date DESC,
      cc.created_at DESC
    ;`,
  });
  return results.rows;
}

const cashClose = { create, findAll };

export default cashClose;
