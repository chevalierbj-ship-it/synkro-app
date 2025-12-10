import React from 'react';
import { Sparkles, Calendar, Users, TrendingUp, Check, ChevronRight, BarChart3 } from 'lucide-react';

/**
 * Composant d'affichage de la recommandation IA
 * Montre la meilleure date calculée et les alternatives
 */
export default function AIRecommendation({
  recommendation,
  onConfirm,
  onShowManualVote,
  eventData
}) {
  if (!recommendation) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#6B7280' }}>
          Aucune recommandation disponible
        </p>
      </div>
    );
  }

  const { bestDate, confidence, preferredBy, totalParticipants, alternativeDates } = recommendation;

  const formatDate = (dateLabel) => {
    return dateLabel;
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 80) return '#10B981'; // Vert
    if (conf >= 60) return '#F59E0B'; // Orange
    return '#EF4444'; // Rouge
  };

  const getConfidenceText = (conf) => {
    if (conf >= 80) return 'Excellente';
    if (conf >= 60) return 'Bonne';
    if (conf >= 40) return 'Correcte';
    return 'Faible';
  };

  return (
    <div style={{
      maxWidth: '750px',
      margin: '0 auto',
      padding: '40px 20px'
    }}>

      {/* Header avec animation */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s ease-in-out infinite',
            boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)'
          }}>
            <Sparkles size={36} color="white" />
          </div>
        </div>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#1E1B4B',
          marginBottom: '12px',
          margin: 0
        }}>
          L'IA a trouvé la date parfaite ! ✨
        </h1>
        <p style={{
          color: '#6B7280',
          fontSize: '17px',
          margin: '12px 0 0 0'
        }}>
          Basé sur les préférences de {preferredBy}/{totalParticipants} participant{totalParticipants > 1 ? 's' : ''}
        </p>
      </div>

      {/* Carte principale - Recommandation */}
      <div style={{
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
        borderRadius: '24px',
        padding: '40px',
        marginBottom: '24px',
        boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Décoration */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '28px',
          position: 'relative'
        }}>
          <Calendar size={36} strokeWidth={2.5} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px',
              opacity: 0.9,
              marginBottom: '6px',
              fontWeight: '600'
            }}>
              📅 Date recommandée
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: '800',
              lineHeight: '1.2'
            }}>
              {formatDate(bestDate.label)}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '28px',
          position: 'relative'
        }}>
          {/* Participants */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '14px',
            padding: '18px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px'
            }}>
              <Users size={20} />
              <span style={{ fontSize: '13px', opacity: 0.9, fontWeight: '600' }}>
                Participants
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>
              {preferredBy}/{totalParticipants}
            </div>
          </div>

          {/* Confiance */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '14px',
            padding: '18px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px'
            }}>
              <TrendingUp size={20} />
              <span style={{ fontSize: '13px', opacity: 0.9, fontWeight: '600' }}>
                Confiance
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>
              {Math.round(confidence)}%
            </div>
          </div>

          {/* Score IA */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '14px',
            padding: '18px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px'
            }}>
              <BarChart3 size={20} />
              <span style={{ fontSize: '13px', opacity: 0.9, fontWeight: '600' }}>
                Score IA
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>
              {bestDate.aiScore || bestDate.score || 0}
            </div>
          </div>
        </div>

        {/* Badge de confiance */}
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '12px',
          padding: '14px 20px',
          marginBottom: '28px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          <div style={{ fontSize: '15px', fontWeight: '700', opacity: 0.95 }}>
            {getConfidenceText(confidence)} correspondance • {bestDate.voters?.length || 0} vote{(bestDate.voters?.length || 0) > 1 ? 's' : ''} actuel{(bestDate.voters?.length || 0) > 1 ? 's' : ''}
          </div>
        </div>

        {/* Bouton confirmer */}
        <button
          onClick={() => onConfirm(bestDate)}
          style={{
            width: '100%',
            padding: '20px',
            background: 'white',
            color: '#8B5CF6',
            border: 'none',
            borderRadius: '14px',
            fontSize: '18px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.3s',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            position: 'relative',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
          }}
        >
          <Check size={22} strokeWidth={3} />
          Confirmer cette date
        </button>
      </div>

      {/* Dates alternatives */}
      {alternativeDates && alternativeDates.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: '24px',
          border: '2px solid #F5F3FF'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1E1B4B',
            marginBottom: '20px',
            margin: 0
          }}>
            📊 Dates alternatives
          </h3>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '20px'
          }}>
            {alternativeDates.map((alt, index) => (
              <div
                key={index}
                style={{
                  padding: '18px 20px',
                  background: '#F9FAFB',
                  borderRadius: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '2px solid #F3F4F6',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F5F3FF';
                  e.currentTarget.style.borderColor = '#E9D5FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#F3F4F6';
                }}
              >
                <div style={{ flex: 1, pointerEvents: 'none' }}>
                  <div style={{
                    fontWeight: '700',
                    color: '#1E1B4B',
                    fontSize: '16px',
                    marginBottom: '4px'
                  }}>
                    {formatDate(alt.label)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280' }}>
                    {alt.preferredBy}/{totalParticipants} participants • Score: {alt.aiScore || alt.score || 0}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirm(alt);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: 'white',
                    border: '2px solid #8B5CF6',
                    borderRadius: '10px',
                    color: '#8B5CF6',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    position: 'relative',
                    zIndex: 5
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#8B5CF6';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#8B5CF6';
                  }}
                >
                  Choisir
                  <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Option vote manuel */}
      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <button
          onClick={onShowManualVote}
          style={{
            padding: '14px 28px',
            background: 'transparent',
            border: '2px solid #E9D5FF',
            borderRadius: '12px',
            color: '#8B5CF6',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F5F3FF';
            e.currentTarget.style.borderColor = '#8B5CF6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = '#E9D5FF';
          }}
        >
          Préférer voter manuellement sur les dates proposées
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
