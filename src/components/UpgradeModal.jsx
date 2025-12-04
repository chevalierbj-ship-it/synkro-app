import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Crown, Zap, Check } from 'lucide-react';

const UpgradeModal = ({ isOpen, onClose, feature, plan = 'Pro', price = '19€/mois' }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3)',
          position: 'relative',
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.background = '#F5F3FF')}
          onMouseLeave={(e) => (e.target.style.background = 'transparent')}
        >
          <X size={24} color="#6B7280" />
        </button>

        {/* Crown icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 12px 28px rgba(139, 92, 246, 0.3)',
          }}
        >
          <Crown size={40} color="white" />
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1E1B4B',
            textAlign: 'center',
            marginBottom: '12px',
          }}
        >
          Fonctionnalité {plan}
        </h2>

        {/* Feature description */}
        <p
          style={{
            fontSize: '16px',
            color: '#6B7280',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <strong style={{ color: '#8B5CF6' }}>{feature}</strong> est disponible avec le plan{' '}
          <strong>{plan}</strong>.
        </p>

        {/* Benefits */}
        <div
          style={{
            background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
            padding: '20px',
            borderRadius: '16px',
            marginBottom: '24px',
            border: '2px solid #E9D5FF',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E1B4B', marginBottom: '12px' }}>
            ✨ Avec le plan {plan}, débloquez :
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {plan === 'Pro' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={18} color="#8B5CF6" />
                  <span style={{ fontSize: '14px', color: '#1E1B4B' }}>15 événements/mois</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={18} color="#8B5CF6" />
                  <span style={{ fontSize: '14px', color: '#1E1B4B' }}>50 participants max</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={18} color="#8B5CF6" />
                  <span style={{ fontSize: '14px', color: '#1E1B4B' }}>Sans branding Synkro</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={18} color="#8B5CF6" />
                  <span style={{ fontSize: '14px', color: '#1E1B4B' }}>Export données CSV</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={18} color="#8B5CF6" />
                  <span style={{ fontSize: '14px', color: '#1E1B4B' }}>Événements illimités</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={18} color="#8B5CF6" />
                  <span style={{ fontSize: '14px', color: '#1E1B4B' }}>Participants illimités</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={18} color="#8B5CF6" />
                  <span style={{ fontSize: '14px', color: '#1E1B4B' }}>Multi-utilisateurs (3 comptes)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={18} color="#8B5CF6" />
                  <span style={{ fontSize: '14px', color: '#1E1B4B' }}>Analytics avancées</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Price */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>À partir de</div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: '700',
              color: '#1E1B4B',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {price}
          </div>
        </div>

        {/* CTA Buttons */}
        <button
          onClick={handleUpgrade}
          style={{
            width: '100%',
            padding: '18px',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            marginBottom: '12px',
            boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 12px 28px rgba(139, 92, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.3)';
          }}
        >
          <Zap size={20} />
          Passer au plan {plan}
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            color: '#6B7280',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Plus tard
        </button>
      </div>

      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default UpgradeModal;
