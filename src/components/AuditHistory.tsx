import React, { useState } from 'react';
import { AuditResult } from '../types';
import { Search, Clock, Building2, User, ChevronRight, Trash2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface Props {
  history: AuditResult[];
  onSelect: (result: AuditResult) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const AuditHistory: React.FC<Props> = ({ history, onSelect, onDelete, onClearAll, searchQuery, onSearchChange }) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const filteredHistory = history.filter(item => 
    item.bankTarget.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.extractedData.principal.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.extractedData.agent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text"
            placeholder="Search by principal, agent, or bank..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all shadow-sm"
          />
        </div>
        {history.length > 0 && (
          <button 
            onClick={() => setShowConfirmClear(true)}
            className="flex items-center gap-2 px-6 py-4 text-rose-600 font-medium hover:bg-rose-50 rounded-2xl transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            Clear All History
          </button>
        )}
      </div>

      <AnimatePresence>
        {showConfirmClear && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <button onClick={() => setShowConfirmClear(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Clear Audit History?</h3>
              <p className="text-zinc-500 mb-8 leading-relaxed">
                This will permanently delete all {history.length} past audit records. This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowConfirmClear(false)}
                  className="px-6 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    onClearAll();
                    setShowConfirmClear(false);
                  }}
                  className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={item.id}
              className="group bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-900 transition-all cursor-pointer shadow-sm flex items-center justify-between"
              onClick={() => onSelect(item)}
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg",
                  item.acceptanceProbability >= 85 ? "bg-emerald-500/10 text-emerald-600" :
                  item.acceptanceProbability >= 50 ? "bg-amber-500/10 text-amber-600" :
                  "bg-rose-500/10 text-rose-600"
                )}>
                  {item.acceptanceProbability}%
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-sm font-bold text-zinc-900">{item.bankTarget}</span>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest ml-2">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      {item.extractedData.principal}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 opacity-30" />
                      <User className="w-3 h-3" />
                      {item.extractedData.agent}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="p-2 text-zinc-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 bg-zinc-100/50 rounded-3xl border border-dashed border-zinc-200">
            <Clock className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">No audits found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
