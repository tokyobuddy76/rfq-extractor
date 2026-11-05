import React from 'react';
import { FileText, Cpu, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface HeaderProps {
  currentStep: 'upload' | 'analyzing' | 'review' | 'approved';
  onReset?: () => void;
  fileName?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentStep, onReset, fileName }) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onReset}>
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold tracking-wider shadow-sm ring-1 ring-blue-400/40">
              <span className="text-sm font-black font-mono">SNIP</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">SNIP</span>
                <span className="text-[11px] bg-blue-900/80 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-700/60 hidden sm:inline-block">
                  Smart Navigation & Information Parsing
                </span>
              </div>
              <p className="text-xs text-blue-300/90 font-medium">
                SNIP it. Extract it. Excel it.
              </p>
            </div>
          </div>

          {/* Workflow Stepper */}
          <nav aria-label="Workflow Steps" className="hidden md:flex items-center space-x-2 text-xs font-medium">
            <span
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded ${
                currentStep === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
              <span>Upload PDF</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

            <span
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded ${
                currentStep === 'analyzing'
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'text-slate-400'
              }`}
            >
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
              <span>Analyze</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

            <span
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded ${
                currentStep === 'review'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400'
              }`}
            >
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
              <span>Review & Edit</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

            <span
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded ${
                currentStep === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400'
              }`}
            >
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">4</span>
              <span>Approve & Export</span>
            </span>
          </nav>

          {/* Action / Status */}
          <div className="flex items-center space-x-3">
            {fileName && (
              <div className="hidden lg:flex items-center space-x-1 text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                <span className="text-slate-400">File:</span>
                <span className="font-mono text-slate-200 truncate max-w-[150px]">{fileName}</span>
              </div>
            )}
            {currentStep !== 'upload' && onReset && (
              <button
                onClick={onReset}
                className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded font-medium border border-slate-700 transition-colors"
              >
                New RFQ
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
