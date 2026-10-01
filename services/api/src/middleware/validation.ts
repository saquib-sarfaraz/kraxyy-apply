import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/apiError';

export function validateBody(schema: ZodTypeAny) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        return next(ApiError.unprocessable('Validation failed', details));
      }
      next(error);
    }
  };
}

export function validateQuery(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = (await schema.parseAsync(req.query)) as Record<string, string>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        return next(ApiError.unprocessable('Invalid query parameters', details));
      }
      next(error);
    }
  };
}
