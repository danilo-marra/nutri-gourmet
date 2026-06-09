import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import stoneWebhook from "models/stoneWebhook.js";
import { UnauthorizedError } from "infra/errors.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const secret = process.env.STONE_WEBHOOK_SECRET;

  if (!stoneWebhook.validateBasicAuth(request.headers.authorization, secret)) {
    throw new UnauthorizedError({
      message: "Credenciais do webhook Pagar.me inválidas.",
      action: "Verifique a variável STONE_WEBHOOK_SECRET.",
    });
  }

  const payload = request.body;

  if (payload?.event !== "order.paid") {
    return response.status(200).end();
  }

  const stonePaymentId = payload?.data?.id;

  const alreadyMatched =
    await stoneWebhook.findMatchedCreditByStonePaymentId(stonePaymentId);
  if (alreadyMatched) return response.status(200).json(alreadyMatched);

  const existing =
    await stoneWebhook.findPendingByStonePaymentId(stonePaymentId);
  if (existing) return response.status(200).json(existing);

  const pending = await stoneWebhook.createPendingPayment(payload);

  return response.status(200).json(pending);
}
