import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import stoneWebhook from "models/stoneWebhook.js";
import { UnauthorizedError, ValidationError } from "infra/errors.js";

// ⚠️ PENDÊNCIA — antes de ir a produção, substituir toda a lógica de segurança:
//   1. Remover HMAC; implementar JWE decrypt + JWS verify (ver models/stoneWebhook.js)
//   2. O body real da Stone é: { "encrypted_body": "<JWE token>" }
//   3. Adicionar filtro: só processar se payload.event_type === "order_paid"
//   4. Variáveis de ambiente:
//      - Remover STONE_WEBHOOK_SECRET
//      - Adicionar STONE_PRIVATE_KEY (chave privada RSA em PEM, para descriptografar JWE)
//
// Requisito prévio: aplicação cadastrada como parceiro Stone Banking API.
//
// raw body ainda necessário para parse manual do encrypted_body.
export const config = {
  api: { bodyParser: false },
};

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const rawBody = await collectRawBody(request);

  // ⚠️ PENDÊNCIA: substituir por JWE decrypt + JWS verify (ver models/stoneWebhook.js)
  const signatureHeader = request.headers[stoneWebhook.SIGNATURE_HEADER];
  const secret = process.env.STONE_WEBHOOK_SECRET;

  if (!stoneWebhook.validateSignature(rawBody, signatureHeader, secret)) {
    throw new UnauthorizedError({
      message: "Assinatura do webhook Stone inválida.",
      action: "Verifique a chave configurada em STONE_WEBHOOK_SECRET.",
    });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw new ValidationError({
      message: "Payload do webhook Stone não é um JSON válido.",
      action: "Verifique o formato do corpo da requisição.",
    });
  }

  // ⚠️ PENDÊNCIA: filtrar event_type — ignorar eventos que não sejam "order_paid"
  // if (payload?.event_type !== "order_paid") return response.status(200).end();

  const operatorId = process.env.STONE_OPERATOR_ID;

  const transaction = await stoneWebhook.processPayment(payload, operatorId);

  return response.status(200).json(transaction);
}

const MAX_BODY_BYTES = 100 * 1024; // 100 KB

function collectRawBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalSize = 0;
    request.on("data", (chunk) => {
      totalSize += chunk.length;
      if (totalSize > MAX_BODY_BYTES) {
        request.destroy();
        return reject(
          new ValidationError({
            message: "Corpo da requisição excede o limite permitido.",
            action: "Reduza o tamanho do payload e tente novamente.",
          }),
        );
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}
