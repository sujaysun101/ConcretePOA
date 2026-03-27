import React from 'react';
import { JurisdictionResult } from '../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  FileText, 
  Scale,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface Props {
  result: JurisdictionResult;
}

export const JurisdictionResults: React.FC<Props> = ({ result }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'non-compliant': return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'missing': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-rose-500/10 text-rose-600 border-rose-200';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      default: return 'bg-zinc-500/10 text-zinc-600 border-zinc-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header Summary */}
      <div className="bg-white border border-zinc-200 rounded-[32px] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs uppercase tracking-widest">
              <Scale className="w-4 h-4" />
              Jurisdictional Law Tracker
            </div>
            <h2 className="text-4xl font-serif italic text-zinc-900">
              {result.state} Statutory Audit <span className="text-zinc-400 not-italic">({result.statutoryYear})</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-mono text-zinc-400 uppercase">Compliance Score</div>
              <div className={cn(
                "text-5xl font-mono font-bold",
                result.overallComplianceScore >= 85 ? "text-emerald-500" :
                result.overallComplianceScore >= 50 ? "text-amber-500" : "text-rose-500"
              )}>
                {result.overallComplianceScore}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Caution Section */}
        <div className="bg-white border border-zinc-200 rounded-[32px] p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-zinc-400" />
              Caution to Principal
            </h3>
            {getStatusIcon(result.cautionSectionVerbatim.status)}
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <div className="text-[10px] font-mono text-zinc-400 uppercase mb-2">Statutory Drift Analysis</div>
              <p className="text-sm text-zinc-600 leading-relaxed italic">
                "{result.cautionSectionVerbatim.driftDetails}"
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-mono text-zinc-400 uppercase">Required Verbatim Language</div>
              <div className="text-xs text-zinc-500 bg-white border border-zinc-100 p-3 rounded-xl max-h-32 overflow-y-auto font-mono">
                {result.cautionSectionVerbatim.requiredText}
              </div>
            </div>
          </div>
        </div>

        {/* Agent Signature Page */}
        <div className="bg-white border border-zinc-200 rounded-[32px] p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-zinc-400" />
              Agent's Signature Page
            </h3>
            {getStatusIcon(result.agentSignaturePage.status)}
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <div className="text-[10px] font-mono text-zinc-400 uppercase mb-2">Compliance Requirements</div>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {result.agentSignaturePage.requirements}
              </p>
            </div>

            <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
              <div className="text-[10px] font-mono text-rose-400 uppercase mb-2">Drift Identified</div>
              <p className="text-sm text-rose-700 leading-relaxed">
                {result.agentSignaturePage.driftDetails}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Drift Timeline/List */}
      <div className="bg-zinc-900 text-white rounded-[32px] p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Statutory Drift Log</h3>
            <p className="text-zinc-400 text-sm">Legislative updates affecting this document's validity.</p>
          </div>
        </div>

        <div className="space-y-4">
          {result.statutoryDrift.map((drift, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-mono uppercase px-2 py-0.5 rounded border",
                      getSeverityColor(drift.severity)
                    )}>
                      {drift.severity} Risk
                    </span>
                    <h4 className="font-bold text-lg">{drift.title}</h4>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {drift.description}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <div className="text-xs">
                  <span className="text-zinc-500 uppercase font-mono mr-2">Remediation:</span>
                  <span className="text-amber-400">{drift.remediation}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action CTA */}
      <div className="flex justify-center pt-8">
        <button className="group flex items-center gap-3 px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/20">
          Generate 2026 Compliant Amendment
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
