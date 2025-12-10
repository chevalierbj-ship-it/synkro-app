import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn, isLoaded } = useUser();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Handle navigation and close menu
  const handleNavigate = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  // Hamburger icon component (pure CSS)
  const HamburgerIcon = ({ isOpen, onClick }) => (
    <button
      onClick={onClick}
      aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      aria-expanded={isOpen}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '44px',
        height: '44px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '10px',
        zIndex: 1002
      }}
    >
      <span style={{
        display: 'block',
        width: '24px',
        height: '3px',
        backgroundColor: '#8B5CF6',
        borderRadius: '2px',
        transition: 'all 0.3s ease',
        transform: isOpen ? 'rotate(45deg) translateY(7px)' : 'rotate(0)',
        marginBottom: isOpen ? '0' : '5px'
      }} />
      <span style={{
        display: 'block',
        width: '24px',
        height: '3px',
        backgroundColor: '#8B5CF6',
        borderRadius: '2px',
        transition: 'all 0.3s ease',
        opacity: isOpen ? 0 : 1,
        marginBottom: isOpen ? '0' : '5px'
      }} />
      <span style={{
        display: 'block',
        width: '24px',
        height: '3px',
        backgroundColor: '#8B5CF6',
        borderRadius: '2px',
        transition: 'all 0.3s ease',
        transform: isOpen ? 'rotate(-45deg) translateY(-7px)' : 'rotate(0)'
      }} />
    </button>
  );

  // Mobile drawer menu
  const MobileDrawer = () => (
    <>
      {/* Overlay */}
      <div
        onClick={() => setIsMenuOpen(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          opacity: isMenuOpen ? 1 : 0,
          visibility: isMenuOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, visibility 0.3s ease'
        }}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(280px, 75vw)',
          backgroundColor: 'white',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
          zIndex: 1001,
          transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
      >
        {/* Drawer header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(139, 92, 246, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={24} color="#8B5CF6" />
            <span style={{
              fontSize: '20px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Synkro
            </span>
          </div>
          <HamburgerIcon isOpen={isMenuOpen} onClick={() => setIsMenuOpen(false)} />
        </div>

        {/* Navigation links */}
        <nav style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          gap: '8px',
          flex: 1
        }}>
          <button
            onClick={() => handleNavigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#1E1B4B',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '16px',
              textAlign: 'left',
              borderRadius: '12px',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => e.target.style.background = '#F5F3FF'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            <span style={{ fontSize: '20px' }}>🏠</span>
            {t('nav.home')}
          </button>

          <button
            onClick={() => handleNavigate('/pricing')}
            style={{
              background: 'none',
              border: 'none',
              color: '#1E1B4B',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '16px',
              textAlign: 'left',
              borderRadius: '12px',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => e.target.style.background = '#F5F3FF'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            <span style={{ fontSize: '20px' }}>💎</span>
            {t('nav.pricing')}
          </button>

          {/* Dashboard link if signed in */}
          {isLoaded && isSignedIn && (
            <button
              onClick={() => handleNavigate('/dashboard')}
              style={{
                background: 'none',
                border: 'none',
                color: '#1E1B4B',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '16px',
                textAlign: 'left',
                borderRadius: '12px',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => e.target.style.background = '#F5F3FF'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              <span style={{ fontSize: '20px' }}>📊</span>
              {t('nav.dashboard')}
            </button>
          )}

          {/* Separator */}
          <div style={{
            height: '1px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            margin: '12px 0'
          }} />

          {/* Language switcher */}
          <div style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>🌐</span>
            <LanguageSwitcher />
          </div>
        </nav>

        {/* Auth section at bottom */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid rgba(139, 92, 246, 0.1)',
          backgroundColor: '#FAFAFA'
        }}>
          {isLoaded && !isSignedIn ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <button
                onClick={() => handleNavigate('/sign-in')}
                style={{
                  background: 'none',
                  border: '2px solid #8B5CF6',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  color: '#8B5CF6',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  width: '100%'
                }}
              >
                {t('nav.login')}
              </button>

              <button
                onClick={() => handleNavigate('/sign-up')}
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                  width: '100%'
                }}
              >
                {t('nav.signup')}
              </button>
            </div>
          ) : isLoaded && isSignedIn ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: {
                      width: '48px',
                      height: '48px'
                    }
                  }
                }}
              />
              <span style={{
                fontSize: '14px',
                color: '#6B7280'
              }}>
                {t('nav.dashboard')}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: isMobile ? '12px 16px' : '16px 40px',
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
          <Sparkles size={isMobile ? 24 : 28} color="#8B5CF6" />
          <span style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Synkro
          </span>
        </div>

        {/* Desktop Navigation Links - hidden on mobile */}
        {!isMobile && (
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

            {/* Dashboard link if signed in */}
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
        )}

        {/* Desktop Auth Buttons & Language Switcher - hidden on mobile */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Language Switcher */}
            <LanguageSwitcher />

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
        )}

        {/* Mobile hamburger button */}
        {isMobile && (
          <HamburgerIcon isOpen={isMenuOpen} onClick={() => setIsMenuOpen(true)} />
        )}
      </nav>

      {/* Mobile drawer menu */}
      {isMobile && <MobileDrawer />}
    </>
  );
};

export default Header;
