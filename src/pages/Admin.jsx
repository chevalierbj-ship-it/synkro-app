import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Users, CheckCircle, Clock, Share2, Copy, Sparkles, MapPin, AlertCircle, TrendingUp, BarChart, Pause, Play, Volume2, VolumeX, RefreshCw, Bell } from 'lucide-react';

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDateToConfirm, setSelectedDateToConfirm] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // États temps réel
  const [countdown, setCountdown] = useState(10);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [previousParticipantCount, setPreviousParticipantCount] = useState(0);
  const [newParticipants, setNewParticipants] = useState([]);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🆕 État pour la relance
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState(false);

  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  // Fonction pour jouer un son de notification
  const playNotificationSound = () => {
    if (!isSoundEnabled) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  // Fonction de récupération des données
  const fetchEvent = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/get-event?id=${eventId}`);
      
      if (!response.ok) {
        throw new Error('Événement non trouvé');
      }

      const data = await response.json();
      const newEvent = data.event;

      // Détection de nouveaux participants
      if (event && newEvent.participants) {
        const oldCount = event.participants?.length || 0;
        const newCount = newEvent.participants.length;

        if (newCount > oldCount) {
          const newParticipantsList = newEvent.participants.slice(oldCount);
          setNewParticipants(newParticipantsList.map(p => p.name));
          playNotificationSound();

          setTimeout(() => {
            setNewParticipants([]);
          }, 3000);
        }
      }

      setEvent(newEvent);
      setLastRefreshTime(new Date());
      setLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err.message);
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Gestion du countdown et auto-refresh
  useEffect(() => {
    if (!eventId) {
      setError('ID d\'événement manquant');
      setLoading(false);
      return;
    }

    fetchEvent();

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [eventId]);

  // Auto-refresh quand countdown = 10
  useEffect(() => {
    if (countdown === 10 && isAutoRefreshEnabled && event) {
      fetchEvent();
    }
  }, [countdown, isAutoRefreshEnabled]);

  // Toggle pause/play
  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(prev => !prev);
    if (!isAutoRefreshEnabled) {
      setCountdown(10);
    }
  };

  // Refresh manuel
  const manualRefresh = () => {
    setCountdown(10);
    fetchEvent();
  };

  // 🆕 FONCTION : Relancer les non-votants
  const sendReminder = async () => {
    if (isSendingReminder) return;

    setIsSendingReminder(true);
    setReminderSuccess(false);

    try {
      const response = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventId })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la relance');
      }

      setReminderSuccess(true);
      setTimeout(() => {
        setReminderSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Erreur lors de l\'envoi de la relance. Réessayez.');
    } finally {
      setIsSendingReminder(false);
    }
  };

  const participantLink = `${window.location.origin}/participant?id=${eventId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(participantLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const shareVia = (platform) => {
    const text = `${event.organizerName} t'invite : ${event.type}`;
    const encodedLink = encodeURIComponent(participantLink);
    const encodedText = encodeURIComponent(text);

    const urls = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedLink}`,
      messenger: `fb-messenger://share/?link=${encodedLink}`,
      email: `mailto:?subject=${encodedText}&body=${encodedText}%20-%20${encodedLink}`,
      sms: `sms:?body=${encodedText}%20${encodedLink}`
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
  };

  const getBestDate = () => {
    if (!event || !event.dates || event.dates.length === 0) return null;
    return event.dates.reduce((prev, current) => 
      current.votes > prev.votes ? current : prev
    );
  };

  const getProgressPercentage = () => {
    if (!event || !event.expectedParticipants || event.expectedParticipants === 0) return 0;
    return Math.round((event.totalResponded / event.expectedParticipants) * 100);
  };

  const getDatePercentage = (date) => {
    if (!event || !event.expectedParticipants || event.expectedParticipants === 0) return 0;
    return Math.round((date.votes / event.expectedParticipants) * 100);
  };

  // Écran de chargement
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

  // Écran d'erreur
  if (error || !event) {
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
          maxWidth: '500px',
          background: 'white',
          borderRadius: '24px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3)'
        }}>
          <AlertCircle size={64} color="#EF4444" />
          <h2 style={{ color: '#1E1B4B', marginTop: '20px', marginBottom: '10px' }}>
            Événement introuvable
          </h2>
          <p style={{ color: '#6B7280', marginBottom: '30px' }}>
            {error || 'Cet événement n\'existe pas ou a été supprimé.'}
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
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const bestDate = getBestDate();
  const progressPercentage = getProgressPercentage();
  const remainingParticipants = Math.max(0, (event.expectedParticipants || 0) - (event.totalResponded || 0));

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '900px',
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
            <BarChart size={36} color="white" />
          </div>
          <h1 style={{ 
            fontSize: '32px', 
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '800'
          }}>
            Dashboard Organisateur
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
            Gérez votre événement en temps réel
          </p>
        </div>

        {/* Bandeau Temps Réel */}
        <div style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: '#FFF',
              borderRadius: '50%',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.7)'
            }}></div>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>
              🟢 En direct
            </span>
            {lastRefreshTime && (
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
                • Mis à jour à {lastRefreshTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '8px 14px',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '700',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Clock size={16} />
              {isAutoRefreshEnabled ? `${countdown}s` : '⏸️'}
            </div>

            <button
              onClick={toggleAutoRefresh}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: '600',
                fontSize: '13px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              {isAutoRefreshEnabled ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Play</>}
            </button>

            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              onClick={manualRefresh}
              disabled={isRefreshing}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: '600',
                fontSize: '13px',
                transition: 'background 0.2s',
                opacity: isRefreshing ? 0.5 : 1
              }}
              onMouseEnter={(e) => !isRefreshing && (e.target.style.background = 'rgba(255,255,255,0.3)')}
              onMouseLeave={(e) => !isRefreshing && (e.target.style.background = 'rgba(255,255,255,0.2)')}
            >
              <RefreshCw size={16} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Badge Nouveau vote */}
        {newParticipants.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            animation: 'flash 0.5s ease-in-out',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: '700', fontSize: '15px' }}>
              <Sparkles size={20} />
              Nouveau{newParticipants.length > 1 ? 'x' : ''} vote{newParticipants.length > 1 ? 's' : ''} ! 🎉
            </div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', marginTop: '6px' }}>
              {newParticipants.join(', ')} {newParticipants.length > 1 ? 'ont' : 'a'} voté !
            </div>
          </div>
        )}

        {/* Badge Relance réussie */}
        {reminderSuccess && (
          <div style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            animation: 'flash 0.5s ease-in-out',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: '700', fontSize: '15px' }}>
              <CheckCircle size={20} />
              Relance envoyée avec succès ! 📧
            </div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', marginTop: '6px' }}>
              Vérifie ton email pour le message à partager
            </div>
          </div>
        )}

        {/* Info Événement */}
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

        {/* Statistiques */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          {event.expectedParticipants && (
            <div style={{
              background: 'linear-gradient(135deg, #EEF2FF 0%, #DBEAFE 100%)',
              padding: '20px',
              borderRadius: '12px',
              border: '2px solid #DBEAFE'
            }}>
              <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '8px' }}>
                👥 Participants attendus
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#1E40AF' }}>
                {event.expectedParticipants}
              </div>
            </div>
          )}

          <div style={{
            background: 'linear-gradient(135deg, #F0FDF4 0%, #D1FAE5 100%)',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #D1FAE5'
          }}>
            <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '8px' }}>
              ✅ Réponses reçues
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669' }}>
              {event.totalResponded || 0}
            </div>
          </div>

          {bestDate && (
            <div style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              padding: '20px',
              borderRadius: '12px',
              border: '2px solid #FDE68A'
            }}>
              <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '8px' }}>
                ⭐ Date favorite
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#92400E' }}>
                {bestDate.label}
              </div>
              <div style={{ fontSize: '13px', color: '#92400E', marginTop: '4px' }}>
                {bestDate.votes} vote{bestDate.votes !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Progression globale */}
        {event.expectedParticipants && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E1B4B', margin: 0 }}>
                📊 Taux de participation
              </h3>
              <span style={{ fontSize: '20px', fontWeight: '800', color: progressPercentage >= 70 ? '#10B981' : '#8B5CF6' }}>
                {progressPercentage}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              background: '#E9D5FF',
              borderRadius: '20px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(progressPercentage, 100)}%`,
                height: '100%',
                background: progressPercentage >= 70 ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)' : 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
            {progressPercentage >= 70 && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: '#D1FAE5',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#065F46',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                ✅ Majorité atteinte ! Vous pouvez confirmer la date.
              </div>
            )}
          </div>
        )}

        {/* Résultats par date */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E1B4B', marginBottom: '16px' }}>
            📅 Votes par date
          </h3>
          {event.dates && event.dates.map((date, index) => (
            <div key={index} style={{
              background: 'white',
              border: '2px solid #E9D5FF',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#1E1B4B' }}>
                  {date.label}
                </span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#8B5CF6' }}>
                  {date.votes} vote{date.votes !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div style={{
                width: '100%',
                height: '8px',
                background: '#E9D5FF',
                borderRadius: '20px',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: event.expectedParticipants > 0 ? `${Math.min(getDatePercentage(date), 100)}%` : `${Math.min((date.votes / (event.totalResponded || 1)) * 100, 100)}%`,
                  height: '100%',
                  background: date.votes === bestDate.votes ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)' : 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)',
                  transition: 'width 0.5s ease'
                }}></div>
              </div>

              {date.voters && date.voters.length > 0 && (
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  👥 {date.voters.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Résultats du vote budget */}
        {event.budgetVoteEnabled && event.budgetVotes && event.budgetVotes.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E1B4B', marginBottom: '16px' }}>
              💰 Vote budget
            </h3>
            {(() => {
              const maxBudgetVotes = Math.max(...event.budgetVotes.map(b => b.votes));
              return event.budgetVotes.map((budget, index) => {
                const isBest = budget.votes === maxBudgetVotes && budget.votes > 0;
                return (
                  <div key={index} style={{
                    background: isBest ? 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)' : 'white',
                    border: isBest ? '2px solid #10B981' : '2px solid #E9D5FF',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#1E1B4B' }}>
                          {budget.range}
                        </span>
                        {isBest && (
                          <span style={{
                            fontSize: '11px',
                            background: '#10B981',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontWeight: '700'
                          }}>
                            Majoritaire
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: isBest ? '#059669' : '#8B5CF6' }}>
                        {budget.votes} vote{budget.votes !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: isBest ? '#A7F3D0' : '#E9D5FF',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        width: event.totalResponded > 0 ? `${Math.min((budget.votes / event.totalResponded) * 100, 100)}%` : '0%',
                        height: '100%',
                        background: isBest ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)' : 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)',
                        transition: 'width 0.5s ease'
                      }}></div>
                    </div>

                    {budget.voters && budget.voters.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        👥 {budget.voters.join(', ')}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* Liste des participants */}
        {event.participants && event.participants.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E1B4B', marginBottom: '16px' }}>
              👥 Participants ({event.participants.length})
            </h3>
            <div style={{ 
              background: 'white',
              border: '2px solid #E9D5FF',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {event.participants.map((participant, index) => {
                const isNew = newParticipants.includes(participant.name);
                return (
                  <div key={index} style={{
                    padding: '16px',
                    borderBottom: index < event.participants.length - 1 ? '1px solid #E9D5FF' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isNew ? 'linear-gradient(90deg, rgba(251,191,36,0.1) 0%, rgba(252,211,77,0.1) 100%)' : 'transparent',
                    animation: isNew ? 'flash 0.5s ease-in-out' : 'none'
                  }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1E1B4B', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {participant.name}
                        {isNew && <span style={{ fontSize: '11px', background: '#F59E0B', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>NOUVEAU</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {new Date(participant.votedAt).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#8B5CF6', fontWeight: '600' }}>
                      {Object.values(participant.availabilities).filter(v => v === true).length} dates ✓
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E1B4B', marginBottom: '16px' }}>
            ⚡ Actions rapides
          </h3>
          
          {/* 🆕 BOUTON RELANCER LES NON-VOTANTS */}
          {remainingParticipants > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '16px',
              border: '2px solid #FCD34D'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E1B4B', marginBottom: '12px' }}>
                📣 Relancer les participants
              </div>
              <div style={{ fontSize: '13px', color: '#92400E', marginBottom: '12px' }}>
                {remainingParticipants} personne{remainingParticipants > 1 ? 's' : ''} n'{remainingParticipants > 1 ? 'ont' : 'a'} pas encore voté
              </div>
              <button
                onClick={sendReminder}
                disabled={isSendingReminder}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: isSendingReminder 
                    ? '#D1D5DB' 
                    : 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: isSendingReminder ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: isSendingReminder ? 'none' : '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}
              >
                <Bell size={18} />
                {isSendingReminder ? 'Envoi en cours...' : 'Relancer les non-votants'}
              </button>
            </div>
          )}
          
          {/* Partager le lien */}
          <div style={{
            background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E1B4B', marginBottom: '12px' }}>
              📤 Lien participant
            </div>
            <div style={{
              background: 'white',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '13px',
              color: '#6B7280',
              wordBreak: 'break-all',
              fontFamily: 'monospace'
            }}>
              {participantLink}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={copyLink}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  padding: '12px',
                  background: copySuccess ? '#10B981' : 'white',
                  color: copySuccess ? 'white' : '#8B5CF6',
                  border: '2px solid ' + (copySuccess ? '#10B981' : '#8B5CF6'),
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {copySuccess ? '✓ Copié !' : <><Copy size={16} /> Copier</>}
              </button>
              <button
                onClick={() => shareVia('whatsapp')}
                style={{
                  padding: '12px 20px',
                  background: 'white',
                  color: '#25D366',
                  border: '2px solid #25D366',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                WhatsApp
              </button>
              <button
                onClick={() => shareVia('email')}
                style={{
                  padding: '12px 20px',
                  background: 'white',
                  color: '#8B5CF6',
                  border: '2px solid #8B5CF6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Email
              </button>
            </div>
          </div>
        </div>

        {/* Bouton retour */}
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%',
            padding: '14px',
            background: 'transparent',
            color: '#6B7280',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ← Retour à l'accueil
        </button>
      </div>

      {/* Animations CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
          }
          50% {
            opacity: 0.8;
            box-shadow: 0 0 0 8px rgba(255, 255, 255, 0);
          }
        }

        @keyframes flash {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Admin;
