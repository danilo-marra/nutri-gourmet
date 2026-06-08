import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import stoneWebhook from "models/stoneWebhook.js";
import { ValidationError } from "infra/errors.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("update:stone_payment"), postHandler);

export default router.handler(controller.errorHandlers);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function postHandler(request, response) {
  const { id } = request.query;
  const { student_id } = request.body;

  if (!student_id || !UUID_REGEX.test(student_id)) {
    throw new ValidationError({
      message: "O campo 'student_id' é obrigatório e deve ser um UUID válido.",
      action: "Informe o ID do aluno que deve receber o crédito.",
    });
  }

  const operatorId = request.context.user.id;

  const transaction = await stoneWebhook.matchPayment(
    id,
    student_id,
    operatorId,
  );

  return response.status(200).json(transaction);
}
