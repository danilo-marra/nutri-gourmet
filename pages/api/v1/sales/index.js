import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import sale from "models/sale.js";
import authorization from "models/authorization.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:sale:self"), getListHandler);
router.post(controller.canRequest("create:sale"), postHandler);

export default router.handler(controller.errorHandlers);

async function getListHandler(request, response) {
  const user = request.context.user;
  const operatorId = authorization.can(user, "read:sale") ? null : user.id;
  const sales = await sale.findAll({ operatorId });
  const output = sales.map((s) =>
    authorization.filterOutput(user, "read:sale:self", s),
  );
  return response.status(200).json(output);
}

async function postHandler(request, response) {
  const user = request.context.user;
  const { student_id, payment_method, items } = request.body;
  const newSale = await sale.create(user.id, {
    student_id,
    payment_method,
    items,
  });
  const output = authorization.filterOutput(user, "read:sale:self", newSale);
  return response.status(201).json(output);
}
