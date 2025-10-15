import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, CheckCircle, Clock, Download, Sparkles, MapPin } from 'lucide-react';

const Participant = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [availabilities, setAvailabilities] = useState({
    date1: null,
    date2: null,
    date3: null
  });

  // Données simulées (en prod, viendront de l'API)
  const event = {
    type: '🍽️ Dîner restaurant',
    location: 'Restaurant Le Bistrot',
    organizer: 'Thomas',
    expectedParticipants: 6, // Si null, affichage absolu
    dates: [
      { id: 'date1', label: 'Ven 18 oct, 20:00', votes: 4, voters: ['Sarah', 'Marc', 'Julie', 'Paul'] },
      { id: 'date2', label: 'Sam 19 oct, 20:00', votes: 2, voters: ['Marc', 'Sophie'] },
      { id: 'date3', label: 'Ven 25 oct, 20:00', votes: 1, voters: ['Paul'] }
    ],
    totalResponded: 4
  };

  const handleAvailabilityToggle = (dateId) => {
    setAvailabilities(prev => {
      const current = prev[dateId];
      let newValue;
      
      if (current === null) {
        newValue = true; // Disponible
      } else if (current === true) {
        newValue = false; // Indisponible
      } else {
        newValue = null; // Aucune réponse
      }
      
      return { ...prev, [dateId]: newValue };
    });
  };

  const getButtonStyle = (availability) => {
    if (availability === true) {
      return {
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
        color: 'white',
        border: '2px solid #8B5CF6'
      };
    } else if (availability === false) {
      return {
        background: '#fff',
        color: '#EF4444',
        border: '2px solid #EF4444'
      };
    } else {
      return {
        background: '#fff',
        color: '#6B7280',
        border: '2px solid #E9D5FF'
      };
    }
  };

  const getButtonText = (availability) => {
    if (availability === true) return '✓ Disponible';
    if (availability === false) return '✗ Indisponible';
    return 'Tap pour indiquer';
  };

  const getBadge = (date) => {
    const maxVotes = Math.max(...event.dates.map(d => d.votes));
    const percentage = event.expectedParticipants ? (date.votes / event.expectedParticipants) * 100 : 0;

    if (event.expectedParticipants && percentage >= 70) {
      return { text: '✅ Majorité atteinte', color: '#10B981' };
    } else if (date.votes === maxVotes && date.votes > 0) {
      return { text: '🔥 Date populaire', color: '#F59E0B' };
    } else if (date.votes > 0) {
      return { text: '👀 En tête', color: '#8B5CF6' };
    }
    return null;
  };

  const getProgressColor = (votes) => {
    const maxVotes = Math.max(...event.dates.map(d => d.votes));
    if (votes === maxVotes && votes > 0) {
      return '#10B981'; // Vert
    } else if (votes > 0) {
      return '#F59E0B'; // Orange
    }
    return '#E5E7EB'; // Gris
  };

  const canSubmit = Object.values(availabilities).some(v => v !== null);

  const handleSubmit = () => {
    if (canSubmit && userName.trim()) {
      setStep(3);
      setTimeout(() => {
        setSelectedDate(event.dates[0]);
        setStep(4);
      }, 1500);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          <Sparkles size={32} color="white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: 'white',
            margin: 0,
            textShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            Synkro
          </h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.95)', margin: 0, fontSize: '16px' }}>
          Une date en 1 minute ⚡
        </p>
      </div>

      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.1)'
      }}>
        
        {/* Step 1: Enter name */}
        {step === 1 && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
              padding: '24px',
              borderRadius: '16px',
              marginBottom: '28px',
              border: '2px solid #E9D5FF'
            }}>
              <h2 style={{ 
                fontSize: '26px', 
                marginBottom: '10px', 
                color: '#1E1B4B',
                margin: '0 0 10px 0',
                fontWeight: '700'
              }}>
                {event.type}
              </h2>
              {event.location && (
                <p style={{ 
                  color: '#6B7280', 
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <MapPin size={16} color="#8B5CF6" />
                  {event.location}
                </p>
              )}
              <p style={{ 
                color: '#6B7280', 
                margin: 0,
                fontSize: '14px'
              }}>
                Organisé par <strong style={{ color: '#8B5CF6' }}>{event.organizer}</strong>
              </p>
            </div>

            <h3 style={{ fontSize: '22px', marginBottom: '12px', color: '#1E1B4B', fontWeight: '700' }}>
              👋 Ton prénom ?
            </h3>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '20px' }}>
              Pour qu'on sache qui tu es !
            </p>

            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && userName.trim() && setStep(2)}
              placeholder="Ex: Julie"
              autoFocus
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                border: '2px solid #E9D5FF',
                borderRadius: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                marginBottom: '20px',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
              onBlur={(e) => e.target.style.borderColor = '#E9D5FF'}
            />

            <button
              onClick={() => userName.trim() && setStep(2)}
              disabled={!userName.trim()}
              style={{
                width: '100%',
                padding: '18px',
                background: userName.trim()
                  ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                  : '#E9D5FF',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: userName.trim() ? 'pointer' : 'not-allowed',
                boxShadow: userName.trim() ? '0 8px 20px rgba(139, 92, 246, 0.3)' : 'none',
                transition: 'all 0.3s'
              }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* Step 2: Indicate availabilities */}
        {step === 2 && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
              padding: '20px',
              borderRadius: '16px',
              marginBottom: '24px',
              border: '2px solid #E9D5FF'
            }}>
              <h3 style={{ 
                fontSize: '20px', 
                marginBottom: '8px', 
                color: '#1E1B4B',
                margin: '0 0 8px 0',
                fontWeight: '700'
              }}>
                {event.type}
              </h3>
              {event.location && (
                <p style={{ 
                  color: '#6B7280', 
                  margin: '0 0 6px 0',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <MapPin size={14} color="#8B5CF6" />
                  {event.location}
                </p>
              )}
              <p style={{ 
                color: '#6B7280', 
                margin: 0,
                fontSize: '13px'
              }}>
                Organisé par <strong style={{ color: '#8B5CF6' }}>{event.organizer}</strong>
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              padding: '14px',
              background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
              borderRadius: '12px',
              border: '1px solid #E9D5FF'
            }}>
              <Users size={20} color="#8B5CF6" />
              <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>
                {event.expectedParticipants 
                  ? `${event.totalResponded}/${event.expectedParticipants} participants ont répondu`
                  : `${event.totalResponded} personnes ont répondu`
                }
              </span>
            </div>

            <h3 style={{ 
              fontSize: '18px', 
              marginBottom: '18px', 
              color: '#1E1B4B',
              fontWeight: '700'
            }}>
              Indique tes disponibilités :
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              {event.dates.map(date => {
                const badge = getBadge(date);
                const percentage = event.expectedParticipants ? (date.votes / event.expectedParticipants) * 100 : 0;
                const progressColor = getProgressColor(date.votes);

                return (
                  <div key={date.id} style={{
                    border: '2px solid #E9D5FF',
                    borderRadius: '16px',
                    padding: '18px',
                    background: 'linear-gradient(135deg, #FDFCFF 0%, #F9F7FF 100%)',
                    transition: 'all 0.3s'
                  }}>
                    <div style={{
                      marginBottom: '14px'
                    }}>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '700',
                        color: '#1E1B4B',
                        marginBottom: '8px'
                      }}>
                        {date.label}
                      </div>

                      {/* Barre de progression */}
                      {event.expectedParticipants ? (
                        <div>
                          <div style={{
                            width: '100%',
                            height: '8px',
                            background: '#E9D5FF',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: '8px'
                          }}>
                            <div style={{
                              width: `${percentage}%`,
                              height: '100%',
                              background: progressColor,
                              transition: 'all 0.3s'
                            }} />
                          </div>
                          <div style={{ 
                            fontSize: '13px', 
                            color: progressColor,
                            fontWeight: '600',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>{date.votes}/{event.expectedParticipants} ({Math.round(percentage)}%)</span>
                            {badge && <span style={{ color: badge.color }}>{badge.text}</span>}
                          </div>
                        </div>
                      ) : (
                        <div style={{ 
                          fontSize: '13px', 
                          color: progressColor,
                          fontWeight: '600',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>👥 {date.votes} personne{date.votes > 1 ? 's' : ''} disponible{date.votes > 1 ? 's' : ''}</span>
                          {badge && <span style={{ color: badge.color }}>{badge.text}</span>}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleAvailabilityToggle(date.id)}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        ...getButtonStyle(availabilities[date.id])
                      }}
                      onMouseEnter={(e) => {
                        if (availabilities[date.id] === true) {
                          e.target.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      {getButtonText(availabilities[date.id])}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width: '100%',
                padding: '18px',
                background: canSubmit
                  ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                  : '#E9D5FF',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: canSubmit ? '0 8px 20px rgba(139, 92, 246, 0.3)' : 'none',
                transition: 'all 0.3s'
              }}
            >
              <CheckCircle size={20} />
              Valider mes disponibilités
            </button>

            <p style={{
              fontSize: '12px',
              color: '#9CA3AF',
              textAlign: 'center',
              marginTop: '16px'
            }}>
              💡 Clique plusieurs fois pour changer ton choix
            </p>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{
              width: '90px',
              height: '90px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 32px',
              animation: 'pulse 1.5s ease-in-out infinite',
              boxShadow: '0 12px 28px rgba(139, 92, 246, 0.3)'
            }}>
              <Clock size={44} color="white" />
            </div>

            <h2 style={{ fontSize: '26px', marginBottom: '16px', color: '#1E1B4B', fontWeight: '700' }}>
              Analyse en cours...
            </h2>
            <p style={{ color: '#6B7280', fontSize: '16px' }}>
              Je cherche la meilleure date pour tout le monde 🤖
            </p>

            <style>{`
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
              }
            `}</style>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 4 && selectedDate && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '90px',
              height: '90px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 12px 28px rgba(139, 92, 246, 0.3)'
            }}>
              <CheckCircle size={52} color="white" />
            </div>

            <h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#1E1B4B', fontWeight: '700' }}>
              Date confirmée ! 🎉
            </h2>

            <div style={{
              background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
              padding: '28px',
              borderRadius: '20px',
              marginBottom: '28px',
              textAlign: 'left',
              border: '2px solid #E9D5FF'
            }}>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px', fontWeight: '600' }}>
                  Événement
                </div>
                <div style={{ fontSize: '19px', fontWeight: '700', color: '#1E1B4B' }}>
                  {event.type}
                </div>
              </div>

              {event.location && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px', fontWeight: '600' }}>
                    📍 Lieu
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1E1B4B' }}>
                    {event.location}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px', fontWeight: '600' }}>
                  📅 Date & Heure
                </div>
                <div style={{ 
                  fontSize: '22px', 
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {selectedDate.label}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px', fontWeight: '600' }}>
                  👥 Participants confirmés
                </div>
                <div style={{ fontSize: '15px', color: '#1E1B4B', fontWeight: '500' }}>
                  {event.organizer}, {selectedDate.voters.join(', ')}, {userName}
                </div>
              </div>
            </div>

            <button
              onClick={() => alert('Ajouté à Google Calendar ! (simulation)')}
              style={{
                width: '100%',
                padding: '18px',
                background: 'white',
                color: '#8B5CF6',
                border: '2px solid #8B5CF6',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)';
                e.target.style.color = 'white';
                e.target.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#8B5CF6';
                e.target.style.boxShadow = 'none';
              }}
            >
              <Calendar size={20} />
              Ajouter à Google Calendar
            </button>

            <button
              onClick={() => alert('Ajouté à Outlook ! (simulation)')}
              style={{
                width: '100%',
                padding: '18px',
                background: 'white',
                color: '#EC4899',
                border: '2px solid #EC4899',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#EC4899';
                e.target.style.color = 'white';
                e.target.style.boxShadow = '0 6px 16px rgba(236, 72, 153, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#EC4899';
                e.target.style.boxShadow = 'none';
              }}
            >
              <Calendar size={20} />
              Ajouter à Outlook
            </button>

            <button
              onClick={() => alert('Fichier .ics téléchargé ! (simulation)')}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#8B5CF6',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: '600'
              }}
            >
              <Download size={18} />
              Télécharger .ics
            </button>

            <div style={{
              marginTop: '32px',
              padding: '18px',
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              borderRadius: '14px',
              border: '2px solid #FCD34D'
            }}>
              <p style={{ 
                fontSize: '13px', 
                color: '#92400E',
                margin: 0,
                lineHeight: '1.6',
                fontWeight: '500'
              }}>
                💡 <strong>Astuce :</strong> Tu recevras un email de rappel 24h avant l'événement !
              </p>
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px',
        color: 'rgba(255,255,255,0.9)',
        fontSize: '14px'
      }}>
        <p style={{ margin: '0 0 8px 0' }}>✨ Prototype Synkro v2.0 - Purple Dream</p>
      </div>
    </div>
  );
};

export default Participant;