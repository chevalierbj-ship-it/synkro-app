import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';

const Contact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });

    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '16px 20px',
    border: '2px solid #E5E7EB',
    borderRadius: '14px',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.3s ease',
    background: 'white',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F3FF 0%, #FFFFFF 50%, #FDF2F8 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <SEOHead
        title="Contact - Synkro"
        description="Une question, une suggestion, un bug ? Contactez l'équipe Synkro. On répond généralement sous 24h !"
        type="website"
        keywords={['contact', 'support', 'aide', 'question', 'synkro']}
      />

      <Header />

      <div style={{
        maxWidth: '700px',
        margin: '0 auto',
        padding: '120px 20px 60px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #F5F3FF 0%, #FCE7F3 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.15)'
          }}>
            <span style={{ fontSize: '40px' }}>👋</span>
          </div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            color: '#1E1B4B',
            marginBottom: '16px'
          }}>
            Coucou !
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#6B7280',
            lineHeight: '1.6'
          }}>
            Une question, une suggestion, un bug ?<br />
            On est là pour toi !
          </p>
        </div>

        {/* Formulaire ou Message de succès */}
        {status === 'success' ? (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            padding: '48px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <CheckCircle size={36} color="#059669" />
            </div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#1E1B4B',
              marginBottom: '16px'
            }}>
              Message envoyé ! 🎉
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6B7280',
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              Merci ! On a bien reçu ton message et on te répond très vite.<br />
              Tu vas recevoir un email de confirmation.
            </p>
            <button
              onClick={() => setStatus('idle')}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.3)';
              }}
            >
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            padding: '40px'
          }}>
            {/* Nom */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="name" style={labelStyle}>
                Ton nom *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Jean Dupont"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8B5CF6';
                  e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="email" style={labelStyle}>
                Ton email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="jean@exemple.com"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8B5CF6';
                  e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Sujet */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="subject" style={labelStyle}>
                Sujet
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                  backgroundSize: '20px',
                  paddingRight: '48px'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8B5CF6';
                  e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">Choisis un sujet...</option>
                <option value="Question générale">❓ Question générale</option>
                <option value="Bug / Problème technique">🐛 Bug / Problème technique</option>
                <option value="Suggestion / Idée">💡 Suggestion / Idée</option>
                <option value="Facturation / Abonnement">💳 Facturation / Abonnement</option>
                <option value="Partenariat">🤝 Partenariat</option>
                <option value="Autre">📝 Autre</option>
              </select>
            </div>

            {/* Message */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="message" style={labelStyle}>
                Ton message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Décris ta question ou ton problème..."
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: '140px'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8B5CF6';
                  e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Erreur */}
            {status === 'error' && (
              <div style={{
                marginBottom: '24px',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                border: '1px solid #F87171',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <AlertCircle size={20} color="#DC2626" />
                <span style={{ color: '#DC2626', fontSize: '14px' }}>
                  {errorMessage || 'Une erreur est survenue. Réessaie !'}
                </span>
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={status === 'sending'}
              style={{
                width: '100%',
                padding: '18px 32px',
                background: status === 'sending'
                  ? '#9CA3AF'
                  : 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                boxShadow: status === 'sending'
                  ? 'none'
                  : '0 8px 20px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                if (status !== 'sending') {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(139, 92, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (status !== 'sending') {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.3)';
                }
              }}
            >
              {status === 'sending' ? (
                <>
                  <svg
                    style={{ animation: 'spin 1s linear infinite', width: '20px', height: '20px' }}
                    viewBox="0 0 24 24"
                  >
                    <circle
                      style={{ opacity: 0.25 }}
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      style={{ opacity: 0.75 }}
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Envoyer mon message
                </>
              )}
            </button>

            <p style={{
              textAlign: 'center',
              color: '#9CA3AF',
              fontSize: '14px',
              marginTop: '16px'
            }}>
              On répond généralement sous 24h ! ⚡
            </p>
          </form>
        )}

        {/* FAQ rapide */}
        <div style={{
          marginTop: '48px',
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          padding: '32px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1E1B4B',
            marginBottom: '24px'
          }}>
            Besoin d'aide rapide ?
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <span style={{ fontSize: '24px' }}>📖</span>
              <div>
                <p style={{ fontWeight: '600', color: '#1E1B4B', margin: '0 0 4px 0' }}>
                  Questions fréquentes
                </p>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
                  Retrouve les réponses sur notre{' '}
                  <button
                    onClick={() => navigate('/pricing')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8B5CF6',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: 0
                    }}
                  >
                    page tarifs
                  </button>.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <span style={{ fontSize: '24px' }}>🐛</span>
              <div>
                <p style={{ fontWeight: '600', color: '#1E1B4B', margin: '0 0 4px 0' }}>
                  Signaler un bug
                </p>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
                  Décris-nous le problème avec des captures d'écran si possible.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <span style={{ fontSize: '24px' }}>💡</span>
              <div>
                <p style={{ fontWeight: '600', color: '#1E1B4B', margin: '0 0 4px 0' }}>
                  Suggérer une fonctionnalité
                </p>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
                  Tes idées nous intéressent ! On lit tout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Contact;
