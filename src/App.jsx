import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import HomePage      from './pages/HomePage';
import ProductPage   from './pages/ProductPage';
import RegisterPage  from './pages/RegisterPage';
import VerifyPage    from './pages/VerifyPage';
import PdfPage       from './pages/PdfPage';
import { useBlockchain } from './hooks/useBlockchain';

// ── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  const navigate   = useNavigate();
  const blockchain = useBlockchain();

  const short = blockchain.account
    ? `${blockchain.account.slice(0, 6)}…${blockchain.account.slice(-4)}`
    : null;

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')}>
        <div className="logo-icon">⛓</div>
        <span className="logo-text">BlockAuth</span>
      </div>

      <div className="navbar-wallet">
        {blockchain.account ? (
          <span className="wallet-badge" title={blockchain.account}>{short}</span>
        ) : (
          <button
            id="btn-connect-wallet-nav"
            className="btn btn-ghost btn-sm"
            onClick={blockchain.connectWallet}
            disabled={blockchain.connecting}
          >
            {blockchain.connecting
              ? <><div className="spinner" style={{ width: 12, height: 12 }} /> Connecting…</>
              : '🦊 Connect'}
          </button>
        )}
      </div>
    </nav>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <Routes>
          <Route path="/"                element={<HomePage />}     />
          <Route path="/product"         element={<ProductPage />}  />
          <Route path="/product/register" element={<RegisterPage />} />
          <Route path="/product/verify"  element={<VerifyPage />}   />
          <Route path="/pdf"             element={<PdfPage />}      />
          <Route path="*"               element={<NotFound />}     />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="page-container" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This page doesn't exist.</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>← Back to Home</button>
    </div>
  );
}
