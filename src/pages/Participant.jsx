import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Users, CheckCircle, Clock, Download, Sparkles, MapPin, AlertCircle } from 'lucide-react';

const Participant = () => {
  const navigate = useNavigate();
  const { eventId } = useParams(); // Récupère l'ID depuis l'URL
  
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [availabilities, setAvailabilities] = useState({});
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔥 Charger l'événement depuis Airtable via API
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/get-event?id=${eventId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Cet événement n'existe pas ou a expiré 😕");
          } else {
            setError("Erreur lors du chargement de l'événement 😕");
          }
          setLoading(false);
          return;
        }

        const eventData = await response.json();
        setEvent(eventData);
        
        // Initialiser les availabilities avec null pour chaque date
        const initialAvailabilities = {};
        eventData.dates.forEach(date => {
          initialAvailabilities[date.id] = null;
        });
        setAvailabilities(initialAvailabilities);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError("Erreur lors du chargement de l'événement 😕");
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

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

  // 🔥 SAUVEGARDER les votes dans Airtable via API
  const handleSubmit = async () => {
    if (!canSubmit || !userName.trim()) return;

    try {
      setStep(3); // Afficher le loader

      // Appeler l'API pour sauvegarder
      const response = await fetch('/api/update-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId: event.id,
          airtableId: event.airtableId,
          participant: {
            name: userName.trim()
          },
          availabilities: availabilities
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save vote');
      }

      const result = await response.json();
      
      // Mettre à jour l'état local avec les nouvelles données
      setEvent(result.event);

      // Trouver la meilleure date et afficher le résultat
      setTimeout(() => {
        const bestDate = result.event.dates.reduce((prev, current) => 
          current.votes > prev.votes ? current : prev
        );
        setSelectedDate(bestDate);
        setStep(4);
      }, 1500);

    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      alert('Erreur lors de la sauvegarde de tes disponibilités 😕');
      setStep(2); // Retour au formulaire en cas d'erreur
    }
  };

  // 🔥 Écran de chargement
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
        <div style={{ textAlign: 'center', color: 'white' }}>
          <Clock size={48} />
          <p style={{ marginTop: '20px', fontSize: '18px' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  // 🔥 Écran d'erreur
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          background: 'white',
          borderRadius: '24px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3)'
        }}>
          <AlertCircle size={64} color="#EF4444" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ fontSize: '24px', marginBottom: '12px', color: '#1E1B4B' }}>
            {error}
          </h2>
          <p style={{ color: '#6B7280', marginBottom: '24px' }}>
            Vérifie que le lien est correct ou contacte l'organisateur.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
      padding: '20px',
      paddingBottom: '60px'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '16px'
          }}>
            <Sparkles size={32} color="#8B5CF6" />
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '700',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Synkro
            </h1>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
            padding: '20px',
            borderRadius: '16px',
            border: '2px solid #E9D5FF'
          }}>
            <h2 style={{ fontSize: '22px', marginBottom: '8px', color: '#1E1B4B', fontWeight: '700' }}>
              {event.type}
            </h2>
            <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>
              Organisé par <strong>{event.organizerName}</strong>
            </p>
            {event.location && (
              <div style={{ 
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#8B5CF6',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <MapPin size={18} />
                {event.location}
              </div>
            )}
          </div>
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#1E1B4B', fontWeight: '700' }}>
              👋 Comment t'appelles-tu ?
            </h3>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '20px' }}>
              Entre ton nom pour continuer
            </p>

            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ton nom"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                border: '2px solid #E9D5FF',
                borderRadius: '12px',
                marginBottom: '20px',
                outline: 'none',
                transition: 'border 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
              onBlur={(e) => e.target.style.borderColor = '#E9D5FF'}
            />

            <button
              onClick={() => setStep(2)}
              disabled={!userName.trim()}
              style={{
                width: '100%',
                padding: '18px',
                background: userName.trim() 
                  ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                  : '#E5E7EB',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: userName.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s',
                boxShadow: userName.trim() ? '0 6px 16px rgba(139, 92, 246, 0.3)' : 'none'
              }}
            >
              Continuer
            </button>
          </div>
        )}

        {/* Step 2: Availability Selection */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#1E1B4B', fontWeight: '700' }}>
                📅 Tes disponibilités
              </h3>
              <p style={{ color: '#6B7280', fontSize: '14px' }}>
                Indique pour chaque date si tu es disponible ou non
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              {event.dates.map((date) => {
                const badge = getBadge(date);
                
                return (
                  <div 
                    key={date.id}
                    style={{
                      marginBottom: '16px',
                      padding: '20px',
                      background: '#F9FAFB',
                      borderRadius: '16px',
                      border: '2px solid #E9D5FF'
                    }}
                  >
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: '700',
                          color: '#1E1B4B',
                          marginBottom: '4px'
                        }}>
                          {date.label}
                        </div>
                        {badge && (
                          <div style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            background: badge.color,
                            color: 'white',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {badge.text}
                          </div>
                        )}
                      </div>
                      
                      {date.votes > 0 && (
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#8B5CF6'
                        }}>
                          <Users size={18} />
                          {date.votes}
                        </div>
                      )}
                    </div>

                    {date.votes > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: '#E5E7EB',
                          borderRadius: '10px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(date.votes / (event.expectedParticipants || date.votes)) * 100}%`,
                            height: '100%',
                            background: getProgressColor(date.votes),
                            transition: 'width 0.5s'
                          }} />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleAvailabilityToggle(date.id)}
                      style={{
                        width: '100%',
                        padding: '14px',
                        ...getButtonStyle(availabilities[date.id]),
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                    >
                      {getButtonText(availabilities[date.id])}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '12px'
            }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '18px',
                  background: 'white',
                  color: '#8B5CF6',
                  border: '2px solid #8B5CF6',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Retour
              </button>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  flex: 2,
                  padding: '18px',
                  background: canSubmit 
                    ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                    : '#E5E7EB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s',
                  boxShadow: canSubmit ? '0 6px 16px rgba(139, 92, 246, 0.3)' : 'none'
                }}
              >
                Valider mes disponibilités
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Loading */}
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
                  {event.organizerName || event.organizer}
                  {selectedDate.voters.length > 0 && `, ${selectedDate.voters.join(', ')}`}
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
        <p style={{ margin: '0 0 8px 0' }}>✨ Synkro v2.1 - Airtable Edition</p>
      </div>
    </div>
  );
};

export default Participant;
