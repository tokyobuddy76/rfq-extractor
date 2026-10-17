import React from 'react';
import { Loader2, AlertCircle, RefreshCw, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

interface AnalysisStatusProps {
  isLoading: boolean;
  error: string | null;
  errorCode?: string;
  fileName?: string;
  fileSizeBytes?: number;
  onRetry: () => void;
  onCancel: () => void;
}

export const AnalysisStatus: React.FC<AnalysisStatusProps> = ({
  isLoading,
  error,
  errorCode,
  fileName,
  fileSizeBytes,
  onRetry,
  onCancel,
}) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-10 text-center space-y-6">
        {/* Animated spinner & badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            Analyzing RFQ Document
          </h2>
          <p className="text-sm text-slate-600 font-medium">
            Your RFQ is being analyzed. Large documents may take a little longer.
          </p>
          {fileName && (
            <p className="text-xs text-slate-400 font-mono pt-1">
              {fileName} {fileSizeBytes ? `(${formatFileSize(fileSizeBytes)})` : ''}
            </p>
          )}
        </div>

        {/* Step Breakdown */}
        <div className="bg-slate-50 rounded-lg p-4 text-left border border-slate-200 space-y-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium text-slate-800">PDF document validated & transferred</span>
          </div>
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
            <span className="text-slate-800">Reading RFQ tables, part numbers & equipment serials via Mistral AI</span>
          </div>
          <div className="flex items-center space-x-2 opacity-60">
            <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
              3
            </div>
            <span>Validating line item quantities and formatting quotation schema</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Document extraction powered by Mistral AI. Part numbers and drawing numbers are captured verbatim without alterations.
        </p>

        <div>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
          >
            Cancel and choose another document
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-red-200 p-8 sm:p-10 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            Analysis Failed
          </h2>
          <div className="text-xs text-red-700 font-medium max-w-lg mx-auto text-left bg-red-50/80 p-3.5 rounded-lg border border-red-200/80 whitespace-pre-line leading-relaxed">
            {error}
          </div>
          {errorCode && (
            <span className="inline-block text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 mt-1">
              Error code: {errorCode}
            </span>
          )}
        </div>

        {errorCode === 'KEY_NOT_CONFIGURED' ? (
          <div className="bg-blue-50 rounded-lg p-4 text-left border border-blue-200 text-xs text-blue-900 space-y-2">
            <p className="font-bold text-blue-950 flex items-center space-x-1.5">
              <span>How to configure MISTRAL_API_KEY in Vercel:</span>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-900 pl-1">
              <li>Open your project in the <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="underline font-semibold">Vercel Dashboard</a>.</li>
              <li>Go to <strong>Settings</strong> &gt; <strong>Environment Variables</strong>.</li>
              <li>Add a new variable with Key: <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-mono font-bold">MISTRAL_API_KEY</code> and your Mistral API key as Value.</li>
              <li>Select <strong>Production</strong>, <strong>Preview</strong>, and <strong>Development</strong>.</li>
              <li>Go to <strong>Deployments</strong> &gt; Click the <strong>...</strong> menu on your latest deployment &gt; select <strong>Redeploy</strong>.</li>
            </ol>
          </div>
        ) : (
          <div className="bg-amber-50 rounded-lg p-4 text-left border border-amber-200 text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Important:</p>
            <p>
              No fake or sample RFQ data is generated when analysis encounters an issue. Ensure your PDF has readable text (not a low-resolution photograph) and is not password protected.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg border border-slate-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Select Another PDF</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
