import crypto from "crypto";
import database from "infra/database.js";
import credit from "models/credit.js";
import student from "models/student.js";
import { NotFoundError, ValidationError } from "infra/errors.js";

const SAFE_COLUMNS = `id, stone_payment_id, amount, payer_name, payer_email, payment_method, matched_at, matched_by_id, credit_transaction_id, created_at, updated_at`;

// Pagar.me envia Authorization: Basic base64(webhook:STONE_WEBHOOK_SECRET)
// A URL do webhook deve ser configurada como https://webhook:SECRET@dominio/...
// Validamos apenas a senha (parte após o primeiro ":") com timing-safe compare.
function validateBasicAuth(authHeader, secret) {
  if (!authHeader || !secret) return false;
  if (!authHeader.startsWith("Basic ")) return false;

  try {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
    const colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) return false;
    const password = decoded.slice(colonIndex + 1);
    if (Buffer.byteLength(password) !== Buffer.byteLength(secret)) return false;
    return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(secret));
  } catch {
    return false;
  }
}

async function createPendingPayment(payload) {
  const stonePaymentId = payload?.data?.id;
  const amountCentavos = payload?.data?.amount;
  const payerName = payload?.data?.customer?.name ?? null;
  const payerEmail = payload?.data?.customer?.email ?? null;
  const paymentMethod = payload?.data?.charge?.payment_method ?? null;

  if (!stonePaymentId || amountCentavos == null) {
    throw new ValidationError({
      message: "Payload do webhook Pagar.me está incompleto.",
      action: "Verifique os campos 'data.id' e 'data.amount' no payload.",
    });
  }

  const amount = amountCentavos / 100;

  const result = await database.query({
    text: `
      INSERT INTO pending_stone_payments
        (stone_payment_id, amount, payer_name, payer_email, payment_method, raw_payload)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (stone_payment_id) DO NOTHING
      RETURNING ${SAFE_COLUMNS}
    `,
    values: [
      stonePaymentId,
      amount,
      payerName,
      payerEmail,
      paymentMethod,
      JSON.stringify(payload),
    ],
  });

  return result.rows[0] ?? (await findPendingByStonePaymentId(stonePaymentId));
}

async function findPendingByStonePaymentId(stonePaymentId) {
  const result = await database.query({
    text: `SELECT ${SAFE_COLUMNS} FROM pending_stone_payments WHERE stone_payment_id = $1`,
    values: [stonePaymentId],
  });
  return result.rows[0] ?? null;
}

async function findMatchedCreditByStonePaymentId(stonePaymentId) {
  const result = await database.query({
    text: `SELECT * FROM credit_transactions WHERE stone_payment_id = $1`,
    values: [stonePaymentId],
  });
  return result.rows[0] ?? null;
}

async function listPending() {
  const result = await database.query({
    text: `
      SELECT ${SAFE_COLUMNS} FROM pending_stone_payments
      WHERE matched_at IS NULL
      ORDER BY created_at DESC
    `,
  });
  return result.rows;
}

async function findPendingById(id) {
  const result = await database.query({
    text: `SELECT ${SAFE_COLUMNS} FROM pending_stone_payments WHERE id = $1`,
    values: [id],
  });
  return result.rows[0] ?? null;
}

async function matchPayment(pendingId, studentId, operatorId) {
  const pending = await findPendingById(pendingId);

  if (!pending) {
    throw new NotFoundError({
      message: "Pagamento pendente não encontrado.",
      action: "Verifique o ID informado e tente novamente.",
    });
  }

  if (pending.matched_at) {
    const existing = await database.query({
      text: `SELECT * FROM credit_transactions WHERE id = $1`,
      values: [pending.credit_transaction_id],
    });
    return existing.rows[0];
  }

  await student.findOneById(studentId);

  const transaction = await credit.create(
    studentId,
    {
      amount: Number(pending.amount),
      type: "stone",
      stone_payment_id: pending.stone_payment_id,
    },
    operatorId,
  );

  await database.query({
    text: `
      UPDATE pending_stone_payments
      SET matched_at = NOW(), matched_by_id = $1, credit_transaction_id = $2
      WHERE id = $3
    `,
    values: [operatorId, transaction.id, pendingId],
  });

  return transaction;
}

const stoneWebhook = {
  validateBasicAuth,
  createPendingPayment,
  findPendingByStonePaymentId,
  findMatchedCreditByStonePaymentId,
  listPending,
  findPendingById,
  matchPayment,
};

export default stoneWebhook;
