const router = require('express').Router();
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Parse raw OCR text from a receipt image.
 * Extracts: amount (TND), date, description (merchant / first meaningful line).
 */
function parseReceiptText(text) {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  // ── Amount ────────────────────────────────────────────────────────────────
  // Matches patterns like: TOTAL 45.500, Total: 45,500, 45.500 TND, TND 45.500
  const amountPatterns = [
    /(?:total|montant|amount|net\s*à\s*payer|net\s*a\s*payer)[^\d]*([\d,. ]+)/i,
    /([\d,. ]+)\s*(?:tnd|dt|dinar)/i,
    /(?:tnd|dt|dinar)\s*([\d,. ]+)/i,
  ];

  let amount = null;
  for (const pattern of amountPatterns) {
    for (const line of lines) {
      const m = line.match(pattern);
      if (m) {
        const raw = m[1].replace(/\s/g, '').replace(',', '.');
        const parsed = parseFloat(raw);
        if (!isNaN(parsed) && parsed > 0 && parsed < 100000) {
          amount = parsed;
          break;
        }
      }
    }
    if (amount !== null) break;
  }

  // Fallback: largest number found in the text that looks like a price
  if (amount === null) {
    const allNums = [];
    for (const line of lines) {
      const matches = line.matchAll(/\b(\d{1,6}[.,]\d{1,3})\b/g);
      for (const m of matches) {
        const v = parseFloat(m[1].replace(',', '.'));
        if (!isNaN(v) && v > 0) allNums.push(v);
      }
    }
    if (allNums.length) amount = Math.max(...allNums);
  }

  // ── Date ──────────────────────────────────────────────────────────────────
  const datePatterns = [
    /(\d{4}[-\/]\d{2}[-\/]\d{2})/,           // 2025-06-15
    /(\d{2}[-\/]\d{2}[-\/]\d{4})/,           // 15/06/2025
    /(\d{2}[-\/]\d{2}[-\/]\d{2})/,           // 15/06/25
  ];

  let date = null;
  for (const pattern of datePatterns) {
    for (const line of lines) {
      const m = line.match(pattern);
      if (m) {
        const raw = m[1];
        // Normalize to YYYY-MM-DD
        if (/^\d{4}/.test(raw)) {
          date = raw.replace(/\//g, '-');
        } else {
          const parts = raw.split(/[-\/]/);
          const year = parseInt(parts[2]) < 100 ? `20${parts[2]}` : parts[2];
          date = `${year}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
        }
        // Sanity check
        if (isNaN(Date.parse(date))) date = null;
        else break;
      }
    }
    if (date) break;
  }

  if (!date) date = new Date().toISOString().substring(0, 10);

  // ── Description (merchant name) ───────────────────────────────────────────
  // Use the first non-numeric, non-empty line that's at least 3 chars
  const skipPatterns = /^(\d[\d\s.,:/\-]+)$|^(tnd|dt|total|date|heure|time|vat|tva|ticket|facture|receipt|recu)$/i;
  const description = lines.find(l => l.length >= 3 && !skipPatterns.test(l)) || 'Receipt';

  return { amount, date, description };
}

// POST /receipts/scan
// Body: { image: "<base64 string>" }
router.post('/scan', async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'image (base64) is required' });
  }

  // Strip data URI prefix if present: "data:image/jpeg;base64,..."
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

  // Write to a temp file so Tesseract can read it
  const tmpPath = path.join(os.tmpdir(), `receipt_${Date.now()}.jpg`);

  try {
    fs.writeFileSync(tmpPath, Buffer.from(base64Data, 'base64'));

    const worker = await createWorker('eng+fra+ara', 1, {
      logger: () => {}, // silence progress logs
    });

    const { data: { text } } = await worker.recognize(tmpPath);
    await worker.terminate();

    const result = parseReceiptText(text);
    result.rawText = text; // send raw text too so frontend can debug

    res.json(result);
  } catch (err) {
    console.error('OCR error:', err.message);
    res.status(500).json({ error: 'OCR processing failed', detail: err.message });
  } finally {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
  }
});

module.exports = router;
