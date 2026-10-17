import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

// Vercel Serverless Function Configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export const maxDuration = 60; // 60s timeout for large multi-page PDF analysis

const RFQ_SYSTEM_INSTRUCTION = `You are an industrial RFQ document extraction system.

Analyze the entire supplied PDF.

Extract information exactly as written in the document.

Pay particular attention to tables, line items, part numbers, drawing numbers, equipment serial numbers and quantities.

A document may contain multiple equipment serial numbers and multiple requested parts. Preserve the relationship between equipment and parts whenever the document makes that relationship clear.

Never infer an identifier that is not visible in the document.

Never invent missing values.

If a field is absent, return null or empty string.

Do not change punctuation, leading zeros, hyphens or capitalization in part numbers, drawing numbers or serial numbers.

Distinguish part numbers from drawing numbers whenever the document identifies them separately.

Return every requested line item, not merely the first one.

Capture important technical or commercial information that does not fit the predefined schema under additionalInformation.

Return only data conforming to the required structured-output schema.`;

const rfqResponseSchema = {
  type: Type.OBJECT,
  properties: {
    customer: {
      type: Type.OBJECT,
      properties: {
        companyName: { type: Type.STRING, description: 'Customer or company name' },
        address: { type: Type.STRING, description: 'Customer physical or mailing address' },
        contactName: { type: Type.STRING, description: 'Contact person or buyer name' },
        email: { type: Type.STRING, description: 'Customer contact email' },
        phone: { type: Type.STRING, description: 'Customer telephone number' },
        country: { type: Type.STRING, description: 'Customer country' },
        customerReference: { type: Type.STRING, description: 'Customer reference or internal project number' },
      },
    },
    rfq: {
      type: Type.OBJECT,
      properties: {
        rfqNumber: { type: Type.STRING, description: 'RFQ or enquiry number' },
        rfqDate: { type: Type.STRING, description: 'RFQ issue date' },
        dueDate: { type: Type.STRING, description: 'Quotation submission deadline / due date' },
        currency: { type: Type.STRING, description: 'Quotation currency requested (e.g. USD, EUR, GBP)' },
        requestedDeliveryDate: { type: Type.STRING, description: 'Overall requested delivery date' },
        deliveryLocation: { type: Type.STRING, description: 'Delivery address or port/facility' },
        incoterms: { type: Type.STRING, description: 'Incoterms (e.g. EXW, FOB, CIF, DDP)' },
      },
    },
    equipment: {
      type: Type.ARRAY,
      description: 'Major equipment, systems, or machines referenced in the RFQ',
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: 'Equipment type (e.g. Centrifugal Pump, Compressor, Turbine)' },
          model: { type: Type.STRING, description: 'Equipment model designation' },
          manufacturer: { type: Type.STRING, description: 'Equipment OEM / manufacturer name' },
          serialNumber: { type: Type.STRING, description: 'Equipment serial number' },
          tagNumber: { type: Type.STRING, description: 'Plant or unit tag number (e.g. P-101A)' },
          description: { type: Type.STRING, description: 'Equipment description or service' },
          otherIdentification: { type: Type.STRING, description: 'Any other equipment identifier' },
        },
      },
    },
    lineItems: {
      type: Type.ARRAY,
      description: 'All requested quotation line items (spare parts, assemblies, components, or equipment)',
      items: {
        type: Type.OBJECT,
        properties: {
          lineNumber: { type: Type.STRING, description: 'Line or item number exactly as stated' },
          partNumber: { type: Type.STRING, description: 'Exact OEM or manufacturer part number' },
          customerPartNumber: { type: Type.STRING, description: 'Customer-specific internal material or part number' },
          drawingNumber: { type: Type.STRING, description: 'Technical drawing or blueprint number' },
          description: { type: Type.STRING, description: 'Item description or specification' },
          quantity: { type: Type.STRING, description: 'Quantity requested' },
          unit: { type: Type.STRING, description: 'Unit of measure (e.g. EA, PC, SET, M, KG)' },
          equipmentSerialNumber: { type: Type.STRING, description: 'Associated equipment serial or tag number if specified' },
          revision: { type: Type.STRING, description: 'Revision level or letter' },
          material: { type: Type.STRING, description: 'Material grade or standard' },
          requestedDeliveryDate: { type: Type.STRING, description: 'Requested delivery date for this specific line item' },
          notes: { type: Type.STRING, description: 'Line-specific instructions or remarks' },
        },
        required: ['lineNumber'],
      },
    },
    requirements: {
      type: Type.OBJECT,
      description: 'Specific commercial, technical, and compliance requirements',
      properties: {
        technical: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Technical specifications, standards, or performance tolerances' },
        commercial: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Commercial terms, validity, or payment milestones' },
        certifications: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Certifications required (e.g. Mill test certificate 3.1, ATEX, NACE, ISO)' },
        inspection: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Inspection, PMI, hydrostatic testing, or witness requirements' },
        packaging: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Export preservation, crating, or tropical packaging requirements' },
        shipping: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Shipping terms, preferred freight mode, or destination port' },
        specialInstructions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Any special buyer instructions, penalties, or compliance clauses' },
      },
    },
    additionalInformation: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Any notable context, project background, or unclassified information',
    },
    reviewFlags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Items requiring human verification (ambiguous part numbers, conflicting dates, missing tags)',
    },
  },
  required: ['customer', 'rfq', 'equipment', 'lineItems', 'requirements'],
};

export async function handleAnalyzeRfq(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();

  // Set CORS headers for cross-origin and preflight requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET request diagnostic helper
  if (req.method === 'GET') {
    const hasKey = Boolean(
      (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') ||
      (process.env.API_KEY && process.env.API_KEY !== 'MY_GEMINI_API_KEY')
    );
    res.status(200).json({
      status: 'ok',
      endpoint: '/api/analyze-rfq',
      hasGeminiKey: hasKey,
      message: hasKey
        ? 'Gemini API is configured. Ready to accept POST requests with { pdfBase64: string }.'
        : 'GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY to your Vercel Environment Variables.',
    });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    // Guardrail: Check Gemini API key presence
    if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'The Gemini API is not configured. Please configure GEMINI_API_KEY in Vercel environment variables (Settings > Environment Variables).',
        code: 'KEY_NOT_CONFIGURED',
      });
      return;
    }

    // Safely parse body if sent as string or object
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // use raw
      }
    }

    const { pdfBase64, fileName, fileSizeBytes } = body || {};

    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      res.status(400).json({
        error: 'Invalid request: No PDF base64 data provided.',
        code: 'MISSING_FILE',
      });
      return;
    }

    // Basic PDF validation: Check base64 header (%PDF magic bytes in base64 start with JVBERi)
    const trimmedBase64 = pdfBase64.replace(/\s/g, '');
    if (!trimmedBase64.startsWith('JVBERi')) {
      res.status(400).json({
        error: 'The uploaded file does not appear to be a valid PDF document. Please verify the file and try again.',
        code: 'INVALID_PDF_FORMAT',
      });
      return;
    }

    // Size limit check (25MB base64 ~ 18MB binary)
    if (trimmedBase64.length > 35 * 1024 * 1024) {
      res.status(413).json({
        error: 'The uploaded PDF exceeds the supported file size limit (20 MB). Please reduce file size or select another document.',
        code: 'FILE_TOO_LARGE',
      });
      return;
    }

    // Initialize official GoogleGenAI SDK
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const filePart = {
      inlineData: {
        mimeType: 'application/pdf',
        data: trimmedBase64,
      },
    };

    const promptPart = {
      text: 'Perform an exhaustive industrial RFQ extraction on this entire document. Extract all customer details, RFQ commercial details, equipment identification (models, manufacturers, serial numbers, tags), every single line item requested with exact part numbers and drawing numbers, and all technical/commercial requirements. Preserve exact identifiers without reinterpreting them.',
    };

    // Call Gemini 3.8 Flash model with structured JSON output
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [filePart, promptPart],
      },
      config: {
        systemInstruction: RFQ_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: rfqResponseSchema,
        temperature: 0.1, // Low temperature for high precision and zero hallucination
      },
    });

    const rawText = response.text;

    if (!rawText || rawText.trim() === '') {
      res.status(422).json({
        error: 'The document was analyzed, but no RFQ information could be identified. Please ensure the PDF contains readable text or quotation tables.',
        code: 'EMPTY_RESPONSE',
      });
      return;
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(rawText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response JSON:', parseError);
      res.status(500).json({
        error: 'We could not analyze this document. The extracted data could not be parsed. Please try again.',
        code: 'PARSE_ERROR',
      });
      return;
    }

    const processingTimeMs = Date.now() - startTime;

    res.status(200).json({
      success: true,
      data: parsedData,
      metadata: {
        fileName: fileName || 'RFQ-Document.pdf',
        fileSizeBytes: fileSizeBytes || 0,
        extractedAt: new Date().toISOString(),
        modelUsed: 'gemini-3.8-flash',
        processingTimeMs,
      },
    });
  } catch (error: any) {
    console.error('Error during RFQ analysis:', error);
    const errorMessage = error?.message || '';

    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
      res.status(429).json({
        error: 'Gemini API quota or rate limit reached. Please wait a moment and try again.',
        code: 'RATE_LIMITED',
      });
      return;
    }

    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('unauthenticated')) {
      res.status(503).json({
        error: 'The Gemini API key is invalid. Please verify GEMINI_API_KEY in Vercel Settings > Environment Variables.',
        code: 'INVALID_API_KEY',
      });
      return;
    }

    res.status(500).json({
      error: error?.message || "We couldn't analyze this document. Please try again or check that the PDF is not password protected.",
      code: 'GEMINI_ERROR',
      details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined,
    });
  }
}

// Vercel Serverless Function Default Export
export default async function handler(req: any, res: any) {
  return handleAnalyzeRfq(req, res);
}
