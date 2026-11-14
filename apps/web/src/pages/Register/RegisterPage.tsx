import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Wallet,
  Gift,
} from 'lucide-react';

const getOrCreateDeviceFingerprint = (): string => {
  const existing = localStorage.getItem('nova_device_fp');
  if (existing) return existing;
  const generated =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  localStorage.setItem('nova_device_fp', generated);
  return generated;
};

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState<string>(() => {
    const fromUrl = searchParams.get('ref')?.trim().toUpperCase();
    if (fromUrl) {
      localStorage.setItem('nova_referral_code', fromUrl);
      return fromUrl;
    }
    return localStorage.getItem('nova_referral_code') || '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  useEffect(() => {
    const fromUrl = searchParams.get('ref')?.trim().toUpperCase();
    if (fromUrl) {
      localStorage.setItem('nova_referral_code', fromUrl);
      setReferralCode(fromUrl);
    }
  }, [searchParams]);

  // Compute live password strength
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-800' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8 && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Medium', color: 'bg-amber-400' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-400' };
  }, [password]);

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptedTerms) {
      setError('You must confirm you are 18+ and accept the platform terms.');
      return;
    }

    setIsLoading(true);
    try {
      const deviceFp = getOrCreateDeviceFingerprint();
      await register(
        username.trim(),
        email.trim(),
        password,
        referralCode.trim() || undefined,
        deviceFp
      );
      navigate('/promotions');
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Registration failed. Please check your details and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center py-4 sm:py-8 px-2 sm:px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/95 shadow-2xl relative">
        {/* Left Value Proposition Panel (Visible on Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-950 via-[#0d1526] to-slate-900 p-8 flex-col justify-between border-r border-slate-800/80 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/images/nova-logo.png"
                alt="NOVA GAMING"
                className="h-14 w-auto object-contain drop-shadow-[0_0_16px_rgba(139,92,246,0.45)]"
              />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Ethiopia's Premier Gaming Hub
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Welcome Bonus Included
              </span>
              <h1 className="text-2xl font-black text-white leading-snug">
                Join & Play in Under 30 Seconds
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Experience Aviator Crash, 75-Ball Cartella Bingo, Ethiopian 8x8 Dama, and 7 other provably fair games.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">1000% Welcome Promotional Bonus</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Credited separately as promotional balance upon signup (qualifying first deposit &amp; wagering required before withdrawal).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">HMAC-SHA256 Provably Fair</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Every round and multiplier is cryptographically verifiable.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">Real-Time PvP & Live Rooms</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Compete head-to-head in Dama or join live Bingo & Aviator lobbies.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>256-Bit Encrypted</span>
            <span>18+ Responsible Gaming</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-5 sm:p-8 flex flex-col justify-center">
          <div className="mb-6">
            <div className="flex items-center justify-between lg:hidden mb-3">
              <div className="flex items-center gap-2">
                <img
                  src="/images/nova-logo.png"
                  alt="NOVA GAMING"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black">
                1000% Welcome Bonus
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Create Your Account
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your details below to unlock instant access to all games.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. dawit_pro"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  autoComplete="username"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password & Confirm Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Live Password Strength Meter */}
                {password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 flex gap-1 h-1">
                      <div
                        className={`flex-1 rounded-full ${
                          passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-800'
                        }`}
                      />
                      <div
                        className={`flex-1 rounded-full ${
                          passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-800'
                        }`}
                      />
                      <div
                        className={`flex-1 rounded-full ${
                          passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-800'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={`w-full h-11 pl-10 pr-10 rounded-xl bg-slate-950/90 border text-sm text-white placeholder:text-slate-500 outline-none transition-all ${
                      !passwordsMatch
                        ? 'border-rose-500/70 focus:border-rose-500'
                        : 'border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {!passwordsMatch && (
                  <p className="text-[10px] text-rose-400 font-bold mt-1">
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>

            {/* Optional Referral Code Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Referral Code <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Gift className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. NOVA-A1B2C3"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 text-sm text-white font-mono placeholder:text-slate-500 outline-none transition-all"
                />
              </div>
              {referralCode && (
                <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                  Referral attribution ready for {referralCode} (qualified on your first confirmed deposit).
                </p>
              )}
            </div>

            {/* 18+ Terms Agreement */}
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-4 h-4 rounded border border-slate-600 bg-slate-950 peer-checked:bg-amber-500 peer-checked:border-amber-400 flex items-center justify-center transition-colors">
                  {acceptedTerms && <CheckCircle2 className="w-3 h-3 text-slate-950 stroke-[3]" />}
                </div>
              </div>
              <span className="text-[11px] text-slate-400 group-hover:text-slate-300 leading-snug">
                I confirm that I am at least <strong className="text-slate-200">18 years old</strong> and accept the{' '}
                <Link to="/settings" className="text-cyan-400 hover:underline font-semibold">
                  Provably Fair Policy & Terms
                </Link>
                .
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !passwordsMatch}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account &amp; Claim 1000% Bonus</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6 pt-5 border-t border-slate-800/80">
            Already have a NOVA account?{' '}
            <Link to="/login" className="text-cyan-400 font-black hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
