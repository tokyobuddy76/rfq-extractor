import React from 'react';
import { Building2, Calendar, Clock, DollarSign, MapPin, Mail, Phone, User, FileSpreadsheet, Edit3 } from 'lucide-react';
import type { CustomerInfo, RfqDetails } from '../types/rfq';

interface CustomerDetailsProps {
  customer: CustomerInfo;
  rfq: RfqDetails;
  onUpdateCustomer: (field: keyof CustomerInfo, value: string) => void;
  onUpdateRfq: (field: keyof RfqDetails, value: string) => void;
  originalCustomer?: CustomerInfo | null;
  originalRfq?: RfqDetails | null;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customer,
  rfq,
  onUpdateCustomer,
  onUpdateRfq,
  originalCustomer,
  originalRfq,
}) => {
  const isCustomerFieldModified = (field: keyof CustomerInfo) => {
    if (!originalCustomer) return false;
    return (customer[field] || '') !== (originalCustomer[field] || '');
  };

  const isRfqFieldModified = (field: keyof RfqDetails) => {
    if (!originalRfq) return false;
    return (rfq[field] || '') !== (originalRfq[field] || '');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Customer Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Customer Information
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Section 1 of 5</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Company Name */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Company / Account Name</label>
              {isCustomerFieldModified('companyName') ? (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                  User Edited
                </span>
              ) : !customer.companyName ? (
                <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-medium">
                  Not found in PDF
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">Extracted</span>
              )}
            </div>
            <input
              type="text"
              value={customer.companyName || ''}
              placeholder="e.g. Acme Industrial Mining Ltd."
              onChange={(e) => onUpdateCustomer('companyName', e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-lg border font-medium transition-colors ${
                !customer.companyName
                  ? 'border-red-300 bg-red-50/20 text-slate-900 focus:border-blue-500'
                  : isCustomerFieldModified('companyName')
                  ? 'border-amber-300 bg-amber-50/20 text-slate-900 focus:border-blue-500'
                  : 'border-slate-200 bg-white text-slate-900 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Contact Person */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Contact Person</label>
              {isCustomerFieldModified('contactName') ? (
                <span className="text-[10px] text-amber-700 font-medium">Edited</span>
              ) : !customer.contactName ? (
                <span className="text-[10px] text-red-500 font-medium">Not found</span>
              ) : null}
            </div>
            <input
              type="text"
              value={customer.contactName || ''}
              placeholder="Buyer / Engineer Name"
              onChange={(e) => onUpdateCustomer('contactName', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:border-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Email Address</label>
              {isCustomerFieldModified('email') ? (
                <span className="text-[10px] text-amber-700 font-medium">Edited</span>
              ) : !customer.email ? (
                <span className="text-[10px] text-red-500 font-medium">Not found</span>
              ) : null}
            </div>
            <input
              type="email"
              value={customer.email || ''}
              placeholder="buyer@customer.com"
              onChange={(e) => onUpdateCustomer('email', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:border-blue-500"
            />
          </div>

          {/* Telephone */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Phone Number</label>
              {isCustomerFieldModified('phone') ? (
                <span className="text-[10px] text-amber-700 font-medium">Edited</span>
              ) : !customer.phone ? (
                <span className="text-[10px] text-red-500 font-medium">Not found</span>
              ) : null}
            </div>
            <input
              type="text"
              value={customer.phone || ''}
              placeholder="+1 (555) 019-2831"
              onChange={(e) => onUpdateCustomer('phone', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:border-blue-500"
            />
          </div>

          {/* Country */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Country</label>
              {isCustomerFieldModified('country') ? (
                <span className="text-[10px] text-amber-700 font-medium">Edited</span>
              ) : !customer.country ? (
                <span className="text-[10px] text-red-500 font-medium">Not found</span>
              ) : null}
            </div>
            <input
              type="text"
              value={customer.country || ''}
              placeholder="e.g. United States, Australia"
              onChange={(e) => onUpdateCustomer('country', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:border-blue-500"
            />
          </div>

          {/* Customer Reference */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Customer Reference / Project No.</label>
              {isCustomerFieldModified('customerReference') ? (
                <span className="text-[10px] text-amber-700 font-medium">Edited</span>
              ) : !customer.customerReference ? (
                <span className="text-[10px] text-slate-400">Optional</span>
              ) : null}
            </div>
            <input
              type="text"
              value={customer.customerReference || ''}
              placeholder="e.g. PR-9942-EXPANSION"
              onChange={(e) => onUpdateCustomer('customerReference', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:border-blue-500"
            />
          </div>

          {/* Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Customer Address</label>
              {isCustomerFieldModified('address') ? (
                <span className="text-[10px] text-amber-700 font-medium">Edited</span>
              ) : !customer.address ? (
                <span className="text-[10px] text-red-500 font-medium">Not found</span>
              ) : null}
            </div>
            <input
              type="text"
              value={customer.address || ''}
              placeholder="Billing / Operating site address"
              onChange={(e) => onUpdateCustomer('address', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* RFQ Commercial Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              RFQ Commercial Details
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Section 2 of 5</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* RFQ Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">RFQ / Enquiry Number</label>
              {isRfqFieldModified('rfqNumber') ? (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                  User Edited
                </span>
              ) : !rfq.rfqNumber ? (
                <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-medium">
                  Not found in PDF
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">Verbatim</span>
              )}
            </div>
            <input
              type="text"
              value={rfq.rfqNumber || ''}
              placeholder="e.g. RFQ-2026-908"
              onChange={(e) => onUpdateRfq('rfqNumber', e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-lg border font-mono font-medium transition-colors ${
                !rfq.rfqNumber
                  ? 'border-red-300 bg-red-50/20 focus:border-blue-500'
                  : isRfqFieldModified('rfqNumber')
                  ? 'border-amber-300 bg-amber-50/20 focus:border-blue-500'
                  : 'border-slate-200 bg-white focus:border-blue-500'
              }`}
            />
          </div>

          {/* Currency */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Currency</label>
              {isRfqFieldModified('currency') ? (
                <span className="text-[10px] text-amber-700 font-medium">Edited</span>
              ) : !rfq.currency ? (
                <span className="text-[10px] text-red-500 font-medium">Not specified</span>
              ) : null}
            </div>
            <input
              type="text"
              value={rfq.currency || ''}
              placeholder="USD, EUR, GBP, CAD"
              onChange={(e) => onUpdateRfq('currency', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-mono font-semibold focus:border-blue-500"
            />
          </div>

          {/* RFQ Issue Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">RFQ Date</label>
              {isRfqFieldModified('rfqDate') ? (
                <span className="text-[10px] text-amber-700 font-medium">Edited</span>
              ) : !rfq.rfqDate ? (
                <span className="text-[10px] text-red-500 font-medium">Not found</span>
              ) : null}
            </div>
            <input
              type="text"
              value={rfq.rfqDate || ''}
              placeholder="YYYY-MM-DD"
              onChange={(e) => onUpdateRfq('rfqDate', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:border-blue-500"
            />
          </div>

          {/* Due Date / Deadline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Quotation Deadline / Due Date</label>
              {isRfqFieldModified('dueDate') ? (
                <span className="text-[10px] text-amber-700 font-medium">Edited</span>
              ) : !rfq.dueDate ? (
                <span className="text-[10px] text-red-500 font-medium">Not found</span>
              ) : null}
            </div>
            <input
              type="text"
              value={rfq.dueDate || ''}
              placeholder="YYYY-MM-DD"
              onChange={(e) => onUpdateRfq('dueDate', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-mono font-medium text-amber-900 focus:border-blue-500"
            />
          </div>

          {/* Requested Delivery Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Requested Delivery Date</label>
              {isRfqFieldModified('requestedDeliveryDate') ? (
                <span className="text-[10px] text-amber-700 font-medium">Edited</span>
              ) : !rfq.requestedDeliveryDate ? (
                <span className="text-[10px] text-slate-400">Not specified</span>
              ) : null}
            </div>
            <input
              type="text"
              value={rfq.requestedDeliveryDate || ''}
              placeholder="e.g. 6-8 weeks ARO / 2026-12-01"
              onChange={(e) => onUpdateRfq('requestedDeliveryDate', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:border-blue-500"
            />
          </div>

          {/* Incoterms */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Incoterms</label>
              {isRfqFieldModified('incoterms') ? (
                <span className="text-[10px] text-amber-700 font-medium">Edited</span>
              ) : !rfq.incoterms ? (
                <span className="text-[10px] text-slate-400">Not specified</span>
              ) : null}
            </div>
            <input
              type="text"
              value={rfq.incoterms || ''}
              placeholder="e.g. EXW, FOB, CIF, DDP"
              onChange={(e) => onUpdateRfq('incoterms', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:border-blue-500"
            />
          </div>

          {/* Delivery Location */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Delivery Location / Port</label>
              {isRfqFieldModified('deliveryLocation') ? (
                <span className="text-[10px] text-amber-700 font-medium">Edited</span>
              ) : !rfq.deliveryLocation ? (
                <span className="text-[10px] text-red-500 font-medium">Not specified</span>
              ) : null}
            </div>
            <input
              type="text"
              value={rfq.deliveryLocation || ''}
              placeholder="Port or plant site address"
              onChange={(e) => onUpdateRfq('deliveryLocation', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
