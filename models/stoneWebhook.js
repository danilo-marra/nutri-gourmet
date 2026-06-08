import crypto from "crypto";
import database from "infra/database.js";
import credit from "models/credit.js";
import student from "models/student.js";
import { ValidationError } from "infra/errors.js";

// ⚠️ PENDÊNCIA (Stone Banking API — docs.openbank.stone.com.br/docs/guias/webhooks/):
//
// SEGURANÇA — a Stone Banking API NÃO usa HMAC-SHA256. O webhook chega como:
//   POST body: { "encrypted_body": "<JWE token>" }
//   Passo 1: descriptografar o JWE com a CHAVE PRIVADA RSA da aplicação
//            algoritmo: RSA-OAEP-256 + A256GCM  (lib sugerida: npm install jose)
//   Passo 2: verificar assinatura JWS resultante com a chave pública da Stone
//            algoritmo: RS256
//            endpoint das chaves: https://sandbox-api.openbank.stone.com.br/api/v1/discovery/keys
//
// Para implementar: substituir validateSignature() por função que usa jose.compactDecrypt()
// + jose.compactVerify(). Remover STONE_WEBHOOK_SECRET; adicionar STONE_PRIVATE_KEY (PEM RSA).
//
// REQUISITO PRÉVIO: cadastrar aplicação como parceiro Stone Banking API via formulário
// em docs.openbank.stone.com.br (requer aprovação da Stone).
const SIGNATURE_HEADER = "x-stone-webhook-event-id"; // header de idempotência (não de assinatura)

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

// ⚠️ PENDÊNCIA — campos confirmados via docs Stone Banking API (lp_order_paid.json):
//   - event_type: "order_paid"  (filtrar — ignorar outros eventos como order_created)
//   - target_data.id: order ID  (ex.: "or_5OA7n7os6SbanXl4") → stone_payment_id
//   - target_data.amount: valor em CENTAVOS (ex.: 1000 = R$ 10,00) → dividir por 100
//   - header x-stone-webhook-event-id: UUID do evento (idempotência adicional)
//
// IDENTIFICAÇÃO DO ALUNO — NÃO existe student_id nativo no payload Stone.
//   Opção A: ao criar o link, gravar na tabela stone_payment_links (link_id, student_id).
//            No webhook, extrair link_id de target_detail_uri e fazer join.
//   Opção B: ao criar o link, colocar o UUID do aluno em items[0].description.
//            No webhook, ler target_data.items[0].description como student_id.
//   Decidir antes de implementar.
//
// Quando credenciais Stone estiverem disponíveis, substituir as linhas de extração
// abaixo sem alterar a lógica de idempotência ou a chamada ao credit.create().
async function processPayment(payload, systemOperatorId) {
  const stonePaymentId = payload?.id;
  const amount = payload?.amount;

  // ⚠️ PENDÊNCIA: student_id não existe no payload — ver opções A/B acima.
  //   Após definir a estratégia, substituir esta linha pelo campo correto.
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
