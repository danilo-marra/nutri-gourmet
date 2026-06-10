import { createRouter } from "next-connect";
import type { NextApiRequest, NextApiResponse } from "next";
import controller from "infra/controller.js";
import user from "models/user.js";
import passwordReset from "models/passwordReset.js";
import { NotFoundError } from "infra/errors.js";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request: NextApiRequest, response: NextApiResponse) {
  const { email } = request.body || {};

  try {
    const foundUser = await user.findOneByEmail(email);
    const resetToken = await passwordReset.create(foundUser.id);
    await passwordReset.sendEmailToUser(foundUser, resetToken);
  } catch (error) {
    if (!(error instanceof NotFoundError)) {
      throw error;
    }
  }

  return response.status(200).json({
    message:
      "Se o email informado estiver cadastrado, você receberá um link de recuperação em breve.",
  });
}
