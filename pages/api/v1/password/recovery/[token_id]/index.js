import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import passwordReset from "models/passwordReset.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const { token_id } = request.query;
  const { password } = request.body;

  const token = await passwordReset.markTokenAsUsed(token_id);
  await passwordReset.resetPassword(token.user_id, password);

  return response.status(204).end();
}
