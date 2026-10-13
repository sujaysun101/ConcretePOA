import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Loader2,
  X,
  ChevronDown,
  AlertCircle,
  Check,
  Copy,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getDemoCredentials } from '../auth/authService';
import { cn } from '../lib/utils';

type Mode = 'signin' | 'signup';

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.5l.1.1 6.2 5.2C39.1 37.1 44 33 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const demos = getDemoCredentials();

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 250));

    const result =
      mode === 'signin'
        ? login(email, password)
        : register({ email, password, confirmPassword, tenantName: tenantName || undefined });

    if (result.ok === false) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  };

  const fillCredentials = (demoEmail: string, demoPassword: string) => {
    setMode('signin');
    setEmail(demoEmail);
    setPassword(demoPassword);
    setConfirmPassword(demoPassword);
    setError(null);
    setInfo('Demo credentials loaded — click Sign In.');
  };

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-zinc-100 flex items-center justify-center px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(24,24,27,0.08), transparent 60%), linear-gradient(180deg, #f4f4f5 0%, #e4e4e7 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="rounded-2xl bg-white border border-zinc-200 shadow-xl shadow-zinc-900/10 overflow-hidden">
          <div className="relative px-7 pt-7 pb-2">
            <button
              type="button"
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              aria-label="Close"
              onClick={() => {
                setError(null);
                setInfo('Use Sign In or Create Account below to continue.');
              }}
            >
              <X className="w-4 h-4" />
            </button>

            <h1 className="text-center font-serif italic text-3xl text-zinc-900 tracking-tight">
              ConcretePOA.
            </h1>

            {/* Mode toggle */}
            <div className="mt-6 mx-auto flex w-full max-w-xs rounded-full bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={cn(
                  'flex-1 rounded-full py-2 text-sm font-medium transition-all',
                  mode === 'signin'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={cn(
                  'flex-1 rounded-full py-2 text-sm font-medium transition-all',
                  mode === 'signup'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                )}
              >
                Create Account
              </button>
            </div>
          </div>

          <div className="px-7 pb-7 pt-5 space-y-4">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setInfo(
                  'Google sign-in is not configured in this demo. Use email/password or a test account below.'
                );
              }}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 transition-colors"
            >
              <GoogleGlyph />
              Continue with Google
            </button>

            <div className="relative flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-200" />
              <span className="text-xs text-zinc-400">or</span>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 focus:bg-white transition-all"
                required
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <AnimatePresence initial={false}>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 focus:bg-white transition-all"
                      required
                    />
                    <input
                      type="text"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      placeholder="Organization / tenant name (optional)"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 focus:bg-white transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-1.5 text-sm text-red-600"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    {error}
                  </motion.p>
                )}
                {!error && info && (
                  <motion.p
                    key="info"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-zinc-500"
                  >
                    {info}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-zinc-900 text-white py-3.5 text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : mode === 'signin' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white/80 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-zinc-50 transition-colors"
          >
            <span className="text-sm font-medium text-zinc-700">Test credentials</span>
            <ChevronDown
              className={cn('w-4 h-4 text-zinc-400 transition-transform', showDemo && 'rotate-180')}
            />
          </button>
          <AnimatePresence>
            {showDemo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-2">
                  {demos.map((demo) => (
                    <button
                      key={demo.email}
                      type="button"
                      onClick={() => fillCredentials(demo.email, demo.password)}
                      className="w-full text-left rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 hover:border-zinc-400 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{demo.label}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {demo.role} · {demo.tenant}
                          </p>
                          <p className="text-xs font-mono text-zinc-600 mt-2">{demo.email}</p>
                          <p className="text-xs font-mono text-zinc-500">{demo.password}</p>
                        </div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            copyText(demo.email, `${demo.email} / ${demo.password}`);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.stopPropagation();
                              copyText(demo.email, `${demo.email} / ${demo.password}`);
                            }
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-white"
                          title="Copy"
                        >
                          {copiedKey === demo.email ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400 mt-2">
                        Click to fill &amp; sign in
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
