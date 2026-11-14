import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useI18nStore } from '../../stores/i18nStore';
import { LanguageSelector } from '../../components/layout/LanguageSelector';
import {
  detectIdentifierType,
  normalizeIdentifier,
  checkPasswordStrength,
  AUTH_ERROR_CODES,
} from '@nova/validation';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Gamepad2,
  Wallet,
  X,
  Phone,
  Mail,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerMinimal, verifyRegistration, resendCode } = useAuthStore();
  const { t } = useI18nStore();

  // Screen stages: 'form' -> 'otp' -> 'welcome'
  const [stage, setStage] = useState<'form' | 'otp' | 'welcome'>('form');

  // Registration Method Selection: 'phone' or 'email'
  const [selectedMethod, setSelectedMethod] = useState<'phone' | 'email'>('phone');

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field Touched / Validation Tracking
  const [touched, setTouched] = useState<{
    identifier: boolean;
    password: boolean;
    confirmPassword: boolean;
  }>({
    identifier: false,
    password: false,
    confirmPassword: false,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification State
  const [verifiedIdentifier, setVerifiedIdentifier] = useState('');
  const [maskedIdentifier, setMaskedIdentifier] = useState('');
  const [destinationType, setDestinationType] = useState<'phone' | 'email'>('phone');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Modal State for Terms / Privacy Policy
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);

  // Input Refs for Accessibility and Focus Management
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for Resend Countdown
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (stage === 'otp' && resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    } else if (resendCountdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [stage, resendCountdown]);

  // Focus the first OTP input when transitioning to OTP stage
  useEffect(() => {
    if (stage === 'otp') {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    }
  }, [stage]);

  // Real-time detection & synchronization with selected method
  const detectedType = useMemo(() => detectIdentifierType(identifier), [identifier]);

  // Current active mode: if typed text exists, auto-detected type takes precedence; otherwise user's tab choice
  const activeMethod = useMemo<'phone' | 'email'>(() => {
    if (identifier.trim().length > 0) {
      return detectedType === 'email' ? 'email' : 'phone';
    }
    return selectedMethod;
  }, [identifier, detectedType, selectedMethod]);

  // Normalization & Validation of Identifier
  const idValidation = useMemo(() => {
    if (!identifier.trim()) {
      return { isValid: false, error: '', normalized: '', type: activeMethod };
    }
    return normalizeIdentifier(identifier);
  }, [identifier, activeMethod]);

  // Password Strength Calculation
  const passStrength = useMemo(() => {
    return checkPasswordStrength(password);
  }, [password]);

  // Switch between Phone and Email tabs
  const handleSelectMethod = (method: 'phone' | 'email') => {
    setSelectedMethod(method);
    setIdentifier('');
    setFormError('');
    setTouched((prev) => ({ ...prev, identifier: false }));
    identifierRef.current?.focus();
  };

  // Handle Form Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Mark fields touched
    setTouched({ identifier: true, password: true, confirmPassword: true });

    // Validate identifier
    if (!idValidation.isValid) {
      if (activeMethod === 'phone') {
        setFormError(t.auth.phoneError);
      } else {
        setFormError(t.auth.emailError);
      }
      identifierRef.current?.focus();
      return;
    }

    // Validate password
    if (!passStrength.isAllowed) {
      setFormError(passStrength.hint);
      passwordRef.current?.focus();
      return;
    }

    // Validate password confirmation match
    if (password !== confirmPassword) {
      setFormError(t.auth.passwordsDoNotMatch);
      confirmPasswordRef.current?.focus();
      return;
    }

    // Validate terms acceptance
    if (!acceptedTerms) {
      setFormError(
        t.auth.termsAgree + ' ' + t.auth.termsOfService + ' ' + t.auth.and + ' ' + t.auth.privacyPolicy
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerMinimal({
        identifier: idValidation.normalized,
        password,
        acceptedTerms,
      });

      setVerifiedIdentifier(idValidation.normalized);
      setMaskedIdentifier(res.identifier || idValidation.normalized);
      setDestinationType(res.destinationType || activeMethod);
      setResendCountdown(60);
      setCanResend(false);
      setStage('otp');
    } catch (err: any) {
      const errCode = err.response?.data?.code;
      if (errCode === AUTH_ERROR_CODES.IDENTIFIER_INVALID) {
        setFormError(activeMethod === 'phone' ? t.auth.phoneError : t.auth.emailError);
        identifierRef.current?.focus();
      } else if (errCode === AUTH_ERROR_CODES.PASSWORD_TOO_WEAK || errCode === AUTH_ERROR_CODES.PASSWORD_COMMON) {
        setFormError(err.response?.data?.message || passStrength.hint);
        passwordRef.current?.focus();
      } else if (errCode === AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS) {
        setFormError(t.auth.tooManyAttempts);
      } else {
        setFormError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP Input Handling
  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean && val !== '') return;

    const newDigits = [...otpDigits];

    if (clean.length > 1) {
      const pastedChars = clean.slice(0, 6).split('');
      pastedChars.forEach((ch, i) => {
        if (i < 6) newDigits[i] = ch;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pastedChars.length, 5);
      otpRefs.current[nextFocus]?.focus();

      if (pastedChars.length === 6) {
        submitOtp(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = clean;
    setOtpDigits(newDigits);
    setOtpError('');

    if (clean && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (index === 5 && clean) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        submitOtp(fullCode);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const submitOtp = async (code: string) => {
    if (code.length < 6) return;
    setIsVerifying(true);
    setOtpError('');

    try {
      await verifyRegistration(verifiedIdentifier, code);
      setStage('welcome');
    } catch (err: any) {
      const codeErr = err.response?.data?.code;
      if (codeErr === AUTH_ERROR_CODES.OTP_EXPIRED) {
        setOtpError('The code has expired. Please tap Resend code.');
      } else if (codeErr === AUTH_ERROR_CODES.ACCOUNT_LOCKED) {
        setOtpError('Too many failed attempts. Please request a new code.');
      } else {
        setOtpError(err.response?.data?.message || 'Invalid code. Please check and try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setOtpError('');
    try {
      await resendCode(verifiedIdentifier, 'REGISTER');
      setResendCountdown(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Could not resend code. Please try again.');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-6 px-3 sm:px-4">
      {/* Container: Max ~420px width for optimal single-thumb mobile ergonomics */}
      <div className="w-full max-w-[420px]">
        {/* Single Card Component */}
        <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-visible">
          {/* Top Right: Language Selector - aligned inward so it stays inside container on mobile */}
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30">
            <LanguageSelector align="right" />
          </div>

          {/* STAGE 1: Minimal Registration Form */}
          {stage === 'form' && (
            <div>
              {/* Header: NOVA Logo & Title */}
              <div className="text-center pt-2 mb-5">
                <img
                  src="/images/nova-logo.png"
                  alt="NOVA GAMING"
                  className="h-16 w-auto mx-auto mb-3 object-contain drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                />
                <h1 className="text-2xl font-black tracking-tight text-white">
                  {t.auth.createAccount}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                  {t.auth.itTakesLess}
                </p>
              </div>

              {/* Form Level Error Message */}
              {formError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Method Chooser Tabs: Phone or Email */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/90 mb-4">
                <button
                  type="button"
                  onClick={() => handleSelectMethod('phone')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
                    activeMethod === 'phone'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  aria-pressed={activeMethod === 'phone'}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t.auth.phone} (🇪🇹 +251)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMethod('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
                    activeMethod === 'email'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  aria-pressed={activeMethod === 'email'}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{t.auth.email}</span>
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} noValidate className="flex flex-col gap-4">
                {/* FIELD 1: Phone or Email Input */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="identifier"
                    className="text-xs font-bold text-slate-300 uppercase tracking-wider"
                  >
                    {activeMethod === 'phone' ? t.auth.phone : t.auth.email}
                  </label>

                  <div className="flex rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/90 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 transition-all">
                    {/* Fixed +251 Chip with Ethiopian Flag shown when Phone is active */}
                    {activeMethod === 'phone' && (
                      <div
                        className="flex items-center gap-1.5 px-3 py-3 bg-slate-800/90 border-r border-slate-700/80 text-slate-200 font-bold text-sm select-none"
                        title="Ethiopia (+251)"
                      >
                        <span role="img" aria-label="Ethiopia" className="text-base leading-none">
                          🇪🇹
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-300">+251</span>
                      </div>
                    )}

                    <input
                      id="identifier"
                      ref={identifierRef}
                      type={activeMethod === 'email' ? 'email' : 'text'}
                      inputMode={activeMethod === 'phone' ? 'tel' : 'email'}
                      autoComplete="username"
                      placeholder={activeMethod === 'phone' ? t.auth.phonePlaceholder : t.auth.emailPlaceholder}
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (formError) setFormError('');
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, identifier: true }))}
                      aria-describedby="identifier-helper"
                      aria-invalid={touched.identifier && identifier.trim() !== '' && !idValidation.isValid}
                      className="w-full bg-transparent px-3.5 py-3 text-slate-100 placeholder-slate-500 text-base focus:outline-none min-h-[48px]"
                    />
                  </div>

                  {/* Inline Error */}
                  {touched.identifier && identifier.trim() !== '' && !idValidation.isValid && (
                    <span role="alert" className="text-xs text-rose-400 font-medium">
                      {activeMethod === 'phone' ? t.auth.phoneError : t.auth.emailError}
                    </span>
                  )}

                  {/* Helper Text */}
                  <span id="identifier-helper" className="text-[11px] text-slate-400">
                    {activeMethod === 'phone' ? t.auth.phoneHelper : t.auth.emailHelper}
                  </span>
                </div>

                {/* FIELD 2: Password Input */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password"
                    className="text-xs font-bold text-slate-300 uppercase tracking-wider"
                  >
                    {t.auth.password}
                  </label>

                  <div className="relative flex items-center rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/90 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 transition-all">
                    <input
                      id="password"
                      ref={passwordRef}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={t.auth.passwordPlaceholder}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formError) setFormError('');
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                      aria-describedby="password-hint"
                      aria-invalid={touched.password && password !== '' && !passStrength.isAllowed}
                      className="w-full bg-transparent px-3.5 py-3 pr-12 text-slate-100 placeholder-slate-500 text-base focus:outline-none min-h-[48px]"
                    />

                    {/* Show / Hide Eye Button (>=48px touch target) */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 bottom-0 px-3.5 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:text-cyan-400 min-w-[48px] min-h-[48px]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Strength Bar (weak / okay / strong) */}
                  {password.length > 0 && (
                    <div className="mt-1 flex flex-col gap-1">
                      <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passStrength.score >= 1
                              ? passStrength.score === 1
                                ? 'bg-rose-500'
                                : passStrength.score === 2
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                              : 'bg-transparent'
                          }`}
                        />
                        <div
                          className={`h-full transition-all duration-300 ${
                            passStrength.score >= 2
                              ? passStrength.score === 2
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                              : 'bg-transparent'
                          }`}
                        />
                        <div
                          className={`h-full transition-all duration-300 ${
                            passStrength.score >= 3 ? 'bg-emerald-400' : 'bg-transparent'
                          }`}
                        />
                      </div>

                      {/* Single Plain Hint */}
                      <span
                        id="password-hint"
                        className={`text-[11px] font-medium ${
                          passStrength.score === 1
                            ? 'text-rose-400'
                            : passStrength.score === 2
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {passStrength.hint}
                      </span>
                    </div>
                  )}
                </div>

                {/* FIELD 3: Confirm Password Input */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="confirm-password"
                    className="text-xs font-bold text-slate-300 uppercase tracking-wider"
                  >
                    {t.auth.confirmPassword}
                  </label>

                  <div className="relative flex items-center rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/90 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 transition-all">
                    <input
                      id="confirm-password"
                      ref={confirmPasswordRef}
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={t.auth.confirmPasswordPlaceholder}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (formError) setFormError('');
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                      aria-invalid={touched.confirmPassword && confirmPassword !== '' && confirmPassword !== password}
                      className="w-full bg-transparent px-3.5 py-3 pr-12 text-slate-100 placeholder-slate-500 text-base focus:outline-none min-h-[48px]"
                    />

                    {/* Show / Hide Eye Button (>=48px touch target) */}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-0 top-0 bottom-0 px-3.5 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:text-cyan-400 min-w-[48px] min-h-[48px]"
                      aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Match indicator or error */}
                  {touched.confirmPassword && confirmPassword !== '' && confirmPassword !== password && (
                    <span role="alert" className="text-xs text-rose-400 font-medium">
                      {t.auth.passwordsDoNotMatch}
                    </span>
                  )}
                  {confirmPassword !== '' && confirmPassword === password && (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Passwords match</span>
                    </span>
                  )}
                </div>

                {/* 18+ & Terms Checkbox (Never pre-ticked) */}
                <div className="flex items-start gap-3 mt-1 py-1">
                  <input
                    id="acceptedTerms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (formError) setFormError('');
                    }}
                    className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 shrink-0 cursor-pointer"
                  />
                  <label htmlFor="acceptedTerms" className="text-xs text-slate-300 leading-snug cursor-pointer select-none">
                    {t.auth.termsAgree}{' '}
                    <button
                      type="button"
                      onClick={() => setActiveModal('terms')}
                      className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 font-semibold focus:outline-none"
                    >
                      {t.auth.termsOfService}
                    </button>{' '}
                    {t.auth.and}{' '}
                    <button
                      type="button"
                      onClick={() => setActiveModal('privacy')}
                      className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 font-semibold focus:outline-none"
                    >
                      {t.auth.privacyPolicy}
                    </button>
                    .
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !acceptedTerms}
                  className="w-full mt-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    <>
                      <span>{t.auth.submitRegister}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switcher: Already have an account? Log in */}
              <div className="text-center mt-6 pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  {t.auth.alreadyHaveAccount}{' '}
                  <Link
                    to="/login"
                    className="text-cyan-400 font-bold hover:text-cyan-300 hover:underline inline-flex items-center py-1 px-1"
                  >
                    {t.auth.logIn}
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* STAGE 2: 6-Digit OTP Verification Screen */}
          {stage === 'otp' && (
            <div>
              <div className="text-center pt-2 mb-6">
                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-cyan-400 shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white">
                  {destinationType === 'phone'
                    ? t.auth.enterCodeTitlePhone
                    : t.auth.enterCodeTitleEmail}
                </h2>
                <p className="text-sm font-bold text-cyan-400 mt-1 font-mono tracking-wide">
                  {maskedIdentifier}
                </p>
              </div>

              {/* OTP Error Banner */}
              {otpError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {/* 6 Digit Input Boxes */}
              <div className="flex justify-between items-center gap-2 sm:gap-2.5 my-6">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={idx === 0 ? 6 : 1}
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono text-white bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40 transition-all select-all shadow-inner"
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={() => submitOtp(otpDigits.join(''))}
                disabled={isVerifying || otpDigits.join('').length < 6}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  <span>{t.auth.verifyCode}</span>
                )}
              </button>

              {/* Resend Countdown & Wrong Number/Email Link */}
              <div className="flex flex-col items-center gap-3 mt-6 pt-4 border-t border-slate-800 text-xs">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-cyan-400 font-bold hover:underline p-2 min-h-[48px] flex items-center"
                  >
                    {t.auth.resendCode}
                  </button>
                ) : (
                  <span className="text-slate-400 font-medium">
                    {t.auth.resendCodeIn} <span className="text-cyan-400 font-bold font-mono">{resendCountdown}s</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setStage('form');
                    setOtpDigits(['', '', '', '', '', '']);
                    setOtpError('');
                  }}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-2 min-h-[48px] flex items-center"
                >
                  {destinationType === 'phone' ? t.auth.wrongNumberChange : t.auth.wrongEmailChange}
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3: Welcome Screen */}
          {stage === 'welcome' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight">
                {t.auth.welcomeTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium leading-relaxed max-w-xs mx-auto">
                {t.auth.welcomeSubtitle}
              </p>

              <div className="flex flex-col gap-3 mt-8">
                {/* Primary Button: Try a free game */}
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider py-4 px-6 rounded-xl shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all min-h-[48px] flex items-center justify-center gap-2"
                >
                  <Gamepad2 className="w-5 h-5" />
                  <span>{t.auth.tryFreeGame}</span>
                </button>

                {/* Secondary Button: Make my first deposit */}
                <button
                  type="button"
                  onClick={() => navigate('/wallet')}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-100 font-bold text-sm py-3.5 px-6 rounded-xl active:scale-[0.98] transition-all min-h-[48px] flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  <span>{t.auth.makeDeposit}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Terms of Service & Privacy Policy */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {activeModal === 'terms' ? t.auth.termsOfService : t.auth.privacyPolicy}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
              {activeModal === 'terms' ? (
                <>
                  <p className="font-semibold text-slate-100">
                    1. Eligibility and Responsible Gaming
                  </p>
                  <p>
                    You must be at least 18 years of age or the legal age of majority in your jurisdiction to participate in real-money contests. Staked matches, deposits, and cash withdrawals require complete age and identity verification.
                  </p>
                  <p className="font-semibold text-slate-100">
                    2. Fair Play & Provably Fair Mechanisms
                  </p>
                  <p>
                    All NOVA games utilize cryptographically verifiable algorithms (HMAC-SHA256) to ensure tamper-proof, unbiased game outcomes. Collusion, automated scripts, or account sharing will result in permanent suspension.
                  </p>
                  <p className="font-semibold text-slate-100">
                    3. Wallet & Financial Regulations
                  </p>
                  <p>
                    Balances are maintained in Ethiopian Birr (ETB) and processed through licensed national payment channels. Unverified accounts may play free practice modes but cannot transact real money.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-100">
                    1. Information We Collect
                  </p>
                  <p>
                    We collect your mobile number or email address solely for account authentication, password recovery, and regulatory compliance. We do not sell or share your personal data with third-party marketers.
                  </p>
                  <p className="font-semibold text-slate-100">
                    2. Security & Encryption
                  </p>
                  <p>
                    Passwords and verification OTPs are hashed using cryptographic one-way functions (bcrypt/Argon2id and HMAC-SHA256). Sensitive data is encrypted in transit and at rest.
                  </p>
                  <p className="font-semibold text-slate-100">
                    3. Data Retention
                  </p>
                  <p>
                    Unverified accounts that are not activated within 24 hours are automatically purged from our servers. You may request account deletion at any time through support.
                  </p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
