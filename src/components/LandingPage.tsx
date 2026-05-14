import React from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { ShieldCheck, FileText, Search, Zap, Lock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: ShieldCheck,
    title: 'Bank Compliance Audit',
    description: 'AI-powered analysis against 15+ major institutions including Chase, Fidelity, Schwab, and Vanguard. Know your acceptance probability before you submit.',
  },
  {
    icon: Search,
    title: 'Rejection Diagnosis',
    description: 'Upload the bank\'s rejection letter alongside your POA. Get a plain-English translation of legalese and a 3-step action plan.',
  },
  {
    icon: FileText,
    title: 'Jurisdictional Tracker',
    description: 'Compare your document against current 2026 state statutes. Detect statutory drift before it causes a rejection.',
  },
  {
    icon: Zap,
    title: 'Instant Remediation',
    description: 'Receive a legally-sound affidavit template or amendment blueprint tailored to the exact friction points found.',
  },
];

const stats = [
  { value: '15+', label: 'Financial Institutions' },
  { value: '50', label: 'States Covered' },
  { value: '3', label: 'AI Analysis Modes' },
  { value: '2026', label: 'Statute Database' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-blue-400" size={28} />
          <span className="text-xl font-bold tracking-tight">ConcretePOA</span>
        </div>
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
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
            <Lock size={12} /> AI-Powered Legal Document Analysis
          </span>
        </motion.div>

        <motion.h1
          className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6"
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
        >
          Stop Getting Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            POA Rejected
          </span>
        </motion.h1>

        <motion.p
          className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
        >
          ConcretePOA uses AI to audit Power of Attorney documents against institutional banking requirements,
          diagnose rejections, and surface statutory drift — in seconds.
        </motion.p>

        <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial="hidden" animate="visible" variants={fadeUp} custom={3}>
          <SignUpButton mode="modal">
            <button className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-semibold text-lg shadow-lg shadow-blue-900/30">
              Analyze My POA — Free
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="px-8 py-3.5 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors font-semibold text-lg text-slate-300 hover:text-white">
              Sign In
            </button>
          </SignInButton>
        </motion.div>

        <motion.p className="mt-4 text-xs text-slate-500" initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          For informational purposes only — not a substitute for legal counsel.
        </motion.p>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="text-center p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50"
              initial="hidden" animate="visible" variants={fadeUp} custom={i + 5}
            >
              <div className="text-3xl font-bold text-blue-400">{s.value}</div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-4">Three modes. One verdict.</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Whether you're pre-submitting, handling a rejection, or checking state compliance, ConcretePOA has a dedicated AI mode.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/30 transition-colors"
              initial="hidden" animate="visible" variants={fadeUp} custom={i}
            >
              <f.icon className="text-blue-400 mb-4" size={28} />
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-500/20 p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to get your POA accepted?</h2>
          <p className="text-slate-400 mb-8">Upload your document and get an institutional audit in under 60 seconds.</p>
          <SignUpButton mode="modal">
            <button className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-semibold text-lg">
              Start Free Analysis
            </button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck size={16} className="text-blue-500" />
          <span className="font-medium text-slate-400">ConcretePOA</span>
        </div>
        <p>AI-assisted POA review tool. Outputs are informational only and not legal advice.</p>
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-slate-600">
          <CheckCircle2 size={12} /> No documents are stored on our servers.
        </div>
      </footer>
    </div>
  );
}
