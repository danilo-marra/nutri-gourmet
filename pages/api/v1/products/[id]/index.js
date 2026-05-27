import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import product from "models/product.js";
import authorization from "models/authorization.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:product"), getHandler);
router.patch(controller.canRequest("update:product"), patchHandler);
router.delete(controller.canRequest("delete:product"), deleteHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const user = request.context.user;
  const { id } = request.query;
  const foundProduct = await product.findOneById(id);
  const output = authorization.filterOutput(user, "read:product", foundProduct);
  return response.status(200).json(output);
}

async function patchHandler(request, response) {
  const user = request.context.user;
  const { id } = request.query;
  const inputValues = request.body;
  const updatedProduct = await product.update(id, inputValues);
  const output = authorization.filterOutput(
    user,
    "read:product",
    updatedProduct,
  );
  return response.status(200).json(output);
}

async function deleteHandler(request, response) {
  const user = request.context.user;
  const { id } = request.query;
  const deactivatedProduct = await product.deactivate(id);
  const output = authorization.filterOutput(
    user,
    "read:product",
    deactivatedProduct,
  );
  return response.status(200).json(output);
}
