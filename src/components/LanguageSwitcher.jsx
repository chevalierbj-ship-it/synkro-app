import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' }
];

const LanguageSwitcher = ({ variant = 'default' }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('synkro_language', langCode);
    setIsOpen(false);
  };

  // Variant: compact (just icon + flag)
  if (variant === 'compact') {
    return (
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            color: 'white',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <span style={{ fontSize: '16px' }}>{currentLanguage.flag}</span>
          <ChevronDown size={14} style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }} />
        </button>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            zIndex: 1000,
            minWidth: '140px'
          }}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: lang.code === i18n.language
                    ? 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)'
                    : 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: lang.code === i18n.language ? '600' : '400',
                  color: '#1E1B4B',
                  textAlign: 'left',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (lang.code !== i18n.language) {
                    e.target.style.background = '#F5F3FF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (lang.code !== i18n.language) {
                    e.target.style.background = 'white';
                  }
                }}
              >
                <span style={{ fontSize: '18px' }}>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default variant: full button with text
  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
          border: '2px solid #E9D5FF',
          borderRadius: '12px',
          cursor: 'pointer',
          color: '#1E1B4B',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#8B5CF6';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#E9D5FF';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <Globe size={18} color="#8B5CF6" />
        <span style={{ fontSize: '16px' }}>{currentLanguage.flag}</span>
        <span>{currentLanguage.label}</span>
        <ChevronDown size={16} color="#8B5CF6" style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 12px 32px rgba(139, 92, 246, 0.2)',
          overflow: 'hidden',
          zIndex: 1000,
          border: '2px solid #E9D5FF',
          minWidth: '160px'
        }}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '14px 18px',
                border: 'none',
                background: lang.code === i18n.language
                  ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                  : 'white',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: lang.code === i18n.language ? '700' : '500',
                color: lang.code === i18n.language ? 'white' : '#1E1B4B',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (lang.code !== i18n.language) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (lang.code !== i18n.language) {
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              <span style={{ fontSize: '20px' }}>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
