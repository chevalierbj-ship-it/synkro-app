import React, { useState } from 'react';
import { Palette, Image, Lock, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Composant de personnalisation pour les utilisateurs PRO/Entreprise
 * Permet de changer la couleur principale et d'uploader un logo
 */
export default function CustomizationPanel({ isPro, onColorChange, onLogoUpload }) {
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');
  const [logoPreview, setLogoPreview] = useState(null);

  const colors = [
    { name: 'Violet', value: '#8B5CF6' },
    { name: 'Rose', value: '#EC4899' },
    { name: 'Bleu', value: '#3B82F6' },
    { name: 'Vert', value: '#10B981' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Rouge', value: '#EF4444' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Cyan', value: '#06B6D4' }
  ];

  const handleColorSelect = (color) => {
    if (!isPro) return;
    setSelectedColor(color.value);
    if (onColorChange) {
      onColorChange(color.value);
    }
  };

  const handleLogoChange = (e) => {
    if (!isPro) return;

    const file = e.target.files[0];
    if (file) {
      // Validation du fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image');
        return;
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB max
        alert('L\'image ne doit pas dépasser 2MB');
        return;
      }

      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        if (onLogoUpload) {
          onLogoUpload(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Version bloquée pour utilisateurs gratuits
  if (!isPro) {
    return (
      <div style={{
        padding: '24px',
        background: '#F9FAFB',
        borderRadius: '16px',
        position: 'relative',
        border: '2px dashed #D1D5DB'
      }}>
        {/* Overlay de verrouillage */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Lock size={32} color="white" />
          </div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1E1B4B',
            marginBottom: '8px'
          }}>
            Fonctionnalité PRO
          </h3>
          <p style={{
            color: '#6B7280',
            marginBottom: '20px',
            fontSize: '14px',
            maxWidth: '300px'
          }}>
            Personnalisez l'apparence de vos événements avec vos couleurs et votre logo
          </p>
          <button
            onClick={() => navigate('/pricing')}
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <Crown size={20} />
            Upgrade vers Pro
          </button>
        </div>

        {/* Contenu preview (flouté) */}
        <div style={{ filter: 'blur(3px)', pointerEvents: 'none' }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            marginBottom: '20px',
            color: '#1E1B4B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Palette size={24} color="#8B5CF6" />
            Personnalisation
          </h3>

          {/* Couleurs */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              Couleur principale
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px'
            }}>
              {colors.map(color => (
                <div
                  key={color.value}
                  style={{
                    width: '100%',
                    paddingTop: '100%',
                    borderRadius: '12px',
                    background: color.value,
                    position: 'relative'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Logo */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              Votre logo
            </label>
            <div style={{
              padding: '32px',
              border: '2px dashed #D1D5DB',
              borderRadius: '12px',
              textAlign: 'center',
              background: 'white'
            }}>
              <Image size={32} color="#9CA3AF" style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Cliquez pour uploader
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Version débloquée pour utilisateurs PRO
  return (
    <div style={{
      padding: '24px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '2px solid #E5E7EB'
    }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: '700',
        marginBottom: '20px',
        color: '#1E1B4B',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Palette size={24} color="#8B5CF6" />
        Personnalisation ✨
      </h3>

      {/* Sélecteur de couleur */}
      <div style={{ marginBottom: '28px' }}>
        <label style={{
          display: 'block',
          marginBottom: '12px',
          fontWeight: '600',
          fontSize: '14px',
          color: '#374151'
        }}>
          Couleur principale
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px'
        }}>
          {colors.map(color => (
            <button
              key={color.value}
              onClick={() => handleColorSelect(color)}
              style={{
                width: '100%',
                paddingTop: '100%',
                borderRadius: '12px',
                background: color.value,
                border: selectedColor === color.value ? '4px solid #1E1B4B' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.3s',
                position: 'relative',
                boxShadow: selectedColor === color.value
                  ? '0 4px 12px rgba(0,0,0,0.2)'
                  : '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                if (selectedColor !== color.value) {
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
              title={color.name}
            />
          ))}
        </div>
        <p style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#6B7280'
        }}>
          Couleur sélectionnée : <strong>{colors.find(c => c.value === selectedColor)?.name}</strong>
        </p>
      </div>

      {/* Upload logo */}
      <div>
        <label style={{
          display: 'block',
          marginBottom: '12px',
          fontWeight: '600',
          fontSize: '14px',
          color: '#374151'
        }}>
          <Image size={16} style={{ display: 'inline', marginRight: '8px' }} />
          Votre logo
        </label>

        {logoPreview ? (
          <div style={{
            padding: '20px',
            border: '2px solid #E5E7EB',
            borderRadius: '12px',
            background: '#F9FAFB',
            textAlign: 'center',
            position: 'relative'
          }}>
            <img
              src={logoPreview}
              alt="Logo preview"
              style={{
                maxWidth: '200px',
                maxHeight: '100px',
                objectFit: 'contain',
                marginBottom: '12px'
              }}
            />
            <button
              onClick={() => setLogoPreview(null)}
              style={{
                padding: '8px 16px',
                background: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Supprimer
            </button>
          </div>
        ) : (
          <label style={{
            display: 'block',
            padding: '32px',
            border: '2px dashed #D1D5DB',
            borderRadius: '12px',
            textAlign: 'center',
            background: '#F9FAFB',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#8B5CF6';
            e.target.style.background = '#F5F3FF';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#D1D5DB';
            e.target.style.background = '#F9FAFB';
          }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              style={{ display: 'none' }}
            />
            <Image size={32} color="#8B5CF6" style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
              Cliquez pour uploader votre logo
            </p>
            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
              PNG, JPG ou SVG • Max 2MB
            </p>
          </label>
        )}
      </div>
    </div>
  );
}
