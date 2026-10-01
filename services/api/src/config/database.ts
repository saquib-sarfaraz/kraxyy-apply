import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load .env from services/api/.env or workspace root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

let memoryServer: any = null;

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kraxyy_apply';

  try {
    mongoose.set('strictQuery', true);
    
    // Auto-reconnect logger
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Reconnection will be attempted automatically.');
    });

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true
    });
    logger.info(`MongoDB successfully connected to: ${uri.split('@').pop()}`);
  } catch (error) {
    logger.warn(`Direct MongoDB connection failed: ${(error as Error).message}. Starting embedded memory database for resilience...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      logger.info(`Fallback MongoDB Memory Server running at ${memUri}`);
    } catch (memErr) {
      logger.error(`Failed to start memory server fallback: ${(memErr as Error).message}`);
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  }
  if (memoryServer) {
    await memoryServer.stop();
  }
}
