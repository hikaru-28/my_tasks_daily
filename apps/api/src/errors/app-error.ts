export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE'

export class AppError extends Error {
  readonly status: number
  readonly code: AppErrorCode
  readonly details?: unknown

  constructor(status: number, code: AppErrorCode, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details)
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'BAD_REQUEST', message, details)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super(404, 'NOT_FOUND', message, details)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, 'CONFLICT', message, details)
  }
}

export class UnprocessableError extends AppError {
  constructor(message: string, details?: unknown) {
    super(422, 'UNPROCESSABLE', message, details)
  }
}
