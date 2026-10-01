export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown[];

  constructor(statusCode: number, message: string, code: string = 'INTERNAL_ERROR', details?: unknown[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code: string = 'BAD_REQUEST', details?: unknown[]) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message: string = 'Unauthorized access', code: string = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message: string = 'Forbidden resource', code: string = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code: string = 'CONFLICT') {
    return new ApiError(409, message, code);
  }

  static unprocessable(message: string, details?: unknown[]) {
    return new ApiError(422, message, 'VALIDATION_ERROR', details);
  }

  static internal(message: string = 'Internal server error') {
    return new ApiError(500, message, 'INTERNAL_SERVER_ERROR');
  }
}
