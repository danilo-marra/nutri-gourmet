import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import report from "models/report.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:report:operational"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const data = await report.activePackages();
  return response.status(200).json(data);
}
