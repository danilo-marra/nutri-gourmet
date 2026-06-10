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
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getHandler(request: NextApiRequest, response: NextApiResponse) {
  const start_date = request.query.start_date as string | undefined;
  const end_date = request.query.end_date as string | undefined;
  const student_id = request.query.student_id as string | undefined;

  if (
    !start_date ||
    !DATE_REGEX.test(start_date) ||
    isNaN(new Date(start_date + "T00:00:00Z").getTime())
  ) {
    throw new ValidationError({
      message:
        "O parâmetro 'start_date' é obrigatório e deve estar no formato YYYY-MM-DD.",
      action: "Informe uma data inicial válida.",
    });
  }

  if (
    !end_date ||
    !DATE_REGEX.test(end_date) ||
    isNaN(new Date(end_date + "T00:00:00Z").getTime())
  ) {
    throw new ValidationError({
      message:
        "O parâmetro 'end_date' é obrigatório e deve estar no formato YYYY-MM-DD.",
      action: "Informe uma data final válida.",
    });
  }

  if (start_date > end_date) {
    throw new ValidationError({
      message: "O parâmetro 'start_date' não pode ser posterior a 'end_date'.",
      action:
        "Informe um período com data inicial anterior ou igual à data final.",
    });
  }

  if (student_id !== undefined && !UUID_REGEX.test(student_id)) {
    throw new ValidationError({
      message: "O parâmetro 'student_id' deve ser um UUID válido.",
      action: "Informe um ID de aluno válido.",
    });
  }

  const data = await report.creditsAdded({
    startDate: start_date,
    endDate: end_date,
    studentId: student_id,
  });
  return response.status(200).json(data);
}
