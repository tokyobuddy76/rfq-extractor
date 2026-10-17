/**
 * Sanitizes invalid filename characters across Windows, macOS, and Linux
 */
export function sanitizeFilename(name: string): string {
  if (!name) return 'Unknown';
  // Remove or replace characters not allowed in filenames: \ / : * ? " < > | and control characters
  return name
    .replace(/[\\/:*?"<>|\r\n\t]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60); // Keep reasonable length
}

/**
 * Builds the pattern: RFQ_<Customer>_<RFQNumber>.xlsx
 */
export function buildRfqExportFilename(customerName?: string | null, rfqNumber?: string | null): string {
  const cleanCustomer = sanitizeFilename(customerName || 'Customer');
  const cleanRfqNumber = sanitizeFilename(rfqNumber || 'RFQ');
  return `RFQ_${cleanCustomer}_${cleanRfqNumber}.xlsx`;
}
