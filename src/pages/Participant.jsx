import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Users, CheckCircle, Clock, Download, Sparkles, MapPin, AlertCircle } from 'lucide-react';

const Participant = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id'); // Récupère l'ID depuis l'URL (?id=xxx)
  
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState(''); // 🆕 Email optionnel
  const [userEmail, setUserEmail] = useState(''); // 🆕 Email optionnel pour confirmation
  const [selectedDate, setSelectedDate] = useState(null);
  const [availabilities, setAvailabilities] = useState({});
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 🆕 FONCTIONS CALENDRIER
  const addToGoogleCalendar = () => {
    const startDate = new Date(selectedDate.date);
    const [hours, minutes] = selectedDate.time.split(':');
    startDate.setHours(parseInt(hours), parseInt(minutes));
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2); // Durée par défaut: 2 heures
    
    const formatGoogleDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.type,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: `Organisé par ${event.organizerName}\n\nCréé avec Synkro - https://synkro-app-bice.vercel.app`,
      location: event.location || ''
    });
    
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  };

  const addToOutlook = () => {
    const startDate = new Date(selectedDate.date);
    const [hours, minutes] = selectedDate.time.split(':');
    startDate.setHours(parseInt(hours), parseInt(minutes));
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2); // Durée par défaut: 2 heures
    
    const params = new URLSearchParams({
      subject: event.type,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      location: event.location || '',
      body: `Organisé par ${event.organizerName}\n\nCréé avec Synkro`
    });
    
    window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank');
  };

  const downloadICS = () => {
    const startDate = new Date(selectedDate.date);
    const [hours, minutes] = selectedDate.time.split(':');
    startDate.setHours(parseInt(hours), parseInt(minutes));
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2); // Durée par défaut: 2 heures
    
    const params = new URLSearchParams({
      title: event.type,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      location: event.location || '',
      description: `Organisé par ${event.organizerName} - Créé avec Synkro`
    });
    
    window.open(`/api/generate-ics?${params.toString()}`, '_blank');
  };

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

        const responseData = await response.json();
        const eventData = responseData.event; // ✅ Extraire l'événement
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
          eventId: eventId,
          participantName: userName.trim(),
          participantEmail: userEmail.trim() || undefined,
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
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '700px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '70px',
            height: '70px',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)'
          }}>
            <Sparkles size={36} color="white" />
          </div>
          <h1 style={{ 
            fontSize: '32px', 
            margin: '0 0 12px 0',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '800'
          }}>
            Synkro
          </h1>
        </div>

        {/* Step 1: Nom */}
        {step === 1 && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
              padding: '24px',
              borderRadius: '16px',
              marginBottom: '28px',
              border: '2px solid #E9D5FF'
            }}>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px', fontWeight: '600' }}>
                🎯 {event.type}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#1E1B4B', marginBottom: '8px' }}>
                Organisé par {event.organizerName}
              </div>
              {event.location && (
                <div style={{ fontSize: '14px', color: '#8B5CF6', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} />
                  {event.location}
                </div>
              )}
            </div>

            <h2 style={{ fontSize: '24px', marginBottom: '12px', color: '#1E1B4B', fontWeight: '700' }}>
              Comment t'appelles-tu ?
            </h2>
            <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '15px' }}>
              💡 Optionnel mais recommandé pour que l'organisateur puisse te reconnaître
            </p>

            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ton prénom"
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #E9D5FF',
                borderRadius: '12px',
                fontSize: '16px',
                marginBottom: '20px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8B5CF6';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E9D5FF';
                e.target.style.boxShadow = 'none';
              }}
            />

            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Ton email (optionnel, pour confirmation)"
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #E9D5FF',
                borderRadius: '12px',
                fontSize: '16px',
                marginBottom: '12px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8B5CF6';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E9D5FF';
                e.target.style.boxShadow = 'none';
              }}
            />

            <div style={{
              marginBottom: '20px',
              fontSize: '13px',
              color: '#6B7280',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              💌 Ton email est optionnel. Si tu le donnes, tu recevras une confirmation par email.
            </div>


            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                padding: '18px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 6px 16px rgba(139, 92, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.3)';
              }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* Step 2: Disponibilités */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '12px', color: '#1E1B4B', fontWeight: '700' }}>
              Quelles sont tes disponibilités ?
            </h2>
            <p style={{ color: '#6B7280', marginBottom: '28px', fontSize: '15px' }}>
              💡 Tape sur chaque date pour indiquer si tu es disponible ou non
            </p>

            <div style={{ marginBottom: '32px' }}>
              {event.dates.map((date, index) => {
                const badge = getBadge(date);
                const availability = availabilities[date.id];
                
                return (
                  <div 
                    key={date.id} 
                    style={{ 
                      marginBottom: '16px',
                      position: 'relative'
                    }}
                  >
                    {/* Badge */}
                    {badge && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '12px',
                        background: badge.color,
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        zIndex: 10,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}>
                        {badge.text}
                      </div>
                    )}

                    {/* Bouton de sélection */}
                    <button
                      onClick={() => handleAvailabilityToggle(date.id)}
                      style={{
                        width: '100%',
                        padding: '20px',
                        ...getButtonStyle(availability),
                        borderRadius: '14px',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        textAlign: 'left',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (availability === null) {
                          e.target.style.borderColor = '#8B5CF6';
                          e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (availability === null) {
                          e.target.style.borderColor = '#E9D5FF';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                            {date.label}
                          </div>
                          <div style={{ 
                            fontSize: '13px', 
                            opacity: 0.7,
                            fontWeight: '600'
                          }}>
                            {getButtonText(availability)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '4px', fontWeight: '600' }}>
                            {date.votes} {date.votes > 1 ? 'votes' : 'vote'}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Barre de progression */}
                    {date.votes > 0 && (
                      <div style={{
                        marginTop: '8px',
                        height: '6px',
                        background: '#F3F4F6',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min((date.votes / Math.max(...event.dates.map(d => d.votes))) * 100, 100)}%`,
                          background: getProgressColor(date.votes),
                          transition: 'width 0.3s ease',
                          borderRadius: '3px'
                        }}></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{
              padding: '16px',
              background: '#FEF3C7',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '2px solid #FCD34D'
            }}>
              <p style={{ 
                fontSize: '13px', 
                color: '#92400E',
                margin: 0,
                lineHeight: '1.5',
                fontWeight: '500'
              }}>
                💡 <strong>Astuce :</strong> Tu peux changer d'avis en tapant plusieurs fois sur la même date !
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '18px',
                  background: 'white',
                  color: '#8B5CF6',
                  border: '2px solid #E9D5FF',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ← Retour
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  flex: 2,
                  padding: '18px',
                  background: canSubmit 
                    ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' 
                    : '#E9D5FF',
                  color: canSubmit ? 'white' : '#C4B5FD',
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

            {/* 🆕 BOUTONS CALENDRIER */}
            <div style={{ 
              marginTop: '32px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              width: '100%',
              maxWidth: '500px',
              margin: '32px auto 0'
            }}>
              
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#1f2937',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                📅 Ajouter à ton calendrier
              </h3>

              {/* Bouton Google Calendar */}
              <button
                onClick={() => addToGoogleCalendar()}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  background: 'white',
                  color: '#8B5CF6',
                  border: '2px solid #8B5CF6',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#8B5CF6';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.1)';
                }}
              >
                <Calendar size={20} />
                Ajouter à Google Calendar
              </button>

              {/* Bouton Outlook */}
              <button
                onClick={() => addToOutlook()}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  background: 'white',
                  color: '#EC4899',
                  border: '2px solid #EC4899',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(236, 72, 153, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(236, 72, 153, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#EC4899';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(236, 72, 153, 0.1)';
                }}
              >
                <Calendar size={20} />
                Ajouter à Outlook Calendar
              </button>

              {/* Bouton Télécharger .ics */}
              <button
                onClick={() => downloadICS()}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: 'transparent',
                  color: '#6B7280',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#8B5CF6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#6B7280';
                }}
              >
                <Download size={18} />
                Télécharger .ics (Apple Calendar, autres...)
              </button>

            </div>

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
