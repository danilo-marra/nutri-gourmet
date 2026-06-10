import { createRouter } from "next-connect";
import type { NextApiRequest, NextApiResponse } from "next";
import controller from "infra/controller.js";
import report from "models/report.js";
import { ValidationError } from "infra/errors.js";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:report:financial"), getHandler);

export default router.handler(controller.errorHandlers);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateDate(
  value: string | undefined,
  name: string,
): asserts value is string {
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

async function getHandler(request: NextApiRequest, response: NextApiResponse) {
  const start_date = request.query.start_date as string | undefined;
  const end_date = request.query.end_date as string | undefined;

  validateDate(start_date, "start_date");
  validateDate(end_date, "end_date");

  if (start_date > end_date) {
    throw new ValidationError({
      message: "O parâmetro 'start_date' não pode ser posterior a 'end_date'.",
      action:
        "Informe um período com data inicial anterior ou igual à data final.",
    });
  }

  const data = await report.studentConsumption({
    startDate: start_date,
    endDate: end_date,
  });
  return response.status(200).json(data);
}
