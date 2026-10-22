import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlockchain } from '../hooks/useBlockchain';

export default function VerifyPage() {
  const navigate   = useNavigate();
  const blockchain = useBlockchain();

  const [productId, setProductId] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);

  async function handleVerify(e) {
    e.preventDefault();
    setResult(null);
    setError(null);

    const pid = productId.trim();
    if (!pid) {
      setError('Please enter a Product ID.');
      return;
    }

    setLoading(true);
    try {
      const data = await blockchain.verifyProduct(pid);
      setResult({ productId: pid, ...data });
    } catch (err) {
      let msg = err.message || 'Verification failed.';
      if (msg.includes('Contract not deployed')) {
        msg =
          'The smart contract is not yet deployed. ' +
          'Follow the steps in SETUP.md to deploy the contract and update src/config/blockchain.js.';
      } else if (msg.includes('could not detect network') || msg.includes('ECONNREFUSED')) {
        msg =
          'Cannot connect to the blockchain node. ' +
          'Make sure the Hardhat node is running: cd contracts && npm run node';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="breadcrumb">
          <span onClick={() => navigate('/')}>🏠 Home</span>
          <span>›</span>
          <span onClick={() => navigate('/product')}>Product Verification</span>
          <span>›</span>
          <span>Verify Product</span>
        </div>
        <h1>Verify Product</h1>
        <p>Enter a Product ID to check whether it's registered on the blockchain.</p>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={handleVerify} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="input-verify-id">Product ID</label>
              <input
                id="input-verify-id"
                className="form-input"
                type="text"
                placeholder="e.g. NK003"
                value={productId}
                onChange={e => { setProductId(e.target.value); setError(null); setResult(null); }}
                maxLength={32}
                autoComplete="off"
              />
            </div>
            <button
              id="btn-verify-submit"
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
            >
              {loading
                ? <><div className="spinner" /> Checking blockchain…</>
                : '🔍 Verify Product'}
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="status-banner error" style={{ maxWidth: 520, marginTop: 20 }}>
          <span>❌</span><span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className={`result-card ${result.isOriginal ? 'original' : 'fake'}`} style={{ maxWidth: 520 }}>
          <div className="result-icon">{result.isOriginal ? '✅' : '🚫'}</div>
          <h2>
            {result.isOriginal
              ? 'Product is Original'
              : 'Not Registered / First Copy'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>
            {result.isOriginal
              ? `Product ID "${result.productId}" is registered on the blockchain and verified as genuine.`
              : `Product ID "${result.productId}" is NOT found in the blockchain registry. This may be a counterfeit or the ID was entered incorrectly.`}
          </p>
          {result.isOriginal && (
            <div className="result-meta">
              Registered by: {result.registeredBy}
              <br />
              Registered at: {result.registeredAt?.toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" style={{ width: 32, height: 32 }} />
          <span>Querying blockchain…</span>
        </div>
      )}
    </div>
  );
}
