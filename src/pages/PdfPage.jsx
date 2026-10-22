import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = 'http://localhost:5001';
const THRESHOLD   = 85;

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function PdfPage() {
  const navigate   = useNavigate();
  const inputRef   = useRef(null);

  const [files,    setFiles]    = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);

  // ── File handling ─────────────────────────────────────────────────────────

  function addFiles(incoming) {
    const pdfs = Array.from(incoming).filter(f => f.type === 'application/pdf');
    if (pdfs.length !== incoming.length) {
      setError('Only PDF files are accepted. Non-PDF files were ignored.');
    }
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name + f.size));
      const fresh = pdfs.filter(f => !names.has(f.name + f.size));
      return [...prev, ...fresh];
    });
    setResult(null);
  }

  function removeFile(idx) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setResult(null);
    setError(null);
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  // ── Compare ───────────────────────────────────────────────────────────────

  async function handleCompare() {
    setError(null);
    setResult(null);

    if (files.length < 2) {
      setError('Please upload at least 2 PDF files to compare.');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      files.forEach(f => form.append('pdfs', f));

      // Attempt to connect to backend
      let resp;
      try {
        resp = await fetch(`${BACKEND_URL}/api/compare-pdfs`, {
          method: 'POST',
          body:   form,
        });
      } catch {
        throw new Error(
          'Cannot connect to the PDF backend. ' +
          'Make sure the Node.js server is running: cd backend && npm install && npm start'
        );
      }

      const data = await resp.json();

      if (!resp.ok) {
        const msg = data.details
          ? data.error + '\n' + data.details.join('\n')
          : data.error || 'Server error';
        throw new Error(msg);
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isHigh = result && result.percentage > THRESHOLD;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="breadcrumb">
          <span onClick={() => navigate('/')}>🏠 Home</span>
          <span>›</span>
          <span>PDF Verification</span>
        </div>
        <h1>PDF Similarity Checker</h1>
        <p>Upload two or more PDF documents to measure their textual similarity.</p>
      </div>

      {/* Upload zone */}
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{ marginBottom: 20 }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={e => addFiles(e.target.files)}
          onClick={e => e.stopPropagation()}
          style={{ display: 'none' }}
          id="input-pdf-upload"
        />
        <div className="upload-icon">📁</div>
        <h3>Drop PDF files here or click to browse</h3>
        <p>Accepts multiple PDF files · Max 20 MB per file</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="file-list" style={{ marginBottom: 24 }}>
          {files.map((f, i) => (
            <div className="file-item" key={i}>
              <span>📄</span>
              <span className="file-name">{f.name}</span>
              <span className="file-size">{formatBytes(f.size)}</span>
              <button
                className="remove-btn"
                onClick={() => removeFile(i)}
                title="Remove file"
                id={`btn-remove-pdf-${i}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          id="btn-check-similarity"
          className="btn btn-primary btn-lg"
          onClick={handleCompare}
          disabled={loading || files.length < 2}
        >
          {loading
            ? <><div className="spinner" /> Analysing…</>
            : '📊 Check Similarity'}
        </button>
        {files.length > 0 && (
          <button
            id="btn-clear-pdfs"
            className="btn btn-ghost"
            onClick={() => { setFiles([]); setResult(null); setError(null); }}
          >
            🗑️ Clear all
          </button>
        )}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {files.length} file{files.length !== 1 ? 's' : ''} selected
          {files.length < 2 && files.length > 0 ? ' — add at least 1 more' : ''}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="status-banner error" style={{ marginTop: 24, whiteSpace: 'pre-line' }}>
          <span>❌</span><span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" style={{ width: 36, height: 36 }} />
          <span>Extracting text and computing similarity…</span>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className={`result-card ${isHigh ? 'copied' : 'different'}`} style={{ textAlign: 'center' }}>
          <div className="result-icon">{isHigh ? '⚠️' : '✅'}</div>
          <h2>{isHigh ? 'Copied' : 'Does Not Match'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>
            {result.message}
          </p>

          {/* Similarity bar */}
          <div className="similarity-bar-wrap" style={{ margin: '24px auto 0', maxWidth: 360 }}>
            <div className="similarity-bar-label">
              <span>Similarity</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{result.percentage}%</span>
            </div>
            <div className="similarity-bar-track">
              <div
                className={`similarity-bar-fill ${isHigh ? 'high' : 'low'}`}
                style={{ width: `${result.percentage}%` }}
              />
            </div>
            <div className="similarity-bar-label" style={{ marginTop: 6 }}>
              <span>0%</span>
              <span style={{ color: isHigh ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                Threshold: {result.threshold}%
              </span>
              <span>100%</span>
            </div>
          </div>

          <div className="result-meta" style={{ marginTop: 16 }}>
            Files compared: {result.filesCompared}
            <br />
            {result.fileNames.join('  ·  ')}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="card" style={{ marginTop: 32, background: 'rgba(59,130,246,0.04)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 10, color: 'var(--accent-blue)' }}>
          ℹ️ How it works
        </h3>
        <ul style={{ paddingLeft: 18, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8, listStyleType: 'disc' }}>
          <li>Text is extracted from each PDF locally on the backend server — documents are never stored or transmitted externally.</li>
          <li>Similarity is calculated using <strong>cosine similarity</strong> on term-frequency vectors of the extracted text.</li>
          <li>Scanned (image-only), password-protected, or empty PDFs will produce a clear error — no fake scores are generated.</li>
          <li>Threshold: &gt;85% = Copied; ≤85% = Does Not Match.</li>
        </ul>
      </div>
    </div>
  );
}
