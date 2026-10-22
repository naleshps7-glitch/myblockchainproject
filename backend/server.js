/**
 * BlockAuth - PDF Similarity Backend Server
 * 
 * Provides an API endpoint to:
 *  - Accept 2+ PDF file uploads
 *  - Extract text using pdf-parse
 *  - Compute cosine similarity between documents
 *  - Return similarity score and verdict
 */

const express  = require('express');
const cors     = require('cors');
const multer   = require('multer');
const pdfParse = require('pdf-parse');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 5001;

// ── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['POST', 'GET'],
}));
app.use(express.json());

// ── File Upload (in-memory, no disk storage) ─────────────────────────────────

const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB per file
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// ── Text Utilities ────────────────────────────────────────────────────────────

/**
 * Normalise extracted text: lowercase, remove punctuation/extra spaces.
 */
function normalise(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a term-frequency map from a space-separated string.
 */
function termFrequency(text) {
  const freq = {};
  const words = text.split(' ').filter(Boolean);
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return freq;
}

/**
 * Compute cosine similarity between two TF maps.
 */
function cosineSimilarity(tf1, tf2) {
  const vocab = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);

  let dot = 0, mag1 = 0, mag2 = 0;
  for (const term of vocab) {
    const v1 = tf1[term] || 0;
    const v2 = tf2[term] || 0;
    dot  += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  }

  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

/**
 * Average pairwise cosine similarity among N documents.
 */
function averageSimilarity(texts) {
  const tfs  = texts.map(t => termFrequency(normalise(t)));
  const n    = tfs.length;
  let   sum  = 0;
  let   pairs = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      sum += cosineSimilarity(tfs[i], tfs[j]);
      pairs++;
    }
  }
  return pairs > 0 ? sum / pairs : 0;
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'BlockAuth PDF Backend' });
});

/**
 * POST /api/compare-pdfs
 * Multipart form-data, field name: "pdfs" (2–10 files)
 * Returns: { similarity, percentage, verdict, fileNames }
 */
app.post('/api/compare-pdfs', upload.array('pdfs', 10), async (req, res) => {
  try {
    const files = req.files;

    // Validation
    if (!files || files.length < 2) {
      return res.status(400).json({
        error: 'Please upload at least 2 PDF files for comparison.',
      });
    }

    // Extract text from each PDF
    const texts    = [];
    const fileNames = [];
    const errors   = [];

    for (const file of files) {
      fileNames.push(file.originalname);
      try {
        const data = await pdfParse(file.buffer, {
          // Disable page-render; we only want text
          pagerender: () => '',
        });

        const text = data.text || '';

        // Reject password-protected or empty PDFs
        if (text.trim().length === 0) {
          errors.push(
            `"${file.originalname}" appears to be empty, scanned (image-only), or password-protected. ` +
            `Text extraction returned no content.`
          );
        } else {
          texts.push(text);
        }
      } catch (err) {
        errors.push(
          `Failed to read "${file.originalname}": ${err.message}. ` +
          `The file may be corrupted or password-protected.`
        );
      }
    }

    // Surface extraction errors without inventing a score
    if (errors.length > 0) {
      return res.status(422).json({
        error: 'One or more PDFs could not be processed.',
        details: errors,
      });
    }

    if (texts.length < 2) {
      return res.status(422).json({
        error: 'Fewer than 2 PDFs produced usable text. Cannot compare.',
      });
    }

    // Compute similarity
    const similarity  = averageSimilarity(texts);
    const percentage  = Math.round(similarity * 100 * 100) / 100; // 2 decimal places
    const threshold   = 85;
    const verdict     = percentage > threshold
      ? 'copied'
      : 'different';

    return res.json({
      similarity,
      percentage,
      threshold,
      verdict,
      message:
        verdict === 'copied'
          ? `Copied — Documents are highly similar (${percentage}%).`
          : `Does Not Match — Similarity is below the threshold (${percentage}%).`,
      fileNames,
      filesCompared: texts.length,
    });

  } catch (err) {
    console.error('Comparison error:', err);
    res.status(500).json({ error: 'Internal server error during comparison.' });
  }
});

// ── Error Handler ─────────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 20 MB per file.' });
  }
  res.status(400).json({ error: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀  BlockAuth PDF Backend running on http://localhost:${PORT}`);
  console.log(`    Health check: http://localhost:${PORT}/health`);
  console.log(`    Compare PDFs: POST http://localhost:${PORT}/api/compare-pdfs\n`);
});
