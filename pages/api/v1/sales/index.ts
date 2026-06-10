import { createRouter } from "next-connect";
import type { NextApiRequest, NextApiResponse } from "next";
import controller from "infra/controller.js";
import sale from "models/sale.js";
import authorization from "models/authorization.js";
import type { User } from "@/types/index";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:sale:self"), getListHandler);
router.post(controller.canRequest("create:sale"), postHandler);

export default router.handler(controller.errorHandlers);

async function getListHandler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const user = request.context.user as User;
  const operatorId = authorization.can(user, "read:sale") ? null : user.id;
  const sales = await sale.findAll({ operatorId });
  const output = sales.map((s) =>
    authorization.filterOutput(user, "read:sale:self", s),
  );
  return response.status(200).json(output);
}

async function postHandler(request: NextApiRequest, response: NextApiResponse) {
  const user = request.context.user as User;
  const { student_id, payment_method, items } = request.body;
  const newSale = await sale.create(user.id, {
    student_id,
    payment_method,
    items,
  });
  const output = authorization.filterOutput(user, "read:sale:self", newSale);
  return response.status(201).json(output);
}
