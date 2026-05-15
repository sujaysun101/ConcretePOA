import React, { useState } from 'react';
import { ShieldCheck, FileText, Search, Zap, Lock, CheckCircle2, ArrowRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

let SignInButton: React.ComponentType<{ mode?: string; children: React.ReactNode }> | null = null;
let SignUpButton: React.ComponentType<{ mode?: string; children: React.ReactNode }> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const clerk = require('@clerk/clerk-react');
  SignInButton = clerk.SignInButton;
  SignUpButton = clerk.SignUpButton;
} catch {
  // Clerk not available
}

const features = [
  {
    icon: ShieldCheck,
    title: 'Bank Compliance Audit',
    description:
      'AI-powered analysis against 15+ major institutions — Chase, Fidelity, Schwab, Vanguard, and more. Know your acceptance probability before you submit.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Search,
    title: 'Rejection Diagnosis',
    description:
      "Upload the bank's rejection letter alongside your POA. Get a plain-English translation of legalese and a concrete 3-step action plan.",
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: FileText,
    title: 'Jurisdictional Tracker',
    description:
      'Compare your document against current 2026 state statutes across all 50 states. Detect statutory drift before it triggers a rejection.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Zap,
    title: 'Instant Remediation',
    description:
      'Receive a legally-sound affidavit template or amendment blueprint tailored to the exact friction points found in your document.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
];

const stats = [
  { value: '15+', label: 'Financial Institutions' },
  { value: '50', label: 'States Covered' },
  { value: '3', label: 'AI Analysis Modes' },
  { value: '2026', label: 'Statute Database' },
];

const testimonials = [
  {
    quote: 'Got our POA accepted by Fidelity on the first try after fixing the indemnification clause the audit flagged.',
    name: 'Margaret T.',
    role: 'Caregiver, San Jose CA',
  },
  {
    quote: "The rejection letter translator saved us weeks. We finally understood what 'super powers' meant in banking terms.",
    name: 'David K.',
    role: 'Elder Law Paralegal',
  },
  {
    quote: "Caught that our 2018 Texas durable POA had statutory drift before the bank did. Prevented a nightmare.",
    name: 'Sandra R.',
    role: 'Estate Planning Client',
  },
];

import type { Variants } from 'framer-motion';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } }),
};

interface Props {
  clerkEnabled: boolean;
}

function CTAButtons({ clerkEnabled }: Props) {
  const [showBanner, setShowBanner] = useState(false);

  if (clerkEnabled && SignUpButton && SignInButton) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <SignUpButton mode="modal">
          <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-semibold text-lg shadow-lg shadow-blue-900/30">
            Analyze My POA — Free <ArrowRight size={18} />
          </button>
        </SignUpButton>
        <SignInButton mode="modal">
          <button className="px-8 py-3.5 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors font-semibold text-lg text-slate-300 hover:text-white">
            Sign In
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => setShowBanner(true)}
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-semibold text-lg shadow-lg shadow-blue-900/30"
      >
        Get Started Free <ArrowRight size={18} />
      </button>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2"
          >
            Add your <code className="font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> to enable authentication.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButtons({ clerkEnabled }: Props) {
  if (clerkEnabled && SignUpButton && SignInButton) {
    return (
      <div className="flex gap-3">
        <SignInButton mode="modal">
          <button className="px-4 py-2 text-sm rounded-lg text-slate-300 hover:text-white transition-colors">
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors font-medium">
            Get Started Free
          </button>
        </SignUpButton>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors font-medium">
        Get Started Free
      </button>
    </div>
  );
}

export default function LandingPage({ clerkEnabled }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">ConcretePOA</span>
        </div>
        <NavButtons clerkEnabled={clerkEnabled} />
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-8">
            <Lock size={11} /> AI-Powered Legal Document Analysis
          </span>
        </motion.div>

        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
        >
          Stop Getting Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300">
            POA Rejected
          </span>
        </motion.h1>

        <motion.p
          className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
        >
          ConcretePOA uses AI to audit Power of Attorney documents against institutional banking
          requirements, diagnose rejections, and surface statutory drift — in seconds.
        </motion.p>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
          <CTAButtons clerkEnabled={clerkEnabled} />
        </motion.div>

        <motion.p className="mt-5 text-xs text-slate-500" initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          For informational purposes only. Not a substitute for legal counsel.
        </motion.p>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="text-center p-5 rounded-2xl bg-slate-800/60 border border-slate-700/50 backdrop-blur"
              initial="hidden" animate="visible" variants={fadeUp} custom={i + 5}
            >
              <div className="text-3xl font-bold text-blue-400">{s.value}</div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Three modes. One verdict.</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Whether you're pre-submitting, handling a rejection, or checking state compliance, there's a dedicated AI mode.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all hover:-translate-y-1 duration-200"
              initial="hidden" animate="visible" variants={fadeUp} custom={i}
            >
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                <f.icon className={f.color} size={20} />
              </div>
              <h3 className="font-semibold mb-2 text-white">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Trusted by caregivers and professionals</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50"
              initial="hidden" animate="visible" variants={fadeUp} custom={i}
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} size={14} className="text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.quote}"</p>
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600/20 via-blue-600/10 to-cyan-600/10 border border-blue-500/20 p-12 text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to get your POA accepted?</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Upload your document and get an institutional compliance audit in under 60 seconds.
          </p>
          <CTAButtons clerkEnabled={clerkEnabled} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
            <ShieldCheck size={13} className="text-white" />
          </div>
          <span className="font-semibold text-slate-300">ConcretePOA</span>
        </div>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          AI-assisted POA review tool. Outputs are informational only and are not legal advice.
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-600">
          <CheckCircle2 size={11} /> No documents are stored on our servers
        </div>
      </footer>
    </div>
  );
}
