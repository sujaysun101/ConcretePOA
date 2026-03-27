import React, { useState } from 'react';
import { AuditResult } from '../types';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  ShieldAlert, 
  FileText, 
  ArrowRight, 
  FileSignature, 
  Calendar, 
  MapPin, 
  User,
  AlertTriangle,
  ClipboardCheck,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface Props {
  result: AuditResult;
}

export const AuditResults: React.FC<Props> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  const downloadAffidavit = () => {
    const element = document.createElement("a");
    const file = new Blob([result.remediationBlueprint.affidavitTemplate], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Affidavit_${result.extractedData.principal.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const copyFix = () => {
    navigator.clipboard.writeText(result.remediationBlueprint.concreteFix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-4xl mx-auto pb-20"
    >
      {/* Compliance Summary */}
      <section className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Compliance Summary</h2>
            <h3 className="text-3xl font-serif italic text-zinc-900">{result.bankTarget} Analysis</h3>
            <p className="text-xs text-zinc-400 mt-1 font-mono">Audit ID: {result.id} • {new Date(result.timestamp).toLocaleString()}</p>
          </div>
          <div className={cn("px-6 py-4 rounded-xl border flex flex-col items-center justify-center min-w-[160px]", getScoreBg(result.acceptanceProbability))}>
            <span className="text-xs font-mono uppercase tracking-tighter opacity-70">Acceptance Probability</span>
            <span className={cn("text-4xl font-mono font-bold", getScoreColor(result.acceptanceProbability))}>
              {result.acceptanceProbability}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Primary Red Flags
            </h4>
            <div className="space-y-3">
              {result.primaryRedFlags.map((flag, i) => {
                const isHighSeverity = flag.toLowerCase().includes('missing') || flag.toLowerCase().includes('invalid') || flag.toLowerCase().includes('expired');
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className={cn(
                      "text-sm p-4 rounded-xl border flex gap-4 items-start transition-all hover:shadow-md",
                      isHighSeverity 
                        ? "bg-rose-50 border-rose-200 text-rose-900 shadow-sm shadow-rose-100/50" 
                        : "bg-amber-50/50 border-amber-100 text-amber-900"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                      isHighSeverity ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {isHighSeverity ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-[10px] uppercase tracking-widest opacity-60">
                        {isHighSeverity ? 'Critical Risk' : 'Potential Friction'}
                      </p>
                      <p className="leading-relaxed font-medium">{flag}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 h-fit shadow-inner">
            <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Extracted Data Points
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6">
              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 group-hover:border-zinc-900 transition-colors">
                  <User className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-zinc-400 font-mono tracking-tighter">Principal</p>
                  <p className="text-sm font-bold text-zinc-900">{result.extractedData.principal}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 group-hover:border-zinc-900 transition-colors">
                  <User className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-zinc-400 font-mono tracking-tighter">Agent</p>
                  <p className="text-sm font-bold text-zinc-900">{result.extractedData.agent}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 group-hover:border-zinc-900 transition-colors">
                  <MapPin className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-zinc-400 font-mono tracking-tighter">Jurisdiction</p>
                  <p className="text-sm font-bold text-zinc-900">{result.extractedData.state}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 group-hover:border-zinc-900 transition-colors">
                  <Calendar className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-zinc-400 font-mono tracking-tighter">Execution Date</p>
                  <p className="text-sm font-bold text-zinc-900">{result.extractedData.date}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Audit Trail */}
      <section className="space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500 px-4">Detailed Audit Trail</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-500" />
                Clause Audit
              </h4>
            </div>
            <div className="divide-y divide-zinc-100">
              {result.clauseAudit.map((item, i) => (
                <div key={i} className={cn(
                  "flex gap-4 items-start p-5 transition-colors hover:bg-zinc-50",
                  i % 2 === 0 ? "bg-white" : "bg-zinc-50/30"
                )}>
                  <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5 border border-zinc-200">
                    <span className="text-[10px] font-mono font-bold text-zinc-500">{i + 1}</span>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-zinc-100 bg-emerald-50/30">
              <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                Execution Audit
              </h4>
            </div>
            <div className="divide-y divide-zinc-100">
              {result.executionAudit.map((item, i) => (
                <div key={i} className={cn(
                  "flex gap-4 items-start p-5 transition-colors hover:bg-emerald-50/30",
                  i % 2 === 0 ? "bg-white" : "bg-emerald-50/10"
                )}>
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Remediation Blueprint */}
      <section className="space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500 px-4">Remediation Blueprint</h2>
        <div className="bg-zinc-900 text-white rounded-2xl overflow-hidden shadow-xl">
          <div className="p-8 border-b border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Action 1: Immediate Fix</h4>
                  <p className="text-zinc-200 leading-relaxed text-sm">{result.remediationBlueprint.action1}</p>
                </div>
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Action 2: Documentation</h4>
                  <p className="text-zinc-200 leading-relaxed text-sm">{result.remediationBlueprint.action2}</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 relative group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400">The "Concrete Fix"</h4>
                  <button 
                    onClick={copyFix}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="bg-black/40 rounded-lg p-4 font-mono text-sm text-emerald-400 border border-emerald-500/20 leading-relaxed">
                  {result.remediationBlueprint.concreteFix}
                </div>
                <p className="text-[10px] text-zinc-500 mt-4 italic">
                  *Insert this precise legal block into your amendment or affidavit.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-zinc-800/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileSignature className="w-5 h-5 text-emerald-400" />
                <h4 className="text-lg font-serif italic">Generated Affidavit Template</h4>
              </div>
              <button 
                onClick={downloadAffidavit}
                className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-3 h-3" />
                Download .txt
              </button>
            </div>
            <div className="bg-black/60 rounded-xl p-6 font-mono text-xs text-zinc-300 leading-relaxed max-h-[400px] overflow-y-auto border border-white/5 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-zinc-700">
              {result.remediationBlueprint.affidavitTemplate}
            </div>
          </div>
        </div>
      </section>

      <div className="text-center px-8">
        <p className="text-[10px] text-zinc-400 uppercase tracking-widest leading-relaxed">
          ConcretePOA is an AI compliance tool, not an attorney. This analysis is for informational purposes only. 
          Consult with legal counsel for final document verification.
        </p>
      </div>
    </motion.div>
  );
};
