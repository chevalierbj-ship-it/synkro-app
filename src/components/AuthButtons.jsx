import React, { useEffect } from 'react';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';

const AuthButtons = ({ onAuthSuccess }) => {
  // Check if Clerk is available
  const isClerkAvailable = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  // Only use hooks if Clerk is available
  let isSignedIn = false;
  let user = null;
  let openSignIn = null;

  try {
    if (isClerkAvailable) {
      const auth = useAuth();
      const userData = useUser();
      const clerk = useClerk();

      isSignedIn = auth.isSignedIn;
      user = userData.user;
      openSignIn = clerk.openSignIn;
    }
  } catch (error) {
    // Clerk not available, component won't render
    console.log('Clerk not configured');
  }

  // Don't render if Clerk is not available
  if (!isClerkAvailable) {
    return null;
  }

  // Automatically fill form when user signs in
  useEffect(() => {
    if (isSignedIn && user) {
      const userData = {
        name: user.fullName || user.firstName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        provider: user.externalAccounts?.[0]?.provider || 'clerk'
      };

      console.log('User signed in:', userData);
      onAuthSuccess(userData);
    }
  }, [isSignedIn, user, onAuthSuccess]);

  const handleSignIn = (strategy) => {
    openSignIn({
      redirectUrl: window.location.href,
      appearance: {
        elements: {
          rootBox: "mx-auto",
          card: "shadow-xl"
        }
      },
      // Force specific OAuth provider
      ...(strategy && {
        strategy: `oauth_${strategy}`
      })
    });
  };

  const buttonStyle = {
    width: '100%',
    padding: '16px',
    background: 'white',
    color: '#1E1B4B',
    border: '2px solid #E9D5FF',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '12px'
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        color: '#6B7280',
        fontSize: '14px',
        fontWeight: '600'
      }}>
        🚀 Connexion rapide (pré-remplit tes infos)
      </div>

      {/* Google */}
      <button
        onClick={() => handleSignIn('google')}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.target.style.borderColor = '#4285F4';
          e.target.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = '#E9D5FF';
          e.target.style.boxShadow = 'none';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuer avec Google
      </button>

      {/* Microsoft */}
      <button
        onClick={() => handleSignIn('microsoft')}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.target.style.borderColor = '#00A4EF';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 164, 239, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = '#E9D5FF';
          e.target.style.boxShadow = 'none';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
          <path fill="#f25022" d="M0 0h11v11H0z"/>
          <path fill="#00a4ef" d="M12 0h11v11H12z"/>
          <path fill="#7fba00" d="M0 12h11v11H0z"/>
          <path fill="#ffb900" d="M12 12h11v11H12z"/>
        </svg>
        Continuer avec Microsoft
      </button>

      {/* Apple */}
      <button
        onClick={() => handleSignIn('apple')}
        style={{
          ...buttonStyle,
          background: '#000000',
          color: 'white',
          border: '2px solid #000000'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#1a1a1a';
          e.target.style.borderColor = '#1a1a1a';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#000000';
          e.target.style.borderColor = '#000000';
          e.target.style.boxShadow = 'none';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="white" d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
        Continuer avec Apple
      </button>
    </div>
  );
};

export default AuthButtons;
