import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import report from "models/report.js";
import { ValidationError } from "infra/errors.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:report:operational"), getHandler);

export default router.handler(controller.errorHandlers);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getHandler(request, response) {
  const { start_date, end_date, operator_id } = request.query;

  if (
    start_date !== undefined &&
    (!DATE_REGEX.test(start_date) ||
      isNaN(new Date(start_date + "T00:00:00Z").getTime()))
  ) {
    throw new ValidationError({
      message: "O parâmetro 'start_date' deve estar no formato YYYY-MM-DD.",
      action: "Informe uma data inicial válida ou omita o parâmetro.",
    });
  }

  if (
    end_date !== undefined &&
    (!DATE_REGEX.test(end_date) ||
      isNaN(new Date(end_date + "T00:00:00Z").getTime()))
  ) {
    throw new ValidationError({
      message: "O parâmetro 'end_date' deve estar no formato YYYY-MM-DD.",
      action: "Informe uma data final válida ou omita o parâmetro.",
    });
  }

  if (start_date && end_date && start_date > end_date) {
    throw new ValidationError({
      message: "O parâmetro 'start_date' não pode ser posterior a 'end_date'.",
      action:
        "Informe um período com data inicial anterior ou igual à data final.",
    });
  }

  if (operator_id !== undefined && !UUID_REGEX.test(operator_id)) {
    throw new ValidationError({
      message: "O parâmetro 'operator_id' deve ser um UUID válido.",
      action: "Informe um ID de operador válido.",
    });
  }

  const data = await report.cashCloses({
    startDate: start_date,
    endDate: end_date,
    operatorId: operator_id,
  });
  return response.status(200).json(data);
}
