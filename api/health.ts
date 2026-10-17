import type { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const hasKey = Boolean(
    process.env.MISTRAL_API_KEY &&
    process.env.MISTRAL_API_KEY.trim() !== '' &&
    process.env.MISTRAL_API_KEY !== 'your_mistral_api_key_here'
  );

  res.status(200).json({
    status: 'ok',
    hasMistralKey: hasKey,
    runtime: 'vercel-serverless',
    timestamp: new Date().toISOString(),
  });
}
