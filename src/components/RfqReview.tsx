import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  FileText,
  AlertTriangle,
  History,
  Eye,
} from 'lucide-react';
import type { RfqData, CustomerInfo, RfqDetails, EquipmentItem, LineItem, Requirements } from '../types/rfq';
import { CustomerDetails } from './CustomerDetails';
import { EquipmentDetails } from './EquipmentDetails';
import { LineItemsTable } from './LineItemsTable';
import { AdditionalInformation } from './AdditionalInformation';
import { ExportActions } from './ExportActions';

interface RfqReviewProps {
  currentData: RfqData;
  originalData: RfqData;
  fileName?: string;
  isApproved: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  onUpdateRfqData: (newData: RfqData) => void;
  onApprove: (approverName: string) => void;
  onRevokeApproval: () => void;
  onResetToOriginal: () => void;
  onBackToUpload: () => void;
}

export const RfqReview: React.FC<RfqReviewProps> = ({
  currentData,
  originalData,
  fileName,
  isApproved,
  approvedAt,
  approvedBy,
  onUpdateRfqData,
  onApprove,
  onRevokeApproval,
  onResetToOriginal,
  onBackToUpload,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'customer' | 'equipment' | 'parts' | 'requirements'>('all');

  // Calculate modifications count
  const countModifications = () => {
    let mods = 0;
    // Customer mods
    const custKeys: (keyof CustomerInfo)[] = [
      'companyName', 'address', 'contactName', 'email', 'phone', 'country', 'customerReference'
    ];
    for (const k of custKeys) {
      if ((currentData.customer[k] || '') !== (originalData.customer[k] || '')) mods++;
    }
    // RFQ details mods
    const rfqKeys: (keyof RfqDetails)[] = [
      'rfqNumber', 'rfqDate', 'dueDate', 'currency', 'requestedDeliveryDate', 'deliveryLocation', 'incoterms'
    ];
    for (const k of rfqKeys) {
      if ((currentData.rfq[k] || '') !== (originalData.rfq[k] || '')) mods++;
    }
    // Line item mods
    for (const item of currentData.lineItems) {
      if (item.isUserModified || item.isUserAdded) mods++;
    }
    return mods;
  };

  const userModificationsCount = countModifications();

  // Handlers for Customer and RFQ
  const handleUpdateCustomer = (field: keyof CustomerInfo, value: string) => {
    onUpdateRfqData({
      ...currentData,
      customer: {
        ...currentData.customer,
        [field]: value || null,
      },
    });
  };

  const handleUpdateRfq = (field: keyof RfqDetails, value: string) => {
    onUpdateRfqData({
      ...currentData,
      rfq: {
        ...currentData.rfq,
        [field]: value || null,
      },
    });
  };

  // Handlers for Equipment
  const handleAddEquipment = () => {
    const newEq: EquipmentItem = {
      id: `eq-user-${Date.now()}`,
      type: '',
      model: '',
      manufacturer: '',
      serialNumber: '',
      tagNumber: '',
      description: '',
      otherIdentification: '',
      isUserAdded: true,
    };
    onUpdateRfqData({
      ...currentData,
      equipment: [...currentData.equipment, newEq],
    });
  };

  const handleUpdateEquipment = (index: number, field: keyof EquipmentItem, value: string) => {
    const updated = [...currentData.equipment];
    updated[index] = {
      ...updated[index],
      [field]: value || null,
    };
    onUpdateRfqData({
      ...currentData,
      equipment: updated,
    });
  };

  const handleDeleteEquipment = (index: number) => {
    const updated = currentData.equipment.filter((_, i) => i !== index);
    onUpdateRfqData({
      ...currentData,
      equipment: updated,
    });
  };

  // Handlers for Line Items
  const handleAddLineItem = () => {
    const nextLineNum = String(currentData.lineItems.length + 1);
    const newItem: LineItem = {
      id: `line-user-${Date.now()}`,
      lineNumber: nextLineNum,
      partNumber: '',
      customerPartNumber: null,
      drawingNumber: null,
      description: '',
      quantity: 1,
      unit: 'EA',
      equipmentSerialNumber: currentData.equipment[0]?.serialNumber || null,
      revision: null,
      material: null,
      requestedDeliveryDate: currentData.rfq.requestedDeliveryDate || null,
      notes: null,
      partNumberStatus: 'Not found',
      drawingNumberStatus: 'Not found',
      serialNumberStatus: 'Not found',
      quantityStatus: 'Found',
      isUserAdded: true,
      isUserModified: true,
    };
    onUpdateRfqData({
      ...currentData,
      lineItems: [...currentData.lineItems, newItem],
    });
  };

  const handleUpdateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...currentData.lineItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
      isUserModified: true,
    };
    onUpdateRfqData({
      ...currentData,
      lineItems: updated,
    });
  };

  const handleDeleteLineItem = (index: number) => {
    const updated = currentData.lineItems.filter((_, i) => i !== index);
    onUpdateRfqData({
      ...currentData,
      lineItems: updated,
    });
  };

  // Handlers for Requirements
  const handleUpdateRequirements = (category: keyof Requirements, list: string[]) => {
    onUpdateRfqData({
      ...currentData,
      requirements: {
        ...currentData.requirements,
        [category]: list,
      },
    });
  };

  const handleUpdateAdditionalInfo = (list: string[]) => {
    onUpdateRfqData({
      ...currentData,
      additionalInformation: list,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Machine-Extracted Notice (Sub-goal 6 & 7) */}
      <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-4 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-950 block sm:inline mr-2">
              Human Verification Required:
            </span>
            <span>
              All data was machine-extracted by Google Gemini directly from your RFQ document. The quotation engineer must review and approve all part numbers, equipment tags, drawing numbers, and quantities before creating quotations or orders.
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0 text-xs">
          {userModificationsCount > 0 && (
            <span className="bg-amber-200/80 text-amber-900 font-semibold px-2 py-1 rounded text-[11px] whitespace-nowrap">
              {userModificationsCount} user correction{userModificationsCount > 1 ? 's' : ''}
            </span>
          )}
          <button
            type="button"
            onClick={onResetToOriginal}
            title="Reset all values to the original Gemini extraction"
            className="inline-flex items-center space-x-1 px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors text-xs"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Reset to Extracted</span>
          </button>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {currentData.customer.companyName || 'Unknown Customer'}
            </h2>
            <span className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">
              {currentData.rfq.rfqNumber || 'No RFQ Number'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {fileName ? `Source: ${fileName}` : 'Source: Uploaded PDF'} • {currentData.lineItems.length} Requested Line Item{currentData.lineItems.length !== 1 ? 's' : ''} • {currentData.equipment.length} Equipment Unit{currentData.equipment.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBackToUpload}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Upload New PDF</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation for large multi-section reviews */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs font-medium overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-b-2 border-blue-600 text-blue-600 font-bold bg-blue-50/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Sections
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('customer')}
          className={`px-3 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'customer'
              ? 'border-b-2 border-blue-600 text-blue-600 font-bold bg-blue-50/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Customer & RFQ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('equipment')}
          className={`px-3 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'equipment'
              ? 'border-b-2 border-blue-600 text-blue-600 font-bold bg-blue-50/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Equipment ({currentData.equipment.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('parts')}
          className={`px-3 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'parts'
              ? 'border-b-2 border-blue-600 text-blue-600 font-bold bg-blue-50/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Requested Parts ({currentData.lineItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('requirements')}
          className={`px-3 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'requirements'
              ? 'border-b-2 border-blue-600 text-blue-600 font-bold bg-blue-50/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Requirements & Terms
        </button>
      </div>

      {/* Main Review Body */}
      <div className="space-y-6">
        {(activeTab === 'all' || activeTab === 'customer') && (
          <CustomerDetails
            customer={currentData.customer}
            rfq={currentData.rfq}
            onUpdateCustomer={handleUpdateCustomer}
            onUpdateRfq={handleUpdateRfq}
            originalCustomer={originalData.customer}
            originalRfq={originalData.rfq}
          />
        )}

        {(activeTab === 'all' || activeTab === 'equipment') && (
          <EquipmentDetails
            equipment={currentData.equipment}
            onAddEquipment={handleAddEquipment}
            onUpdateEquipment={handleUpdateEquipment}
            onDeleteEquipment={handleDeleteEquipment}
          />
        )}

        {(activeTab === 'all' || activeTab === 'parts') && (
          <LineItemsTable
            lineItems={currentData.lineItems}
            onAddLineItem={handleAddLineItem}
            onUpdateLineItem={handleUpdateLineItem}
            onDeleteLineItem={handleDeleteLineItem}
            originalLineItems={originalData.lineItems}
          />
        )}

        {(activeTab === 'all' || activeTab === 'requirements') && (
          <AdditionalInformation
            requirements={currentData.requirements}
            additionalInformation={currentData.additionalInformation}
            reviewFlags={currentData.reviewFlags}
            onUpdateRequirements={handleUpdateRequirements}
            onUpdateAdditionalInfo={handleUpdateAdditionalInfo}
          />
        )}

        {/* Approval & Export Actions */}
        <ExportActions
          rfqData={currentData}
          isApproved={isApproved}
          onApprove={onApprove}
          onRevokeApproval={onRevokeApproval}
          approvedAt={approvedAt}
          approvedBy={approvedBy}
        />
      </div>
    </div>
  );
};
