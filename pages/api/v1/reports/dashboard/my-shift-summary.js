import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import report from "models/report.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:sale:self"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const operatorId = request.context.user.id;
  const data = await report.myShiftSummary({ operatorId });
  return response.status(200).json(data);
}
