import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

const SignInPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
      padding: '20px'
    }}>
      {/* Header avec retour */}
      <div style={{
        marginBottom: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          <ArrowLeft size={20} />
          Retour
        </button>

        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Sparkles size={32} color="white" />
          <span style={{
            fontSize: '28px',
            fontWeight: '800',
            color: 'white'
          }}>
            Synkro
          </span>
        </div>

        <div style={{ width: '100px' }}></div> {/* Spacer pour centrer le logo */}
      </div>

      {/* Contenu principal */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '30px'
        }}>
          {/* Titre */}
          <div style={{ textAlign: 'center', color: 'white' }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '800',
              marginBottom: '12px'
            }}>
              Bon retour ! 👋
            </h1>
            <p style={{
              fontSize: '18px',
              opacity: 0.9
            }}>
              Connectez-vous pour accéder à votre compte
            </p>
          </div>

          {/* Composant Clerk SignIn */}
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: {
                  margin: '0 auto'
                },
                card: {
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                  borderRadius: '16px'
                }
              }
            }}
          />

          {/* Lien vers inscription */}
          <p style={{
            color: 'white',
            fontSize: '16px',
            textAlign: 'center'
          }}>
            Pas encore de compte ?{' '}
            <span
              onClick={() => navigate('/sign-up')}
              style={{
                fontWeight: '700',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              Créer un compte
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
