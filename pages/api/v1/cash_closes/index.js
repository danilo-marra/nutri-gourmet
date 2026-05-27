import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import cashClose from "models/cash_close.js";
import authorization from "models/authorization.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:cash_close"), getHandler);
router.post(controller.canRequest("create:cash_close"), postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const user = request.context.user;
  const closes = await cashClose.findAll();
  const output = closes.map((c) =>
    authorization.filterOutput(user, "read:cash_close", c),
  );
  return response.status(200).json(output);
}

async function postHandler(request, response) {
  const user = request.context.user;
  const operatorId = authorization.can(user, "read:cash_close")
    ? (request.body.operator_id ?? user.id)
    : user.id;
  const date = request.body.date ?? new Date().toISOString().slice(0, 10);
  const newClose = await cashClose.create(user.id, {
    operator_id: operatorId,
    date,
  });
  return response
    .status(201)
    .json(authorization.filterOutput(user, "read:cash_close", newClose));
}
