import type { LineItem, RfqData, ReviewStatus } from '../types/rfq';

/**
 * Assesses field presence and quality for industrial quotation verification.
 * Does not represent statistically calibrated confidence unless provided by the model.
 */
export function evaluatePartNumberStatus(partNumber?: string | null): ReviewStatus {
  if (!partNumber || !partNumber.trim()) {
    return 'Not found';
  }
  const clean = partNumber.trim();
  if (clean.toLowerCase().includes('unknown') || clean.toLowerCase().includes('tbd') || clean.includes('?')) {
    return 'Review recommended';
  }
  return 'Found';
}

export function evaluateDrawingNumberStatus(drawingNumber?: string | null): ReviewStatus {
  if (!drawingNumber || !drawingNumber.trim()) {
    return 'Not found';
  }
  const clean = drawingNumber.trim();
  if (clean.toLowerCase().includes('unknown') || clean.toLowerCase().includes('tbd') || clean.includes('?')) {
    return 'Review recommended';
  }
  return 'Found';
}

export function evaluateSerialNumberStatus(serialNumber?: string | null): ReviewStatus {
  if (!serialNumber || !serialNumber.trim()) {
    return 'Not found';
  }
  const clean = serialNumber.trim();
  if (clean.toLowerCase().includes('unknown') || clean.toLowerCase().includes('tbd') || clean.includes('?')) {
    return 'Review recommended';
  }
  return 'Found';
}

export function evaluateQuantityStatus(quantity?: number | string | null): ReviewStatus {
  if (quantity === null || quantity === undefined || quantity === '') {
    return 'Not found';
  }
  const num = typeof quantity === 'number' ? quantity : parseFloat(String(quantity).replace(/,/g, ''));
  if (isNaN(num) || num <= 0) {
    return 'Review recommended';
  }
  return 'Found';
}

/**
 * Normalizes raw Gemini output into typed RfqData with unique IDs and initial statuses
 */
export function normalizeExtractedRfq(raw: Partial<RfqData>): RfqData {
  const lineItems: LineItem[] = (raw.lineItems || []).map((item, idx) => {
    const partNumber = item.partNumber ? String(item.partNumber).trim() : null;
    const drawingNumber = item.drawingNumber ? String(item.drawingNumber).trim() : null;
    const serialNumber = item.equipmentSerialNumber ? String(item.equipmentSerialNumber).trim() : null;
    const qty = item.quantity !== undefined && item.quantity !== null && item.quantity !== ''
      ? (typeof item.quantity === 'number' ? item.quantity : String(item.quantity).trim())
      : null;

    return {
      id: item.id || `line-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      lineNumber: item.lineNumber ? String(item.lineNumber).trim() : String(idx + 1),
      partNumber: partNumber || null,
      customerPartNumber: item.customerPartNumber ? String(item.customerPartNumber).trim() : null,
      drawingNumber: drawingNumber || null,
      description: item.description ? String(item.description).trim() : null,
      quantity: qty,
      unit: item.unit ? String(item.unit).trim().toUpperCase() : null,
      equipmentSerialNumber: serialNumber || null,
      revision: item.revision ? String(item.revision).trim() : null,
      material: item.material ? String(item.material).trim() : null,
      requestedDeliveryDate: item.requestedDeliveryDate ? String(item.requestedDeliveryDate).trim() : null,
      notes: item.notes ? String(item.notes).trim() : null,
      partNumberStatus: item.partNumberStatus || evaluatePartNumberStatus(partNumber),
      drawingNumberStatus: item.drawingNumberStatus || evaluateDrawingNumberStatus(drawingNumber),
      serialNumberStatus: item.serialNumberStatus || evaluateSerialNumberStatus(serialNumber),
      quantityStatus: item.quantityStatus || evaluateQuantityStatus(qty),
    };
  });

  const equipment = (raw.equipment || []).map((eq, idx) => ({
    id: eq.id || `eq-${Date.now()}-${idx}`,
    type: eq.type ? String(eq.type).trim() : null,
    model: eq.model ? String(eq.model).trim() : null,
    manufacturer: eq.manufacturer ? String(eq.manufacturer).trim() : null,
    serialNumber: eq.serialNumber ? String(eq.serialNumber).trim() : null,
    tagNumber: eq.tagNumber ? String(eq.tagNumber).trim() : null,
    description: eq.description ? String(eq.description).trim() : null,
    otherIdentification: eq.otherIdentification ? String(eq.otherIdentification).trim() : null,
  }));

  return {
    customer: {
      companyName: raw.customer?.companyName ? String(raw.customer.companyName).trim() : null,
      address: raw.customer?.address ? String(raw.customer.address).trim() : null,
      contactName: raw.customer?.contactName ? String(raw.customer.contactName).trim() : null,
      email: raw.customer?.email ? String(raw.customer.email).trim() : null,
      phone: raw.customer?.phone ? String(raw.customer.phone).trim() : null,
      country: raw.customer?.country ? String(raw.customer.country).trim() : null,
      customerReference: raw.customer?.customerReference ? String(raw.customer.customerReference).trim() : null,
    },
    rfq: {
      rfqNumber: raw.rfq?.rfqNumber ? String(raw.rfq.rfqNumber).trim() : null,
      rfqDate: raw.rfq?.rfqDate ? String(raw.rfq.rfqDate).trim() : null,
      dueDate: raw.rfq?.dueDate ? String(raw.rfq.dueDate).trim() : null,
      currency: raw.rfq?.currency ? String(raw.rfq.currency).trim().toUpperCase() : null,
      requestedDeliveryDate: raw.rfq?.requestedDeliveryDate ? String(raw.rfq.requestedDeliveryDate).trim() : null,
      deliveryLocation: raw.rfq?.deliveryLocation ? String(raw.rfq.deliveryLocation).trim() : null,
      incoterms: raw.rfq?.incoterms ? String(raw.rfq.incoterms).trim().toUpperCase() : null,
    },
    equipment: equipment.length > 0 ? equipment : [],
    lineItems: lineItems.length > 0 ? lineItems : [],
    requirements: {
      technical: Array.isArray(raw.requirements?.technical) ? raw.requirements.technical.filter(Boolean).map(String) : [],
      commercial: Array.isArray(raw.requirements?.commercial) ? raw.requirements.commercial.filter(Boolean).map(String) : [],
      certifications: Array.isArray(raw.requirements?.certifications) ? raw.requirements.certifications.filter(Boolean).map(String) : [],
      inspection: Array.isArray(raw.requirements?.inspection) ? raw.requirements.inspection.filter(Boolean).map(String) : [],
      packaging: Array.isArray(raw.requirements?.packaging) ? raw.requirements.packaging.filter(Boolean).map(String) : [],
      shipping: Array.isArray(raw.requirements?.shipping) ? raw.requirements.shipping.filter(Boolean).map(String) : [],
      specialInstructions: Array.isArray(raw.requirements?.specialInstructions) ? raw.requirements.specialInstructions.filter(Boolean).map(String) : [],
    },
    additionalInformation: Array.isArray(raw.additionalInformation) ? raw.additionalInformation.filter(Boolean).map(String) : [],
    reviewFlags: Array.isArray(raw.reviewFlags) ? raw.reviewFlags.filter(Boolean).map(String) : [],
  };
}
