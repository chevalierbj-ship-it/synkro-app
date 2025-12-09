import React, { useState, useRef } from 'react';
import { Palette, Upload, Check, X, Image, Trash2, Loader2 } from 'lucide-react';

const COLORS = [
  { name: 'violet', label: 'Violet', hex: '#8B5CF6' },
  { name: 'rose', label: 'Rose', hex: '#EC4899' },
  { name: 'bleu', label: 'Bleu', hex: '#3B82F6' },
  { name: 'vert', label: 'Vert', hex: '#10B981' },
  { name: 'orange', label: 'Orange', hex: '#F97316' }
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export default function CustomizationPanel({ userData, onSave }) {
  const [selectedColor, setSelectedColor] = useState(userData?.theme_color || 'violet');
  const [hideBranding, setHideBranding] = useState(userData?.hide_branding || false);
  const [logoUrl, setLogoUrl] = useState(userData?.custom_logo_url || null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const isPro = userData?.plan === 'pro' || userData?.plan === 'entreprise';
  const isEnterprise = userData?.plan === 'entreprise';

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);

    // Validation du type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Type de fichier non supporte. Utilisez PNG, JPEG, WebP ou SVG.');
      return;
    }

    // Validation de la taille
    if (file.size > MAX_FILE_SIZE) {
      setError('Le fichier est trop volumineux. Taille maximale : 2MB');
      return;
    }

    // Apercu local
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload vers le serveur
    await uploadLogo(file);
  };

  const uploadLogo = async (file) => {
    setUploadingLogo(true);
    setError(null);

    try {
      // Convertir le fichier en base64
      const base64 = await fileToBase64(file);

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: userData.clerk_user_id,
          logoData: base64,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        })
      });

      const data = await response.json();

      if (data.success) {
        setLogoUrl(data.logoUrl);
        setLogoPreview(null);
      } else {
        setError(data.message || 'Erreur lors de l\'upload');
        setLogoPreview(null);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Erreur de connexion. Veuillez reessayer.');
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const deleteLogo = async () => {
    if (!logoUrl) return;

    setUploadingLogo(true);
    setError(null);

    try {
      const response = await fetch('/api/upload-logo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: userData.clerk_user_id
        })
      });

      const data = await response.json();

      if (data.success) {
        setLogoUrl(null);
        setLogoPreview(null);
      } else {
        setError(data.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Erreur de connexion. Veuillez reessayer.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Extraire seulement la partie base64 (sans le prefix data:...)
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

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
        if (onSave) onSave();
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Erreur lors de la sauvegarde');
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
        <h3>Fonctionnalite PRO</h3>
        <p style={{ color: '#6B7280', marginBottom: '20px' }}>
          Personnalisez vos evenements avec vos couleurs et votre logo
        </p>
        <button
          onClick={() => window.location.href = '/pricing'}
          style={{
            padding: '12px 24px',
            background: '#8B5CF6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
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

      {/* Message d'erreur */}
      {error && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#DC2626'
        }}>
          <X size={18} />
          {error}
        </div>
      )}

      {/* Upload Logo (Entreprise seulement) */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '600',
          marginBottom: '12px'
        }}>
          <Image size={20} color="#8B5CF6" />
          Logo personnalise
          {!isEnterprise && (
            <span style={{
              fontSize: '11px',
              background: '#F3F4F6',
              padding: '2px 8px',
              borderRadius: '4px',
              color: '#6B7280'
            }}>
              Entreprise
            </span>
          )}
        </label>

        {isEnterprise ? (
          <div>
            {/* Apercu du logo */}
            {(logoUrl || logoPreview) && (
              <div style={{
                position: 'relative',
                width: '120px',
                height: '120px',
                border: '2px dashed #E5E7EB',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '12px'
              }}>
                <img
                  src={logoPreview || logoUrl}
                  alt="Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '8px'
                  }}
                />
                {!uploadingLogo && (
                  <button
                    onClick={deleteLogo}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                {uploadingLogo && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255,255,255,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Loader2 size={24} color="#8B5CF6" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
              </div>
            )}

            {/* Bouton upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: '#F3F4F6',
                border: '2px dashed #D1D5DB',
                borderRadius: '8px',
                cursor: uploadingLogo ? 'wait' : 'pointer',
                color: '#4B5563',
                fontWeight: '500'
              }}
            >
              {uploadingLogo ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Upload size={18} />
              )}
              {logoUrl ? 'Changer le logo' : 'Telecharger un logo'}
            </button>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
              PNG, JPEG, WebP ou SVG. Max 2MB.
            </p>
          </div>
        ) : (
          <div style={{
            padding: '20px',
            background: '#F9FAFB',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
              Passez au plan Entreprise pour telecharger votre logo
            </p>
            <button
              onClick={() => window.location.href = '/pricing'}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                background: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Voir les plans
            </button>
          </div>
        )}
      </div>

      {/* Couleurs */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px' }}>
          Couleur du theme
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          {COLORS.map(color => (
            <button
              key={color.name}
              onClick={() => setSelectedColor(color.name)}
              title={color.label}
              style={{
                width: '60px',
                height: '60px',
                background: color.hex,
                border: selectedColor === color.name ? '3px solid #1E1B4B' : '3px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'transform 0.15s ease'
              }}
            >
              {selectedColor === color.name && (
                <Check
                  size={24}
                  color="white"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Branding */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={hideBranding}
            onChange={(e) => setHideBranding(e.target.checked)}
            style={{
              width: '20px',
              height: '20px',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontWeight: '500' }}>Masquer le branding Synkro</span>
        </label>
        <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '8px', marginLeft: '32px' }}>
          Retire la mention "Cree avec Synkro" de vos pages evenements
        </p>
      </div>

      {/* Bouton sauvegarder */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          padding: '16px',
          background: saving ? '#D1D5DB' : '#8B5CF6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: saving ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '16px'
        }}
      >
        {saving ? (
          <>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Sauvegarde...
          </>
        ) : (
          <>
            <Check size={18} />
            Sauvegarder les preferences
          </>
        )}
      </button>

      {/* CSS pour l'animation de spin */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
