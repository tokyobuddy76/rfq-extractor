import React, { useState } from 'react';
import {
  Table,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Edit2,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import type { LineItem, ReviewStatus } from '../types/rfq';
import {
  evaluatePartNumberStatus,
  evaluateDrawingNumberStatus,
  evaluateSerialNumberStatus,
  evaluateQuantityStatus,
} from '../utils/rfqValidation';

interface LineItemsTableProps {
  lineItems: LineItem[];
  onAddLineItem: () => void;
  onUpdateLineItem: (index: number, field: keyof LineItem, value: any) => void;
  onDeleteLineItem: (index: number) => void;
  originalLineItems?: LineItem[] | null;
}

export const LineItemsTable: React.FC<LineItemsTableProps> = ({
  lineItems,
  onAddLineItem,
  onUpdateLineItem,
  onDeleteLineItem,
  originalLineItems,
}) => {
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'needs-review' | 'user-edited'>('all');

  const renderStatusBadge = (status?: ReviewStatus, label?: string) => {
    switch (status) {
      case 'Found':
        return (
          <span
            title="Field successfully extracted verbatim from RFQ document"
            className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            <span>Found</span>
          </span>
        );
      case 'Review recommended':
        return (
          <span
            title="Field value may be ambiguous or contains non-standard characters"
            className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
          >
            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
            <span>Review recommended</span>
          </span>
        );
      case 'Not found':
      default:
        return (
          <span
            title="Field was not identified in the source RFQ document"
            className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200"
          >
            <HelpCircle className="w-2.5 h-2.5 text-rose-500" />
            <span>Not found</span>
          </span>
        );
    }
  };

  const isFieldModified = (index: number, field: keyof LineItem) => {
    if (!originalLineItems || !originalLineItems[index]) {
      return lineItems[index]?.isUserAdded || false;
    }
    const orig = originalLineItems[index];
    const curr = lineItems[index];
    return (curr[field] ?? '') !== (orig[field] ?? '');
  };

  const handleFieldChange = (index: number, field: keyof LineItem, val: string) => {
    onUpdateLineItem(index, field, val);

    // Re-evaluate review status when identifier fields are corrected by the user
    if (field === 'partNumber') {
      onUpdateLineItem(index, 'partNumberStatus', evaluatePartNumberStatus(val));
    } else if (field === 'drawingNumber') {
      onUpdateLineItem(index, 'drawingNumberStatus', evaluateDrawingNumberStatus(val));
    } else if (field === 'equipmentSerialNumber') {
      onUpdateLineItem(index, 'serialNumberStatus', evaluateSerialNumberStatus(val));
    } else if (field === 'quantity') {
      onUpdateLineItem(index, 'quantityStatus', evaluateQuantityStatus(val));
    }
  };

  const filteredItems = lineItems.map((item, idx) => ({ item, index: idx })).filter(({ item, index }) => {
    // Search text filter
    if (filterText) {
      const q = filterText.toLowerCase();
      const match =
        (item.partNumber && item.partNumber.toLowerCase().includes(q)) ||
        (item.drawingNumber && item.drawingNumber.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.equipmentSerialNumber && item.equipmentSerialNumber.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Status filter
    if (statusFilter === 'needs-review') {
      const needsReview =
        item.partNumberStatus === 'Review recommended' ||
        item.partNumberStatus === 'Not found' ||
        item.drawingNumberStatus === 'Review recommended' ||
        item.quantityStatus === 'Review recommended' ||
        item.quantityStatus === 'Not found';
      return needsReview;
    }

    if (statusFilter === 'user-edited') {
      return item.isUserModified || item.isUserAdded;
    }

    return true;
  });

  // Calculate review stats
  const totalParts = lineItems.length;
  const missingPartNumbers = lineItems.filter((i) => !i.partNumber || i.partNumberStatus === 'Not found').length;
  const missingQuantities = lineItems.filter((i) => i.quantity === null || i.quantity === undefined || i.quantity === '').length;
  const itemsNeedingReview = lineItems.filter(
    (i) =>
      i.partNumberStatus === 'Review recommended' ||
      i.drawingNumberStatus === 'Review recommended' ||
      i.quantityStatus === 'Review recommended'
  ).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <Table className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Requested Parts & Line Items ({lineItems.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Editable table of spare parts, components, and assemblies extracted verbatim from the RFQ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 mr-2">Section 4 of 5</span>
          <button
            type="button"
            onClick={onAddLineItem}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Line Item</span>
          </button>
        </div>
      </div>

      {/* Verification Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
        <div>
          <span className="text-slate-500 block text-[11px]">Total Line Items</span>
          <span className="font-bold text-slate-900 text-sm">{totalParts}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Missing Part Nos</span>
          <span className={`font-bold text-sm ${missingPartNumbers > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {missingPartNumbers === 0 ? '0 (All Found)' : `${missingPartNumbers} missing`}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Missing Quantities</span>
          <span className={`font-bold text-sm ${missingQuantities > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {missingQuantities === 0 ? '0 (All Found)' : `${missingQuantities} missing`}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Review Recommended</span>
          <span className={`font-bold text-sm ${itemsNeedingReview > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
            {itemsNeedingReview} items
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search part no, drawing no, description..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-slate-500 text-[11px]">View:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-[11px]">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({lineItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('needs-review')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'needs-review'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Needs Review
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('user-edited')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'user-edited'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              User Edited
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
          <thead className="bg-slate-100/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2.5 w-12 text-center">Line</th>
              <th className="px-3 py-2.5 min-w-[170px]">
                Part Number & Status
              </th>
              <th className="px-3 py-2.5 min-w-[150px]">Drawing Number</th>
              <th className="px-3 py-2.5 min-w-[220px]">Description</th>
              <th className="px-3 py-2.5 min-w-[90px]">Qty</th>
              <th className="px-3 py-2.5 min-w-[70px]">Unit</th>
              <th className="px-3 py-2.5 min-w-[150px]">Equip S/N</th>
              <th className="px-3 py-2.5 min-w-[75px]">Rev</th>
              <th className="px-3 py-2.5 min-w-[120px]">Material</th>
              <th className="px-3 py-2.5 min-w-[150px]">Notes</th>
              <th className="px-2 py-2.5 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                  {filterText || statusFilter !== 'all'
                    ? 'No line items match the selected filter.'
                    : 'No line items present. Click "Add Line Item" to enter items manually.'}
                </td>
              </tr>
            ) : (
              filteredItems.map(({ item, index }) => {
                const partModified = isFieldModified(index, 'partNumber');
                const qtyModified = isFieldModified(index, 'quantity');
                const drawingModified = isFieldModified(index, 'drawingNumber');
                const isItemModified = item.isUserModified || item.isUserAdded;

                return (
                  <tr
                    key={item.id || index}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isItemModified ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    {/* Line Number */}
                    <td className="px-2 py-2 text-center font-mono font-medium text-slate-500">
                      <input
                        type="text"
                        value={item.lineNumber || ''}
                        onChange={(e) => handleFieldChange(index, 'lineNumber', e.target.value)}
                        className="w-10 text-center py-1 px-0.5 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-xs font-mono font-bold"
                      />
                    </td>

                    {/* Part Number & Status */}
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={item.partNumber || ''}
                          placeholder="Part Number"
                          onChange={(e) => handleFieldChange(index, 'partNumber', e.target.value)}
                          className={`w-full px-2 py-1 rounded font-mono font-semibold text-xs border transition-colors ${
                            !item.partNumber
                              ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-blue-500'
                              : partModified
                              ? 'border-amber-300 bg-amber-50/40 text-slate-900 focus:border-blue-500'
                              : 'border-slate-200 bg-white text-slate-900 focus:border-blue-500'
                          }`}
                        />
                        <div className="flex items-center justify-between">
                          {renderStatusBadge(item.partNumberStatus)}
                          {partModified && (
                            <span className="text-[9px] text-amber-700 font-medium">
                              User Edited
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Drawing Number */}
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={item.drawingNumber || ''}
                          placeholder="Drawing / Print No"
                          onChange={(e) => handleFieldChange(index, 'drawingNumber', e.target.value)}
                          className={`w-full px-2 py-1 rounded font-mono text-xs border ${
                            drawingModified
                              ? 'border-amber-300 bg-amber-50/30'
                              : 'border-slate-200 bg-white'
                          } focus:border-blue-500`}
                        />
                        <div className="flex items-center justify-between">
                          {renderStatusBadge(item.drawingNumberStatus)}
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-3 py-2">
                      <textarea
                        rows={2}
                        value={item.description || ''}
                        placeholder="Item description, material, dimensions..."
                        onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-200 bg-white text-xs resize-y focus:border-blue-500"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={item.quantity !== null && item.quantity !== undefined ? item.quantity : ''}
                          placeholder="0"
                          onChange={(e) => handleFieldChange(index, 'quantity', e.target.value)}
                          className={`w-full px-2 py-1 rounded font-mono font-bold text-xs text-center border ${
                            item.quantity === null || item.quantity === undefined || item.quantity === ''
                              ? 'border-rose-300 bg-rose-50/40 text-rose-900'
                              : qtyModified
                              ? 'border-amber-300 bg-amber-50/40'
                              : 'border-slate-200 bg-white text-slate-900'
                          } focus:border-blue-500`}
                        />
                        <div className="flex items-center justify-center">
                          {renderStatusBadge(item.quantityStatus)}
                        </div>
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.unit || ''}
                        placeholder="EA"
                        onChange={(e) => handleFieldChange(index, 'unit', e.target.value.toUpperCase())}
                        className="w-full px-1.5 py-1 rounded font-mono font-semibold text-xs text-center border border-slate-200 bg-white focus:border-blue-500 uppercase"
                      />
                    </td>

                    {/* Equipment Serial Number */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.equipmentSerialNumber || ''}
                        placeholder="e.g. WAR-8849-01"
                        onChange={(e) => handleFieldChange(index, 'equipmentSerialNumber', e.target.value)}
                        className="w-full px-2 py-1 rounded font-mono text-xs border border-slate-200 bg-white focus:border-blue-500"
                      />
                    </td>

                    {/* Revision */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.revision || ''}
                        placeholder="Rev"
                        onChange={(e) => handleFieldChange(index, 'revision', e.target.value)}
                        className="w-full px-1.5 py-1 rounded font-mono text-xs text-center border border-slate-200 bg-white focus:border-blue-500"
                      />
                    </td>

                    {/* Material */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.material || ''}
                        placeholder="e.g. Ultrachrome A05, 316SS"
                        onChange={(e) => handleFieldChange(index, 'material', e.target.value)}
                        className="w-full px-2 py-1 rounded text-xs border border-slate-200 bg-white focus:border-blue-500"
                      />
                    </td>

                    {/* Notes */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.notes || ''}
                        placeholder="Inspection, certs..."
                        onChange={(e) => handleFieldChange(index, 'notes', e.target.value)}
                        className="w-full px-2 py-1 rounded text-xs border border-slate-200 bg-white focus:border-blue-500"
                      />
                    </td>

                    {/* Delete Line */}
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteLineItem(index)}
                        title="Delete line item"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 pt-1">
        <div>
          <span>Tip: Click any cell to edit. Review statuses update dynamically as you correct identifiers.</span>
        </div>
        <div className="flex items-center space-x-3 mt-1 sm:mt-0">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Found</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Review recommended</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Not found</span>
          </span>
        </div>
      </div>
    </div>
  );
};
