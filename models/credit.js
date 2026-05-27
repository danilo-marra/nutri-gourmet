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
      action: "Informe o tipo do crédito ('manual' ou 'package').",
    });
  }

  if (!["manual", "package"].includes(values.type)) {
    throw new ValidationError({
      message: "O campo 'type' deve ser 'manual' ou 'package'.",
      action: "Informe um tipo válido para o crédito.",
    });
  }

  const expiresAt =
    values.type === "package" ? (values.expires_at ?? null) : null;

  const newTransaction = await runInsertQuery({
    studentId,
    operatorId,
    amount,
    type: values.type,
    expiresAt,
  });
  return newTransaction;

  async function runInsertQuery({
    studentId,
    operatorId,
    amount,
    type,
    expiresAt,
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
        credit_transactions (student_id, operator_id, amount, type, expires_at, balance_after)
      SELECT
        $2, $3, $1, $4, $5, updated.balance
      FROM
        updated
      RETURNING
        *
      ;`,
      values: [amount, studentId, operatorId, type, expiresAt],
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
    ORDER BY
      created_at DESC
    ;`,
    values: [studentId],
  });
  return results.rows;
}

const credit = { create, findAllByStudentId, findPackagesByStudentId };

export default credit;
