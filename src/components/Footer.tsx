import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-700">
            Document extraction powered by Mistral AI
          </span>
        </div>

        <div className="text-[11px] text-slate-400 max-w-xl">
          Mistral AI extracts information strictly based on the content of the provided document. All quotation details, pricing, part numbers, and quantities must be independently verified and approved by authorized personnel prior to commercial quotation.
        </div>
      </div>
    </footer>
  );
};
