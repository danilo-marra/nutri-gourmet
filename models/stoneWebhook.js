import crypto from "crypto";
import database from "infra/database.js";
import credit from "models/credit.js";
import student from "models/student.js";
import { ValidationError } from "infra/errors.js";

// ⚠️ PENDÊNCIA: confirmar com sandbox Stone:
//   - Nome do header de assinatura (ex.: "x-stone-signature")
//   - Formato da assinatura (hex vs base64)
//   - Algoritmo exato (HMAC-SHA256 é o padrão de mercado — assumido aqui)
const SIGNATURE_HEADER = "x-stone-signature";

function validateSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  const computed = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(computed),
    );
  } catch {
    return false;
  }
}

// ⚠️ PENDÊNCIA: confirmar com sandbox Stone os nomes exatos dos campos do payload:
//   - ID da transação (aqui assumido: payload.id)
//   - Valor em reais (aqui assumido: payload.amount, número decimal)
//   - Identificador do aluno (aqui assumido: payload.metadata.student_id — UUID interno)
//   - Método de pagamento (aqui assumido: payload.payment_type — "pix" | "credit_card")
//
// Quando o formato real estiver disponível, substituir apenas as linhas de extração
// abaixo sem alterar a lógica de idempotência ou a chamada ao credit.create().
async function processPayment(payload, systemOperatorId) {
  const stonePaymentId = payload?.id;
  const amount = payload?.amount;

  // ⚠️ PENDÊNCIA: como o student_id do aluno é embutido no link de pagamento Stone?
  //   Assumindo que a cantina inclui o UUID do aluno em payload.metadata.student_id.
  const studentId = payload?.metadata?.student_id;

  if (!stonePaymentId || !amount || !studentId) {
    throw new ValidationError({
      message: "Payload do webhook Stone está incompleto.",
      action:
        "Verifique os campos 'id', 'amount' e 'metadata.student_id' no payload.",
    });
  }

  const existing = await findByStonePaymentId(stonePaymentId);
  if (existing) return existing;

  await student.findOneById(studentId);

  try {
    return await credit.create(
      studentId,
      { amount, type: "stone", stone_payment_id: stonePaymentId },
      systemOperatorId,
    );
  } catch (error) {
    if (error.cause?.code === "23505") {
      return await findByStonePaymentId(stonePaymentId);
    }
    throw error;
  }
}

async function findByStonePaymentId(stonePaymentId) {
  const result = await database.query({
    text: `SELECT * FROM credit_transactions WHERE stone_payment_id = $1`,
    values: [stonePaymentId],
  });
  return result.rows[0] ?? null;
}

const stoneWebhook = { validateSignature, processPayment, SIGNATURE_HEADER };

export default stoneWebhook;
