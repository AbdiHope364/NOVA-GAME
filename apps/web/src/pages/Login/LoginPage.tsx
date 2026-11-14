import React, { useState, useMemo, useRef } from 'react';
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
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Phone,
  Mail,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginMinimal, forgotPassword, resetPassword } = useAuthStore();
  const { t } = useI18nStore();

  // Mode: 'login' | 'forgot_identifier' | 'forgot_reset'
  const [mode, setMode] = useState<'login' | 'forgot_identifier' | 'forgot_reset'>('login');

  // Method Selection: 'phone' or 'email'
  const [selectedMethod, setSelectedMethod] = useState<'phone' | 'email'>('phone');

  // Login Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<{ identifier: boolean; password: boolean }>({
    identifier: false,
    password: false,
  });
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password Reset State
  const [resetSelectedMethod, setResetSelectedMethod] = useState<'phone' | 'email'>('phone');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [maskedResetIdentifier, setMaskedResetIdentifier] = useState('');
  const [resetOtpDigits, setResetOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Refs
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const resetOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Detection & Active Method
  const detectedType = useMemo(() => detectIdentifierType(identifier), [identifier]);
  const activeMethod = useMemo<'phone' | 'email'>(() => {
    if (identifier.trim().length > 0) {
      return detectedType === 'email' ? 'email' : 'phone';
    }
    return selectedMethod;
  }, [identifier, detectedType, selectedMethod]);

  const idValidation = useMemo(() => {
    if (!identifier.trim()) return { isValid: false, error: '', normalized: '', type: activeMethod };
    return normalizeIdentifier(identifier);
  }, [identifier, activeMethod]);

  // Reset Identifier Detection & Active Method
  const resetDetectedType = useMemo(() => detectIdentifierType(resetIdentifier), [resetIdentifier]);
  const resetActiveMethod = useMemo<'phone' | 'email'>(() => {
    if (resetIdentifier.trim().length > 0) {
      return resetDetectedType === 'email' ? 'email' : 'phone';
    }
    return resetSelectedMethod;
  }, [resetIdentifier, resetDetectedType, resetSelectedMethod]);

  const resetIdValidation = useMemo(() => {
    if (!resetIdentifier.trim()) return { isValid: false, error: '', normalized: '', type: resetActiveMethod };
    return normalizeIdentifier(resetIdentifier);
  }, [resetIdentifier, resetActiveMethod]);

  // New Password Strength
  const newPassStrength = useMemo(() => {
    return checkPasswordStrength(newPassword);
  }, [newPassword]);

  // Switch between Phone and Email tabs
  const handleSelectMethod = (method: 'phone' | 'email') => {
    setSelectedMethod(method);
    setIdentifier('');
    setLoginError('');
    setTouched((prev) => ({ ...prev, identifier: false }));
    identifierRef.current?.focus();
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setResetSuccess('');
    setTouched({ identifier: true, password: true });

    if (!identifier.trim() || !password) {
      setLoginError(t.auth.invalidCredentials);
      if (!identifier.trim()) identifierRef.current?.focus();
      else passwordRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      const lookup = idValidation.isValid ? idValidation.normalized : identifier.trim();
      const res = await loginMinimal(lookup, password);

      if (res?.requiresVerification) {
        setLoginError(res.message || 'Please verify your phone or email to sign in.');
        return;
      }

      navigate('/');
    } catch (err: any) {
      const errCode = err.response?.data?.code;
      if (errCode === AUTH_ERROR_CODES.ACCOUNT_LOCKED || errCode === AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS) {
        setLoginError(t.auth.tooManyAttempts);
      } else {
        setLoginError(t.auth.invalidCredentials);
      }
      passwordRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Send Reset Code
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!resetIdValidation.isValid) {
      setResetError(resetActiveMethod === 'phone' ? t.auth.phoneError : t.auth.emailError);
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPassword(resetIdValidation.normalized);
      setMaskedResetIdentifier(res.identifier || resetIdValidation.normalized);
      setMode('forgot_reset');
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Could not send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit changes in Reset Flow
  const handleResetOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean && val !== '') return;

    const newDigits = [...resetOtpDigits];
    if (clean.length > 1) {
      const pastedChars = clean.slice(0, 6).split('');
      pastedChars.forEach((ch, i) => {
        if (i < 6) newDigits[i] = ch;
      });
      setResetOtpDigits(newDigits);
      const nextFocus = Math.min(pastedChars.length, 5);
      resetOtpRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = clean;
    setResetOtpDigits(newDigits);
    setResetError('');
    if (clean && index < 5) {
      resetOtpRefs.current[index + 1]?.focus();
    }
  };

  // Handle Complete Password Reset
  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    const code = resetOtpDigits.join('');
    if (code.length < 6) {
      setResetError('Please enter the complete 6-digit code.');
      return;
    }

    if (!newPassStrength.isAllowed) {
      setResetError(newPassStrength.hint);
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(resetIdValidation.normalized, code, newPassword);
      setResetSuccess(t.auth.passwordResetSuccess);
      setMode('login');
      setPassword('');
      setResetOtpDigits(['', '', '', '', '', '']);
      setNewPassword('');
    } catch (err: any) {
      const errCode = err.response?.data?.code;
      if (errCode === AUTH_ERROR_CODES.OTP_EXPIRED) {
        setResetError('The reset code has expired. Please request a new one.');
      } else if (errCode === AUTH_ERROR_CODES.OTP_INCORRECT) {
        setResetError('The reset code is incorrect.');
      } else {
        setResetError(err.response?.data?.message || 'Failed to reset password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-6 px-3 sm:px-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Top Right Language Selector */}
          <div className="absolute top-5 right-5 z-20">
            <LanguageSelector />
          </div>

          {/* MODE 1: Standard Minimal Login */}
          {mode === 'login' && (
            <div>
              {/* Logo & Header */}
              <div className="text-center pt-2 mb-5">
                <img
                  src="/images/nova-logo.png"
                  alt="NOVA GAMING"
                  className="h-16 w-auto mx-auto mb-3 object-contain drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                />
                <h1 className="text-2xl font-black tracking-tight text-white">
                  {t.auth.logInTitle}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                  {t.auth.logInSubtitle}
                </p>
              </div>

              {/* Success Notice */}
              {resetSuccess && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              {/* Login Error Alert */}
              {loginError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
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

              <form onSubmit={handleLoginSubmit} noValidate className="flex flex-col gap-4">
                {/* Field 1: Phone or Email */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="login-identifier"
                    className="text-xs font-bold text-slate-300 uppercase tracking-wider"
                  >
                    {activeMethod === 'phone' ? t.auth.phone : t.auth.email}
                  </label>

                  <div className="flex rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/90 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 transition-all">
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
                      id="login-identifier"
                      ref={identifierRef}
                      type={activeMethod === 'email' ? 'email' : 'text'}
                      inputMode={activeMethod === 'phone' ? 'tel' : 'email'}
                      autoComplete="username"
                      placeholder={activeMethod === 'phone' ? t.auth.phonePlaceholder : t.auth.emailPlaceholder}
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, identifier: true }))}
                      className="w-full bg-transparent px-3.5 py-3 text-slate-100 placeholder-slate-500 text-base focus:outline-none min-h-[48px]"
                    />
                  </div>
                </div>

                {/* Field 2: Password */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="login-password"
                    className="text-xs font-bold text-slate-300 uppercase tracking-wider"
                  >
                    {t.auth.password}
                  </label>

                  <div className="relative flex items-center rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/90 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 transition-all">
                    <input
                      id="login-password"
                      ref={passwordRef}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder={t.auth.passwordPlaceholder}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      className="w-full bg-transparent px-3.5 py-3 pr-12 text-slate-100 placeholder-slate-500 text-base focus:outline-none min-h-[48px]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 bottom-0 px-3.5 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:text-cyan-400 min-w-[48px] min-h-[48px]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Forgot Password Under Password Input */}
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setResetIdentifier(identifier);
                        setResetSelectedMethod(activeMethod);
                        setMode('forgot_identifier');
                        setLoginError('');
                      }}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline p-1 min-h-[36px] flex items-center"
                    >
                      {t.auth.forgotPassword}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <>
                      <span>{t.auth.logIn}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switcher */}
              <div className="text-center mt-6 pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  {t.auth.dontHaveAccount}{' '}
                  <Link
                    to="/register"
                    className="text-cyan-400 font-bold hover:text-cyan-300 hover:underline inline-flex items-center py-1 px-1"
                  >
                    {t.auth.createAccount}
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* MODE 2: Forgot Password - Enter Identifier */}
          {mode === 'forgot_identifier' && (
            <div>
              <div className="text-center pt-2 mb-5">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-inner">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white">
                  {t.auth.resetPasswordTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                  {t.auth.resetPasswordSubtitle}
                </p>
              </div>

              {resetError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              {/* Reset Method Chooser Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/90 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setResetSelectedMethod('phone');
                    setResetIdentifier('');
                    setResetError('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all min-h-[40px] ${
                    resetActiveMethod === 'phone'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t.auth.phone} (🇪🇹 +251)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetSelectedMethod('email');
                    setResetIdentifier('');
                    setResetError('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all min-h-[40px] ${
                    resetActiveMethod === 'email'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{t.auth.email}</span>
                </button>
              </div>

              <form onSubmit={handleSendResetCode} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {resetActiveMethod === 'phone' ? t.auth.phone : t.auth.email}
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/90 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 transition-all">
                    {resetActiveMethod === 'phone' && (
                      <div className="flex items-center gap-1.5 px-3 py-3 bg-slate-800/90 border-r border-slate-700/80 text-slate-200 font-bold text-sm select-none">
                        <span role="img" aria-label="Ethiopia" className="text-base leading-none">
                          🇪🇹
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-300">+251</span>
                      </div>
                    )}
                    <input
                      type={resetActiveMethod === 'email' ? 'email' : 'text'}
                      inputMode={resetActiveMethod === 'phone' ? 'tel' : 'email'}
                      placeholder={resetActiveMethod === 'phone' ? t.auth.phonePlaceholder : t.auth.emailPlaceholder}
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      className="w-full bg-transparent px-3.5 py-3 text-slate-100 placeholder-slate-500 text-base focus:outline-none min-h-[48px]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all min-h-[48px] flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Sending...' : t.auth.sendResetCode}
                </button>
              </form>

              <div className="text-center mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setResetError('');
                  }}
                  className="text-xs text-slate-400 hover:text-white transition-colors p-2 min-h-[44px]"
                >
                  {t.auth.backToLogin}
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: Forgot Password - Enter Code and New Password */}
          {mode === 'forgot_reset' && (
            <div>
              <div className="text-center pt-2 mb-4">
                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-cyan-400 shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white">
                  Enter 6-Digit Code
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Sent to <span className="font-mono text-cyan-400 font-bold">{maskedResetIdentifier}</span>
                </p>
              </div>

              {resetError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <form onSubmit={handleCompleteReset} className="flex flex-col gap-4">
                {/* 6 Digit Input Boxes */}
                <div className="flex justify-between items-center gap-2 my-2">
                  {resetOtpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (resetOtpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={idx === 0 ? 6 : 1}
                      value={digit}
                      onChange={(e) => handleResetOtpChange(idx, e.target.value)}
                      className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl font-black font-mono text-white bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40 transition-all select-all shadow-inner"
                      aria-label={`Digit ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* New Password Input */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {t.auth.newPassword}
                  </label>
                  <div className="relative flex items-center rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/90 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 transition-all">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder={t.auth.passwordPlaceholder}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-transparent px-3.5 py-3 pr-12 text-slate-100 placeholder-slate-500 text-base focus:outline-none min-h-[48px]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-0 top-0 bottom-0 px-3.5 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none min-w-[48px] min-h-[48px]"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {newPassword && (
                    <span className="text-[11px] font-medium text-amber-400 mt-0.5">
                      {newPassStrength.hint}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || resetOtpDigits.join('').length < 6 || !newPassStrength.isAllowed}
                  className="w-full mt-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Resetting...' : t.auth.setNewPassword}
                </button>
              </form>

              <div className="text-center mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setResetError('');
                  }}
                  className="text-xs text-slate-400 hover:text-white transition-colors p-2 min-h-[44px]"
                >
                  {t.auth.backToLogin}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
