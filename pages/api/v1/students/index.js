import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import student from "models/student.js";
import authorization from "models/authorization.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:student"), getHandler);
router.post(controller.canRequest("create:student"), postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const students = await student.findAll();
  const output = students.map((s) =>
    authorization.filterOutput(userTryingToGet, "read:student", s),
  );
  return response.status(200).json(output);
}

async function postHandler(request, response) {
  const userTryingToPost = request.context.user;
  const newStudent = await student.create(request.body);
  const output = authorization.filterOutput(
    userTryingToPost,
    "read:student",
    newStudent,
  );
  return response.status(201).json(output);
}
