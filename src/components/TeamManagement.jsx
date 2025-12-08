import React, { useState, useEffect } from 'react';
import { Users, Mail, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function TeamManagement({ userData, clerkUserId }) {
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [loading, setLoading] = useState(false);

  const isEnterprise = userData?.plan === 'entreprise';
  const maxMembers = 2; // Plan Entreprise : 2 sous-comptes max

  const roleOptions = [
    { value: 'admin', label: '👑 Administrateur', description: 'Accès complet à tous les événements' },
    { value: 'editor', label: '✏️ Éditeur', description: 'Peut créer et modifier des événements' },
    { value: 'viewer', label: '👁️ Lecteur', description: 'Peut uniquement consulter les événements' }
  ];

  useEffect(() => {
    if (isEnterprise) {
      loadMembers();
    }
  }, [isEnterprise]);

  const loadMembers = async () => {
    try {
      const response = await fetch(`/api/team?clerkUserId=${clerkUserId}`);
      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();

    if (!inviteEmail || !inviteEmail.includes('@')) {
      alert('Email invalide');
      return;
    }

    if (members.filter(m => m.status !== 'revoked').length >= maxMembers) {
      alert(`Limite atteinte : ${maxMembers} membres maximum`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentUserId: clerkUserId,
          email: inviteEmail,
          role: inviteRole
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Invitation envoyée avec succès !');
        setInviteEmail('');
        setInviteRole('editor');
        loadMembers();
      } else {
        alert(data.error || 'Erreur lors de l\'invitation');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (memberId) => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cet accès ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/team?memberId=${memberId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('Accès révoqué');
        loadMembers();
      } else {
        alert('Erreur');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur');
    }
  };

  if (!isEnterprise) {
    return (
      <div style={{
        padding: '40px',
        background: 'white',
        borderRadius: '16px',
        textAlign: 'center',
        opacity: 0.6
      }}>
        <div style={{ fontSize: '48px' }}>🔒</div>
        <h3>Fonctionnalité ENTREPRISE</h3>
        <p>Collaborez avec votre équipe</p>
        <button
          onClick={() => window.location.href = '/pricing'}
          style={{
            padding: '12px 24px',
            background: '#8B5CF6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Passer en Entreprise
        </button>
      </div>
    );
  }

  const activeMembers = members.filter(m => m.status !== 'revoked');

  return (
    <div style={{ background: 'white', padding: '32px', borderRadius: '16px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Users size={28} color="#8B5CF6" />
        Gestion d'équipe
      </h2>

      <p style={{ color: '#6B7280', marginBottom: '24px' }}>
        {activeMembers.length}/{maxMembers} membres utilisés
      </p>

      {/* Formulaire d'invitation */}
      <form onSubmit={handleInvite} style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
          Inviter un membre
        </label>

        {/* Email input */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@exemple.com"
            disabled={activeMembers.length >= maxMembers}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Role selector */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#6B7280' }}>
            Rôle
          </label>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            disabled={activeMembers.length >= maxMembers}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            {roleOptions.map(role => (
              <option key={role.value} value={role.value}>
                {role.label} - {role.description}
              </option>
            ))}
          </select>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || activeMembers.length >= maxMembers}
          style={{
            width: '100%',
            padding: '12px 24px',
            background: '#8B5CF6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: loading || activeMembers.length >= maxMembers ? 'not-allowed' : 'pointer',
            opacity: loading || activeMembers.length >= maxMembers ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Mail size={20} />
          {loading ? 'Envoi en cours...' : 'Envoyer l\'invitation'}
        </button>
      </form>

      {/* Liste des membres */}
      <div>
        <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>Membres de l'équipe</h3>
        {members.length === 0 ? (
          <p style={{ color: '#6B7280', textAlign: 'center', padding: '20px' }}>
            Aucun membre invité
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {members.map(member => (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {member.status === 'active' && <CheckCircle size={20} color="#10B981" />}
                  {member.status === 'pending' && <Clock size={20} color="#F59E0B" />}
                  {member.status === 'revoked' && <XCircle size={20} color="#EF4444" />}
                  <div>
                    <div style={{ fontWeight: '600' }}>{member.sub_user_email}</div>
                    <div style={{ fontSize: '14px', color: '#6B7280' }}>
                      {member.status === 'active' && 'Actif'}
                      {member.status === 'pending' && 'En attente'}
                      {member.status === 'revoked' && 'Révoqué'}
                      {member.role && ` • ${member.role === 'admin' ? '👑 Admin' : member.role === 'editor' ? '✏️ Éditeur' : '👁️ Lecteur'}`}
                    </div>
                  </div>
                </div>
                {member.status !== 'revoked' && (
                  <button
                    onClick={() => handleRevoke(member.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={16} />
                    Révoquer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
