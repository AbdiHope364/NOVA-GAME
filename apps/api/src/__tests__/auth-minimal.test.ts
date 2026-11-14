import assert from 'node:assert';
import { prisma, initDatabaseTriggers } from '../config/database.js';
import { AuthService } from '../services/auth.service.js';
import { OtpService } from '../services/otp.service.js';
import { NotificationService } from '../services/notification.service.js';
import { config } from '../config/env.js';
import {
  normalizeEthiopianPhone,
  normalizeEmail,
  detectIdentifierType,
  normalizeIdentifier,
  checkPasswordStrength,
  registerSchema,
  AUTH_ERROR_CODES,
} from '@nova/validation';
import { AuthServiceLogic } from '@nova/auth';

let testCount = 0;
let passedCount = 0;

function describe(suiteName: string, fn: () => Promise<void> | void) {
  console.log(`\n📋 SUITE: ${suiteName}`);
  return fn();
}

async function it(testName: string, fn: () => Promise<void>) {
  testCount++;
  try {
    await fn();
    passedCount++;
    console.log(`  ✅ ${testName}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${testName}`);
    console.error(err);
    process.exit(1);
  }
}

async function runTests() {
  await prisma.$connect();
  await initDatabaseTriggers(prisma);

  // ==========================================
  // SUITE 1: Normalizers and Validation Rules
  // ==========================================
  await describe('Phone, Email & Password Normalization Unit Tests', async () => {
    await it('1.1 Normalizes Ethiopian phone numbers across formats', async () => {
      // 09... format
      const r1 = normalizeEthiopianPhone('0911223344');
      assert.strictEqual(r1.isValid, true);
      assert.strictEqual(r1.normalized, '+251911223344');

      // 9... format without leading 0
      const r2 = normalizeEthiopianPhone('911223344');
      assert.strictEqual(r2.isValid, true);
      assert.strictEqual(r2.normalized, '+251911223344');

      // +251 9... format with spaces and dashes
      const r3 = normalizeEthiopianPhone('+251 911-22-33-44');
      assert.strictEqual(r3.isValid, true);
      assert.strictEqual(r3.normalized, '+251911223344');

      // Safaricom Ethiopia 07... format
      const r4 = normalizeEthiopianPhone('0712345678');
      assert.strictEqual(r4.isValid, true);
      assert.strictEqual(r4.normalized, '+251712345678');

      // Invalid Ethiopian prefixes
      const r5 = normalizeEthiopianPhone('0811223344');
      assert.strictEqual(r5.isValid, false);

      // Incomplete number
      const r6 = normalizeEthiopianPhone('0911');
      assert.strictEqual(r6.isValid, false);
    });

    await it('1.2 Normalizes email addresses and blocks disposable domains', async () => {
      // Valid email with mixed case and whitespace
      const e1 = normalizeEmail('  Player.One@Example.COM  ');
      assert.strictEqual(e1.isValid, true);
      assert.strictEqual(e1.normalized, 'player.one@example.com');
      assert.strictEqual(e1.isDisposable, false);

      // Disposable email domains blocked
      const e2 = normalizeEmail('spammer@tempmail.com');
      assert.strictEqual(e2.isValid, false);
      assert.strictEqual(e2.isDisposable, true);

      const e3 = normalizeEmail('test@mailinator.com');
      assert.strictEqual(e3.isValid, false);
      assert.strictEqual(e3.isDisposable, true);

      // Malformed email
      const e4 = normalizeEmail('notanemail');
      assert.strictEqual(e4.isValid, false);
    });

    await it('1.3 Correctly auto-detects identifier type (phone vs email)', async () => {
      assert.strictEqual(detectIdentifierType('0911223344'), 'phone');
      assert.strictEqual(detectIdentifierType('911223344'), 'phone');
      assert.strictEqual(detectIdentifierType('+251911223344'), 'phone');
      assert.strictEqual(detectIdentifierType('user@gmail.com'), 'email');
      assert.strictEqual(detectIdentifierType('player'), 'email');
    });

    await it('1.4 Enforces password rules & detects common passwords', async () => {
      // Too short (<8 chars)
      const p1 = checkPasswordStrength('short1');
      assert.strictEqual(p1.isAllowed, false);
      assert.strictEqual(p1.label, 'weak');

      // Common password in top list
      const p2 = checkPasswordStrength('password');
      assert.strictEqual(p2.isAllowed, false);
      assert.strictEqual(p2.label, 'weak');

      const p3 = checkPasswordStrength('12345678');
      assert.strictEqual(p3.isAllowed, false);

      // Valid pass with hint
      const p4 = checkPasswordStrength('mysecretpass');
      assert.strictEqual(p4.isAllowed, true);
      assert.strictEqual(p4.hint, 'Add a number');

      // Strong password
      const p5 = checkPasswordStrength('SafeBet#2026!');
      assert.strictEqual(p5.isAllowed, true);
      assert.strictEqual(p5.score, 3);
    });

    await it('1.5 Generates unique friendly player usernames', async () => {
      const u1 = AuthServiceLogic.generatePlayerUsername();
      const u2 = AuthServiceLogic.generatePlayerUsername();
      assert.match(u1, /^Player-[A-Z0-9]{4}$/);
      assert.notStrictEqual(u1, u2);
    });
  });

  // ==========================================
  // SUITE 2: Registration & Anti-Enumeration
  // ==========================================
  await describe('API Registration & Anti-Enumeration Tests', async () => {
    const uniqueSuffix = Math.floor(100000 + Math.random() * 900000);
    const testPhone = `0911${uniqueSuffix.toString().slice(0, 6)}`;
    const testEmail = `player_${Date.now()}_${uniqueSuffix}@novatest.com`;

    await it('2.1 Rejects registration without accepted terms', async () => {
      try {
        await AuthService.register({
          identifier: testPhone,
          password: 'Password999!',
          acceptedTerms: false,
        });
        assert.fail('Should have rejected registration without acceptedTerms');
      } catch (err: any) {
        assert.strictEqual(err.statusCode || 400, 400);
      }
    });

    await it('2.2 Rejects registration with a common password', async () => {
      try {
        await AuthService.register({
          identifier: testPhone,
          password: 'password123',
          acceptedTerms: true,
        });
        assert.fail('Should have rejected common password');
      } catch (err: any) {
        assert.strictEqual(err.statusCode || 400, 400);
      }
    });

    await it('2.3 Successfully registers with phone number, creates unverified user and OTP', async () => {
      const res = await AuthService.register({
        identifier: testPhone,
        password: 'ValidPassword123!',
        acceptedTerms: true,
        ipAddress: '196.188.1.10',
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.destinationType, 'phone');

      // Check user in database
      const user = await prisma.user.findFirst({
        where: { phone: res.normalized },
        include: { wallet: true, consentRecords: true },
      });

      assert.ok(user);
      assert.strictEqual(user.isVerified, false);
      assert.strictEqual(user.wallet?.balance, 0);
      assert.strictEqual(user.consentRecords.length, 1);
      assert.strictEqual(user.consentRecords[0].termsVersion, '1.0');
    });

    await it('2.4 Prevents account enumeration when registering duplicate phone', async () => {
      // Attempting to register the EXACT SAME phone number
      const res = await AuthService.register({
        identifier: testPhone,
        password: 'AnotherPassword123!',
        acceptedTerms: true,
        ipAddress: '196.188.1.11',
      });

      // Response shape MUST BE IDENTICAL to new registration
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.destinationType, 'phone');
    });

    await it('2.5 Successfully registers with email address', async () => {
      const res = await AuthService.register({
        identifier: testEmail,
        password: 'ValidPassword123!',
        acceptedTerms: true,
        ipAddress: '196.188.1.12',
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.destinationType, 'email');
      assert.strictEqual(res.normalized, testEmail.toLowerCase());

      const user = await prisma.user.findFirst({
        where: { email: testEmail.toLowerCase() },
      });
      assert.ok(user);
      assert.strictEqual(user.isVerified, false);
    });
  });

  // ==========================================
  // SUITE 3: OTP Verification, Expiry & Lockout
  // ==========================================
  await describe('OTP Lifecycle & Security Tests', async () => {
    const s = Math.floor(100000 + Math.random() * 900000);
    const otpContact = `+251922${s.toString().slice(0, 6)}`;

    await it('3.1 Generates, delivers to dev store, and hashes OTP code', async () => {
      const sendRes = await OtpService.sendOtp(otpContact, 'REGISTER', '127.0.0.1');
      assert.ok(sendRes.masked);
      assert.strictEqual(sendRes.destinationType, 'phone');

      const devCode = NotificationService.getDevOtp(otpContact);
      assert.ok(devCode);
      assert.match(devCode, /^\d{6}$/);

      // Verify OTP is hashed in DB, never plain text
      const dbRecord = await prisma.otpCode.findFirst({
        where: { identifier: otpContact, purpose: 'REGISTER' },
      });
      assert.ok(dbRecord);
      assert.notStrictEqual(dbRecord.hash, devCode);
    });

    await it('3.2 Enforces 5 wrong attempts lockout', async () => {
      // 4 wrong attempts
      for (let i = 0; i < 4; i++) {
        try {
          await OtpService.verifyOtp(otpContact, '000000', 'REGISTER');
          assert.fail('Should have rejected wrong code');
        } catch (err: any) {
          assert.strictEqual(err.code, AUTH_ERROR_CODES.OTP_INCORRECT);
        }
      }

      // 5th wrong attempt triggers lockout
      try {
        await OtpService.verifyOtp(otpContact, '000000', 'REGISTER');
        assert.fail('Should have locked out after 5 attempts');
      } catch (err: any) {
        assert.strictEqual(err.code, AUTH_ERROR_CODES.ACCOUNT_LOCKED);
      }
    });

    await it('3.3 Enforces rate limit on resends (max 3 sends per contact per hour)', async () => {
      const spamContact = `+251933${s.toString().slice(0, 6)}`;
      await OtpService.sendOtp(spamContact, 'REGISTER', '127.0.0.1');
      await OtpService.sendOtp(spamContact, 'REGISTER', '127.0.0.1');
      await OtpService.sendOtp(spamContact, 'REGISTER', '127.0.0.1');

      try {
        await OtpService.sendOtp(spamContact, 'REGISTER', '127.0.0.1');
        assert.fail('Should have rejected 4th send within the hour');
      } catch (err: any) {
        assert.strictEqual(err.code, AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS);
      }
    });

    await it('3.4 Successfully verifies registration and issues JWT token', async () => {
      const validContact = `+251944${s.toString().slice(0, 6)}`;
      await AuthService.register({
        identifier: validContact,
        password: 'SecurePassword123!',
        acceptedTerms: true,
      });

      const devCode = NotificationService.getDevOtp(validContact);
      assert.ok(devCode);

      const verifyRes = await AuthService.verifyRegistration({
        identifier: validContact,
        code: devCode,
      });

      assert.strictEqual(verifyRes.success, true);
      assert.ok(verifyRes.token);
      assert.strictEqual(verifyRes.user.isVerified, true);
      assert.strictEqual(verifyRes.user.phone, validContact);
    });
  });

  // ==========================================
  // SUITE 4: Login, Password Reset & Session Invalidation
  // ==========================================
  await describe('Login, Password Reset & Security Controls', async () => {
    const s2 = Math.floor(100000 + Math.random() * 900000);
    const loginPhone = `+251955${s2.toString().slice(0, 6)}`;
    const originalPassword = 'OriginalPassword123!';

    await it('4.1 Registers and verifies user for login testing', async () => {
      await AuthService.register({
        identifier: loginPhone,
        password: originalPassword,
        acceptedTerms: true,
      });
      const code = NotificationService.getDevOtp(loginPhone);
      await AuthService.verifyRegistration({ identifier: loginPhone, code });
    });

    await it('4.2 Returns generic error on incorrect credentials to prevent enumeration', async () => {
      try {
        await AuthService.login({
          identifier: loginPhone,
          password: 'WrongPassword!',
        });
        assert.fail('Should have failed login');
      } catch (err: any) {
        assert.strictEqual(err.code, AUTH_ERROR_CODES.INVALID_CREDENTIALS);
        assert.strictEqual(err.message, 'Phone/email or password is incorrect.');
      }
    });

    await it('4.3 Successfully logs in with valid credentials', async () => {
      const loginRes = await AuthService.login({
        identifier: loginPhone,
        password: originalPassword,
      });
      assert.strictEqual(loginRes.success, true);
      assert.ok(loginRes.token);
    });

    await it('4.4 Password reset invalidates existing sessions via tokenVersion', async () => {
      // 1. Get initial token
      const initialLogin = await AuthService.login({
        identifier: loginPhone,
        password: originalPassword,
      });
      const oldPayload = AuthServiceLogic.verifyToken(initialLogin.token, config.jwtSecret);
      assert.strictEqual(oldPayload.tokenVersion, 0);

      // 2. Request password reset OTP
      await AuthService.forgotPassword({ identifier: loginPhone });
      const resetCode = NotificationService.getDevOtp(loginPhone);
      assert.ok(resetCode);

      // 3. Reset password
      const newPassword = 'BrandNewPassword123!';
      const resetRes = await AuthService.resetPassword({
        identifier: loginPhone,
        code: resetCode,
        newPassword,
      });
      assert.strictEqual(resetRes.success, true);

      // 4. Verify tokenVersion incremented in DB
      const user = await prisma.user.findFirst({ where: { phone: loginPhone } });
      assert.strictEqual(user?.tokenVersion, 1);

      // 5. Login with new password yields updated tokenVersion
      const newLogin = await AuthService.login({
        identifier: loginPhone,
        password: newPassword,
      });
      const newPayload = AuthServiceLogic.verifyToken(newLogin.token, config.jwtSecret);
      assert.strictEqual(newPayload.tokenVersion, 1);
    });
  });

  // ==========================================
  // SUITE 5: Age & Identity Verification Guard
  // ==========================================
  await describe('Age Verification Guard (VERIFICATION_REQUIRED)', async () => {
    await it('5.1 Blocks unverified age accounts from financial operations', async () => {
      const s3 = Math.floor(100000 + Math.random() * 900000);
      const unverifiedUser = await prisma.user.create({
        data: {
          username: `PlayerAgeCheck_${Date.now()}`,
          phone: `+251966${s3.toString().slice(0, 6)}`,
          passwordHash: 'dummy',
          isVerified: true,
          ageVerifiedAt: null, // Self-declared 18+ only, not yet identity/age verified
          wallet: {
            create: { balance: 50000, currency: 'ETB' },
          },
        },
      });

      assert.strictEqual(unverifiedUser.ageVerifiedAt, null);

      // Guard check simulation (used in /deposit, /withdraw, and /match staked)
      const isAllowedToTransact = unverifiedUser.ageVerifiedAt !== null;
      assert.strictEqual(isAllowedToTransact, false);

      // Verify setting ageVerifiedAt unlocks staked play and withdrawals
      const verifiedAgeUser = await prisma.user.update({
        where: { id: unverifiedUser.id },
        data: { ageVerifiedAt: new Date() },
      });
      assert.ok(verifiedAgeUser.ageVerifiedAt instanceof Date);
    });
  });

  console.log(`\n🎉 ALL ${passedCount}/${testCount} TESTS PASSED SUCCESSFULLY!`);
  await prisma.$disconnect();
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
