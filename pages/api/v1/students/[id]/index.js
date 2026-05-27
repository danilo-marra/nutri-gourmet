import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import student from "models/student.js";
import authorization from "models/authorization.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:student"), getHandler);
router.patch(controller.canRequest("update:student"), patchHandler);
router.delete(controller.canRequest("delete:student"), deleteHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const { id } = request.query;
  const foundStudent = await student.findOneById(id);
  const output = authorization.filterOutput(
    userTryingToGet,
    "read:student",
    foundStudent,
  );
  return response.status(200).json(output);
}

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const { id } = request.query;
  const updatedStudent = await student.update(id, request.body);
  const output = authorization.filterOutput(
    userTryingToPatch,
    "read:student",
    updatedStudent,
  );
  return response.status(200).json(output);
}

async function deleteHandler(request, response) {
  const { id } = request.query;
  await student.remove(id);
  return response.status(204).end();
}
