import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import report from "models/report.js";
import { ValidationError } from "infra/errors.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:report:financial"), getHandler);

export default router.handler(controller.errorHandlers);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateDate(value, name) {
  if (
    !value ||
    !DATE_REGEX.test(value) ||
    isNaN(new Date(value + "T00:00:00Z").getTime())
  ) {
    throw new ValidationError({
      message: `O parâmetro '${name}' é obrigatório e deve estar no formato YYYY-MM-DD.`,
      action: "Informe uma data válida.",
    });
  }
}

async function getHandler(request, response) {
  const { start_date, end_date } = request.query;

  validateDate(start_date, "start_date");
  validateDate(end_date, "end_date");

  if (start_date > end_date) {
    throw new ValidationError({
      message: "O parâmetro 'start_date' não pode ser posterior a 'end_date'.",
      action:
        "Informe um período com data inicial anterior ou igual à data final.",
    });
  }

  const data = await report.operatorSummary({
    startDate: start_date,
    endDate: end_date,
  });
  return response.status(200).json(data);
}
