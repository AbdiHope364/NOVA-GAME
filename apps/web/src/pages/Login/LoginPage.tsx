import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Input, Button } from '@nova/ui';
import { useAuthStore } from '../../stores/authStore';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-12 px-2 sm:px-0">
      <Card className="flex flex-col gap-5 sm:gap-6 p-4 sm:p-6 border-slate-800 bg-slate-900/90 shadow-2xl">
        <div className="text-center mb-2 sm:mb-4">
          <img
            src="/images/nova-logo.png"
            alt="NOVA GAMING"
            className="h-20 w-auto mx-auto mb-3 object-contain drop-shadow-[0_0_20px_rgba(139,92,246,0.45)]"
          />
          <h2 className="text-xl sm:text-2xl font-black text-white">Sign In to NOVA</h2>
          <p className="text-xs text-slate-400 mt-1">Access your platform wallet and games</p>
        </div>

        {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Email Address"
            aria-label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-11 sm:h-12 text-sm sm:text-base placeholder:text-slate-400 bg-slate-950/90"
          />
          <Input
            type="password"
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-11 sm:h-12 text-sm sm:text-base placeholder:text-slate-400 bg-slate-950/90"
          />
          <Button variant="primary" size="lg" type="submit" isLoading={isLoading} className="mt-2 min-h-[48px] active:scale-95 font-black tracking-wider uppercase">
            SIGN IN
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 font-bold hover:underline">
            Register now
          </Link>
        </p>
      </Card>
    </div>
  );
};

