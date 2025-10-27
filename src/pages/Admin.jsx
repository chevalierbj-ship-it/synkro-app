import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Users, CheckCircle, Clock, Share2, Copy, Sparkles, MapPin, AlertCircle, TrendingUp, BarChart } from 'lucide-react';

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

  useEffect(() => {
    if (!eventId) {
      setError('ID d\'événement manquant');
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/get-event?id=${eventId}`);
        
        if (!response.ok) {
          throw new Error('Événement non trouvé');
        }

        const data = await response.json();
        setEvent(data.event);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchEvent();

    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(fetchEvent, 10000);
    return () => clearInterval(interval);
  }, [eventId]);

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

  // ❌ Écran d'erreur
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
          {/* Participants */}
          <div style={{
            background: 'white',
            border: '2px solid #E9D5FF',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <Users size={32} color="#8B5CF6" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1E1B4B', marginBottom: '4px' }}>
              {event.totalResponded || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              Participants
            </div>
            {event.expectedParticipants > 0 && (
              <div style={{ fontSize: '12px', color: '#8B5CF6', marginTop: '4px', fontWeight: '600' }}>
                sur {event.expectedParticipants} attendus ({progressPercentage}%)
              </div>
            )}
          </div>

          {/* Meilleure Date */}
          <div style={{
            background: 'white',
            border: '2px solid #E9D5FF',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <TrendingUp size={32} color="#10B981" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1E1B4B', marginBottom: '4px' }}>
              {bestDate ? bestDate.votes : 0} votes
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.4' }}>
              {bestDate ? bestDate.label : 'Aucun vote'}
            </div>
            {event.expectedParticipants > 0 && bestDate && (
              <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: '600' }}>
                {getDatePercentage(bestDate)}% d'accord
              </div>
            )}
          </div>
        </div>

        {/* Progression vers l'objectif */}
        {event.expectedParticipants > 0 && (
          <div style={{
            background: 'white',
            border: '2px solid #E9D5FF',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1E1B4B' }}>
                📊 Progression
              </span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#8B5CF6' }}>
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
              
              {/* Barre de progression */}
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

              {/* Participants disponibles */}
              {date.voters && date.voters.length > 0 && (
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  👥 {date.voters.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

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
              {event.participants.map((participant, index) => (
                <div key={index} style={{
                  padding: '16px',
                  borderBottom: index < event.participants.length - 1 ? '1px solid #E9D5FF' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1E1B4B', marginBottom: '4px' }}>
                      {participant.name}
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
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E1B4B', marginBottom: '16px' }}>
            ⚡ Actions rapides
          </h3>
          
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
                  border: '2px solid' + (copySuccess ? '#10B981' : '#8B5CF6'),
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
    </div>
  );
};

export default Admin;
