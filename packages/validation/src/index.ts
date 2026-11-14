import { z } from 'zod';

/**
 * Common disposable / temporary email domains blocked for financial platform security
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com',
  'temp-mail.org',
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'sharklasers.com',
  '10minutemail.com',
  'trashmail.com',
  'yopmail.com',
  'dispostable.com',
  'getairmail.com',
  'throwawaymail.com',
  'tempail.com',
  'burnermail.io',
  'fakeinbox.com',
  'maildrop.cc',
  'mohmal.com',
  'mytemp.email',
  'nada.ltd',
  'emailondeck.com',
  'crazymailing.com',
  'tmail.ws',
  'minuteinbox.com',
  'fakemailgenerator.com',
]);

/**
 * Top most common passwords to block (subset of 10k list)
 */
export const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password1',
  'password123',
  'qwerty123',
  'qwertyui',
  'qwertyuiop',
  'novagame',
  'novagaming',
  'ethiopia',
  'ethiopia1',
  'admin123',
  'admin1234',
  'welcome1',
  'welcome123',
  'football',
  'arsenal1',
  'manchester',
  'chelsea1',
  'iloveyou',
  'sunshine',
  'princess',
  'dragon12',
  'shadow12',
  'master12',
  'trustno1',
  '11111111',
  '00000000',
  '12312312',
  '65432100',
  'letmein1',
  'superman',
  'liverpool',
  'barcelona',
]);

/**
 * Stable, translatable API error codes
 */
export const AUTH_ERROR_CODES = {
  IDENTIFIER_INVALID: 'IDENTIFIER_INVALID',
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  PASSWORD_COMMON: 'PASSWORD_COMMON',
  TERMS_NOT_ACCEPTED: 'TERMS_NOT_ACCEPTED',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_INCORRECT: 'OTP_INCORRECT',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
  EMAIL_DISPOSABLE: 'EMAIL_DISPOSABLE',
  USER_EXISTS: 'USER_EXISTS',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export type IdentifierType = 'phone' | 'email' | 'unknown';

/**
 * Detects whether an identifier input is a phone number or email address
 */
export function detectIdentifierType(input: string): IdentifierType {
  const trimmed = input.trim();
  if (!trimmed) return 'unknown';

  // If it has an '@' or letters (without leading plus/digits), it's treated as email
  if (trimmed.includes('@')) return 'email';
  if (/[a-zA-Z]/.test(trimmed)) return 'email';

  // If it starts with '+' or contains only digits, spaces, dashes
  if (/^[+]?[\d\s-()]+$/.test(trimmed)) {
    return 'phone';
  }

  return 'unknown';
}

/**
 * Normalizes an Ethiopian phone number to E.164 format (+2519... or +2517...)
 * Valid mobile networks in Ethiopia:
 * - Ethio Telecom: 9XXXXXXXX (e.g. 0911223344)
 * - Safaricom Ethiopia: 7XXXXXXXX (e.g. 0711223344)
 */
export function normalizeEthiopianPhone(input: string): {
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  // Strip spaces, dashes, parentheses
  let digits = input.replace(/[\s\-()]/g, '');

  if (digits.startsWith('+251')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('251')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Must be 9 digits and start with 9 or 7
  if (!/^[97]\d{8}$/.test(digits)) {
    return {
      isValid: false,
      normalized: '',
      error: 'Enter a valid Ethiopian mobile number (9XX XXX XXXX or 7XX XXX XXXX).',
    };
  }

  return {
    isValid: true,
    normalized: `+251${digits}`,
  };
}

/**
 * Normalizes an email address and checks for disposable email domains
 */
export function normalizeEmail(input: string): {
  isValid: boolean;
  normalized: string;
  isDisposable: boolean;
  error?: string;
} {
  const normalized = input.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(normalized)) {
    return {
      isValid: false,
      normalized,
      isDisposable: false,
      error: 'Enter a valid email address.',
    };
  }

  const domain = normalized.split('@')[1];
  const isDisposable = DISPOSABLE_EMAIL_DOMAINS.has(domain);

  if (isDisposable) {
    return {
      isValid: false,
      normalized,
      isDisposable: true,
      error: 'Temporary or disposable emails are not permitted.',
    };
  }

  return {
    isValid: true,
    normalized,
    isDisposable: false,
  };
}

/**
 * Normalizes either phone or email
 */
export function normalizeIdentifier(input: string): {
  type: 'phone' | 'email';
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  const type = detectIdentifierType(input);

  if (type === 'phone') {
    const phoneRes = normalizeEthiopianPhone(input);
    return {
      type: 'phone',
      isValid: phoneRes.isValid,
      normalized: phoneRes.normalized,
      error: phoneRes.error,
    };
  }

  const emailRes = normalizeEmail(input);
  return {
    type: 'email',
    isValid: emailRes.isValid,
    normalized: emailRes.normalized,
    error: emailRes.error,
  };
}

/**
 * Checks password strength and returns a single plain hint
 */
export function checkPasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3;
  label: 'none' | 'weak' | 'okay' | 'strong';
  hint: string;
  isAllowed: boolean;
} {
  if (!password) {
    return {
      score: 0,
      label: 'none',
      hint: 'At least 8 characters',
      isAllowed: false,
    };
  }

  if (password.length < 8) {
    return {
      score: 1,
      label: 'weak',
      hint: 'Make it longer',
      isAllowed: false,
    };
  }

  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) {
    return {
      score: 1,
      label: 'weak',
      hint: 'Password is too common — choose something unique',
      isAllowed: false,
    };
  }

  const hasNumbers = /\d/.test(password);
  const hasLetters = /[a-zA-Z]/.test(password);

  if (!hasNumbers) {
    return {
      score: 2,
      label: 'okay',
      hint: 'Add a number',
      isAllowed: true,
    };
  }

  if (!hasLetters) {
    return {
      score: 2,
      label: 'okay',
      hint: 'Add a letter',
      isAllowed: true,
    };
  }

  if (password.length >= 10) {
    return {
      score: 3,
      label: 'strong',
      hint: 'Strong password',
      isAllowed: true,
    };
  }

  return {
    score: 2,
    label: 'okay',
    hint: 'Good password',
    isAllowed: true,
  };
}

/**
 * Registration request Zod validation schema
 */
export const registerSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Phone or email is required')
    .refine(
      (val) => {
        const norm = normalizeIdentifier(val);
        return norm.isValid;
      },
      { message: 'Enter a valid Ethiopian phone number or email address' }
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (val) => {
        const check = checkPasswordStrength(val);
        return check.isAllowed;
      },
      { message: 'Password is too weak or too common' }
    ),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must be 18 or older and agree to the Terms and Privacy Policy' }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login request Zod validation schema
 */
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Phone or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * OTP Verification Zod schema
 */
export const verifyOtpSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  code: z
    .string()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain digits only'),
  purpose: z.enum(['REGISTER', 'LOGIN', 'PASSWORD_RESET']),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

/**
 * OTP Resend Zod schema
 */
export const resendOtpSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  purpose: z.enum(['REGISTER', 'LOGIN', 'PASSWORD_RESET']),
});

export type ResendOtpInput = z.infer<typeof resendOtpSchema>;

/**
 * Forgot password Zod schema
 */
export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Phone or email is required'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password Zod schema
 */
export const resetPasswordSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  code: z.string().length(6, 'Verification code must be exactly 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (val) => {
        const check = checkPasswordStrength(val);
        return check.isAllowed;
      },
      { message: 'New password is too weak or too common' }
    ),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
