import React from 'react';
import { 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Trash2,
  Search,
  FileText
} from 'lucide-react';
import { JurisdictionResult } from '../types';
import { cn } from '../lib/utils';

interface JurisdictionHistoryProps {
  history: JurisdictionResult[];
  onSelect: (result: JurisdictionResult) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function JurisdictionHistory({ 
  history, 
  onSelect, 
  onDelete, 
  onClearAll,
  searchQuery,
  onSearchChange
}: JurisdictionHistoryProps) {
  const filteredHistory = history.filter(item => 
    item.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.statutoryDrift.some(drift => 
      drift.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drift.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (history.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-zinc-200 rounded-2xl">
        <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-6 h-6 text-zinc-400" />
        </div>
        <h3 className="text-zinc-900 font-medium">No statutory checks yet</h3>
        <p className="text-zinc-500 text-sm mt-1">Your jurisdictional law tracking history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text"
            placeholder="Search by state or drift details..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
          />
        </div>
        <button 
          onClick={onClearAll}
          className="text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-rose-500 transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-3 h-3" />
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredHistory.map((item) => (
          <div 
            key={item.id}
            className="group bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-400 transition-all cursor-pointer relative"
            onClick={() => onSelect(item)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  item.overallComplianceScore >= 80 ? "bg-emerald-50 text-emerald-600" : 
                  item.overallComplianceScore >= 50 ? "bg-amber-50 text-amber-600" : 
                  "bg-rose-50 text-rose-600"
                )}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900">{item.state} Statutory Check</h4>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleDateString()}
                    <span className="mx-1">•</span>
                    <span>Score: {item.overallComplianceScore}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="p-2 text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className={cn(
                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
                item.cautionSectionVerbatim.status === 'compliant' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}>
                {item.cautionSectionVerbatim.status === 'compliant' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                Caution Section
              </div>
              <div className={cn(
                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
                item.agentSignaturePage.status === 'compliant' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}>
                {item.agentSignaturePage.status === 'compliant' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                Agent Signature
              </div>
              {item.statutoryDrift.length > 0 && (
                <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {item.statutoryDrift.length} Drift Issues
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredHistory.length === 0 && history.length > 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-500">No results match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
