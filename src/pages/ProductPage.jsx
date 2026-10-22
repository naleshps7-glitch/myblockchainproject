import { useNavigate } from 'react-router-dom';
import { useBlockchain } from '../hooks/useBlockchain';

export default function ProductPage() {
  const navigate = useNavigate();
  const { contractDeployed } = useBlockchain();

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="breadcrumb">
          <span onClick={() => navigate('/')}>🏠 Home</span>
          <span>›</span>
          <span>Product Verification</span>
        </div>
        <h1>Product Verification</h1>
        <p>Register products on the blockchain or verify their authenticity.</p>
      </div>

      {!contractDeployed && (
        <div className="status-banner warning">
          <span>⚠️</span>
          <div>
            <strong>Contract not deployed.</strong> Update <code>CONTRACT_ADDRESS</code> in{' '}
            <code>src/config/blockchain.js</code> after running the deployment steps in{' '}
            <code>SETUP.md</code>.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <ProductOptionCard
          id="btn-product-registration"
          icon="📝"
          title="Product Registration"
          description="Register a new product ID on the Ethereum blockchain. Requires an authorized manufacturer wallet."
          accent="var(--accent-blue)"
          onClick={() => navigate('/product/register')}
        />
        <ProductOptionCard
          id="btn-verify-product"
          icon="🔍"
          title="Verify Product"
          description="Check whether a product ID is registered and genuine on the blockchain."
          accent="var(--accent-green)"
          onClick={() => navigate('/product/verify')}
        />
      </div>
    </div>
  );
}

function ProductOptionCard({ id, icon, title, description, accent, onClick }) {
  return (
    <button
      id={id}
      onClick={onClick}
      style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '32px 24px',
        cursor: 'pointer',
        textAlign: 'left',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        width: '100%',
        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 8px 30px rgba(0,0,0,0.3)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '14px' }}>{icon}</div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{title}</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{description}</p>
    </button>
  );
}
