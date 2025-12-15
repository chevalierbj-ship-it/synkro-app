import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowUp, ArrowLeft } from 'lucide-react';
import SEOHead from './SEOHead';
import LanguageSwitcher from './LanguageSwitcher';
import Footer from './Footer';

const LegalPageLayout = ({
  title,
  seoTitle,
  seoDescription,
  lastUpdated,
  children,
  showScrollToTop = false
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    if (!showScrollToTop) return;

    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showScrollToTop]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1E1B4B',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        type="website"
      />

      {/* Header */}
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

        {/* Back button & Language Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'none',
              border: '2px solid #E9D5FF',
              borderRadius: '12px',
              color: '#8B5CF6',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8B5CF6';
              e.currentTarget.style.background = '#F5F3FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E9D5FF';
              e.currentTarget.style.background = 'none';
            }}
          >
            <ArrowLeft size={18} />
            {t('legal.back')}
          </button>
          <LanguageSwitcher />
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        flex: 1,
        paddingTop: '100px',
        paddingBottom: '60px'
      }}>
        {/* Title Section */}
        <div style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            color: 'white',
            margin: '0 0 16px 0',
            textShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            {title}
          </h1>
          {lastUpdated && (
            <p style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '14px',
              margin: 0
            }}>
              {t('legal.lastUpdated')}: {lastUpdated}
            </p>
          )}
        </div>

        {/* Content Section */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '60px 20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '48px',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1)',
            border: '2px solid #E9D5FF'
          }}>
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Scroll to Top Button */}
      {showScrollToTop && showScrollButton && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            transition: 'all 0.3s',
            zIndex: 999
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(139, 92, 246, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.4)';
          }}
          aria-label={t('legal.scrollToTop')}
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};

// Reusable styled components for legal content
export const LegalSection = ({ title, children }) => (
  <section style={{ marginBottom: '40px' }}>
    <h2 style={{
      fontSize: '24px',
      fontWeight: '700',
      color: '#1E1B4B',
      marginBottom: '20px',
      paddingBottom: '12px',
      borderBottom: '2px solid #E9D5FF'
    }}>
      {title}
    </h2>
    {children}
  </section>
);

export const LegalSubSection = ({ title, children }) => (
  <div style={{ marginBottom: '24px' }}>
    <h3 style={{
      fontSize: '18px',
      fontWeight: '600',
      color: '#8B5CF6',
      marginBottom: '12px'
    }}>
      {title}
    </h3>
    {children}
  </div>
);

export const LegalParagraph = ({ children }) => (
  <p style={{
    fontSize: '15px',
    lineHeight: '1.8',
    color: '#4B5563',
    marginBottom: '16px'
  }}>
    {children}
  </p>
);

export const LegalList = ({ items }) => (
  <ul style={{
    paddingLeft: '24px',
    marginBottom: '16px'
  }}>
    {items.map((item, index) => (
      <li key={index} style={{
        fontSize: '15px',
        lineHeight: '1.8',
        color: '#4B5563',
        marginBottom: '8px'
      }}>
        {item}
      </li>
    ))}
  </ul>
);

export const LegalArticle = ({ number, title, children }) => (
  <section style={{ marginBottom: '40px' }}>
    <h2 style={{
      fontSize: '20px',
      fontWeight: '700',
      color: '#1E1B4B',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
        borderRadius: '50%',
        color: 'white',
        fontSize: '14px',
        fontWeight: '700'
      }}>
        {number}
      </span>
      {title}
    </h2>
    {children}
  </section>
);

export default LegalPageLayout;
