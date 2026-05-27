import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import sale from "models/sale.js";
import authorization from "models/authorization.js";
import { ForbiddenError } from "infra/errors.js";

const CANCEL_WINDOW_MS = 5 * 60 * 1000;

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:sale:self"), getOneHandler);
router.delete(controller.canRequest("delete:sale:self"), deleteHandler);

export default router.handler(controller.errorHandlers);

async function getOneHandler(request, response) {
  const user = request.context.user;
  const { id } = request.query;
  const foundSale = await sale.findOneById(id);

  if (
    !authorization.can(user, "read:sale") &&
    foundSale.operator_id !== user.id
  ) {
    throw new ForbiddenError({
      message: "Você não tem permissão para visualizar esta venda.",
      action: 'Verifique se o seu usuário possui a feature "read:sale".',
    });
  }

  const output = authorization.filterOutput(user, "read:sale:self", foundSale);
  return response.status(200).json(output);
}

async function deleteHandler(request, response) {
  const user = request.context.user;
  const { id } = request.query;
  const foundSale = await sale.findOneById(id);

  if (foundSale.reversed_at) {
    throw new ForbiddenError({
      message: "Esta venda já foi estornada.",
      action: "Não é possível estornar uma venda que já foi estornada.",
    });
  }

  if (authorization.can(user, "delete:sale")) {
    await sale.reverse(id, user.id);
    return response.status(204).end();
  }

  if (foundSale.operator_id !== user.id) {
    throw new ForbiddenError({
      message: "Você não tem permissão para cancelar esta venda.",
      action: "Apenas o operador que registrou a venda pode cancelá-la.",
    });
  }

  const ageMs = Date.now() - new Date(foundSale.created_at).getTime();
  if (ageMs > CANCEL_WINDOW_MS) {
    throw new ForbiddenError({
      message: "Prazo de cancelamento (5 minutos) expirado.",
      action: "Entre em contato com o supervisor para realizar o estorno.",
    });
  }

  await sale.reverse(id, user.id);
  return response.status(204).end();
}
