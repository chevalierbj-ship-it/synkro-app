import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Vous pouvez aussi logger l'erreur à un service externe ici
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
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
            {/* Icône d'erreur */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <AlertTriangle size={40} color="#DC2626" />
            </div>

            <h1 style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#1E1B4B',
              marginBottom: '16px'
            }}>
              Oups ! Une erreur est survenue
            </h1>

            <p style={{
              color: '#6B7280',
              fontSize: '18px',
              lineHeight: '1.6',
              marginBottom: '32px'
            }}>
              Quelque chose s'est mal passé. Ne vous inquiétez pas, vos données sont en sécurité.
            </p>

            {/* Détails de l'erreur (seulement en développement) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginBottom: '32px',
                textAlign: 'left',
                padding: '20px',
                background: '#F9FAFB',
                borderRadius: '12px',
                border: '1px solid #E5E7EB'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#1E1B4B',
                  marginBottom: '12px'
                }}>
                  Détails de l'erreur (développement)
                </summary>
                <div style={{
                  fontSize: '14px',
                  color: '#DC2626',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  <strong>Erreur:</strong> {this.state.error.toString()}
                  <br />
                  <br />
                  <strong>Stack:</strong>
                  <br />
                  {this.state.errorInfo?.componentStack}
                </div>
              </details>
            )}

            {/* Boutons d'action */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleReload}
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
                <RefreshCw size={20} />
                Recharger la page
              </button>

              <button
                onClick={this.handleReset}
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
                Retour à l'accueil
              </button>
            </div>

            {/* Message de support */}
            <div style={{
              marginTop: '40px',
              paddingTop: '32px',
              borderTop: '1px solid #E5E7EB'
            }}>
              <p style={{
                color: '#9CA3AF',
                fontSize: '14px'
              }}>
                Si le problème persiste, veuillez contacter le support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
