import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import report from "models/report.js";
import { ValidationError } from "infra/errors.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:report:financial"), getHandler);

export default router.handler(controller.errorHandlers);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function validateDate(value, name) {
  const d = new Date((value ?? "") + "T00:00:00Z");
  if (
    !value ||
    !DATE_REGEX.test(value) ||
    isNaN(d.getTime()) ||
    d.toISOString().slice(0, 10) !== value
  ) {
    throw new ValidationError({
      message: `O parâmetro '${name}' é obrigatório e deve estar no formato YYYY-MM-DD.`,
      action: "Informe uma data válida.",
    });
  }
}

async function getHandler(request, response) {
  const { start_date, end_date, limit: limitParam } = request.query;

  validateDate(start_date, "start_date");
  validateDate(end_date, "end_date");

  if (start_date > end_date) {
    throw new ValidationError({
      message: "O parâmetro 'start_date' não pode ser posterior a 'end_date'.",
      action:
        "Informe um período com data inicial anterior ou igual à data final.",
    });
  }

  let limit = DEFAULT_LIMIT;
  if (limitParam !== undefined) {
    const parsed = parseInt(limitParam, 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
      throw new ValidationError({
        message: `O parâmetro 'limit' deve ser um inteiro entre 1 e ${MAX_LIMIT}.`,
        action: "Informe um limite válido ou omita o parâmetro.",
      });
    }
    limit = parsed;
  }

  const data = await report.topProducts({
    startDate: start_date,
    endDate: end_date,
    limit,
  });
  return response.status(200).json(data);
}
