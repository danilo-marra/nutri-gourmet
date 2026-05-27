import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import credit from "models/credit.js";
import student from "models/student.js";
import authorization from "models/authorization.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:package"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const { id } = request.query;
  await student.findOneById(id);
  const packages = await credit.findPackagesByStudentId(id);
  const output = packages.map((pkg) =>
    authorization.filterOutput(userTryingToGet, "read:package", pkg),
  );
  return response.status(200).json(output);
}
