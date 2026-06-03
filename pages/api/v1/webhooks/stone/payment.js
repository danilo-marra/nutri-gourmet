import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import stoneWebhook from "models/stoneWebhook.js";
import { UnauthorizedError, ValidationError } from "infra/errors.js";

// Desabilita o body parser padrão do Next.js para ter acesso ao raw body,
// necessário para calcular e verificar a assinatura HMAC da Stone.
export const config = {
  api: { bodyParser: false },
};

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const rawBody = await collectRawBody(request);

  // ⚠️ PENDÊNCIA: confirmar o nome exato do header com a Stone
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
