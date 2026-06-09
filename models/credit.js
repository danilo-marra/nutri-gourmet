import database from "infra/database.js";
import { ValidationError } from "infra/errors.js";

async function create(studentId, values, operatorId) {
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
    if (
      err.cause?.code === "23505" &&
      err.cause?.constraint?.includes("stone_payment_id")
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
  }) {
    const results = await database.query({
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

async function findAllByStudentId(studentId) {
  const transactions = await runSelectQuery(studentId);
  return transactions;

  async function runSelectQuery(studentId) {
    const results = await database.query({
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

async function findPackagesByStudentId(studentId) {
  const results = await database.query({
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
