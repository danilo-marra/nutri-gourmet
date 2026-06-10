import type { RequestUser } from "./index";

declare module "next" {
  interface NextApiRequest {
    context: {
      user: RequestUser;
    };
  }
}
