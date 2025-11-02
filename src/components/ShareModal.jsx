// ShareModal.jsx - Version simplifiée SANS QR Code
import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, eventLink, eventType }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(eventLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVia = (platform) => {
    const text = `Viens voter pour : ${eventType}`;
    const encodedLink = encodeURIComponent(eventLink);
    const encodedText = encodeURIComponent(text);

    const urls = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedLink}`,
      email: `mailto:?subject=${encodedText}&body=${encodedText}%20-%20${encodedLink}`,
      sms: `sms:?body=${encodedText}%20${encodedLink}`
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
          padding: '24px',
          borderRadius: '24px 24px 0 0',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <X size={24} color="white" />
          </button>

          <h2 style={{
            color: 'white',
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '800'
          }}>
            🔗 Partage ton événement
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            margin: 0,
            fontSize: '15px'
          }}>
            {eventType}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          
          {/* 📝 Lien avec bouton copier */}
          <div style={{
            background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
            padding: '20px',
            borderRadius: '16px',
            marginBottom: '24px',
            border: '2px solid #E9D5FF'
          }}>
            <div style={{
              fontSize: '13px',
              color: '#8B5CF6',
              fontWeight: '700',
              marginBottom: '12px'
            }}>
              📋 Lien de l'événement
            </div>
            <div style={{
              background: 'white',
              padding: '12px',
              borderRadius: '10px',
              wordBreak: 'break-all',
              fontSize: '13px',
              color: '#1E1B4B',
              marginBottom: '12px',
              maxHeight: '80px',
              overflow: 'auto'
            }}>
              {eventLink}
            </div>
            <button
              onClick={handleCopy}
              style={{
                width: '100%',
                padding: '14px',
                background: copied 
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s'
              }}
            >
              {copied ? (
                <>
                  <Check size={20} />
                  Copié !
                </>
              ) : (
                <>
                  <Copy size={20} />
                  Copier le lien
                </>
              )}
            </button>
          </div>

          {/* 💬 Boutons de partage */}
          <div style={{
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#6B7280',
              marginBottom: '12px',
              fontWeight: '600'
            }}>
              Ou partage via :
            </div>
            
            <div style={{
              display: 'grid',
              gap: '12px'
            }}>
              {/* WhatsApp */}
              <button
                onClick={() => shareVia('whatsapp')}
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                💬 Partager sur WhatsApp
              </button>

              {/* Email */}
              <button
                onClick={() => shareVia('email')}
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                📧 Envoyer par Email
              </button>

              {/* SMS */}
              <button
                onClick={() => shareVia('sms')}
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                💬 Envoyer par SMS
              </button>
            </div>
          </div>

          {/* Info QR Code */}
          <div style={{
            background: '#FEF3C7',
            padding: '16px',
            borderRadius: '12px',
            border: '2px solid #FDE68A',
            textAlign: 'center'
          }}>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: '#92400E',
              lineHeight: '1.6'
            }}>
              💡 <strong>QR Code bientôt disponible !</strong><br/>
              En attendant, copie le lien ou utilise les boutons de partage 😊
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShareModal;
