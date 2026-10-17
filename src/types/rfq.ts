export type ReviewStatus = 'Found' | 'Review recommended' | 'Not found';

export interface CustomerInfo {
  companyName: string | null;
  address: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  customerReference: string | null;
}

export interface RfqDetails {
  rfqNumber: string | null;
  rfqDate: string | null;
  dueDate: string | null;
  currency: string | null;
  requestedDeliveryDate: string | null;
  deliveryLocation: string | null;
  incoterms: string | null;
}

export interface EquipmentItem {
  id: string;
  type: string | null;
  model: string | null;
  manufacturer: string | null;
  serialNumber: string | null;
  tagNumber: string | null;
  description: string | null;
  otherIdentification: string | null;
  isUserAdded?: boolean;
}

export interface LineItem {
  id: string;
  lineNumber: string | null;
  partNumber: string | null;
  customerPartNumber: string | null;
  drawingNumber: string | null;
  description: string | null;
  quantity: number | string | null;
  unit: string | null;
  equipmentSerialNumber: string | null;
  revision: string | null;
  material: string | null;
  requestedDeliveryDate: string | null;
  notes: string | null;
  // Statuses
  partNumberStatus?: ReviewStatus;
  drawingNumberStatus?: ReviewStatus;
  serialNumberStatus?: ReviewStatus;
  quantityStatus?: ReviewStatus;
  isUserAdded?: boolean;
  isUserModified?: boolean;
}

export interface Requirements {
  technical: string[];
  commercial: string[];
  certifications: string[];
  inspection: string[];
  packaging: string[];
  shipping: string[];
  specialInstructions: string[];
}

export interface RfqData {
  customer: CustomerInfo;
  rfq: RfqDetails;
  equipment: EquipmentItem[];
  lineItems: LineItem[];
  requirements: Requirements;
  additionalInformation: string[];
  reviewFlags: string[];
}

export interface ExtractionMetadata {
  fileName: string;
  fileSizeBytes: number;
  extractedAt: string;
  modelUsed: string;
  processingTimeMs: number;
}

export interface RfqSessionState {
  originalData: RfqData | null;
  currentData: RfqData | null;
  metadata: ExtractionMetadata | null;
  isApproved: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  modifiedFields: Set<string>; // Keys like "customer.companyName", "lineItem-0.quantity"
}
