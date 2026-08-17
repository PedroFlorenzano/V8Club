export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return { error: this.message, code: this.code };
  }
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
  readonly statusCode = 404;
}

export class UnauthorizedError extends DomainError {
  readonly code = "UNAUTHORIZED";
  readonly statusCode = 401;
}

export class ForbiddenError extends DomainError {
  readonly code = "FORBIDDEN";
  readonly statusCode = 403;
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";
  readonly statusCode = 400;
}

export class ConflictError extends DomainError {
  readonly code = "CONFLICT";
  readonly statusCode = 409;
}

export class InvalidCPFError extends ValidationError {
  constructor(cpf?: string) {
    super(cpf ? `CPF inválido: ${cpf}` : "CPF inválido");
  }
}

export class InvalidCardNumberError extends ValidationError {
  constructor() {
    super("Número de cartão inválido");
  }
}

export class ExpiredCardError extends ValidationError {
  constructor() {
    super("Cartão expirado");
  }
}
