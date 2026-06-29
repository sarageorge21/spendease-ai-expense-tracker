const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const isOpenAIConfigured = process.env.OPENAI_API_KEY && 
                            process.env.OPENAI_API_KEY !== 'your_openai_key_here' && 
                            process.env.OPENAI_API_KEY.trim() !== '';

const isGeminiConfigured = process.env.GEMINI_API_KEY && 
                            process.env.GEMINI_API_KEY !== 'your_gemini_key_here' && 
                            process.env.GEMINI_API_KEY.trim() !== '';

let openai = null;
let geminiModel = null;
let activeProvider = null;

if (isGeminiConfigured) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  activeProvider = 'gemini';
} else if (isOpenAIConfigured) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  activeProvider = 'openai';
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `receipt_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files allowed'));
}});

// Ensure uploads directory exists
const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

router.post('/scan', auth, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Dynamic import of Tesseract.js (ESM compatible)
    const Tesseract = require('tesseract.js');
    const { data: { text } } = await Tesseract.recognize(req.file.path, 'eng', { logger: () => {} });

    // Parse extracted text for expense data (LLM-based with local fallback)
    let parsed = null;
    if (activeProvider) {
      try {
        const prompt = `Analyze the following raw OCR text extracted from a financial receipt image.
Extract the transaction details:
1. title: The merchant/vendor name (e.g. "Walmart", "McDonald's", "Shell"). If not found, use a reasonable name based on the text. Max 3 words.
2. amount: The grand total amount as a float number (e.g. 1540.50). Make sure to find the actual grand total, not subtotal or tax.
3. date: The transaction date in ISO format (YYYY-MM-DD). If no year is found, assume 2026. If no date is found, use today's date (${new Date().toISOString().slice(0, 10)}).
4. category: Assign the best matching category from: 'Food', 'Shopping', 'Bills', 'Transport', 'Entertainment', 'Health'.

Raw OCR Text:
"""
${text}
"""

Return your response in standard JSON format:
{
  "title": "Merchant Name",
  "amount": 123.45,
  "date": "YYYY-MM-DD",
  "category": "Food" | "Shopping" | "Bills" | "Transport" | "Entertainment" | "Health"
}
Do not include any markdown formatting, backticks, or extra text. Just the JSON object.`;

        if (activeProvider === 'openai' && openai) {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          });
          parsed = JSON.parse(completion.choices[0].message.content);
        } else if (activeProvider === 'gemini' && geminiModel) {
          const result = await geminiModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2
            }
          });
          parsed = JSON.parse(result.response.text());
        }
      } catch (err) {
        console.error('AI OCR Parsing Error:', err.message);
        parsed = parseReceiptText(text);
      }
    } else {
      parsed = parseReceiptText(text);
    }

    res.json({
      success: true,
      data: {
        rawText: text,
        parsed,
        receiptUrl: `/uploads/${req.file.filename}`,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Try to find amount – look for currency patterns
  const amountPatterns = [
    /(?:total|amount|grand total|net amount|bill amount)[:\s]*[₹$£€]?\s*([\d,]+\.?\d*)/i,
    /[₹$£€]\s*([\d,]+\.?\d*)/,
    /([\d,]+\.\d{2})\s*(?:only)?$/im,
  ];
  let amount = null;
  for (const pat of amountPatterns) {
    const m = text.match(pat);
    if (m) { amount = parseFloat(m[1].replace(/,/g, '')); break; }
  }

  // Try to find date
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
    /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4})/i,
  ];
  let date = null;
  for (const pat of datePatterns) {
    const m = text.match(pat);
    if (m) { date = m[1]; break; }
  }

  // Try to find merchant/title from first few non-empty lines
  const title = lines.slice(0, 3).find(l => l.length > 3 && !/^\d/.test(l)) || 'Receipt Expense';

  // Guess category from keywords
  const lower = text.toLowerCase();
  let category = 'Shopping';
  if (/restaurant|cafe|food|pizza|burger|dine|eat|meal|hotel/.test(lower)) category = 'Food';
  else if (/medical|pharmacy|hospital|clinic|health|doctor/.test(lower)) category = 'Health';
  else if (/uber|ola|taxi|fuel|petrol|metro|bus|train|travel/.test(lower)) category = 'Transport';
  else if (/amazon|flipkart|mall|store|shop|purchase/.test(lower)) category = 'Shopping';
  else if (/electricity|water|gas|internet|wifi|bill|utility/.test(lower)) category = 'Bills';
  else if (/netflix|prime|spotify|movie|cinema|entertainment/.test(lower)) category = 'Entertainment';

  return { title, amount, date, category };
}

module.exports = router;
