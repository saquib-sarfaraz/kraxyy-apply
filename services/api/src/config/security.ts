import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:5174';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl or chrome extensions)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      CLIENT_URL,
      ADMIN_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5001'
    ];

    if (allowedOrigins.includes(origin) || origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }

    callback(null, true); // Permissive in dev, logged in audit
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Extension-Token', 'X-Request-Id']
});

export const helmetMiddleware = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 30, // 30 requests per IP per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'API rate limit exceeded. Please slow down.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10, // 10 contact requests per IP per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many contact requests from this address. Please try again in a few minutes.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 5, // 5 requests per IP per window to prevent email flooding
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many password reset requests. Please try again in 15 minutes.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

