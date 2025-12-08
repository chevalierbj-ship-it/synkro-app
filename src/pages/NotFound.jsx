import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '60px 40px',
        textAlign: 'center',
        maxWidth: '600px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        {/* 404 Animation */}
        <div style={{
          fontSize: '120px',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '24px',
          lineHeight: '1'
        }}>
          404
        </div>

        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#1E1B4B',
          marginBottom: '16px'
        }}>
          Page introuvable
        </h1>

        <p style={{
          color: '#6B7280',
          fontSize: '18px',
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        {/* Icône de recherche */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px'
        }}>
          <Search size={40} color="#9CA3AF" />
        </div>

        {/* Boutons d'action */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '14px 28px',
              background: 'white',
              border: '2px solid #E5E7EB',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1E1B4B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#8B5CF6';
              e.target.style.color = '#8B5CF6';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#E5E7EB';
              e.target.style.color = '#1E1B4B';
            }}
          >
            <ArrowLeft size={20} />
            Retour
          </button>

          <button
            onClick={() => navigate('/')}
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.3s',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <Home size={20} />
            Accueil
          </button>
        </div>

        {/* Liens utiles */}
        <div style={{
          marginTop: '40px',
          paddingTop: '32px',
          borderTop: '1px solid #E5E7EB'
        }}>
          <p style={{
            color: '#9CA3AF',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            Peut-être cherchiez-vous :
          </p>
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => navigate('/create')}
              style={{
                background: 'none',
                border: 'none',
                color: '#8B5CF6',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Créer un événement
            </button>
            <button
              onClick={() => navigate('/pricing')}
              style={{
                background: 'none',
                border: 'none',
                color: '#8B5CF6',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Voir les tarifs
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'none',
                border: 'none',
                color: '#8B5CF6',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Mon dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
