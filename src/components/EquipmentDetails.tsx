import React from 'react';
import { Cog, Plus, Trash2, Tag, Hash, Building, Layers } from 'lucide-react';
import type { EquipmentItem } from '../types/rfq';

interface EquipmentDetailsProps {
  equipment: EquipmentItem[];
  onAddEquipment: () => void;
  onUpdateEquipment: (index: number, field: keyof EquipmentItem, value: string) => void;
  onDeleteEquipment: (index: number) => void;
}

export const EquipmentDetails: React.FC<EquipmentDetailsProps> = ({
  equipment,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <Cog className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Equipment & Machine Identification ({equipment.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Original plant equipment, OEM models, serial numbers, and unit tags associated with this RFQ.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[11px] text-slate-400">Section 3 of 5</span>
          <button
            type="button"
            onClick={onAddEquipment}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Equipment</span>
          </button>
        </div>
      </div>

      {equipment.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300 space-y-2">
          <p className="text-xs font-medium text-slate-600">
            No specific equipment or machine identifiers were detected in this RFQ.
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Some customer RFQs request general aftermarket parts without citing master equipment serials. You can manually add equipment tags if needed.
          </p>
          <button
            type="button"
            onClick={onAddEquipment}
            className="mt-2 inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-slate-300 rounded hover:bg-slate-100"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Equipment Tag</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equipment.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-slate-50/70 rounded-lg border border-slate-200 p-4 relative group space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                    #{idx + 1}
                  </span>
                  <span>{item.type || 'Equipment Item'}</span>
                </span>

                <div className="flex items-center space-x-2">
                  {item.serialNumber ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-medium px-2 py-0.5 rounded">
                      S/N: {item.serialNumber}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded">
                      No Serial Number
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteEquipment(idx)}
                    title="Delete equipment item"
                    className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-200/50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Equipment Type */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Equipment Type
                  </label>
                  <input
                    type="text"
                    value={item.type || ''}
                    placeholder="e.g. Centrifugal Slurry Pump"
                    onChange={(e) => onUpdateEquipment(idx, 'type', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-white focus:border-blue-500"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={item.model || ''}
                    placeholder="e.g. 10/8 FF-AH"
                    onChange={(e) => onUpdateEquipment(idx, 'model', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-white font-mono focus:border-blue-500"
                  />
                </div>

                {/* Manufacturer / OEM */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Manufacturer / OEM
                  </label>
                  <input
                    type="text"
                    value={item.manufacturer || ''}
                    placeholder="e.g. Warman, Sulzer, Flowserve"
                    onChange={(e) => onUpdateEquipment(idx, 'manufacturer', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-white focus:border-blue-500"
                  />
                </div>

                {/* Serial Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Serial Number (Verbatim)
                  </label>
                  <input
                    type="text"
                    value={item.serialNumber || ''}
                    placeholder="e.g. WAR-8849-01"
                    onChange={(e) => onUpdateEquipment(idx, 'serialNumber', e.target.value)}
                    className={`w-full px-2.5 py-1.5 text-xs rounded border font-mono font-semibold focus:border-blue-500 ${
                      !item.serialNumber ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  />
                </div>

                {/* Tag Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Plant Tag Number
                  </label>
                  <input
                    type="text"
                    value={item.tagNumber || ''}
                    placeholder="e.g. 10-PU-002A"
                    onChange={(e) => onUpdateEquipment(idx, 'tagNumber', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-white font-mono focus:border-blue-500"
                  />
                </div>

                {/* Other Identification */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Other Identification
                  </label>
                  <input
                    type="text"
                    value={item.otherIdentification || ''}
                    placeholder="e.g. Skid #4, Mill Train 1"
                    onChange={(e) => onUpdateEquipment(idx, 'otherIdentification', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-white focus:border-blue-500"
                  />
                </div>

                {/* Equipment Description */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Equipment Description / Service
                  </label>
                  <input
                    type="text"
                    value={item.description || ''}
                    placeholder="Cyclone feed pump duty, heavy abrasive slurry service"
                    onChange={(e) => onUpdateEquipment(idx, 'description', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-white focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
