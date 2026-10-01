import express, { Express } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { corsMiddleware, helmetMiddleware, apiRateLimiter } from './config/security';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import apiV1Routes from './routes';
import contactRoutes from './routes/contactRoutes';
import { ApiError } from './utils/apiError';

export function createApp(): Express {
  const app = express();

  // Basic security and tracing
  app.use(requestIdMiddleware);
  app.use(helmetMiddleware);
  app.use(corsMiddleware);

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('[:date[iso]] :method :url :status :response-time ms - :res[content-length]'));
  }

  // Parsers
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(cookieParser(process.env.COOKIE_SECRET || 'kraxyy_cookie_secret'));

  // Static uploads directory
  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadDir));

  // Health endpoint
  app.get('/health', (_req, res) => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({
      status: 'healthy',
      database: states[mongoose.connection.readyState] || 'unknown',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Direct /api/contact route
  app.use('/api/contact', contactRoutes);

  // API prefix with rate limiter (support both /api and /api/v1)
  app.use('/api/v1', apiRateLimiter, apiV1Routes);
  app.use('/api', apiRateLimiter, apiV1Routes);

  // 404 handler
  app.use((req, _res, next) => {
    next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
}
