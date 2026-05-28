import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import passwordReset from "models/passwordReset.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("create:password_recovery"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const { token_id } = request.query;
  const { password } = request.body;

  const token = await passwordReset.findOneValidById(token_id);
  await passwordReset.resetPassword(token.user_id, password);
  await passwordReset.markTokenAsUsed(token.id);

  return response.status(204).end();
}
