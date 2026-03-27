import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileUp, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  Building2, 
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  History,
  FileText,
  Settings2,
  PlusCircle,
  Info,
  Database,
  ExternalLink,
  Trash2,
  X,
  Eye,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuditResults } from './components/AuditResults';
import { AuditHistory } from './components/AuditHistory';
import { RejectionHistory } from './components/RejectionHistory';
import { JurisdictionHistory } from './components/JurisdictionHistory';
import { JurisdictionResults } from './components/JurisdictionResults';
import { RejectionDiagnosisResult } from './components/RejectionDiagnosisResult';
import { auditPOA, diagnoseRejection, trackJurisdictionalLaw } from './services/gemini';
import { AuditResult, Bank, BankRequirement, RejectionDiagnosis, JurisdictionResult } from './types';
import { cn } from './lib/utils';
import { BANK_REQUIREMENTS } from './constants';

const PREDEFINED_BANKS: Bank[] = ['Chase', 'Wells Fargo', 'Fidelity', 'Schwab', 'Vanguard', 'Bank of America'];

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [targetBank, setTargetBank] = useState<Bank | ''>('');
  const [customRules, setCustomRules] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [rejectionResult, setRejectionResult] = useState<RejectionDiagnosis | null>(null);
  const [jurisdictionResult, setJurisdictionResult] = useState<JurisdictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AuditResult[]>([]);
  const [rejectionHistory, setRejectionHistory] = useState<RejectionDiagnosis[]>([]);
  const [jurisdictionHistory, setJurisdictionHistory] = useState<JurisdictionResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [auditMode, setAuditMode] = useState<'audit' | 'diagnosis' | 'jurisdiction'>('audit');
  const [rejectionFile, setRejectionFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Custom Banks State
  const [customBanks, setCustomBanks] = useState<BankRequirement[]>([]);
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBank, setNewBank] = useState<BankRequirement>({
    bank: '',
    clauses: [],
    formatting: [],
    ageLimitations: '',
    highFrictionRules: []
  });

  // Load history and custom banks from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('concrete_poa_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }

    const savedRejectionHistory = localStorage.getItem('concrete_poa_rejection_history');
    if (savedRejectionHistory) {
      try {
        setRejectionHistory(JSON.parse(savedRejectionHistory));
      } catch (e) {
        console.error('Failed to parse rejection history', e);
      }
    }

    const savedJurisdictionHistory = localStorage.getItem('concrete_poa_jurisdiction_history');
    if (savedJurisdictionHistory) {
      try {
        setJurisdictionHistory(JSON.parse(savedJurisdictionHistory));
      } catch (e) {
        console.error('Failed to parse jurisdiction history', e);
      }
    }

    const savedBanks = localStorage.getItem('concrete_poa_custom_banks');
    if (savedBanks) {
      try {
        setCustomBanks(JSON.parse(savedBanks));
      } catch (e) {
        console.error('Failed to parse custom banks', e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('concrete_poa_history', JSON.stringify(history));
  }, [history]);

  // Save rejection history to localStorage
  useEffect(() => {
    localStorage.setItem('concrete_poa_rejection_history', JSON.stringify(rejectionHistory));
  }, [rejectionHistory]);

  // Save jurisdiction history to localStorage
  useEffect(() => {
    localStorage.setItem('concrete_poa_jurisdiction_history', JSON.stringify(jurisdictionHistory));
  }, [jurisdictionHistory]);

  // Save custom banks to localStorage
  useEffect(() => {
    localStorage.setItem('concrete_poa_custom_banks', JSON.stringify(customBanks));
  }, [customBanks]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setError(null);
      
      // Create preview URL
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: false
  });

  const handleAudit = async () => {
    if (!file || (auditMode === 'audit' && !targetBank) || (auditMode === 'diagnosis' && !rejectionFile)) return;

    setIsAuditing(true);
    setAuditProgress(10);
    setProgressText(
      auditMode === 'audit' ? 'Initializing OCR Engine...' : 
      auditMode === 'diagnosis' ? 'Analyzing Rejection Logic...' : 
      'Tracking Statutory Drift...'
    );
    setError(null);

    try {
      const readFile = (f: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });
      };

      const poaBase64 = await readFile(file);
      setAuditProgress(30);
      setProgressText('Extracting Document Logic...');

      if (auditMode === 'audit') {
        setAuditProgress(50);
        setProgressText(`Matching against ${targetBank} Compliance Matrix...`);
        const auditResult = await auditPOA(poaBase64, file.type, targetBank as Bank, customRules);
        setAuditProgress(90);
        setProgressText('Generating Remediation Blueprint...');
        
        setTimeout(() => {
          setResult(auditResult);
          setHistory(prev => [auditResult, ...prev]);
          setAuditProgress(100);
          setIsAuditing(false);
        }, 800);
      } else if (auditMode === 'diagnosis' && rejectionFile) {
        setAuditProgress(50);
        setProgressText('Cross-referencing Rejection Letter...');
        const rejectionBase64 = await readFile(rejectionFile);
        const diagnosis = await diagnoseRejection(poaBase64, file.type, rejectionBase64, rejectionFile.type);
        setAuditProgress(90);
        setProgressText('Translating Legalese...');
        
        setTimeout(() => {
          setRejectionResult(diagnosis);
          setRejectionHistory(prev => [diagnosis, ...prev]);
          setAuditProgress(100);
          setIsAuditing(false);
        }, 800);
      } else if (auditMode === 'jurisdiction') {
        setAuditProgress(50);
        setProgressText('Comparing against 2026 Statutory Mandates...');
        const jurisdictionRes = await trackJurisdictionalLaw(poaBase64, file.type);
        setAuditProgress(90);
        setProgressText('Identifying Statutory Drift...');
        
        setTimeout(() => {
          setJurisdictionResult(jurisdictionRes);
          setJurisdictionHistory(prev => [jurisdictionRes, ...prev]);
          setAuditProgress(100);
          setIsAuditing(false);
        }, 800);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze document. Please ensure the file is clear and readable.');
      setIsAuditing(false);
      setAuditProgress(0);
    }
  };

  const deleteAudit = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('concrete_poa_history');
  };

  const handleAddBank = () => {
    if (!newBank.bank.trim()) {
      setError('Bank name is required.');
      return;
    }
    
    // Simple validation for age limitations format (e.g., "5 years", "60 months")
    if (newBank.ageLimitations && !/^\d+\s+\w+/.test(newBank.ageLimitations)) {
      setError('Age limitations should follow a format like "5 years" or "60 months".');
      return;
    }

    setCustomBanks(prev => [...prev, newBank]);
    setNewBank({
      bank: '',
      clauses: [],
      formatting: [],
      ageLimitations: '',
      highFrictionRules: []
    });
    setIsAddingBank(false);
    setError(null);
  };

  const deleteCustomBank = (bankName: string) => {
    setCustomBanks(prev => prev.filter(b => b.bank !== bankName));
  };

  const reset = () => {
    setFile(null);
    setRejectionFile(null);
    setTargetBank('');
    setCustomRules('');
    setResult(null);
    setRejectionResult(null);
    setJurisdictionResult(null);
    setError(null);
    setShowHistory(false);
    setShowDatabase(false);
  };

  const allBankRequirements = [...BANK_REQUIREMENTS, ...customBanks];
  const filteredRequirements = allBankRequirements.filter(req => 
    req.bank.toLowerCase().includes(dbSearchQuery.toLowerCase())
  );

  const availableBanks = [...PREDEFINED_BANKS, ...customBanks.map(b => b.bank), 'Other'];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">ConcretePOA</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setShowHistory(!showHistory);
                setShowDatabase(false);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                showHistory ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
              )}
            >
              <History className="w-4 h-4" />
              Audit History
            </button>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-500 ml-4">
              <button 
                onClick={() => {
                  setShowDatabase(!showDatabase);
                  setShowHistory(false);
                }}
                className={cn("hover:text-zinc-900 transition-colors flex items-center gap-2", showDatabase ? "text-zinc-900" : "")}
              >
                <Database className="w-4 h-4" />
                Bank Database
              </button>
              <a href="#" className="bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-all">
                Enterprise Access
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {showDatabase ? (
            <motion.div
              key="database"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-serif italic text-zinc-900">Institutional Compliance Matrix</h1>
                  <p className="text-zinc-500 text-sm mt-1">Direct access to high-friction rules for major financial institutions.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="text"
                      placeholder="Search banks..."
                      value={dbSearchQuery}
                      onChange={(e) => setDbSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all w-64"
                    />
                  </div>
                  <button 
                    onClick={() => setIsAddingBank(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Custom Bank
                  </button>
                </div>
              </div>

              {isAddingBank && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-zinc-900 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <button onClick={() => setIsAddingBank(false)} className="text-zinc-500 hover:text-white transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <h3 className="text-xl font-serif italic mb-6">New Institutional Profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1.5">Bank Name</label>
                        <input 
                          type="text"
                          value={newBank.bank}
                          onChange={(e) => setNewBank({...newBank, bank: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-all"
                          placeholder="e.g. Credit Suisse"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1.5">Age Limitations</label>
                        <input 
                          type="text"
                          value={newBank.ageLimitations}
                          onChange={(e) => setNewBank({...newBank, ageLimitations: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-all"
                          placeholder="e.g. Max 5 years"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1.5">High-Friction Rules (One per line)</label>
                        <textarea 
                          value={newBank.highFrictionRules.join('\n')}
                          onChange={(e) => setNewBank({...newBank, highFrictionRules: e.target.value.split('\n').filter(l => l.trim())})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-all min-h-[120px]"
                          placeholder="e.g. Requires specific durability clause..."
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end gap-4">
                    <button 
                      onClick={() => setIsAddingBank(false)}
                      className="px-6 py-2 text-zinc-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAddBank}
                      className="px-8 py-2 bg-white text-zinc-900 rounded-full font-bold hover:bg-zinc-100 transition-colors"
                    >
                      Save Profile
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredRequirements.map((req) => (
                  <div key={req.bank} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:border-zinc-400 transition-all group relative">
                    {customBanks.some(b => b.bank === req.bank) && (
                      <button 
                        onClick={() => deleteCustomBank(req.bank)}
                        className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-zinc-900" />
                        </div>
                        <h3 className="text-lg font-bold">{req.bank}</h3>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                        {customBanks.some(b => b.bank === req.bank) ? 'Custom' : 'Verified 2026'}
                      </span>
                    </div>
                    
                    <div className="space-y-6">
                      {req.clauses.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">Mandatory Clauses</h4>
                          <div className="flex flex-wrap gap-2">
                            {req.clauses.map(c => (
                              <span key={c} className="px-2 py-1 bg-zinc-50 text-zinc-600 rounded border border-zinc-100 text-[11px]">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">High-Friction Rules</h4>
                        <ul className="space-y-2">
                          {req.highFrictionRules.map(rule => (
                            <li key={rule} className="text-xs text-zinc-600 flex gap-2">
                              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                              {rule}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-4 border-t border-zinc-50 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span>Age Limit: {req.ageLimitations}</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : showHistory ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-serif italic text-zinc-900">Audit & Diagnosis History</h1>
                  <p className="text-zinc-500 text-sm mt-1">Review your past POA compliance audits and rejection diagnoses.</p>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors"
                >
                  New Session
                </button>
              </div>

              <div className="space-y-16">
                <div className="space-y-6">
                  <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Compliance Audits
                  </h3>
                  <AuditHistory 
                    history={history} 
                    onSelect={(res) => {
                      setResult(res);
                      setShowHistory(false);
                      setAuditMode('audit');
                    }}
                    onDelete={deleteAudit}
                    onClearAll={clearAllHistory}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Rejection Diagnoses
                  </h3>
                  <RejectionHistory 
                    history={rejectionHistory}
                    onSelect={(res) => {
                      setRejectionResult(res);
                      setShowHistory(false);
                      setAuditMode('diagnosis');
                    }}
                    onDelete={(id) => setRejectionHistory(prev => prev.filter(h => h.id !== id))}
                    onClearAll={() => setRejectionHistory([])}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Statutory Checks
                  </h3>
                  <JurisdictionHistory 
                    history={jurisdictionHistory}
                    onSelect={(res) => {
                      setJurisdictionResult(res);
                      setShowHistory(false);
                      setAuditMode('jurisdiction');
                    }}
                    onDelete={(id) => setJurisdictionHistory(prev => prev.filter(h => h.id !== id))}
                    onClearAll={() => setJurisdictionHistory([])}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                </div>
              </div>
            </motion.div>
          ) : !result && !rejectionResult && !jurisdictionResult ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-12"
            >
              <div className="text-center space-y-4">
                <h1 className="text-5xl font-serif italic text-zinc-900">ConcretePOA.</h1>
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button 
                    onClick={() => setAuditMode('audit')}
                    className={cn(
                      "px-6 py-2 rounded-full text-sm font-bold transition-all",
                      auditMode === 'audit' ? "bg-zinc-900 text-white shadow-lg" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    )}
                  >
                    Compliance Audit
                  </button>
                  <button 
                    onClick={() => setAuditMode('diagnosis')}
                    className={cn(
                      "px-6 py-2 rounded-full text-sm font-bold transition-all",
                      auditMode === 'diagnosis' ? "bg-zinc-900 text-white shadow-lg" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    )}
                  >
                    Rejection Diagnosis
                  </button>
                  <button 
                    onClick={() => setAuditMode('jurisdiction')}
                    className={cn(
                      "px-6 py-2 rounded-full text-sm font-bold transition-all",
                      auditMode === 'jurisdiction' ? "bg-zinc-900 text-white shadow-lg" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    )}
                  >
                    Law Tracker
                  </button>
                </div>
                <p className="text-zinc-500 text-lg max-w-lg mx-auto leading-relaxed mt-4">
                  {auditMode === 'audit' 
                    ? 'Identify "Friction Points" before submission to major financial institutions.'
                    : auditMode === 'diagnosis'
                    ? 'Translate bank rejection letters into actionable remediation steps.'
                    : 'Compare against 2026 statutory mandates to identify legal obsolescence.'}
                </p>
              </div>

              <div className="space-y-8">
                {/* Step 1: Upload POA */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs flex items-center justify-center font-mono">01</span>
                    <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500">Upload POA Document</h2>
                  </div>
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer group",
                      isDragActive ? "border-zinc-900 bg-zinc-100" : "border-zinc-200 hover:border-zinc-400 bg-white",
                      file ? "border-emerald-500/50 bg-emerald-50/10" : ""
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-4">
                      <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                        file ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400"
                      )}>
                        {file ? <CheckCircle2 className="w-8 h-8" /> : <FileUp className="w-8 h-8" />}
                      </div>
                      <div className="flex flex-col items-center">
                        {file ? (
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-emerald-600 font-medium">{file.name}</p>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowPreview(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold hover:bg-emerald-200 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              Preview Document
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-zinc-900 font-medium">Drop your POA document here</p>
                            <p className="text-zinc-400 text-sm mt-1">PDF, PNG, or JPG (Max 10MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {auditMode === 'diagnosis' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs flex items-center justify-center font-mono">02</span>
                      <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500">Upload Rejection Letter</h2>
                    </div>
                    <div 
                      className={cn(
                        "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer group",
                        rejectionFile ? "border-emerald-500/50 bg-emerald-50/10" : "border-zinc-200 hover:border-zinc-400 bg-white"
                      )}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,image/*';
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files;
                          if (files && files.length > 0) {
                            setRejectionFile(files[0]);
                          }
                        };
                        input.click();
                      }}
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                          rejectionFile ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400"
                        )}>
                          {rejectionFile ? <CheckCircle2 className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                        </div>
                        <div>
                          {rejectionFile ? (
                            <p className="text-emerald-600 font-medium">{rejectionFile.name}</p>
                          ) : (
                            <>
                              <p className="text-zinc-900 font-medium">Drop the Rejection Letter here</p>
                              <p className="text-zinc-400 text-sm mt-1">PDF, PNG, or JPG (Max 10MB)</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview Modal */}
                <AnimatePresence>
                  {showPreview && previewUrl && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/80 backdrop-blur-sm"
                    >
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-zinc-900" />
                            <h3 className="font-bold text-zinc-900">{file?.name}</h3>
                          </div>
                          <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-zinc-400" />
                          </button>
                        </div>
                        <div className="flex-1 bg-zinc-100 p-6 overflow-auto flex items-center justify-center">
                          {file?.type === 'application/pdf' ? (
                            <iframe src={previewUrl} className="w-full h-full rounded-xl shadow-lg border border-zinc-200" />
                          ) : (
                            <img src={previewUrl} alt="POA Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
                          )}
                        </div>
                        <div className="p-6 border-t border-zinc-100 flex justify-end">
                          <button 
                            onClick={() => setShowPreview(false)}
                            className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
                          >
                            Close Preview
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Step 2: Select Bank (Only for Audit) */}
                {auditMode === 'audit' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs flex items-center justify-center font-mono">02</span>
                      <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500">Target Institution</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {availableBanks.map((bank) => (
                        <button
                          key={bank}
                          onClick={() => setTargetBank(bank)}
                          className={cn(
                            "px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center justify-between group",
                            targetBank === bank 
                              ? "bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-200" 
                              : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                          )}
                        >
                          {bank}
                          <Building2 className={cn("w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity", targetBank === bank ? "opacity-100" : "")} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Custom Rules (Optional, Only for Audit) */}
                {auditMode === 'audit' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs flex items-center justify-center font-mono">03</span>
                      <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500">Custom Compliance Rules (Optional)</h2>
                    </div>
                    <div className="relative">
                      <Settings2 className="absolute left-4 top-4 w-5 h-5 text-zinc-400" />
                      <textarea 
                        placeholder="Input custom bank-specific requirements or internal policy notes..."
                        value={customRules}
                        onChange={(e) => setCustomRules(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all shadow-sm min-h-[120px] text-sm"
                      />
                      <div className="absolute right-4 bottom-4 flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono uppercase">
                        <Info className="w-3 h-3" />
                        Specific to your institution
                      </div>
                    </div>
                  </div>
                )}

                {/* Action */}
                <div className="pt-8 space-y-6">
                  {isAuditing && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono text-zinc-500 uppercase tracking-widest">
                        <span>{progressText}</span>
                        <span>{auditProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${auditProgress}%` }}
                          className="h-full bg-zinc-900"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    disabled={!file || (auditMode === 'audit' && !targetBank) || (auditMode === 'diagnosis' && !rejectionFile) || isAuditing}
                    onClick={handleAudit}
                    className={cn(
                      "w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all",
                      (!file || (auditMode === 'audit' && !targetBank) || (auditMode === 'diagnosis' && !rejectionFile) || isAuditing)
                        ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                        : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-xl shadow-zinc-200 active:scale-[0.98]"
                    )}
                  >
                    {isAuditing ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        {auditMode === 'audit' ? 'Analyzing Compliance...' : auditMode === 'diagnosis' ? 'Diagnosing Rejection...' : 'Checking Statutory Mandates...'}
                      </>
                    ) : (
                      <>
                        {auditMode === 'audit' ? 'Run Compliance Audit' : auditMode === 'diagnosis' ? 'Run Rejection Diagnosis' : 'Run Statutory Check'}
                        <ChevronRight className="w-6 h-6" />
                      </>
                    )}
                  </button>
                  
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-sm"
                    >
                      <XCircle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-zinc-200">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                      <Search className="w-5 h-5 text-zinc-900" />
                    </div>
                    <h3 className="text-sm font-semibold">OCR-to-Logic</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">Deep parsing of jurisdictional nexus and authority granularity.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-zinc-900" />
                    </div>
                    <h3 className="text-sm font-semibold">Bank-Specific Filter</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">Audited against Chase, Fidelity, and BofA internal manuals.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-zinc-900" />
                    </div>
                    <h3 className="text-sm font-semibold">Remediation Blueprint</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">Get the exact legal block of text needed for a successful fix.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div key="results" className="space-y-8">
              <button 
                onClick={reset}
                className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Back to {auditMode === 'audit' ? 'Audit' : auditMode === 'diagnosis' ? 'Diagnosis' : 'Law Tracker'}
              </button>
              {result && <AuditResults result={result} />}
              {rejectionResult && <RejectionDiagnosisResult result={rejectionResult} />}
              {jurisdictionResult && <JurisdictionResults result={jurisdictionResult} />}
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ConcretePOA</span>
          </div>
          <p className="text-zinc-400 text-sm">
            &copy; 2026 Concrete Compliance Technologies. All rights reserved.
          </p>
          <div className="flex gap-8 text-sm font-medium text-zinc-400">
            <a href="#" className="hover:text-zinc-900">Privacy</a>
            <a href="#" className="hover:text-zinc-900">Terms</a>
            <a href="#" className="hover:text-zinc-900">Legal Disclaimer</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
