import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { CheckCircle, XCircle, Loader2, Mail, Shield, Calendar } from 'lucide-react';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const { openSignUp } = useClerk();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Token d\'invitation manquant');
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [token]);

  useEffect(() => {
    // Si l'utilisateur se connecte après avoir chargé l'invitation
    if (isSignedIn && invitation && !accepting && !success && !error) {
      handleAcceptInvitation();
    }
  }, [isSignedIn, invitation]);

  const loadInvitation = async () => {
    try {
      const response = await fetch(`/api/team?action=invitation&token=${token}`);
      const data = await response.json();

      if (data.success) {
        setInvitation(data.invitation);
      } else {
        setError(data.error || 'Invitation invalide');
      }
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Erreur lors du chargement de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!isSignedIn) {
      // Rediriger vers l'inscription avec l'email pré-rempli
      openSignUp({
        redirectUrl: `/accept-invitation?token=${token}`,
        initialValues: {
          emailAddress: invitation?.email
        }
      });
      return;
    }

    setAccepting(true);

    try {
      const response = await fetch('/api/team?action=accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          clerkUserId: user.id,
          email: user.primaryEmailAddress.emailAddress
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Rediriger vers le dashboard après 2 secondes
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Erreur lors de l\'acceptation');
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Erreur lors de l\'acceptation de l\'invitation');
    } finally {
      setAccepting(false);
    }
  };

  // État de chargement
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '60px',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3)'
        }}>
          <Loader2 size={48} color="#8B5CF6" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '24px', fontSize: '18px', color: '#6B7280' }}>
            Chargement de l'invitation...
          </p>
        </div>
      </div>
    );
  }

  // Erreur
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '60px',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3)'
        }}>
          <XCircle size={64} color="#EF4444" />
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1E1B4B', margin: '24px 0 12px 0' }}>
            Invitation invalide
          </h1>
          <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '32px' }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Succès
  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '60px',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3)'
        }}>
          <CheckCircle size={64} color="#10B981" />
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1E1B4B', margin: '24px 0 12px 0' }}>
            Bienvenue dans l'équipe !
          </h1>
          <p style={{ fontSize: '16px', color: '#6B7280' }}>
            Votre invitation a été acceptée avec succès. Redirection vers le dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Afficher l'invitation
  const roleIcons = {
    admin: '👑',
    editor: '✏️',
    viewer: '👁️'
  };

  const roleLabels = {
    admin: 'Administrateur',
    editor: 'Éditeur',
    viewer: 'Lecteur'
  };

  const roleDescriptions = {
    admin: 'Accès complet à tous les événements et gestion d\'équipe',
    editor: 'Peut créer et modifier des événements',
    viewer: 'Peut uniquement consulter les événements'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '48px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3)'
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1E1B4B', margin: '0 0 12px 0' }}>
            Invitation à rejoindre Synkro
          </h1>
          <p style={{ fontSize: '16px', color: '#6B7280' }}>
            Plan Entreprise
          </p>
        </div>

        {/* Invitation Details */}
        <div style={{
          background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '32px',
          border: '2px solid #E9D5FF'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Mail size={18} color="#8B5CF6" />
              <span style={{ fontSize: '14px', color: '#8B5CF6', fontWeight: '700' }}>Invité par</span>
            </div>
            <div style={{ fontSize: '18px', color: '#1E1B4B', fontWeight: '700' }}>
              {invitation?.invitedBy}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Shield size={18} color="#8B5CF6" />
              <span style={{ fontSize: '14px', color: '#8B5CF6', fontWeight: '700' }}>Votre rôle</span>
            </div>
            <div style={{ fontSize: '18px', color: '#1E1B4B', fontWeight: '700', marginBottom: '4px' }}>
              {roleIcons[invitation?.role]} {roleLabels[invitation?.role]}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              {roleDescriptions[invitation?.role]}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Calendar size={18} color="#8B5CF6" />
              <span style={{ fontSize: '14px', color: '#8B5CF6', fontWeight: '700' }}>Invité le</span>
            </div>
            <div style={{ fontSize: '16px', color: '#1E1B4B', fontWeight: '600' }}>
              {new Date(invitation?.invitedAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>

        {/* Email info */}
        <div style={{
          background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '32px'
        }}>
          <p style={{ margin: '0', fontSize: '14px', color: '#1E40AF', lineHeight: '1.6' }}>
            <strong>Note importante :</strong><br />
            Cette invitation est pour <strong>{invitation?.email}</strong>.
            Assurez-vous d'utiliser ce compte pour accepter l'invitation.
          </p>
        </div>

        {/* Accept button */}
        <button
          onClick={handleAcceptInvitation}
          disabled={accepting}
          style={{
            width: '100%',
            padding: '18px',
            background: accepting
              ? '#D1D5DB'
              : 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '14px',
            fontSize: '18px',
            fontWeight: '700',
            cursor: accepting ? 'not-allowed' : 'pointer',
            boxShadow: accepting ? 'none' : '0 8px 20px rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          {accepting ? (
            <>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              Acceptation en cours...
            </>
          ) : (
            <>
              {isSignedIn ? '✨ Accepter l\'invitation' : '🔐 Se connecter et accepter'}
            </>
          )}
        </button>

        {!isSignedIn && (
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#6B7280' }}>
            Vous serez redirigé vers la page de connexion
          </p>
        )}

      </div>
    </div>
  );
}
