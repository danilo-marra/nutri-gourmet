import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import { ForbiddenError } from "infra/errors.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user",
    userFound,
  );

  return response.status(200).json(secureOutputValues);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;

  // user, feature, resource
  const userTryingToPatch = request.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário.",
      action:
        "Verifique se você possui a feature necessária para atualizar outro usuário.",
    });
  }

  // `update:user` permite editar o próprio perfil, mas alterar `role` é uma
  // operação de gestão de contas — só quem pode atuar sobre outros usuários
  // (`update:user:others`) muda role. Sem esta guarda, um operador conseguiria
  // se auto-promover via PATCH no próprio username.
  if (
    userInputValues.role !== undefined &&
    !authorization.can(userTryingToPatch, "update:user:others", targetUser)
  ) {
    throw new ForbiddenError({
      message: "Você não pode alterar o role deste usuário.",
      action: 'Remova o campo "role" da requisição.',
    });
  }

  // Mesmo podendo gerir o alvo, só admin atribui roles elevados; os demais
  // ficam limitados a operador|pending (regra centralizada em authorization).
  if (
    userInputValues.role !== undefined &&
    !authorization.canAssignRole(userTryingToPatch, userInputValues.role)
  ) {
    throw new ForbiddenError({
      message: "Você não pode atribuir este nível de acesso.",
      action: 'Defina o campo "role" como "operador" ou "pending", ou omita-o.',
    });
  }

  const updatedUser = await user.update(username, userInputValues);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:user",
    updatedUser,
  );
  return response.status(200).json(secureOutputValues);
}
