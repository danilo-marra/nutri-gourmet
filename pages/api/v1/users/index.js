import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import activation from "models/activation.js";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:user"), getHandler);
router.post(controller.canRequest("create:user"), postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const roles =
    userTryingToGet.role === "supervisor" ? ["operador", "pending"] : null;
  const users = await user.findAll(roles);
  const secureOutputValues = users.map((u) =>
    authorization.filterOutput(userTryingToGet, "read:user", u),
  );
  return response.status(200).json(secureOutputValues);
}

async function postHandler(request, response) {
  const userTryingToPost = request.context.user;
  const userInputValues = request.body;

  const targetRole = userInputValues.role ?? "pending";
  if (!authorization.canAssignRole(userTryingToPost, targetRole)) {
    throw new ForbiddenError({
      message: "Você não pode atribuir este nível de acesso.",
      action: 'Defina o campo "role" como "operador" ou "pending", ou omita-o.',
    });
  }

  const newUser = await user.create(userInputValues);

  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPost,
    "read:user",
    newUser,
  );

  return response.status(201).json(secureOutputValues);
}
