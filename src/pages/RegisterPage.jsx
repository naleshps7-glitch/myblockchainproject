import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlockchain } from '../hooks/useBlockchain';

// ── Digital Signature Validation ─────────────────────────────────────────────
// The "signature" in this context is the Ethereum wallet's signature of the
// product ID string (sign with MetaMask). This verifies the caller controls
// the private key and is the registered manufacturer — not just any text field.
// Format: must be a 0x-prefixed 130-char hex string (65-byte ECDSA signature).

const SIG_REGEX = /^0x[0-9a-fA-F]{130}$/;

function validateSignatureFormat(sig) {
  if (!sig) return 'Digital signature is required.';
  if (!SIG_REGEX.test(sig.trim())) {
    return (
      'Invalid signature format. Provide your MetaMask signature of the product ID. ' +
      'It must be a 0x-prefixed 130-character hexadecimal string (EIP-191 personal_sign).'
    );
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate   = useNavigate();
  const blockchain = useBlockchain();

  const [productId,  setProductId]  = useState('');
  const [signature,  setSignature]  = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showModal,  setShowModal]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [txResult,   setTxResult]   = useState(null); // { success, message, txHash }

  // ── Validate fields ──────────────────────────────────────────────────────

  function validate() {
    const errors = {};
    if (!productId.trim()) errors.productId = 'Product ID is required.';
    else if (!/^[A-Za-z0-9_-]{1,32}$/.test(productId.trim()))
      errors.productId = 'Product ID must be 1–32 alphanumeric characters (letters, numbers, _ or -).';

    const sigErr = validateSignatureFormat(signature);
    if (sigErr) errors.signature = sigErr;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ── Step 1: Show confirmation modal ──────────────────────────────────────

  function handleSubmit(e) {
    e.preventDefault();
    setTxResult(null);
    if (validate()) setShowModal(true);
  }

  // ── Step 2: Confirm → register on blockchain ──────────────────────────────

  async function handleConfirm() {
    setShowModal(false);
    setLoading(true);
    setTxResult(null);

    try {
      // Ensure wallet is connected
      if (!blockchain.account) {
        await blockchain.connectWallet();
      }

      // Guard: must be authorized
      if (!blockchain.isAuthorized) {
        setTxResult({
          success: false,
          message:
            'Your wallet is not authorized to register products. ' +
            'Only the contract owner or authorized manufacturers can register. ' +
            'Ask the contract owner to call authorizeManufacturer() for your address.',
        });
        return;
      }

      // Send transaction
      const receipt = await blockchain.registerProduct(productId.trim());

      setTxResult({
        success: true,
        message: `Product "${productId.trim()}" has been successfully registered on the blockchain.`,
        txHash: receipt.hash,
      });

      // Reset form
      setProductId('');
      setSignature('');

    } catch (err) {
      let msg = err.message || 'Transaction failed.';

      // Surface common revert reasons in a friendly way
      if (msg.includes('already registered')) {
        msg = `Product ID "${productId.trim()}" is already registered on the blockchain. Duplicate IDs are not allowed.`;
      } else if (msg.includes('Not authorized')) {
        msg = 'Your connected wallet is not an authorized manufacturer.';
      } else if (msg.includes('user rejected')) {
        msg = 'Transaction was rejected in MetaMask.';
      } else if (msg.includes('Contract not deployed')) {
        msg = err.message;
      }

      setTxResult({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
  }

  // ── Helper: sign with MetaMask ────────────────────────────────────────────

  async function handleSignWithMetaMask() {
    if (!productId.trim()) {
      setFieldErrors(prev => ({ ...prev, productId: 'Enter a Product ID first.' }));
      return;
    }
    try {
      if (!blockchain.account) await blockchain.connectWallet();
      const { ethers } = await import('ethers');
      const provider  = new ethers.BrowserProvider(window.ethereum);
      const signer    = await provider.getSigner();
      const sig       = await signer.signMessage(productId.trim());
      setSignature(sig);
      setFieldErrors(prev => ({ ...prev, signature: null }));
    } catch (err) {
      if (err.code === 4001 || err.message?.includes('user rejected')) {
        setFieldErrors(prev => ({ ...prev, signature: 'Signing was cancelled.' }));
      } else {
        setFieldErrors(prev => ({ ...prev, signature: err.message }));
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="breadcrumb">
          <span onClick={() => navigate('/')}>🏠 Home</span>
          <span>›</span>
          <span onClick={() => navigate('/product')}>Product Verification</span>
          <span>›</span>
          <span>Registration</span>
        </div>
        <h1>Product Registration</h1>
        <p>Register a new product on the Ethereum blockchain. Requires an authorized wallet.</p>
      </div>

      {/* Wallet Status */}
      <WalletPanel blockchain={blockchain} />

      {/* Form */}
      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

            {/* Product ID */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-product-id">Product ID</label>
              <input
                id="input-product-id"
                className="form-input"
                type="text"
                placeholder="e.g. NK003"
                value={productId}
                onChange={e => { setProductId(e.target.value); setFieldErrors(p => ({...p, productId: null})); }}
                maxLength={32}
                autoComplete="off"
              />
              {fieldErrors.productId && <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>{fieldErrors.productId}</span>}
              <span className="form-hint">1–32 characters: letters, numbers, hyphens, underscores.</span>
            </div>

            {/* Digital Signature */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-signature">Digital Signature</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  id="input-signature"
                  className="form-input"
                  type="text"
                  placeholder="0x… (sign with MetaMask)"
                  value={signature}
                  onChange={e => { setSignature(e.target.value); setFieldErrors(p => ({...p, signature: null})); }}
                  style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
                />
                <button
                  type="button"
                  id="btn-sign-metamask"
                  className="btn btn-ghost btn-sm"
                  onClick={handleSignWithMetaMask}
                  title="Sign the product ID with your MetaMask wallet"
                >
                  ✍️ Sign
                </button>
              </div>
              {fieldErrors.signature && <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>{fieldErrors.signature}</span>}
              <span className="form-hint">
                Click <strong>✍️ Sign</strong> to generate a cryptographic signature with your MetaMask wallet.
                This proves you control the authorized private key — not just any text.
              </span>
            </div>

            {/* Submit */}
            <button
              id="btn-register-submit"
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
            >
              {loading ? <><div className="spinner" /> Submitting…</> : '📦 Register Product'}
            </button>
          </div>
        </form>
      </div>

      {/* Result */}
      {txResult && (
        <div className={`result-card ${txResult.success ? 'original' : 'fake'}`} style={{ maxWidth: 560 }}>
          <div className="result-icon">{txResult.success ? '✅' : '❌'}</div>
          <h2>{txResult.success ? 'Registration Successful' : 'Registration Failed'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>{txResult.message}</p>
          {txResult.txHash && (
            <div className="result-meta">
              Tx Hash: {txResult.txHash}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>⚠️ Confirm Registration</h3>
            <p>
              You are about to register product <strong style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                {productId.trim()}
              </strong> on the Ethereum blockchain.
              <br /><br />
              This action is <strong>permanent and cannot be undone</strong>. Once registered, the product ID
              will be publicly verifiable on-chain. A gas fee will be charged by the network.
            </p>
            <div className="modal-actions">
              <button id="btn-confirm-register" className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirm}>
                ✅ Confirm &amp; Register
              </button>
              <button id="btn-cancel-register" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Wallet status panel ───────────────────────────────────────────────────────

function WalletPanel({ blockchain }) {
  if (!blockchain.hasMetaMask) {
    return (
      <div className="status-banner warning" style={{ maxWidth: 560, marginBottom: 24 }}>
        <span>🦊</span>
        <div>
          MetaMask is not installed. Install it from{' '}
          <a href="https://metamask.io" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>metamask.io</a>{' '}
          to register products.
        </div>
      </div>
    );
  }

  if (!blockchain.account) {
    return (
      <div style={{ maxWidth: 560, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="status-banner warning">
          <span>🔗</span>
          <span>Connect your MetaMask wallet to register products.</span>
        </div>
        <button id="btn-connect-wallet-register" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={blockchain.connectWallet}>
          {blockchain.connecting ? <><div className="spinner" style={{ width:14, height:14 }} /> Connecting…</> : '🦊 Connect MetaMask'}
        </button>
        {blockchain.error && (
          <div className="status-banner error"><span>❌</span><span>{blockchain.error}</span></div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, marginBottom: 24 }}>
      <div className="status-banner success">
        <span>🟢</span>
        <div>
          <div>Connected: <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{blockchain.account}</code></div>
          <div style={{ marginTop: 4 }}>
            {blockchain.isAuthorized
              ? '✅ Authorized manufacturer — you can register products.'
              : '🚫 Not authorized — ask the contract owner to authorize your wallet.'}
          </div>
          {!blockchain.networkOk && (
            <div style={{ marginTop: 4, color: 'var(--accent-amber)' }}>
              ⚠️ Wrong network. Please switch MetaMask to the Hardhat localhost network (Chain ID 31337).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
