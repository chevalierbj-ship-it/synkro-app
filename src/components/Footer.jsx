import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();

  // Charger le script EcoIndex pour le badge
  useEffect(() => {
    if (!document.querySelector('script[src*="ecoindex-badge"]')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/gh/cnumr/ecoindex_badge@3/assets/js/ecoindex-badge.js';
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const linkStyle = {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'color 0.3s',
    padding: '4px 8px'
  };

  const legalLinkStyle = {
    ...linkStyle,
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px'
  };

  return (
    <footer style={{
      padding: '60px 20px',
      background: 'linear-gradient(135deg, #581c87 0%, #701a75 50%, #831843 100%)',
      textAlign: 'center',
      color: 'rgba(255,255,255,0.7)',
      borderTop: '1px solid rgba(139, 92, 246, 0.3)'
    }}>
      {/* Logo et tagline */}
      <div style={{ marginBottom: '24px' }}>
        <Sparkles size={32} color="white" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '24px', color: 'white', marginBottom: '8px' }}>Synkro</h3>
        <p style={{ margin: 0, fontSize: '14px' }}>Une date en 1 minute ⚡</p>
      </div>

      {/* Navigation principale */}
      <div style={{
        display: 'flex',
        gap: '24px',
        justifyContent: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => navigate('/')}
          style={linkStyle}
          onMouseEnter={(e) => e.target.style.color = 'white'}
          onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
        >
          Accueil
        </button>
        <button
          onClick={() => navigate('/pricing')}
          style={linkStyle}
          onMouseEnter={(e) => e.target.style.color = 'white'}
          onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
        >
          Tarifs
        </button>
        <button
          onClick={() => navigate('/create')}
          style={linkStyle}
          onMouseEnter={(e) => e.target.style.color = 'white'}
          onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
        >
          Créer un événement
        </button>
        <button
          onClick={() => navigate('/contact')}
          style={linkStyle}
          onMouseEnter={(e) => e.target.style.color = 'white'}
          onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
        >
          Contact
        </button>
      </div>

      {/* Liens légaux */}
      <div style={{
        display: 'flex',
        gap: '24px',
        justifyContent: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => navigate('/mentions-legales')}
          style={legalLinkStyle}
          onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.9)'}
          onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.5)'}
        >
          Mentions légales
        </button>
        <button
          onClick={() => navigate('/cgv')}
          style={legalLinkStyle}
          onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.9)'}
          onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.5)'}
        >
          CGV / CGU
        </button>
        <button
          onClick={() => navigate('/confidentialite')}
          style={legalLinkStyle}
          onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.9)'}
          onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.5)'}
        >
          Confidentialité
        </button>
      </div>

      {/* Made in France */}
      <p style={{ fontSize: '14px', margin: '0 0 20px 0' }}>
        Créé avec 💜 en France
      </p>

      {/* Badge EcoIndex */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <div id="ecoindex-badge" data-theme="light"></div>
      </div>

      {/* Copyright - SANS "Prototype de test" */}
      <p style={{ fontSize: '12px', margin: 0 }}>
        © 2025 Synkro
      </p>
    </footer>
  );
};

export default Footer;
