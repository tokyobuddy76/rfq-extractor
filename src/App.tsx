/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { PdfUploader } from './components/PdfUploader';
import { AnalysisStatus } from './components/AnalysisStatus';
import { RfqReview } from './components/RfqReview';
import { Footer } from './components/Footer';
import type { RfqData, ExtractionMetadata } from './types/rfq';
import { fileToBase64 } from './utils/fileValidation';
import { normalizeExtractedRfq } from './utils/rfqValidation';
import { SAMPLE_PUMP_RFQ, SAMPLE_COMPRESSOR_RFQ } from './data/sampleRfqs';

export default function App() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyzing' | 'review' | 'approved'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisErrorCode, setAnalysisErrorCode] = useState<string | undefined>(undefined);

  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<ExtractionMetadata | null>(null);

  const [originalRfqData, setOriginalRfqData] = useState<RfqData | null>(null);
  const [currentRfqData, setCurrentRfqData] = useState<RfqData | null>(null);

  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [approvedAt, setApprovedAt] = useState<string | null>(null);
  const [approvedBy, setApprovedBy] = useState<string | null>(null);

  // Analyze RFQ via backend /api/analyze-rfq
  const handleAnalyzeFile = async (file: File) => {
    setActiveFile(file);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisErrorCode(undefined);
    setCurrentStep('analyzing');

    try {
      const base64Data = await fileToBase64(file);

      const response = await fetch('/api/analyze-rfq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64: base64Data,
          fileName: file.name,
          fileSizeBytes: file.size,
        }),
      });

      // Safely parse JSON or text to avoid JSON SyntaxError on serverless error pages
      let result: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = {
          error: `Server returned HTTP ${response.status}: ${text.slice(0, 180)}`,
          code: `HTTP_${response.status}`,
        };
      }

      if (!response.ok) {
        // Plain language error mapping as mandated by Sub-goal 3
        const code = result.code || `HTTP_${response.status}`;
        let userMessage = result.error || "We couldn't analyze this document. Please try again.";

        if (response.status === 503 || code === 'KEY_NOT_CONFIGURED') {
          userMessage = 'The Gemini API is not configured. Please configure GEMINI_API_KEY in Vercel environment variables (Settings > Environment Variables).';
        } else if (response.status === 422 || code === 'EMPTY_RESPONSE') {
          userMessage = 'The document was analyzed, but no RFQ information could be identified.';
        }

        setAnalysisError(userMessage);
        setAnalysisErrorCode(code);
        setIsAnalyzing(false);
        // Important: Never display fake or sample RFQ data when an API request fails.
        return;
      }

      if (!result.data) {
        setAnalysisError('The document was analyzed, but no RFQ information could be identified.');
        setAnalysisErrorCode('EMPTY_EXTRACTION');
        setIsAnalyzing(false);
        return;
      }

      // Normalize and initialize review status
      const normalizedData = normalizeExtractedRfq(result.data);

      setOriginalRfqData(JSON.parse(JSON.stringify(normalizedData)));
      setCurrentRfqData(normalizedData);
      setMetadata(result.metadata || null);
      setIsApproved(false);
      setApprovedAt(null);
      setApprovedBy(null);

      setIsAnalyzing(false);
      setCurrentStep('review');
    } catch (err: any) {
      console.error('Extraction error:', err);
      setAnalysisError("We couldn't analyze this document. Please try again.");
      setAnalysisErrorCode('NETWORK_OR_CLIENT_ERROR');
      setIsAnalyzing(false);
    }
  };

  // Instant sample loader for testing & demonstration
  const handleLoadSample = (sampleKey: 'pump' | 'compressor') => {
    const sample = sampleKey === 'pump' ? SAMPLE_PUMP_RFQ : SAMPLE_COMPRESSOR_RFQ;
    const sampleFileName = sampleKey === 'pump'
      ? 'RFQ_Warman_SlurryPump_Pilbara_PR0841.pdf'
      : 'RFQ_DresserRand_Compressor_Jurong_PR9932.pdf';

    setOriginalRfqData(JSON.parse(JSON.stringify(sample)));
    setCurrentRfqData(JSON.parse(JSON.stringify(sample)));
    setMetadata({
      fileName: sampleFileName,
      fileSizeBytes: 482910,
      extractedAt: new Date().toISOString(),
      modelUsed: 'gemini-3.8-flash',
      processingTimeMs: 1840,
    });
    setActiveFile(null);
    setIsApproved(false);
    setApprovedAt(null);
    setApprovedBy(null);
    setAnalysisError(null);
    setCurrentStep('review');
  };

  const handleUpdateRfqData = (newData: RfqData) => {
    setCurrentRfqData(newData);
    // If modifications are made after approval, revoke approval to ensure re-verification
    if (isApproved) {
      setIsApproved(false);
      setApprovedAt(null);
      setApprovedBy(null);
    }
  };

  const handleApprove = (approver: string) => {
    setIsApproved(true);
    setApprovedAt(new Date().toISOString());
    setApprovedBy(approver || 'Quotation Specialist');
    setCurrentStep('approved');
  };

  const handleRevokeApproval = () => {
    setIsApproved(false);
    setApprovedAt(null);
    setApprovedBy(null);
    setCurrentStep('review');
  };

  const handleResetToOriginal = () => {
    if (!originalRfqData) return;
    const confirmReset = window.confirm(
      'Are you sure you want to revert all manual edits and reset to the original Gemini extraction?'
    );
    if (confirmReset) {
      setCurrentRfqData(JSON.parse(JSON.stringify(originalRfqData)));
      setIsApproved(false);
      setApprovedAt(null);
      setApprovedBy(null);
    }
  };

  const handleResetToUpload = () => {
    setActiveFile(null);
    setOriginalRfqData(null);
    setCurrentRfqData(null);
    setMetadata(null);
    setIsApproved(false);
    setApprovedAt(null);
    setApprovedBy(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
    setCurrentStep('upload');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Application Header */}
      <Header
        currentStep={currentStep}
        onReset={currentStep !== 'upload' ? handleResetToUpload : undefined}
        fileName={metadata?.fileName || activeFile?.name}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Step 1: Upload View */}
        {currentStep === 'upload' && (
          <PdfUploader
            onAnalyze={handleAnalyzeFile}
            onLoadSample={handleLoadSample}
            isAnalyzing={isAnalyzing}
          />
        )}

        {/* Step 2: Analyzing / Error View */}
        {currentStep === 'analyzing' && (
          <AnalysisStatus
            isLoading={isAnalyzing}
            error={analysisError}
            errorCode={analysisErrorCode}
            fileName={activeFile?.name}
            fileSizeBytes={activeFile?.size}
            onRetry={() => activeFile && handleAnalyzeFile(activeFile)}
            onCancel={handleResetToUpload}
          />
        )}

        {/* Step 3 & 4: Review and Approval Views */}
        {(currentStep === 'review' || currentStep === 'approved') && currentRfqData && (
          <RfqReview
            currentData={currentRfqData}
            originalData={originalRfqData || currentRfqData}
            fileName={metadata?.fileName || activeFile?.name}
            isApproved={isApproved}
            approvedAt={approvedAt}
            approvedBy={approvedBy}
            onUpdateRfqData={handleUpdateRfqData}
            onApprove={handleApprove}
            onRevokeApproval={handleRevokeApproval}
            onResetToOriginal={handleResetToOriginal}
            onBackToUpload={handleResetToUpload}
          />
        )}
      </main>

      {/* Persistent Disclaimer & Powered By Footer */}
      <Footer />
    </div>
  );
}
