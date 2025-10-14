import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, CheckCircle, Clock, Download, Sparkles } from 'lucide-react';

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

  const event = {
    type: '🍽️ Dîner restaurant',
    organizer: 'Thomas',
    dates: [
      { id: 'date1', label: 'Ven 18 oct, 20:00', votes: 2, voters: ['Sarah', 'Marc'] },
      { id: 'date2', label: 'Sam 19 oct, 20:00', votes: 1, voters: ['Marc'] },
      { id: 'date3', label: 'Ven 25 oct, 20:00', votes: 0, voters: [] }
    ],
    totalParticipants: 3,
    responded: 2
  };

  const handleAvailabilityToggle = (dateId) => {
    setAvailabilities(prev => {
      const current = prev[dateId];
      let newValue;
      
      if (current === null) {
        newValue = true;
      } else if (current === true) {
        newValue = false;
      } else {
        newValue = null;
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

  const canSubmit = Object.values(availabilities).some(v => v !== null);

  const handleSubmit = () => {
    if (canSubmit && userName.trim()) {
      setStep(2);
      setTimeout(() => {
        setSelectedDate(event.dates[0]);
        setStep(3);
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
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/')}>
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
              <p style={{ 
                color: '#6B7280', 
                margin: 0,
                fontSize: '14px'
              }}>
                Organisé par <strong style={{ color: '#8B5CF6' }}>{event.organizer}</strong>
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '28px',
              padding: '14px',
              background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
              borderRadius: '12px',
              border: '1px solid #E9D5FF'
            }}>
              <Users size={20} color="#8B5CF6" />
              <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>
                {event.responded}/{event.totalParticipants} participants ont répondu
              </span>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontSize: '14px',
                color: '#1E1B4B',
                fontWeight: '700'
              }}>
                Ton prénom
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex: Julie"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  border: '2px solid #E9D5FF',
                  borderRadius: '14px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
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
              {event.dates.map(date => (
                <div key={date.id} style={{
                  border: '2px solid #E9D5FF',
                  borderRadius: '16px',
                  padding: '18px',
                  background: 'linear-gradient(135deg, #FDFCFF 0%, #F9F7FF 100%)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '700',
                        color: '#1E1B4B',
                        marginBottom: '6px'
                      }}>
                        {date.label}
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#8B5CF6',
                        fontWeight: '500'
                      }}>
                        {date.votes > 0 ? (
                          <span>✓ {date.votes} dispo{date.votes > 1 ? 's' : ''}</span>
                        ) : (
                          <span style={{ color: '#9CA3AF' }}>Aucune réponse</span>
                        )}
                      </div>
                    </div>
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
                      ...getButtonStyle(availabilities[date.id])
                    }}
                  >
                    {getButtonText(availabilities[date.id])}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || !userName.trim()}
              style={{
                width: '100%',
                padding: '18px',
                background: (canSubmit && userName.trim())
                  ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                  : '#E9D5FF',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: (canSubmit && userName.trim()) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
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

        {step === 2 && (
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
              animation: 'pulse 1.5s ease-in-out infinite'
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

        {step === 3 && selectedDate && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '90px',
              height: '90px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
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
                gap: '10px'
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
                gap: '10px'
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
        <p style={{ margin: '0 0 8px 0' }}>✨ Prototype Synkro v1.0 - Purple Dream</p>
      </div>
    </div>
  );
};

export default Participant;