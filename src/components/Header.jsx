import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const { t } = useTranslation();

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      padding: '16px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
      zIndex: 1000,
      borderBottom: '1px solid rgba(139, 92, 246, 0.1)'
    }}>
      {/* Logo */}
      <div
        onClick={() => navigate('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}
      >
        <Sparkles size={28} color="#8B5CF6" />
        <span style={{
          fontSize: '24px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Synkro
        </span>
      </div>

      {/* Navigation Links */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '32px'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#1E1B4B',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '8px 0',
            transition: 'color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#8B5CF6'}
          onMouseLeave={(e) => e.target.style.color = '#1E1B4B'}
        >
          {t('nav.home')}
        </button>

        <button
          onClick={() => navigate('/pricing')}
          style={{
            background: 'none',
            border: 'none',
            color: '#1E1B4B',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '8px 0',
            transition: 'color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#8B5CF6'}
          onMouseLeave={(e) => e.target.style.color = '#1E1B4B'}
        >
          {t('nav.pricing')}
        </button>

        {/* Afficher le Dashboard si connecté */}
        {isLoaded && isSignedIn && (
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: '#1E1B4B',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '8px 0',
              transition: 'color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#8B5CF6'}
            onMouseLeave={(e) => e.target.style.color = '#1E1B4B'}
          >
            {t('nav.dashboard')}
          </button>
        )}
      </div>

      {/* Auth Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {isLoaded && !isSignedIn ? (
          <>
            <button
              onClick={() => navigate('/sign-in')}
              style={{
                background: 'none',
                border: '2px solid #8B5CF6',
                padding: '10px 24px',
                borderRadius: '12px',
                color: '#8B5CF6',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#8B5CF6';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = '#8B5CF6';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {t('nav.login')}
            </button>

            <button
              onClick={() => navigate('/sign-up')}
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)';
              }}
            >
              {t('nav.signup')}
            </button>
          </>
        ) : isLoaded && isSignedIn ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* UserButton de Clerk avec menu de profil */}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: {
                    width: '40px',
                    height: '40px'
                  }
                }
              }}
            />
          </div>
        ) : null}
      </div>
    </nav>
  );
};

export default Header;
