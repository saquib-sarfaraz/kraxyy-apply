type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private format(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(this.format('debug', message, meta));
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    console.info(this.format('info', message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(this.format('warn', message, meta));
  }

  error(message: string, meta?: Record<string, unknown>) {
    console.error(this.format('error', message, meta));
  }
}

export const logger = new Logger();
