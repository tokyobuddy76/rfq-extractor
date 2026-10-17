import type { Request, Response } from 'express';
import { Mistral } from '@mistralai/mistralai';
import zlib from 'node:zlib';

// Vercel Serverless Function Configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export const maxDuration = 60; // 60s timeout for multi-page extraction

const RFQ_SYSTEM_INSTRUCTION = `You are an industrial RFQ document extraction system powered by Mistral AI.

Analyze the entire supplied document text, tables, and equipment schedules.

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

Return ONLY a valid JSON object conforming to the required schema without markdown code fences or conversational text.`;

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
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

/**
 * Pure Node.js zero-dependency PDF text extractor.
 * Handles both uncompressed text and FlateDecode streams using built-in zlib.
 * Never fails due to missing canvas, workers, or font assets.
 */
function extractPureTextFromPdf(buffer: Buffer): string {
  const textChunks: string[] = [];
  const raw = buffer.toString('latin1');

  // Match all PDF streams
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(raw)) !== null) {
    const streamContent = match[1];
    let decoded = '';

    try {
      decoded = zlib.inflateSync(Buffer.from(streamContent, 'latin1')).toString('latin1');
    } catch {
      decoded = streamContent;
    }

    if (decoded && (decoded.includes('Tj') || decoded.includes('TJ'))) {
      // Extract standard single string operator: (text) Tj
      const tjRegex = /\(([^)]+)\)\s*Tj/g;
      let tj: RegExpExecArray | null;
      while ((tj = tjRegex.exec(decoded)) !== null) {
        if (tj[1] && tj[1].trim()) textChunks.push(tj[1].trim());
      }

      // Extract array text operator: [(text) 20 (more text)] TJ
      const arrRegex = /\[([^\]]+)\]\s*TJ/g;
      let arrMatch: RegExpExecArray | null;
      while ((arrMatch = arrRegex.exec(decoded)) !== null) {
        const parts = arrMatch[1].match(/\(([^)]+)\)/g);
        if (parts && parts.length > 0) {
          const joined = parts.map((p) => p.slice(1, -1)).join('');
          if (joined.trim()) textChunks.push(joined.trim());
        }
      }
    }
  }

  return textChunks.join('\n');
}

/**
 * Call Mistral OCR directly via REST API with base64 data URL
 */
async function callMistralOcrApi(apiKey: string, base64Pdf: string): Promise<string> {
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        document_url: `data:application/pdf;base64,${base64Pdf}`,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mistral OCR API returned HTTP ${response.status}: ${errorBody}`);
  }

  const json = await response.json();
  if (json && json.pages && Array.isArray(json.pages)) {
    return json.pages
      .map((p: any, idx: number) => `--- PAGE ${idx + 1} ---\n${p.markdown || ''}`)
      .join('\n\n');
  }

  return '';
}

export async function handleAnalyzeRfq(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Diagnostic GET endpoint
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
        ? 'Mistral API key is configured. Ready to accept POST requests.'
        : 'MISTRAL_API_KEY is not configured. Please add MISTRAL_API_KEY to your Vercel Environment Variables.',
    });
    return;
  }

  try {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_mistral_api_key_here') {
      res.status(503).json({
        error: 'The Mistral API is not configured. Please configure MISTRAL_API_KEY in Vercel environment variables (Settings > Environment Variables).',
        code: 'KEY_NOT_CONFIGURED',
      });
      return;
    }

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

    const trimmedBase64 = pdfBase64.replace(/\s/g, '');
    if (!trimmedBase64.startsWith('JVBERi')) {
      res.status(400).json({
        error: 'The uploaded file does not appear to be a valid PDF document. Please verify the file and try again.',
        code: 'INVALID_PDF_FORMAT',
      });
      return;
    }

    if (trimmedBase64.length > 35 * 1024 * 1024) {
      res.status(413).json({
        error: 'The uploaded PDF exceeds the supported file size limit (20 MB). Please reduce file size or select another document.',
        code: 'FILE_TOO_LARGE',
      });
      return;
    }

    const fileBuffer = Buffer.from(trimmedBase64, 'base64');
    let documentContent = '';
    let extractionSource = '';
    const diagnostics: string[] = [];

    // Strategy 1: Fast zero-dependency native PDF text extraction
    try {
      const pureText = extractPureTextFromPdf(fileBuffer);
      if (pureText && pureText.length > 40) {
        documentContent = pureText;
        extractionSource = 'native-pdf-text';
      } else {
        diagnostics.push(`Native PDF text extractor found ${pureText ? pureText.length : 0} characters.`);
      }
    } catch (pureErr: any) {
      diagnostics.push(`Native PDF text extractor notice: ${pureErr?.message}`);
    }

    // Strategy 2: If native text extraction yielded little text, try Mistral OCR API
    if (!documentContent) {
      try {
        const ocrText = await callMistralOcrApi(apiKey, trimmedBase64);
        if (ocrText && ocrText.length > 20) {
          documentContent = ocrText;
          extractionSource = 'mistral-ocr-api';
        } else {
          diagnostics.push('Mistral OCR API returned empty pages.');
        }
      } catch (ocrErr: any) {
        diagnostics.push(`Mistral OCR API notice: ${ocrErr?.message}`);
      }
    }

    // Strategy 3: Try Mistral SDK files upload + OCR if previous direct REST call failed
    if (!documentContent) {
      const client = new Mistral({ apiKey });
      let uploadedFileId: string | null = null;
      try {
        const uploadedFile = await client.files.upload({
          file: {
            fileName: fileName || 'rfq_document.pdf',
            content: new Uint8Array(fileBuffer),
          },
          purpose: 'ocr' as any,
        });

        if (uploadedFile && uploadedFile.id) {
          uploadedFileId = uploadedFile.id;
          const ocrRes = await client.ocr.process({
            model: 'mistral-ocr-latest',
            document: {
              type: 'file',
              fileId: uploadedFile.id,
            },
          });

          if (ocrRes && ocrRes.pages && ocrRes.pages.length > 0) {
            documentContent = ocrRes.pages
              .map((p, idx) => `--- PAGE ${idx + 1} ---\n${p.markdown || ''}`)
              .join('\n\n');
            extractionSource = 'mistral-sdk-ocr';
          }
        }
      } catch (sdkOcrErr: any) {
        diagnostics.push(`Mistral SDK OCR notice: ${sdkOcrErr?.message}`);
      } finally {
        if (uploadedFileId) {
          try {
            await client.files.delete({ fileId: uploadedFileId });
          } catch {
            // ignore
          }
        }
      }
    }

    // If all strategies failed, report detailed diagnostics so user knows why
    if (!documentContent || documentContent.trim().length === 0) {
      res.status(422).json({
        error: 'The document was analyzed, but no text or quotation tables could be identified.',
        code: 'EMPTY_RESPONSE',
        diagnostics: diagnostics.join(' | '),
        hint: 'If your PDF is a scanned image or photograph, please verify that your Mistral account has OCR enabled, or provide a standard digital PDF with selectable text.',
      });
      return;
    }

    // Strategy 4: Pass the extracted document text into Mistral Large
    const client = new Mistral({ apiKey });
    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      responseFormat: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: `${RFQ_SYSTEM_INSTRUCTION}\n\nYou must return a valid JSON object matching this schema exactly:\n${JSON_SCHEMA_TEMPLATE}`,
        },
        {
          role: 'user',
          content: `Extract the RFQ quotation details, line items, and equipment serials from this RFQ document content:\n\n${documentContent}`,
        },
      ],
    });

    const rawText = typeof chatResponse.choices?.[0]?.message?.content === 'string'
      ? chatResponse.choices[0].message.content
      : '';

    if (!rawText || rawText.trim() === '') {
      res.status(422).json({
        error: 'Mistral Large model returned an empty quotation response. Please try again.',
        code: 'EMPTY_RESPONSE',
        diagnostics: diagnostics.join(' | '),
      });
      return;
    }

    let parsedData: any;
    try {
      parsedData = cleanAndParseJson(rawText);
    } catch (parseError: any) {
      console.error('Failed to parse Mistral response JSON:', parseError, 'Raw response:', rawText);
      res.status(500).json({
        error: "We couldn't analyze this document. The extracted data could not be parsed into JSON. Please try again.",
        code: 'PARSE_ERROR',
        rawSample: rawText.slice(0, 300),
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
        modelUsed: `mistral-large-latest (${extractionSource})`,
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
      error: error?.message || "We couldn't analyze this document. Please try again or verify that the PDF is not password-protected.",
      code: 'MISTRAL_ERROR',
      details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined,
    });
  }
}

// Vercel Serverless Function Default Export
export default async function handler(req: any, res: any) {
  return handleAnalyzeRfq(req, res);
}
