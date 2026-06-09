interface BaseErrorParams {
  cause?: unknown;
  message?: string;
  action?: string;
}

interface ServiceErrorParams extends BaseErrorParams {
  context?: unknown;
}

interface InternalServerErrorParams {
  cause?: unknown;
  statusCode?: number;
}

export class InternalServerError extends Error {
  action: string;
  statusCode: number;

  constructor({ cause, statusCode }: InternalServerErrorParams) {
    super("Um erro interno não esperado aconteceu.", { cause });
    this.name = "InternalServerError";
    this.action = "Entre em contato com o suporte.";
    this.statusCode = statusCode ?? 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ServiceError extends Error {
  action: string;
  statusCode: number;
  context: unknown;

  constructor({ cause, message, action, context }: ServiceErrorParams) {
    super(message ?? "Serviço indisponível no momento.", { cause });
    this.name = "ServiceError";
    this.action = action ?? "Verifique se o serviço está disponível.";
    this.statusCode = 503;
    this.context = context;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
      context: this.context,
    };
  }
}

export class ValidationError extends Error {
  action: string;
  statusCode: number;

  constructor({ cause, message, action }: BaseErrorParams) {
    super(message ?? "Um erro de  validação ocorreu.", { cause });
    this.name = "ValidationError";
    this.action = action ?? "Corrija os dados e tente novamente.";
    this.statusCode = 400;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class NotFoundError extends Error {
  action: string;
  statusCode: number;

  constructor({ cause, message, action }: BaseErrorParams) {
    super(message ?? "Não foi possível encontrar este recurso no sistema.", {
      cause,
    });
    this.name = "NotFoundError";
    this.action =
      action ?? "Verifique se os parâmetros enviados na consulta estão certos.";
    this.statusCode = 404;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class UnauthorizedError extends Error {
  action: string;
  statusCode: number;

  constructor({ cause, message, action }: BaseErrorParams) {
    super(message ?? "Usuário não autenticado.", { cause });
    this.name = "UnauthorizedError";
    this.action = action ?? "Faça novamente o login para continuar.";
    this.statusCode = 401;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ForbiddenError extends Error {
  action: string;
  statusCode: number;

  constructor({ cause, message, action }: BaseErrorParams) {
    super(message ?? "Acesso negado.", { cause });
    this.name = "ForbiddenError";
    this.action =
      action ?? "Verifique as features necessárias antes de continuar.";
    this.statusCode = 403;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class MethodNotAllowedError extends Error {
  action: string;
  statusCode: number;

  constructor() {
    super("Método não permitido para este endpoint.");
    this.name = "MethodNotAllowedError";
    this.action =
      "Verifique se o método HTTP enviado é válido para este endpoint.";
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
