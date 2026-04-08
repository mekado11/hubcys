import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Loader2, Chrome } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/Dashboard';

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'register') {
        await User.registerWithEmail(email, password, fullName);
      } else {
        await User.loginWithEmail(email, password);
      }
      window.location.href = returnUrl;
    } catch (err) {
      setError(friendlyError(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await User.loginWithRedirect(returnUrl);
      window.location.href = returnUrl;
    } catch (err) {
      setError(friendlyError(err.code || err.message));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <ShieldCheck className="w-8 h-8 text-cyan-400" />
          <span className="text-2xl font-bold text-white tracking-tight">Hubcys</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h1 className="text-xl font-semibold text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            {mode === 'login'
              ? 'Sign in to your Hubcys account'
              : 'Start your 28-day free trial — no card required'}
          </p>

          {/* Google button */}
          <Button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full bg-white text-slate-900 hover:bg-slate-100 border border-slate-200 mb-4 font-medium"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Chrome className="w-4 h-4 mr-2" />}
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <Label htmlFor="fullName" className="text-slate-300 text-sm">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-slate-300 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-4">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          By continuing you agree to our{' '}
          <a href="/TermsOfService" className="text-slate-500 hover:text-slate-400">Terms</a>
          {' '}and{' '}
          <a href="/PrivacyPolicy" className="text-slate-500 hover:text-slate-400">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':      'No account found with this email.',
    'auth/wrong-password':      'Incorrect password.',
    'auth/email-already-in-use':'An account with this email already exists.',
    'auth/weak-password':       'Password must be at least 6 characters.',
    'auth/invalid-email':       'Please enter a valid email address.',
    'auth/too-many-requests':   'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user':'Sign-in popup was closed. Please try again.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
