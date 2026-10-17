import React, { useState } from 'react';
import { ShieldCheck, Plus, X, Info, FileCheck, Truck, Package, Award } from 'lucide-react';
import type { Requirements } from '../types/rfq';

interface AdditionalInformationProps {
  requirements: Requirements;
  additionalInformation: string[];
  reviewFlags: string[];
  onUpdateRequirements: (category: keyof Requirements, list: string[]) => void;
  onUpdateAdditionalInfo: (list: string[]) => void;
}

export const AdditionalInformation: React.FC<AdditionalInformationProps> = ({
  requirements,
  additionalInformation,
  reviewFlags,
  onUpdateRequirements,
  onUpdateAdditionalInfo,
}) => {
  const [newInputCategory, setNewInputCategory] = useState<keyof Requirements | 'other' | null>(null);
  const [newInputValue, setNewInputValue] = useState('');

  const handleAddItem = (category: keyof Requirements | 'other') => {
    if (!newInputValue.trim()) return;

    if (category === 'other') {
      onUpdateAdditionalInfo([...additionalInformation, newInputValue.trim()]);
    } else {
      const current = requirements[category] || [];
      onUpdateRequirements(category, [...current, newInputValue.trim()]);
    }

    setNewInputValue('');
    setNewInputCategory(null);
  };

  const handleRemoveItem = (category: keyof Requirements | 'other', index: number) => {
    if (category === 'other') {
      const updated = additionalInformation.filter((_, i) => i !== index);
      onUpdateAdditionalInfo(updated);
    } else {
      const current = requirements[category] || [];
      const updated = current.filter((_, i) => i !== index);
      onUpdateRequirements(category, updated);
    }
  };

  const sections: {
    key: keyof Requirements;
    title: string;
    icon: React.ReactNode;
    placeholder: string;
    color: string;
  }[] = [
    {
      key: 'certifications',
      title: 'Required Certifications',
      icon: <Award className="w-3.5 h-3.5 text-blue-600" />,
      placeholder: 'e.g. EN 10204 3.1 Material Test Certificate, ISO 9001',
      color: 'blue',
    },
    {
      key: 'technical',
      title: 'Technical Requirements',
      icon: <FileCheck className="w-3.5 h-3.5 text-indigo-600" />,
      placeholder: 'e.g. Hydrostatic pressure test at 1.5x working pressure',
      color: 'indigo',
    },
    {
      key: 'inspection',
      title: 'Inspection & Testing',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
      placeholder: 'e.g. Third party witness inspection (PMI / Dye Penetrant)',
      color: 'emerald',
    },
    {
      key: 'commercial',
      title: 'Commercial Terms',
      icon: <Info className="w-3.5 h-3.5 text-amber-600" />,
      placeholder: 'e.g. Net 30 days upon invoice, penalty 0.5%/week late delivery',
      color: 'amber',
    },
    {
      key: 'packaging',
      title: 'Packaging & Preservation',
      icon: <Package className="w-3.5 h-3.5 text-purple-600" />,
      placeholder: 'e.g. Seaworthy ISPM-15 heat-treated wooden crates, rust preventative',
      color: 'purple',
    },
    {
      key: 'shipping',
      title: 'Shipping Instructions',
      icon: <Truck className="w-3.5 h-3.5 text-cyan-600" />,
      placeholder: 'e.g. Direct airfreight to Singapore Changi airport, mark consignee',
      color: 'cyan',
    },
    {
      key: 'specialInstructions',
      title: 'Special Customer Instructions',
      icon: <Info className="w-3.5 h-3.5 text-rose-600" />,
      placeholder: 'e.g. Reference PO number on all outer carton tags',
      color: 'rose',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Commercial, Technical & Quality Requirements
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Special instructions, test certifications, and terms extracted from the RFQ notes and boilerplate clauses.
          </p>
        </div>
        <span className="text-[11px] text-slate-400">Section 5 of 5</span>
      </div>

      {/* Review Flags if any */}
      {reviewFlags && reviewFlags.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
          <p className="font-semibold flex items-center space-x-1.5 text-amber-800">
            <span>Quotation Flags & Noteworthy Items:</span>
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
            {reviewFlags.map((flag, idx) => (
              <li key={idx}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Structured Requirement Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(({ key, title, icon, placeholder }) => {
          const items = requirements[key] || [];
          const isAdding = newInputCategory === key;

          return (
            <div key={key} className="bg-slate-50/70 rounded-lg border border-slate-200 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                  {icon}
                  <span>{title}</span>
                  <span className="text-[10px] font-normal text-slate-400">({items.length})</span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setNewInputCategory(isAdding ? null : key);
                    setNewInputValue('');
                  }}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-800 inline-flex items-center space-x-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 min-h-[38px]">
                {items.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">None specified in RFQ</p>
                ) : (
                  items.map((item, idx) => (
                    <div
                      key={idx}
                      className="group flex items-start justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200 text-xs text-slate-700"
                    >
                      <span className="text-slate-800 flex-1 pr-2 leading-relaxed">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(key, idx)}
                        className="text-slate-400 hover:text-rose-600 opacity-60 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Input for adding new requirement */}
              {isAdding && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center space-x-2">
                  <input
                    type="text"
                    value={newInputValue}
                    placeholder={placeholder}
                    autoFocus
                    onChange={(e) => setNewInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddItem(key);
                      if (e.key === 'Escape') setNewInputCategory(null);
                    }}
                    className="flex-1 px-2 py-1 text-xs rounded border border-blue-400 bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem(key)}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewInputCategory(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Additional Uncategorized Information */}
        <div className="bg-slate-50/70 rounded-lg border border-slate-200 p-3.5 space-y-2.5 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-slate-600" />
              <span>Other RFQ Notes & Uncategorized Details</span>
              <span className="text-[10px] font-normal text-slate-400">({additionalInformation.length})</span>
            </span>

            <button
              type="button"
              onClick={() => {
                setNewInputCategory(newInputCategory === 'other' ? null : 'other');
                setNewInputValue('');
              }}
              className="text-[11px] font-medium text-blue-600 hover:text-blue-800 inline-flex items-center space-x-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>Add Note</span>
            </button>
          </div>

          <div className="space-y-1.5">
            {additionalInformation.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No additional notes detected</p>
            ) : (
              additionalInformation.map((note, idx) => (
                <div
                  key={idx}
                  className="group flex items-start justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200 text-xs text-slate-700"
                >
                  <span className="text-slate-800 flex-1 pr-2 leading-relaxed">{note}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem('other', idx)}
                    className="text-slate-400 hover:text-rose-600 opacity-60 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {newInputCategory === 'other' && (
            <div className="pt-2 border-t border-slate-200/60 flex items-center space-x-2">
              <input
                type="text"
                value={newInputValue}
                placeholder="Enter any other detail or customer request..."
                autoFocus
                onChange={(e) => setNewInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem('other');
                  if (e.key === 'Escape') setNewInputCategory(null);
                }}
                className="flex-1 px-2 py-1 text-xs rounded border border-blue-400 bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddItem('other')}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setNewInputCategory(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
