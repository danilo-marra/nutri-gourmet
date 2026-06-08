import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import stoneWebhook from "models/stoneWebhook.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:stone_payment"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const pending = await stoneWebhook.listPending();
  return response.status(200).json(pending);
}
