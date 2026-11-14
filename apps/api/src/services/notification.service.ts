import { AuthServiceLogic } from '@nova/auth';

export interface NotificationProvider {
  sendSms(to: string, message: string): Promise<boolean>;
  sendEmail(to: string, subject: string, body: string, html?: string): Promise<boolean>;
}

/**
 * In-memory store for development/testing verification
 */
const devOtpStore = new Map<string, { code: string; timestamp: number }>();

export class ConsoleNotificationProvider implements NotificationProvider {
  async sendSms(to: string, message: string): Promise<boolean> {
    const masked = AuthServiceLogic.maskPhone(to);
    // Never print plain OTP in production!
    if (process.env.NODE_ENV !== 'production') {
      const match = message.match(/\b\d{6}\b/);
      if (match) {
        devOtpStore.set(to, { code: match[0], timestamp: Date.now() });
      }
      console.log(`[SMS Provider] -> To: ${masked} | Message: ${message}`);
    } else {
      console.log(`[SMS Provider] -> To: ${masked} | Message sent`);
    }
    return true;
  }

  async sendEmail(to: string, subject: string, body: string, html?: string): Promise<boolean> {
    const masked = AuthServiceLogic.maskEmail(to);
    if (process.env.NODE_ENV !== 'production') {
      const match = body.match(/\b\d{6}\b/) || (html && html.match(/\b\d{6}\b/));
      if (match) {
        devOtpStore.set(to, { code: match[0], timestamp: Date.now() });
      }
      console.log(`[Email Provider] -> To: ${masked} | Subject: ${subject} | Body: ${body}`);
    } else {
      console.log(`[Email Provider] -> To: ${masked} | Subject: ${subject} | Sent`);
    }
    return true;
  }
}

/**
 * Notification service with swappable provider interface
 */
export class NotificationService {
  private static provider: NotificationProvider = new ConsoleNotificationProvider();

  static setProvider(provider: NotificationProvider) {
    this.provider = provider;
  }

  static async sendSms(to: string, message: string): Promise<boolean> {
    return this.provider.sendSms(to, message);
  }

  static async sendEmail(to: string, subject: string, body: string, html?: string): Promise<boolean> {
    return this.provider.sendEmail(to, subject, body, html);
  }

  /**
   * Helper for automated tests and local development to retrieve the generated OTP
   */
  static getDevOtp(identifier: string): string | null {
    const entry = devOtpStore.get(identifier);
    if (!entry) return null;
    return entry.code;
  }

  /**
   * Clears dev OTP store
   */
  static clearDevStore() {
    devOtpStore.clear();
  }
}
