// ==============================================================================
// NOVA Gaming Platform - Structured & Sanitized Production Logger
// ==============================================================================

const SENSITIVE_KEYS = new Set([
  'token',
  'password',
  'passwordhash',
  'serverseed',
  'clientseed',
  'seed',
  'authorization',
  'jwt',
  'secret',
  'cardnumber',
  'cvv',
  'receipturl',
]);

function sanitize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Redact JWT tokens if detected in strings
    if (obj.startsWith('eyJ') && obj.length > 50) {
      return '[REDACTED_JWT_TOKEN]';
    }
    return obj;
  }
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      cleaned[key] = '[REDACTED]';
    } else {
      cleaned[key] = sanitize(val);
    }
  }
  return cleaned;
}

export class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  info(message: string, meta?: any) {
    const payload = {
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...(meta ? { meta: sanitize(meta) } : {}),
    };
    if (this.isProduction) {
      console.log(JSON.stringify(payload));
    } else {
      console.log(`[${payload.timestamp}] [INFO]: ${message}`, meta ? sanitize(meta) : '');
    }
  }

  warn(message: string, meta?: any) {
    const payload = {
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...(meta ? { meta: sanitize(meta) } : {}),
    };
    if (this.isProduction) {
      console.warn(JSON.stringify(payload));
    } else {
      console.warn(`[${payload.timestamp}] [WARN]: ${message}`, meta ? sanitize(meta) : '');
    }
  }

  error(message: string, meta?: any) {
    const payload = {
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      ...(meta ? { meta: sanitize(meta) } : {}),
    };
    if (this.isProduction) {
      console.error(JSON.stringify(payload));
    } else {
      console.error(`[${payload.timestamp}] [ERROR]: ${message}`, meta ? sanitize(meta) : '');
    }
  }
}

export const logger = new Logger();
