import database from "infra/database.js";
import { ValidationError } from "infra/errors.js";
import type { CreditTransaction } from "@/types/index";

interface CreditInputValues {
  amount?: number | string | null;
  type?: string;
  expires_at?: string | Date | null;
  stone_payment_id?: string | null;
}

async function create(
  studentId: string,
  values: CreditInputValues,
  operatorId: string,
): Promise<CreditTransaction> {
  if (values?.amount == null) {
    throw new ValidationError({
      message: "O campo 'amount' é obrigatório.",
      action: "Informe o valor do crédito e tente novamente.",
    });
  }

  const amount = Number(values.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new ValidationError({
      message: "O campo 'amount' deve ser um número maior que zero.",
      action: "Informe um valor positivo para o crédito.",
    });
  }

  if (!values?.type) {
    throw new ValidationError({
      message: "O campo 'type' é obrigatório.",
      action: "Informe o tipo do crédito ('manual', 'package' ou 'stone').",
    });
  }

  if (!["manual", "package", "stone"].includes(values.type)) {
    throw new ValidationError({
      message: "O campo 'type' deve ser 'manual', 'package' ou 'stone'.",
      action: "Informe um tipo válido para o crédito.",
    });
  }

  if (values.type === "stone" && !values.stone_payment_id) {
    throw new ValidationError({
      message:
        "O campo 'stone_payment_id' é obrigatório para créditos do tipo 'stone'.",
      action: "Informe o Id do link de pagamento Stone.",
    });
  }

  const expiresAt =
    values.type === "package" ? (values.expires_at ?? null) : null;

  const stonePaymentId =
    values.type === "stone" ? (values.stone_payment_id ?? null) : null;

  let newTransaction;
  try {
    newTransaction = await runInsertQuery({
      studentId,
      operatorId,
      amount,
      type: values.type,
      expiresAt,
      stonePaymentId,
    });
  } catch (err) {
    const cause =
      err instanceof Error
        ? (err.cause as { code?: string; constraint?: string } | undefined)
        : undefined;
    if (
      cause?.code === "23505" &&
      cause?.constraint?.includes("stone_payment_id")
    ) {
      throw new ValidationError({
        message: "Este Id de pagamento Stone já foi registrado.",
        action: "Verifique o Id do link e tente novamente.",
      });
    }
    throw err;
  }
  return newTransaction;

  async function runInsertQuery({
    studentId,
    operatorId,
    amount,
    type,
    expiresAt,
    stonePaymentId,
  }: {
    studentId: string;
    operatorId: string;
    amount: number;
    type: string;
    expiresAt: string | Date | null;
    stonePaymentId: string | null;
  }): Promise<CreditTransaction> {
    const results = await database.query<CreditTransaction>({
      text: `
      WITH updated AS (
        UPDATE
          students
        SET
          balance = balance + $1
        WHERE
          id = $2
        RETURNING
          balance
      )
      INSERT INTO
        credit_transactions (student_id, operator_id, amount, type, expires_at, balance_after, stone_payment_id)
      SELECT
        $2, $3, $1, $4, $5, updated.balance, $6
      FROM
        updated
      RETURNING
        *
      ;`,
      values: [amount, studentId, operatorId, type, expiresAt, stonePaymentId],
    });

    return results.rows[0];
  }
}

async function findAllByStudentId(
  studentId: string,
): Promise<CreditTransaction[]> {
  const transactions = await runSelectQuery(studentId);
  return transactions;

  async function runSelectQuery(
    studentId: string,
  ): Promise<CreditTransaction[]> {
    const results = await database.query<CreditTransaction>({
      text: `
      SELECT
        *
      FROM
        credit_transactions
      WHERE
        student_id = $1
      ORDER BY
        created_at DESC
      ;`,
      values: [studentId],
    });

    return results.rows;
  }
}

async function findPackagesByStudentId(
  studentId: string,
): Promise<CreditTransaction[]> {
  const results = await database.query<CreditTransaction>({
    text: `
    SELECT
      *
    FROM
      credit_transactions
    WHERE
      student_id = $1
      AND type = 'package'
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY
      created_at DESC
    ;`,
    values: [studentId],
  });
  return results.rows;
}

const credit = { create, findAllByStudentId, findPackagesByStudentId };

export default credit;
