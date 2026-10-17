import type { Request, Response } from 'express';
import { Mistral } from '@mistralai/mistralai';

const RFQ_SYSTEM_INSTRUCTION = `You are an industrial RFQ document extraction system powered by Mistral AI.

Analyze the entire supplied document text and OCR output.

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

Return ONLY a valid JSON object conforming to this exact JSON schema:
{
  "customer": {
    "companyName": "string or null",
    "address": "string or null",
    "contactName": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "country": "string or null",
    "customerReference": "string or null"
  },
  "rfq": {
    "rfqNumber": "string or null",
    "rfqDate": "string or null",
    "dueDate": "string or null",
    "currency": "string or null",
    "requestedDeliveryDate": "string or null",
    "deliveryLocation": "string or null",
    "incoterms": "string or null"
  },
  "equipment": [
    {
      "type": "string or null",
      "model": "string or null",
      "manufacturer": "string or null",
      "serialNumber": "string or null",
      "tagNumber": "string or null",
      "description": "string or null",
      "otherIdentification": "string or null"
    }
  ],
  "lineItems": [
    {
      "lineNumber": "string",
      "partNumber": "string or null",
      "customerPartNumber": "string or null",
      "drawingNumber": "string or null",
      "description": "string or null",
      "quantity": "string or number or null",
      "unit": "string or null",
      "equipmentSerialNumber": "string or null",
      "revision": "string or null",
      "material": "string or null",
      "requestedDeliveryDate": "string or null",
      "notes": "string or null"
    }
  ],
  "requirements": {
    "technical": ["string"],
    "commercial": ["string"],
    "certifications": ["string"],
    "inspection": ["string"],
    "packaging": ["string"],
    "shipping": ["string"],
    "specialInstructions": ["string"]
  },
  "additionalInformation": ["string"],
  "reviewFlags": ["string"]
}`;

export async function handleAnalyzeRfq(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.MISTRAL_API_KEY;

    // Guardrail: Check Mistral API key presence (configured in Vercel environment variables)
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_mistral_api_key_here') {
      res.status(503).json({
        error: 'The Mistral API is not configured. Please configure MISTRAL_API_KEY in Vercel environment variables.',
        code: 'KEY_NOT_CONFIGURED',
      });
      return;
    }

    const { pdfBase64, fileName, fileSizeBytes } = req.body;

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

    // Initialize Mistral AI SDK
    const client = new Mistral({
      apiKey,
    });

    let documentContent = '';

    // Step 1: Use Mistral OCR model to extract tables and formatted content from PDF
    try {
      const ocrResponse = await client.ocr.process({
        model: 'mistral-ocr-latest',
        document: {
          type: 'document_url',
          documentUrl: `data:application/pdf;base64,${trimmedBase64}`,
        },
      });

      if (ocrResponse && ocrResponse.pages && ocrResponse.pages.length > 0) {
        documentContent = ocrResponse.pages
          .map((page, idx) => `--- PAGE ${idx + 1} ---\n${page.markdown || ''}`)
          .join('\n\n');
      }
    } catch (ocrError: any) {
      console.warn('Mistral OCR endpoint warning, attempting direct extraction:', ocrError?.message);
    }

    // If OCR returned empty content or was not available, extract using Chat with Pixtral or fallback text
    if (!documentContent.trim()) {
      try {
        const chatWithPdf = await client.chat.complete({
          model: 'mistral-large-latest',
          responseFormat: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: RFQ_SYSTEM_INSTRUCTION,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all customer info, equipment tags, serial numbers, drawing numbers, and line items from this PDF document into the structured quotation JSON format.',
                },
                {
                  type: 'image_url',
                  imageUrl: `data:application/pdf;base64,${trimmedBase64}`,
                },
              ] as any,
            },
          ],
        });

        const directText = typeof chatWithPdf.choices?.[0]?.message?.content === 'string'
          ? chatWithPdf.choices[0].message.content
          : '';

        if (directText) {
          const parsed = JSON.parse(directText);
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
      } catch (fallbackError) {
        console.error('Direct extraction also encountered an issue:', fallbackError);
      }
    }

    if (!documentContent.trim()) {
      res.status(422).json({
        error: 'The document was analyzed, but no RFQ information could be identified. Please ensure the PDF contains readable text or quotation tables.',
        code: 'EMPTY_RESPONSE',
      });
      return;
    }

    // Step 2: Use Mistral Large to extract structured RFQ JSON from the OCR markdown
    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      responseFormat: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: RFQ_SYSTEM_INSTRUCTION,
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
      parsedData = JSON.parse(rawText);
    } catch (parseError) {
      console.error('Failed to parse Mistral response JSON:', parseError);
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
        error: 'The Mistral API key is invalid or not authorized. Please check MISTRAL_API_KEY in Vercel.',
        code: 'INVALID_API_KEY',
      });
      return;
    }

    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Rate limit')) {
      res.status(429).json({
        error: 'Mistral API rate limit or quota reached. Please wait a moment and try again.',
        code: 'RATE_LIMITED',
      });
      return;
    }

    res.status(500).json({
      error: "We couldn't analyze this document. Please try again or check that the PDF is not password protected.",
      code: 'MISTRAL_ERROR',
      details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined,
    });
  }
}
