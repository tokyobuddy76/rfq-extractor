import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  FileCheck,
} from 'lucide-react';
import type { RfqData } from '../types/rfq';
import { exportRfqToExcel } from '../utils/excelExport';

interface ExportActionsProps {
  rfqData: RfqData;
  isApproved: boolean;
  onApprove: (approverName: string) => void;
  onRevokeApproval: () => void;
  approvedAt: string | null;
  approvedBy: string | null;
}

export const ExportActions: React.FC<ExportActionsProps> = ({
  rfqData,
  isApproved,
  onApprove,
  onRevokeApproval,
  approvedAt,
  approvedBy,
}) => {
  const [approverName, setApproverName] = useState('Quotation Engineer');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [googleSheetsMessage, setGoogleSheetsMessage] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const handleDownloadExcel = () => {
    try {
      const filename = exportRfqToExcel(rfqData);
      setDownloadSuccessMessage(`Excel workbook generated: ${filename}`);
      setTimeout(() => setDownloadSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error('Excel generation error:', err);
      alert('Failed to generate Excel workbook: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleGoogleSheetsExport = () => {
    // Specific requirement from sub-goal 5:
    // If Google Sheets authentication has not yet been configured, do not fake the export.
    // Show: "Google Sheets integration is not configured yet. Download as Excel instead."
    setGoogleSheetsMessage('Google Sheets integration is not configured yet. Download as Excel instead.');
  };

  const formattedApprovalDate = approvedAt
    ? new Date(approvedAt).toLocaleString()
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Approval Card */}
      {!isApproved ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                Human-in-the-Loop RFQ Verification & Approval
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Machine-extracted quotation data must be verified by quotation or customer service personnel. Please verify that part numbers, quantities, equipment serial numbers, and commercial terms are accurate before approving for export.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-slate-200">
            <div className="flex items-center space-x-2">
              <input
                id="verify-checkbox"
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="verify-checkbox" className="text-xs font-medium text-slate-700 cursor-pointer">
                I have reviewed all extracted part numbers, equipment tags, and line item quantities.
              </label>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <input
                type="text"
                placeholder="Approver name / initials"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 w-44"
              />
              <button
                type="button"
                disabled={!agreedTerms}
                onClick={() => onApprove(approverName)}
                className={`inline-flex items-center space-x-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                  agreedTerms
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Approve RFQ</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-emerald-900">RFQ Approved for Quotation Export</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-semibold px-2 py-0.5 rounded">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                Approved by <span className="font-semibold">{approvedBy}</span> on {formattedApprovalDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRevokeApproval}
            className="text-xs text-emerald-800 hover:text-emerald-900 underline font-medium"
          >
            Reopen for edits
          </button>
        </div>
      )}

      {/* Export Options (Active when approved) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Export Options
          </h4>
          {!isApproved && (
            <span className="text-xs text-amber-600 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Approval required before exporting</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Download Excel */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isApproved
                ? 'bg-white border-slate-300 hover:border-blue-400 hover:shadow-xs'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Microsoft Excel (.xlsx)</h5>
                  <p className="text-[11px] text-slate-500">
                    2 sheets: RFQ Summary & Line Items table
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Standard quotation workbook formatted with columns for part numbers, drawings, quantities, materials, and equipment serial numbers.
            </p>

            <button
              type="button"
              disabled={!isApproved}
              onClick={handleDownloadExcel}
              className={`mt-4 w-full inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                isApproved
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Download Excel</span>
            </button>
          </div>

          {/* Export to Google Sheets */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isApproved
                ? 'bg-white border-slate-300 hover:border-emerald-400 hover:shadow-xs'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Google Sheets</h5>
                  <p className="text-[11px] text-slate-500">
                    Direct workspace spreadsheet export
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Export quotation lines directly into a collaborative Google Sheets file for sales and customer service teams.
            </p>

            <button
              type="button"
              disabled={!isApproved}
              onClick={handleGoogleSheetsExport}
              className={`mt-4 w-full inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                isApproved
                  ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Export to Google Sheets</span>
            </button>
          </div>
        </div>

        {/* Google Sheets Feedback Banner */}
        {googleSheetsMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{googleSheetsMessage}</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                The Google Sheets API endpoint and OAuth flow are structured modularly and can be attached anytime. Please download the `.xlsx` file above for immediate quotation processing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGoogleSheetsMessage(null)}
              className="text-amber-600 hover:text-amber-800 text-xs font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Download Feedback Banner */}
        {downloadSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{downloadSuccessMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
