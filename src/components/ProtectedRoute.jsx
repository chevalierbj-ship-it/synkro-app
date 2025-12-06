import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();

  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (!isLoaded) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
        color: 'white',
        fontSize: '24px',
        fontWeight: '700'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            marginBottom: '20px',
            fontSize: '48px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            ✨
          </div>
          <div>Vérification de l'authentification...</div>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, le rediriger vers la page de connexion
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  // Si l'utilisateur est connecté, afficher le contenu
  return children;
};

export default ProtectedRoute;
