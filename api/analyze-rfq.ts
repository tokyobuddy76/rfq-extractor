import type { Request, Response } from 'express';
import { Mistral } from '@mistralai/mistralai';

// Vercel Serverless Function Configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export const maxDuration = 60; // Up to 60s for multi-page OCR & LLM processing

const RFQ_SYSTEM_INSTRUCTION = `You are an industrial RFQ document extraction system powered by Mistral AI.

Analyze the entire supplied document text, tables, and OCR content.

Extract information exactly as written in the document.

Pay particular attention to tables, line items, part numbers, drawing numbers, equipment serial numbers, and quantities.

A document may contain multiple equipment serial numbers and multiple requested parts. Preserve the relationship between equipment and parts whenever the document makes that relationship clear.

Never infer an identifier that is not visible in the document.

Never invent missing values.

If a field is absent, return null or empty string.

Do not change punctuation, leading zeros, hyphens, or capitalization in part numbers, drawing numbers, or serial numbers.

Distinguish part numbers from drawing numbers whenever the document identifies them separately.

Return every requested line item, not merely the first one.

Capture important technical or commercial information that does not fit the predefined schema under additionalInformation.

Return ONLY a valid JSON object without surrounding markdown code fences or conversational text.`;

const JSON_SCHEMA_TEMPLATE = `{
  "customer": {
    "companyName": null,
    "address": null,
    "contactName": null,
    "email": null,
    "phone": null,
    "country": null,
    "customerReference": null
  },
  "rfq": {
    "rfqNumber": null,
    "rfqDate": null,
    "dueDate": null,
    "currency": null,
    "requestedDeliveryDate": null,
    "deliveryLocation": null,
    "incoterms": null
  },
  "equipment": [
    {
      "type": null,
      "model": null,
      "manufacturer": null,
      "serialNumber": null,
      "tagNumber": null,
      "description": null,
      "otherIdentification": null
    }
  ],
  "lineItems": [
    {
      "lineNumber": "1",
      "partNumber": null,
      "customerPartNumber": null,
      "drawingNumber": null,
      "description": null,
      "quantity": null,
      "unit": null,
      "equipmentSerialNumber": null,
      "revision": null,
      "material": null,
      "requestedDeliveryDate": null,
      "notes": null
    }
  ],
  "requirements": {
    "technical": [],
    "commercial": [],
    "certifications": [],
    "inspection": [],
    "packaging": [],
    "shipping": [],
    "specialInstructions": []
  },
  "additionalInformation": [],
  "reviewFlags": []
}`;

function cleanAndParseJson(text: string): any {
  let cleaned = text.trim();
  // Strip ```json and ``` code blocks if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  // If there are leading or trailing characters outside { ... }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

export async function handleAnalyzeRfq(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();

  // Set CORS headers
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
      process.env.MISTRAL_API_KEY &&
      process.env.MISTRAL_API_KEY.trim() !== '' &&
      process.env.MISTRAL_API_KEY !== 'your_mistral_api_key_here'
    );
    res.status(200).json({
      status: 'ok',
      endpoint: '/api/analyze-rfq',
      hasMistralKey: hasKey,
      message: hasKey
        ? 'Mistral API key is configured. Send a POST request with { pdfBase64: string } to analyze RFQs.'
        : 'MISTRAL_API_KEY is not configured. Please add MISTRAL_API_KEY to your Vercel Environment Variables.',
    });
    return;
  }

  try {
    const apiKey = process.env.MISTRAL_API_KEY;

    // Guardrail: Check Mistral API key presence
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_mistral_api_key_here') {
      res.status(503).json({
        error: 'The Mistral API is not configured. Please configure MISTRAL_API_KEY in Vercel environment variables (Settings > Environment Variables).',
        code: 'KEY_NOT_CONFIGURED',
      });
      return;
    }

    const { pdfBase64, fileName, fileSizeBytes } = req.body || {};

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

    // Convert base64 string to buffer for Mistral Files upload
    const fileBuffer = Buffer.from(trimmedBase64, 'base64');

    // Initialize Mistral AI SDK
    const client = new Mistral({
      apiKey,
    });

    let documentContent = '';
    let uploadedFileId: string | null = null;

    // Step 1: Upload PDF to Mistral Files API and run Mistral OCR
    try {
      const uploadedFile = await client.files.upload({
        file: {
          fileName: fileName || 'rfq_document.pdf',
          content: fileBuffer,
        },
        purpose: 'ocr' as any,
      });

      if (uploadedFile && uploadedFile.id) {
        uploadedFileId = uploadedFile.id;

        const ocrResponse = await client.ocr.process({
          model: 'mistral-ocr-latest',
          document: {
            type: 'file',
            fileId: uploadedFile.id,
          },
        });

        if (ocrResponse && ocrResponse.pages && ocrResponse.pages.length > 0) {
          documentContent = ocrResponse.pages
            .map((page, idx) => `--- PAGE ${idx + 1} ---\n${page.markdown || ''}`)
            .join('\n\n');
        }
      }
    } catch (ocrError: any) {
      console.warn('Mistral Files / OCR processing note:', ocrError?.message);
    } finally {
      // Clean up uploaded temp file from Mistral storage
      if (uploadedFileId) {
        try {
          await client.files.delete({ fileId: uploadedFileId });
        } catch (cleanupErr) {
          // Non-blocking cleanup error
        }
      }
    }

    // Step 2: Fallback if OCR was not available or produced empty text
    if (!documentContent.trim()) {
      try {
        const directChat = await client.chat.complete({
          model: 'mistral-large-latest',
          responseFormat: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `${RFQ_SYSTEM_INSTRUCTION}\n\nConform exactly to this JSON schema:\n${JSON_SCHEMA_TEMPLATE}`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all customer info, equipment tags, serial numbers, drawing numbers, and line items from this document into the JSON schema.',
                },
                {
                  type: 'image_url',
                  imageUrl: `data:application/pdf;base64,${trimmedBase64}`,
                },
              ] as any,
            },
          ],
        });

        const rawContent = typeof directChat.choices?.[0]?.message?.content === 'string'
          ? directChat.choices[0].message.content
          : '';

        if (rawContent) {
          const parsed = cleanAndParseJson(rawContent);
          const processingTimeMs = Date.now() - startTime;
          res.status(200).json({
            success: true,
            data: parsed,
            metadata: {
              fileName: fileName || 'RFQ-Document.pdf',
              fileSizeBytes: fileSizeBytes || 0,
              extractedAt: new Date().toISOString(),
              modelUsed: 'mistral-large-latest',
              processingTimeMs,
            },
          });
          return;
        }
      } catch (fallbackErr: any) {
        console.error('Direct extraction fallback error:', fallbackErr?.message);
      }
    }

    if (!documentContent.trim()) {
      res.status(422).json({
        error: 'The document was analyzed, but no RFQ information could be identified. Please ensure the PDF contains readable text or quotation tables.',
        code: 'EMPTY_RESPONSE',
      });
      return;
    }

    // Step 3: Extract structured quotation data using Mistral Large
    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      responseFormat: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: `${RFQ_SYSTEM_INSTRUCTION}\n\nYou must return a valid JSON object matching this schema:\n${JSON_SCHEMA_TEMPLATE}`,
        },
        {
          role: 'user',
          content: `Extract the RFQ quotation details, line items, and equipment serials from this OCR-extracted document content:\n\n${documentContent}`,
        },
      ],
    });

    const rawText = typeof chatResponse.choices?.[0]?.message?.content === 'string'
      ? chatResponse.choices[0].message.content
      : '';

    if (!rawText || rawText.trim() === '') {
      res.status(422).json({
        error: 'The document was analyzed, but no RFQ information could be identified. Please ensure the PDF contains readable text or quotation tables.',
        code: 'EMPTY_RESPONSE',
      });
      return;
    }

    let parsedData: any;
    try {
      parsedData = cleanAndParseJson(rawText);
    } catch (parseError) {
      console.error('Failed to parse Mistral response JSON:', parseError, 'Raw response:', rawText);
      res.status(500).json({
        error: "We couldn't analyze this document. The extracted data could not be parsed. Please try again.",
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
        modelUsed: 'mistral-ocr-latest / mistral-large-latest',
        processingTimeMs,
      },
    });
  } catch (error: any) {
    console.error('Error during Mistral RFQ analysis:', error);
    const errorMessage = error?.message || '';

    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('API key')) {
      res.status(503).json({
        error: 'The Mistral API key is invalid or unauthorized. Please verify MISTRAL_API_KEY in Vercel Settings > Environment Variables.',
        code: 'INVALID_API_KEY',
      });
      return;
    }

    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Rate limit')) {
      res.status(429).json({
        error: 'Mistral API rate limit or quota reached. Please check your Mistral account balance and try again.',
        code: 'RATE_LIMITED',
      });
      return;
    }

    res.status(500).json({
      error: "We couldn't analyze this document. Please try again or verify that the PDF is not password-protected.",
      code: 'MISTRAL_ERROR',
      details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined,
    });
  }
}

// Vercel Serverless Function Default Export
export default async function handler(req: any, res: any) {
  return handleAnalyzeRfq(req, res);
}
