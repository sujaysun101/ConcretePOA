import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  KeyRound,
  ChevronDown,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getDemoCredentials } from '../auth/authService';
import { cn } from '../lib/utils';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const demos = getDemoCredentials();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    // Brief delay so the UI feels intentional under demo auth
    await new Promise((r) => setTimeout(r, 350));
    const result = login(email, password);
    if (result.ok === false) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  };

  const fillCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // ignore clipboard failures in restricted contexts
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Atmospheric background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(161,161,170,0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 80%, rgba(113,113,122,0.22), transparent 50%), linear-gradient(165deg, #09090b 0%, #18181b 45%, #27272a 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Brand panel */}
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="lg:w-[48%] px-8 sm:px-12 lg:px-16 py-12 lg:py-16 flex flex-col justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-zinc-900" />
            </div>
            <span className="text-xl font-semibold tracking-tight">ConcretePOA</span>
          </div>

          <div className="mt-16 lg:mt-0 max-w-md">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-xs font-mono uppercase tracking-[0.25em] text-zinc-500 mb-5"
            >
              Institutional access
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.55 }}
              className="font-serif italic text-5xl sm:text-6xl leading-[1.05] text-white"
            >
              ConcretePOA.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.5 }}
              className="mt-6 text-zinc-400 text-base leading-relaxed max-w-sm"
            >
              Sign in to your tenant workspace to audit POAs, diagnose bank rejections, and track jurisdictional compliance.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="mt-10 flex flex-wrap gap-3 text-xs text-zinc-500"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Multi-tenant workspaces
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Role-based privileges
              </span>
            </motion.div>
          </div>

          <p className="hidden lg:block text-xs text-zinc-600 mt-12">
            Demo authentication — replace with SSO / IdP for production.
          </p>
        </motion.section>

        {/* Form panel */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10 lg:py-16"
        >
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
              <h2 className="text-2xl font-semibold tracking-tight text-white">Sign in</h2>
              <p className="text-sm text-zinc-500 mt-1.5">
                Use your tenant email. Demo accounts are listed below.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@firm.com"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-500 transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 pr-12 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-500 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 rounded-xl border border-red-900/50 bg-red-950/40 px-3 py-2.5 text-sm text-red-300"
                    >
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-white text-zinc-900 py-3 text-sm font-semibold hover:bg-zinc-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    'Sign in to workspace'
                  )}
                </button>
              </form>
            </div>

            {/* Demo credentials */}
            <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDemo((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-zinc-800/40 transition-colors"
              >
                <span className="text-sm font-medium text-zinc-300">Test credentials</span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-zinc-500 transition-transform',
                    showDemo && 'rotate-180'
                  )}
                />
              </button>
              <AnimatePresence>
                {showDemo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2">
                      {demos.map((demo) => (
                        <button
                          key={demo.email}
                          type="button"
                          onClick={() => fillCredentials(demo.email, demo.password)}
                          className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 hover:border-zinc-600 hover:bg-zinc-900/80 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-zinc-200">{demo.label}</p>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {demo.role} · {demo.tenant}
                              </p>
                              <p className="text-xs font-mono text-zinc-400 mt-2">{demo.email}</p>
                              <p className="text-xs font-mono text-zinc-500">{demo.password}</p>
                            </div>
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyText(`${demo.email}-email`, demo.email);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.stopPropagation();
                                    copyText(`${demo.email}-email`, demo.email);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                                title="Copy email"
                              >
                                {copiedKey === `${demo.email}-email` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600 mt-2 group-hover:text-zinc-500">
                            Click to fill
                          </p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
