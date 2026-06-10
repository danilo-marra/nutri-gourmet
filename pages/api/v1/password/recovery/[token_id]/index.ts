import { createRouter } from "next-connect";
import type { NextApiRequest, NextApiResponse } from "next";
import controller from "infra/controller.js";
import passwordReset from "models/passwordReset.js";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const token_id = request.query.token_id as string;
  const { password } = request.body;

  const token = await passwordReset.markTokenAsUsed(token_id);
  await passwordReset.resetPassword(token.user_id, password);

  return response.status(204).end();
}
