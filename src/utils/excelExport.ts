import * as XLSX from 'xlsx';
import type { RfqData } from '../types/rfq';
import { buildRfqExportFilename } from './filenameSanitizer';

export function exportRfqToExcel(rfqData: RfqData): string {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: RFQ Summary
  const equipmentSummary = rfqData.equipment && rfqData.equipment.length > 0
    ? rfqData.equipment
        .map((eq, i) => {
          const parts = [
            eq.manufacturer,
            eq.model,
            eq.type ? `(${eq.type})` : '',
            eq.serialNumber ? `S/N: ${eq.serialNumber}` : '',
            eq.tagNumber ? `Tag: ${eq.tagNumber}` : '',
          ].filter(Boolean);
          return parts.length > 0 ? parts.join(' - ') : (eq.description || `Equipment #${i + 1}`);
        })
        .join('; ')
    : 'N/A';

  const serialNumbersSummary = rfqData.equipment && rfqData.equipment.length > 0
    ? rfqData.equipment.map((eq) => eq.serialNumber).filter(Boolean).join(', ') || 'N/A'
    : 'N/A';

  const additionalInfoSummary = [
    ...(rfqData.requirements?.technical?.length ? [`Technical: ${rfqData.requirements.technical.join('; ')}`] : []),
    ...(rfqData.requirements?.commercial?.length ? [`Commercial: ${rfqData.requirements.commercial.join('; ')}`] : []),
    ...(rfqData.requirements?.certifications?.length ? [`Certifications: ${rfqData.requirements.certifications.join('; ')}`] : []),
    ...(rfqData.requirements?.inspection?.length ? [`Inspection: ${rfqData.requirements.inspection.join('; ')}`] : []),
    ...(rfqData.requirements?.packaging?.length ? [`Packaging: ${rfqData.requirements.packaging.join('; ')}`] : []),
    ...(rfqData.requirements?.shipping?.length ? [`Shipping: ${rfqData.requirements.shipping.join('; ')}`] : []),
    ...(rfqData.requirements?.specialInstructions?.length ? [`Special Instructions: ${rfqData.requirements.specialInstructions.join('; ')}`] : []),
    ...(rfqData.additionalInformation?.length ? [`Other: ${rfqData.additionalInformation.join('; ')}`] : []),
  ].join('\n') || 'None';

  const summaryRows = [
    ['RFQ SUMMARY & QUOTATION HEADER', ''],
    ['Customer Name', rfqData.customer?.companyName || 'N/A'],
    ['Customer Contact', rfqData.customer?.contactName || 'N/A'],
    ['Customer Email', rfqData.customer?.email || 'N/A'],
    ['Customer Phone', rfqData.customer?.phone || 'N/A'],
    ['Customer Address', rfqData.customer?.address || 'N/A'],
    ['Customer Country', rfqData.customer?.country || 'N/A'],
    ['Customer Reference', rfqData.customer?.customerReference || 'N/A'],
    ['', ''],
    ['RFQ Number', rfqData.rfq?.rfqNumber || 'N/A'],
    ['RFQ Date', rfqData.rfq?.rfqDate || 'N/A'],
    ['Due Date', rfqData.rfq?.dueDate || 'N/A'],
    ['Currency', rfqData.rfq?.currency || 'N/A'],
    ['Requested Delivery Date', rfqData.rfq?.requestedDeliveryDate || 'N/A'],
    ['Delivery Location', rfqData.rfq?.deliveryLocation || 'N/A'],
    ['Incoterms', rfqData.rfq?.incoterms || 'N/A'],
    ['', ''],
    ['Equipment', equipmentSummary],
    ['Serial Number', serialNumbersSummary],
    ['', ''],
    ['Additional Information', additionalInfoSummary],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 80 }];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'RFQ Summary');

  // 2. Sheet 2: Line Items
  const lineItemHeaders = [
    'Line Number',
    'Part Number',
    'Drawing Number',
    'Customer Part Number',
    'Description',
    'Quantity',
    'Unit',
    'Unit Basic Price',
    'Total Amount',
    'Requested Delivery Date',
    'Notes',
  ];

  const lineItemRows = (rfqData.lineItems || []).map((item, idx) => [
    item.lineNumber || String(idx + 1),
    item.partNumber || '',
    item.drawingNumber || '',
    item.customerPartNumber || '',
    item.description || '',
    item.quantity !== null && item.quantity !== undefined ? item.quantity : '',
    item.unit || '',
    item.unitPrice !== null && item.unitPrice !== undefined ? item.unitPrice : '',
    item.totalAmount !== null && item.totalAmount !== undefined ? item.totalAmount : '',
    item.requestedDeliveryDate || '',
    item.notes || '',
  ]);

  const wsLineItems = XLSX.utils.aoa_to_sheet([lineItemHeaders, ...lineItemRows]);
  wsLineItems['!cols'] = [
    { wch: 12 }, // Line Number
    { wch: 22 }, // Part Number
    { wch: 22 }, // Drawing Number
    { wch: 22 }, // Customer Part Number
    { wch: 38 }, // Description
    { wch: 10 }, // Quantity
    { wch: 8 },  // Unit
    { wch: 16 }, // Unit Basic Price
    { wch: 16 }, // Total Amount
    { wch: 22 }, // Requested Delivery Date
    { wch: 35 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, wsLineItems, 'Line Items');

  const filename = buildRfqExportFilename(rfqData.customer?.companyName, rfqData.rfq?.rfqNumber);
  XLSX.writeFile(wb, filename);

  return filename;
}
