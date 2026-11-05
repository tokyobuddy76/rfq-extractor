import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, FileCheck, ArrowRight, Shield, Zap, Sparkles, Cpu } from 'lucide-react';
import { validatePdfFile, MAX_FILE_SIZE_LABEL } from '../utils/fileValidation';

export interface ModelOption {
  id: string;
  name: string;
  tag: string;
  tier: 'economy' | 'standard' | 'premium';
  description: string;
  priceIndicator: '$' | '$$' | '$$$' | '$$$$';
}

export const GEMINI_MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    tag: 'Cheapest & Fastest',
    tier: 'economy',
    description: 'Ultra-low cost ($0.075 / 1M tokens), high speed extraction for standard PDF tables and clean quotes',
    priceIndicator: '$',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash (Latest)',
    tag: 'Balanced Economy',
    tier: 'standard',
    description: 'High throughput, responsive extraction with strong multimodal OCR reasoning',
    priceIndicator: '$$',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: 'Advanced Precision',
    tier: 'standard',
    description: 'Enhanced document comprehension for dense schedules and multi-equipment inquiries',
    priceIndicator: '$$$',
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    tag: 'Highest Accuracy (Pro Tier)',
    tier: 'premium',
    description: 'Most powerful deep reasoning for intricate drawings, blurry scans, and ambiguous RFQs',
    priceIndicator: '$$$$',
  },
];

interface PdfUploaderProps {
  onAnalyze: (file: File, modelId?: string) => void;
  onLoadSample: (sampleKey: 'pump' | 'compressor') => void;
  isAnalyzing: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  onAnalyze,
  onLoadSample,
  isAnalyzing,
  selectedModel,
  onSelectModel,
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMsg(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const validation = validatePdfFile(file);
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'Invalid file.');
      setSelectedFile(null);
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setErrorMsg(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a PDF document before analyzing.');
      return;
    }
    onAnalyze(selectedFile, selectedModel);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Introduction Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full text-xs font-semibold text-blue-800 shadow-2xs">
          <span>Smart Navigation & Information Parsing</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          SNIP
        </h1>
        <p className="text-base sm:text-lg font-medium text-blue-600 tracking-wide">
          “SNIP it. Extract it. Excel it.”
        </p>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
          Upload industrial RFQ PDFs. Parse customer data, equipment schedules, drawing numbers, unit basic prices, and line items directly into verified quotation sheets.
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        {/* Model Selection Bar - ordered cheapest to most expensive */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Choose Gemini Extraction Model
              </label>
            </div>
            <span className="text-[11px] text-slate-500">
              Sorted from lowest cost to highest accuracy tier
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {GEMINI_MODEL_OPTIONS.map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectModel(m.id)}
                  className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                        {m.priceIndicator}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          m.tier === 'economy'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.tier === 'standard'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {m.tag}
                      </span>
                    </div>
                    <p className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                      {m.name}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                      {m.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2 border-t border-slate-100">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInput}
            className="hidden"
            id="rfq-pdf-input"
            disabled={isAnalyzing}
          />

          {!selectedFile ? (
            /* Dropzone when no file selected */
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/60'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-blue-100/70 text-blue-600 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Drag and drop your customer RFQ PDF here
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                or <span className="text-blue-600 font-medium hover:underline">browse files</span> from your device
              </p>
              <div className="flex items-center space-x-3 mt-4 text-xs text-slate-500">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-200/80 font-mono text-slate-700">
                  PDF format only
                </span>
                <span>•</span>
                <span>Max {MAX_FILE_SIZE_LABEL}</span>
              </div>
            </div>
          ) : (
            /* File selected view */
            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4 min-w-0 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {selectedFile.name}
                    </p>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded">
                      Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatFileSize(selectedFile.size)} • PDF Document
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={isAnalyzing}
                  className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                  <span>Remove & choose another</span>
                </button>
              </div>
            </div>
          )}

          {/* Validation Error Banner */}
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to process file</p>
                <p className="text-red-700 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Shield className="w-4 h-4 text-slate-400" />
              <span>
                Using <strong className="text-slate-700">{selectedModel}</strong> • Confidential server-side analysis
              </span>
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isAnalyzing}
              className={`w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold text-sm shadow-sm transition-all ${
                !selectedFile || isAnalyzing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-[0.99]'
              }`}
            >
              <span>Analyze RFQ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Preset Real-World Industrial RFQ Samples for Quick Testing */}
      <div className="bg-slate-100/80 rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Instant Test Samples
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Try realistic industrial RFQ structures immediately
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onLoadSample('pump')}
            disabled={isAnalyzing}
            className="text-left p-3.5 bg-white hover:bg-blue-50/50 rounded-lg border border-slate-200 hover:border-blue-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                Centrifugal Slurry Pump Spares RFQ
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                8 Line Items
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Customer: Global Mining Minerals Corp • S/N: WAR-8849-01 • Impellers, Volutes, Mechanical Seals
            </p>
          </button>

          <button
            type="button"
            onClick={() => onLoadSample('compressor')}
            disabled={isAnalyzing}
            className="text-left p-3.5 bg-white hover:bg-blue-50/50 rounded-lg border border-slate-200 hover:border-blue-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                Reciprocating Gas Compressor Spares RFQ
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                6 Line Items
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Customer: Apex Petrochemical Refining • S/N: DPC-4420-B • Piston Rings, Valve Plates, Bearings
            </p>
          </button>
        </div>
      </div>

      {/* Industrial Workflow Note */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="font-semibold text-slate-900 mb-1">1. Exact Identification</p>
          <p>Preserves punctuation, leading zeros, hyphens, and drawing numbers exactly as printed in the RFQ.</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="font-semibold text-slate-900 mb-1">2. Equipment Tag Association</p>
          <p>Links parts to specific equipment serial numbers and plant tags across multi-page schedules.</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="font-semibold text-slate-900 mb-1">3. Human-in-the-Loop Review</p>
          <p>Highlights missing fields and allows manual correction before quotation approval and export.</p>
        </div>
      </div>
    </div>
  );
};
