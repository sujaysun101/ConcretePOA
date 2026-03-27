import React from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  Info,
  Download,
  Copy,
  ChevronRight,
  MessageSquareQuote,
  Lightbulb,
  Stethoscope
} from 'lucide-react';
import { RejectionDiagnosis } from '../types';
import { cn } from '../lib/utils';

interface RejectionDiagnosisResultProps {
  result: RejectionDiagnosis;
}

export const RejectionDiagnosisResult: React.FC<RejectionDiagnosisResultProps> = ({ result }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadRemediation = () => {
    const element = document.createElement("a");
    const file = new Blob([result.remediationText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `remediation_${result.bankName.toLowerCase().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      {/* Header Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Stethoscope className="w-48 h-48 text-zinc-900" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Rejection Diagnosis
            </div>
            <span className="text-zinc-300">•</span>
            <div className="text-zinc-500 text-sm font-medium">
              {new Date(result.timestamp).toLocaleDateString()}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-serif italic text-zinc-900">
              {result.bankName} Rejection Analysis
            </h1>
            <p className="text-zinc-500 max-w-2xl">
              We've cross-referenced your bank's rejection letter against your POA document to identify the specific friction point.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: The "Why" */}
        <div className="lg:col-span-2 space-y-8">
          {/* Rejection Breakdown */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-50 pb-4">
              <MessageSquareQuote className="w-5 h-5 text-zinc-900" />
              <h2 className="font-bold text-zinc-900">Legalese Translation</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">The Bank Said:</h3>
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-sm text-zinc-600 italic leading-relaxed">
                  "{result.rejectionReason}"
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">What it Means:</h3>
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-sm text-emerald-900 leading-relaxed font-medium">
                  {result.legaleseTranslation}
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Conflict Location in your POA:</h3>
              <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100 flex gap-4">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 leading-relaxed">
                  {result.poaConflictSection}
                </p>
              </div>
            </div>
          </div>

          {/* Action Plan */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-50 pb-4">
              <Lightbulb className="w-5 h-5 text-zinc-900" />
              <h2 className="font-bold text-zinc-900">Caregiver Action Plan</h2>
            </div>
            
            <div className="space-y-4">
              {[
                { step: '01', text: result.actionPlan.step1 },
                { step: '02', text: result.actionPlan.step2 },
                { step: '03', text: result.actionPlan.step3 }
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-4 rounded-2xl hover:bg-zinc-50 transition-colors group">
                  <span className="text-2xl font-serif italic text-zinc-200 group-hover:text-zinc-900 transition-colors">{item.step}</span>
                  <p className="text-sm text-zinc-600 leading-relaxed pt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Remediation */}
        <div className="space-y-8">
          <div className="bg-zinc-900 rounded-3xl p-8 text-white shadow-xl shadow-zinc-200 space-y-6 sticky top-8">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold">Concrete Fix</h2>
            </div>
            
            <p className="text-sm text-zinc-400 leading-relaxed">
              Use this specific language in your amendment or new POA to satisfy {result.bankName}'s internal policy.
            </p>

            <div className="bg-white/5 rounded-2xl p-4 font-mono text-xs text-zinc-300 leading-relaxed border border-white/10 relative group">
              {result.remediationText}
              <button 
                onClick={() => copyToClipboard(result.remediationText)}
                className="absolute top-2 right-2 p-2 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3 pt-4">
              <button 
                onClick={downloadRemediation}
                className="w-full py-4 bg-white text-zinc-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                Download Remediation
              </button>
              <p className="text-[10px] text-center text-zinc-500 font-mono uppercase tracking-widest">
                Tailored for {result.bankName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
