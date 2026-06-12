import * as cookie from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";
import type { NextHandler } from "next-connect";
import session from "models/session.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import type { Feature } from "@/types/index";

import loginAttempt from "models/loginAttempt.js";
import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  TooManyRequestsError,
  ConflictError,
} from "infra/errors";

function onNoMatchHandler(request: NextApiRequest, response: NextApiResponse) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(
  error: unknown,
  request: NextApiRequest,
  response: NextApiResponse,
) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError ||
    error instanceof TooManyRequestsError ||
    error instanceof ConflictError
  ) {
    return response.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response);
    return response.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.error(publicErrorObject);

  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function setSessionCookie(
  sessionToken: string,
  response: NextApiResponse,
): Promise<void> {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

async function clearSessionCookie(response: NextApiResponse): Promise<void> {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

async function injectAnonymousOrUser(
  request: NextApiRequest,
  response: NextApiResponse,
  next: NextHandler,
) {
  if (request.cookies?.session_id) {
    try {
      await injectAuthenticatedUser(request);
      return next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Usuário não possui sessão ativa.",
          action: "Verifique se este usuário está logado e tente novamente.",
        });
      }

      throw error;
    }
  }

  injectAnonymousUser(request);
  return next();
}

async function injectAuthenticatedUser(request: NextApiRequest): Promise<void> {
  const sessionToken = request.cookies.session_id!;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userObject = await user.findOneById(sessionObject.user_id);

  request.context = { user: userObject };
}

function injectAnonymousUser(request: NextApiRequest): void {
  request.context = {
    user: {
      features: ["read:activation_token", "create:session", "create:user"],
    },
  };
}

function extractIp(request: NextApiRequest): string {
  // x-real-ip is set by Vercel's edge network and cannot be forged by the client.
  // x-forwarded-for is client-controllable and must not be used for rate limiting.
  const realIp = request.headers["x-real-ip"];
  if (realIp && typeof realIp === "string") {
    return realIp.trim();
  }
  return request.socket?.remoteAddress ?? "unknown";
}

async function rateLimitLogin(
  request: NextApiRequest,
  response: NextApiResponse,
  next: NextHandler,
): Promise<void> {
  const ip = extractIp(request);
  if (await loginAttempt.recordAndCheck(ip)) {
    response.setHeader("Retry-After", String(loginAttempt.WINDOW_MINUTES * 60));
    throw new TooManyRequestsError({});
  }
  return next();
}

function canRequest(feature: Feature) {
  return function canRequestMiddleware(
    request: NextApiRequest,
    response: NextApiResponse,
    next: NextHandler,
  ) {
    const userTryingToRequest = request.context.user;

    if (authorization.can(userTryingToRequest, feature)) {
      return next();
    }

    throw new ForbiddenError({
      message: "Você não possui permissão para executar esta ação.",
      action: `Verifique se o seu usuário possui a feature "${feature}".`,
    });
  };
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
  rateLimitLogin,
};

export default controller;
