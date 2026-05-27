import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import product from "models/product.js";
import authorization from "models/authorization.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:product"), getHandler);
router.post(controller.canRequest("create:product"), postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const user = request.context.user;
  const activeOnly = !authorization.can(user, "update:product");
  const products = await product.findAll({ activeOnly });
  const output = products.map((p) =>
    authorization.filterOutput(user, "read:product", p),
  );
  return response.status(200).json(output);
}

async function postHandler(request, response) {
  const user = request.context.user;
  const inputValues = request.body;
  const newProduct = await product.create(inputValues);
  const output = authorization.filterOutput(user, "read:product", newProduct);
  return response.status(201).json(output);
}
