import dotenv from 'dotenv';
dotenv.config();

// Auto-reloaded with latest environment variables
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT || '5001', 10);

async function bootstrap() {
  await connectDatabase();

  const app = createApp();

  const server = app.listen(PORT, () => {
    logger.info(`Kraxyy Apply API server running on http://localhost:${PORT}`);
    logger.info(`Health check available at http://localhost:${PORT}/health`);
  });

  const handleShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error(`Fatal bootstrap error: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
