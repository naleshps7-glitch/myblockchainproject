import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          padding: '6px 18px', borderRadius: '99px',
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
          fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 500,
          marginBottom: '24px'
        }}>
          ⛓️ Powered by Ethereum Blockchain
        </div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.1,
          background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '16px',
        }}>
          BlockAuth
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          maxWidth: '480px',
          lineHeight: 1.7,
        }}>
          Blockchain-powered product authentication &amp; PDF document verification system.
        </p>
      </div>

      {/* Option Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        width: '100%',
        maxWidth: '640px',
      }}>
        <HomeCard
          id="btn-product-verification"
          icon="🔐"
          title="Product Verification"
          description="Register products on the blockchain and verify their authenticity using unique product IDs."
          gradient="linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))"
          borderColor="rgba(59,130,246,0.35)"
          glowColor="rgba(59,130,246,0.15)"
          onClick={() => navigate('/product')}
        />
        <HomeCard
          id="btn-pdf-verification"
          icon="📄"
          title="PDF Verification"
          description="Upload two or more PDF documents to calculate their similarity and detect copied content."
          gradient="linear-gradient(135deg, rgba(34,211,238,0.08), rgba(16,185,129,0.1))"
          borderColor="rgba(34,211,238,0.3)"
          glowColor="rgba(34,211,238,0.12)"
          onClick={() => navigate('/pdf')}
        />
      </div>
    </div>
  );
}

function HomeCard({ id, icon, title, description, gradient, borderColor, glowColor, onClick }) {
  return (
    <button
      id={id}
      onClick={onClick}
      style={{
        background: gradient,
        border: `1px solid ${borderColor}`,
        borderRadius: '20px',
        padding: '36px 28px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        width: '100%',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 12px 40px ${glowColor}`;
        e.currentTarget.style.borderColor = borderColor.replace('0.35','0.6').replace('0.3','0.55');
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = borderColor;
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{icon}</div>
      <h2 style={{
        fontSize: '1.2rem',
        fontWeight: 700,
        marginBottom: '10px',
        letterSpacing: '-0.01em',
      }}>{title}</h2>
      <p style={{
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.65,
      }}>{description}</p>
      <div style={{
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.82rem',
        fontWeight: 600,
        color: 'var(--accent-blue)',
      }}>
        Get started <span>→</span>
      </div>
    </button>
  );
}
