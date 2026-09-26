export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export class Logger {
  private namespace: string;

  constructor(namespace: string = 'NOVA') {
    this.namespace = namespace;
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] [${this.namespace}]: ${message}${metaString}`;
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(this.formatMessage(LogLevel.INFO, message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, meta));
  }

  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    const errMeta = error instanceof Error ? { error: error.message, stack: error.stack, ...meta } : meta;
    console.error(this.formatMessage(LogLevel.ERROR, message, errMeta));
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }
}

export const logger = new Logger('Global');
