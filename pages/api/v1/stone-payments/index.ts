import { createRouter } from "next-connect";
import type { NextApiRequest, NextApiResponse } from "next";
import controller from "infra/controller.js";
import authorization from "models/authorization.js";
import stoneWebhook from "models/stoneWebhook.js";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:stone_payment"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request: NextApiRequest, response: NextApiResponse) {
  const pending = await stoneWebhook.listPending();
  const filtered = pending.map((p) =>
    authorization.filterOutput(request.context.user, "read:stone_payment", p),
  );
  return response.status(200).json(filtered);
}
