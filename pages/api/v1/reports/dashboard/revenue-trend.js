import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import report from "models/report.js";
import { ValidationError } from "infra/errors.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:report:financial"), getHandler);

export default router.handler(controller.errorHandlers);

const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;

async function getHandler(request, response) {
  const { days: daysParam } = request.query;

  let days = DEFAULT_DAYS;
  if (daysParam !== undefined) {
    const parsed = parseInt(daysParam, 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_DAYS) {
      throw new ValidationError({
        message: `O parâmetro 'days' deve ser um inteiro entre 1 e ${MAX_DAYS}.`,
        action: "Informe um número de dias válido ou omita o parâmetro.",
      });
    }
    days = parsed;
  }

  const data = await report.revenueTrend({ days });
  return response.status(200).json(data);
}
