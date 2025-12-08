import React, { useState } from 'react';
import { Palette, Upload, Check } from 'lucide-react';

const COLORS = [
  { name: 'violet', label: 'Violet', hex: '#8B5CF6' },
  { name: 'rose', label: 'Rose', hex: '#EC4899' },
  { name: 'bleu', label: 'Bleu', hex: '#3B82F6' },
  { name: 'vert', label: 'Vert', hex: '#10B981' },
  { name: 'orange', label: 'Orange', hex: '#F97316' }
];

export default function CustomizationPanel({ userData, onSave }) {
  const [selectedColor, setSelectedColor] = useState(userData?.theme_color || 'violet');
  const [hideBranding, setHideBranding] = useState(userData?.hide_branding || false);
  const [saving, setSaving] = useState(false);

  const isPro = userData?.plan === 'pro' || userData?.plan === 'entreprise';

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/user?action=customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: userData.clerk_user_id,
          themeColor: selectedColor,
          hideBranding: hideBranding
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Préférences sauvegardées !');
        if (onSave) onSave();
      } else {
        alert('Erreur : ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (!isPro) {
    return (
      <div style={{
        padding: '40px',
        background: 'white',
        borderRadius: '16px',
        textAlign: 'center',
        opacity: 0.6
      }}>
        <div style={{ fontSize: '48px' }}>🔒</div>
        <h3>Fonctionnalité PRO</h3>
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
          Passer en Pro
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', padding: '32px', borderRadius: '16px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Palette size={28} color="#8B5CF6" />
        Personnalisation
      </h2>

      {/* Couleurs */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px' }}>
          Couleur du thème
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          {COLORS.map(color => (
            <button
              key={color.name}
              onClick={() => setSelectedColor(color.name)}
              style={{
                width: '60px',
                height: '60px',
                background: color.hex,
                border: selectedColor === color.name ? '3px solid black' : 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {selectedColor === color.name && (
                <Check size={24} color="white" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Branding */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={hideBranding}
            onChange={(e) => setHideBranding(e.target.checked)}
          />
          Masquer le branding Synkro
        </label>
      </div>

      {/* Bouton sauvegarder */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          padding: '16px',
          background: '#8B5CF6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>
    </div>
  );
}
