import { createRouter } from "next-connect";
import type { NextApiRequest, NextApiResponse } from "next";
import controller from "infra/controller.js";
import report from "models/report.js";
import type { User } from "@/types/index";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:sale:self"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request: NextApiRequest, response: NextApiResponse) {
  const operatorId = (request.context.user as User).id;
  const data = await report.myShiftSummary({ operatorId });
  return response.status(200).json(data);
}
