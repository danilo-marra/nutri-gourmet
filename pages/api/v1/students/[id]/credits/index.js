import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import credit from "models/credit.js";
import student from "models/student.js";
import authorization from "models/authorization.js";
import { ForbiddenError } from "infra/errors.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:credit"), getHandler);
router.post(controller.canRequest("create:credit"), postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const { id } = request.query;
  await student.findOneById(id);
  const transactions = await credit.findAllByStudentId(id);
  const output = transactions.map((tx) =>
    authorization.filterOutput(userTryingToGet, "read:credit", tx),
  );
  return response.status(200).json(output);
}

async function postHandler(request, response) {
  const userTryingToPost = request.context.user;
  const { id } = request.query;
  const { amount, type, expires_at } = request.body;

  if (
    type === "package" &&
    !authorization.can(userTryingToPost, "create:package")
  ) {
    throw new ForbiddenError({
      message: "Você não possui permissão para registrar um pacote.",
      action: 'Verifique se o seu usuário possui a feature "create:package".',
    });
  }

  const foundStudent = await student.findOneById(id);

  const newTransaction = await credit.create(
    id,
    { amount, type, expires_at },
    userTryingToPost.id,
  );
  const output = authorization.filterOutput(
    userTryingToPost,
    "read:credit",
    newTransaction,
  );
  return response.status(201).json(output);
}
