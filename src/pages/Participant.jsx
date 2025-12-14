import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, CheckCircle, Clock, Download, Sparkles, MapPin, AlertCircle, ExternalLink, PiggyBank } from 'lucide-react';
import { getQuestionsForEvent } from '../utils/smartQuestions';
import { findBestDate } from '../utils/smartScoring';
import SmartQuestionFlow from '../components/SmartQuestionFlow';
import AIRecommendation from '../components/AIRecommendation';
import AuthButtons from '../components/AuthButtons';
import SEOHead, { generateEventSchema } from '../components/SEOHead';

const Participant = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id'); // Récupère l'ID depuis l'URL (?id=xxx)
  
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState(''); // 🆕 Email optionnel
  const [selectedDate, setSelectedDate] = useState(null);
  const [availabilities, setAvailabilities] = useState({});
  const [selectedBudget, setSelectedBudget] = useState(null); // 🆕 Vote budget
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 🆕 États pour le mode IA
  const [isAIMode, setIsAIMode] = useState(false);
  const [showAIFlow, setShowAIFlow] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [waitingForOthers, setWaitingForOthers] = useState(false);

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
      details: t('participant.calendarOrganizedBy', { name: event.organizerName }),
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
      body: t('participant.calendarOrganizedBy', { name: event.organizerName })
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
      description: t('participant.calendarOrganizedBySimple', { name: event.organizerName })
    });
    
    window.open(`/api/event-utils?action=generate-ics&${params.toString()}`, '_blank');
  };

  // 🔥 Charger l'événement depuis Airtable via API
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events?action=get&id=${eventId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError(t('participant.errorNotFound'));
          } else {
            setError(t('participant.errorLoading'));
          }
          setLoading(false);
          return;
        }

        const responseData = await response.json();
        const eventData = responseData.event; // ✅ Extraire l'événement
        setEvent(eventData);

        // 🆕 Si l'événement a une date confirmée, afficher directement la vue de confirmation
        if (eventData.confirmedDate || eventData.status === 'completed') {
          // Créer l'objet selectedDate pour la vue de confirmation
          const confirmedDateObj = {
            date: eventData.confirmedDate,
            time: eventData.confirmedTime || '18:00',
            label: eventData.confirmedDate
              ? new Date(eventData.confirmedDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) + (eventData.confirmedTime ? ` à ${eventData.confirmedTime}` : '')
              : eventData.dates?.[0]?.label || ''
          };
          setSelectedDate(confirmedDateObj);
          setStep(4); // Afficher directement la page de confirmation
          setLoading(false);
          return;
        }

        // 🆕 Détecter si le mode IA est activé
        if (eventData.useAI === true) {
          setIsAIMode(true);
          setShowAIFlow(true);
        }

        // Initialiser les availabilities avec null pour chaque date
        const initialAvailabilities = {};
        eventData.dates.forEach(date => {
          initialAvailabilities[date.label] = null;
        });
        setAvailabilities(initialAvailabilities);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(t('participant.errorLoading'));
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, t]);

  const handleAvailabilityToggle = (dateLabel) => {
    setAvailabilities(prev => {
      const current = prev[dateLabel];
      let newValue;
      
      if (current === null) {
        newValue = true; // Disponible
      } else if (current === true) {
        newValue = false; // Indisponible
      } else {
        newValue = null; // Aucune réponse
      }
      
      return { ...prev, [dateLabel]: newValue };
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
    if (availability === true) return t('participant.available');
    if (availability === false) return t('participant.notAvailable');
    return t('participant.tapToIndicate');
  };

  const getBadge = (date) => {
    const maxVotes = Math.max(...event.dates.map(d => d.votes));
    const percentage = event.expectedParticipants ? (date.votes / event.expectedParticipants) * 100 : 0;

    if (event.expectedParticipants && percentage >= 70) {
      return { text: t('participant.majorityReached'), color: '#10B981' };
    } else if (date.votes === maxVotes && date.votes > 0) {
      return { text: t('participant.popularDate'), color: '#F59E0B' };
    } else if (date.votes > 0) {
      return { text: t('participant.leading'), color: '#8B5CF6' };
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

  // 🆕 HANDLER : Completion du flux IA (après les questions)
  const handleAIComplete = async (answers) => {
    if (!userName.trim()) {
      alert(t('participant.enterNameError'));
      return;
    }

    try {
      setIsAnalyzing(true);

      // Sauvegarder les préférences IA dans Airtable
      const response = await fetch('/api/user?action=ai-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId: eventId,
          participantName: userName.trim(),
          participantEmail: userEmail.trim() || '',
          preferences: answers
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save AI preferences');
      }

      const result = await response.json();
      console.log('AI preferences saved:', result);

      // Recharger l'événement pour avoir les préférences à jour
      const eventResponse = await fetch(`/api/events?action=get&id=${eventId}`);
      const eventData = await eventResponse.json();
      const updatedEvent = eventData.event;
      setEvent(updatedEvent);

      // Vérifier si tous les participants ont répondu
      const aiPreferences = updatedEvent.ai_preferences
        ? JSON.parse(updatedEvent.ai_preferences)
        : [];

      const expectedParticipants = updatedEvent.expectedParticipants || 0;
      const hasEnoughResponses = aiPreferences.length >= expectedParticipants;

      if (hasEnoughResponses || aiPreferences.length >= 2) {
        // Calculer la meilleure date avec l'algorithme IA
        const recommendation = findBestDate(
          updatedEvent.dates,
          aiPreferences
        );

        setAiRecommendation(recommendation);
        setShowAIFlow(false);
      } else {
        // Pas encore assez de réponses, afficher message d'attente
        setWaitingForOthers(true);
        setShowAIFlow(false);
      }

      setIsAnalyzing(false);
    } catch (error) {
      console.error('Error in AI flow:', error);
      alert(t('participant.genericError'));
      setIsAnalyzing(false);
    }
  };

  // 🆕 HANDLER : Confirmer la date recommandée par l'IA
  const handleAIConfirm = async (selectedDateObj) => {
    console.log('🎯 handleAIConfirm called with:', selectedDateObj);
    console.log('📝 userName:', userName);
    console.log('📧 userEmail:', userEmail);

    // Validation : vérifier que userName est défini
    if (!userName || !userName.trim()) {
      console.error('❌ userName is empty!');
      alert(t('participant.enterNameError') || 'Veuillez entrer votre nom');
      setIsAIMode(false);
      setAiRecommendation(null);
      setStep(1);
      return;
    }

    try {
      setStep(3); // Loader
      console.log('⏳ Step set to 3 (loading)');

      // Créer les availabilities : true pour la date sélectionnée, false pour les autres
      const aiAvailabilities = {};
      event.dates.forEach(date => {
        aiAvailabilities[date.label] = (date.label === selectedDateObj.label);
      });
      console.log('📊 aiAvailabilities:', aiAvailabilities);

      // Sauvegarder le vote via l'API normale
      console.log('📡 Sending API request...');
      const response = await fetch('/api/events?action=update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId: eventId,
          participantName: userName.trim(),
          participantEmail: userEmail.trim() || undefined,
          availabilities: aiAvailabilities,
          selectedBudget: selectedBudget || undefined
        })
      });

      console.log('📥 API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error:', errorText);
        throw new Error('Failed to save vote');
      }

      const result = await response.json();
      console.log('✅ API result:', result);
      setEvent(result.event);

      setTimeout(() => {
        setSelectedDate(selectedDateObj);
        setStep(4);
        console.log('🎉 Step set to 4 (confirmation)');
      }, 1500);

    } catch (error) {
      console.error('❌ Error confirming AI recommendation:', error);
      alert(t('participant.confirmError') || 'Erreur lors de la confirmation');
      setStep(2);
    }
  };

  // 🆕 HANDLER : Basculer vers le vote manuel
  const handleSwitchToManual = () => {
    setIsAIMode(false);
    setShowAIFlow(false);
    setAiRecommendation(null);
    setWaitingForOthers(false);
    setStep(1); // Retour au début en mode manuel
  };

  // 🔥 SAUVEGARDER les votes dans Airtable via API
  const handleSubmit = async () => {
    if (!canSubmit || !userName.trim()) return;

    try {
      setStep(3); // Afficher le loader

      // Appeler l'API pour sauvegarder
      const response = await fetch('/api/events?action=update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId: eventId,
          participantName: userName.trim(),
          participantEmail: userEmail.trim() || undefined,
          availabilities: availabilities,
          selectedBudget: selectedBudget || undefined
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
      alert(t('participant.saveError'));
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
          <p style={{ marginTop: '20px', fontSize: '18px' }}>{t('participant.loading')}</p>
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
            {t('participant.checkLinkMessage')}
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
            {t('participant.backHome')}
          </button>
        </div>
      </div>
    );
  }

  // 🆕 MODE IA : Afficher le flux de questions intelligentes
  if (isAIMode && showAIFlow && userName) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
        padding: '20px'
      }}>
        <SmartQuestionFlow
          questions={getQuestionsForEvent(event.type)}
          eventTitle={event.type}
          participantName={userName}
          onComplete={handleAIComplete}
        />
      </div>
    );
  }

  // 🆕 MODE IA : Afficher la recommandation de l'IA
  if (isAIMode && aiRecommendation) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
        padding: '20px'
      }}>
        <AIRecommendation
          recommendation={aiRecommendation}
          onConfirm={handleAIConfirm}
          onShowManualVote={handleSwitchToManual}
          eventData={event}
        />
      </div>
    );
  }

  // 🆕 MODE IA : Message d'attente des autres participants
  if (isAIMode && waitingForOthers) {
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
          maxWidth: '600px',
          background: 'white',
          borderRadius: '24px',
          padding: '50px 40px',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            animation: 'pulse 2s ease-in-out infinite',
            boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)'
          }}>
            <Users size={40} color="white" />
          </div>

          <h2 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#1E1B4B',
            marginBottom: '16px'
          }}>
            {t('participant.thankYouName', { name: userName })}
          </h2>

          <p style={{
            color: '#6B7280',
            fontSize: '17px',
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            {t('participant.preferencesRecorded')}<br />
            {t('participant.aiWaitingMessage')}
          </p>

          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
            borderRadius: '16px',
            marginBottom: '28px',
            border: '2px solid #E9D5FF'
          }}>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
              {t('participant.responsesReceived')}
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#8B5CF6' }}>
              {event.ai_preferences ? JSON.parse(event.ai_preferences).length : 1} / {event.expectedParticipants || '?'}
            </div>
          </div>

          <button
            onClick={handleSwitchToManual}
            style={{
              padding: '14px 28px',
              background: 'white',
              border: '2px solid #8B5CF6',
              borderRadius: '12px',
              color: '#8B5CF6',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            {t('participant.voteManually')}
          </button>

          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.05); opacity: 0.9; }
            }
          `}</style>
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
      {event && (
        <SEOHead
          title={t('participant.seo.title', { title: event.title })}
          description={t('participant.seo.description', { title: event.title, organizer: event.organizerName })}
          type="website"
          canonical={`https://getsynkro.com/participant?id=${eventId}`}
          keywords={['événement', 'participation', event.type, 'disponibilités', 'coordination']}
          schema={generateEventSchema({
            eventId: eventId,
            title: event.title,
            name: event.title,
            description: event.description || `Événement organisé via Synkro`,
            startDate: event.confirmedDate || event.dates?.[0]?.date,
            endDate: event.endDate,
            location: event.location,
            organizerName: event.organizerName,
            organizerEmail: event.organizerEmail,
            organizerType: 'Person',
            type: event.type
          })}
        />
      )}

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
                {t('participant.organizedBy', { name: event.organizerName })}
              </div>
              {event.location && (
                <div style={{ fontSize: '14px', color: '#8B5CF6', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} />
                  {event.location}
                </div>
              )}
              {event.eventSchedule && (
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '8px', lineHeight: '1.5' }}>
                  📋 {event.eventSchedule}
                </div>
              )}
            </div>

            {/* Boutons d'authentification */}
            <AuthButtons
              onAuthSuccess={(userData) => {
                setUserName(userData.name || '');
                setUserEmail(userData.email || '');
              }}
            />

            {/* Divider "ou" */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '24px',
              gap: '12px'
            }}>
              <div style={{
                flex: 1,
                height: '1px',
                background: 'linear-gradient(to right, transparent, #E9D5FF, transparent)'
              }}></div>
              <div style={{
                color: '#9CA3AF',
                fontSize: '14px',
                fontWeight: '600',
                padding: '0 8px'
              }}>
                {t('participant.or')}
              </div>
              <div style={{
                flex: 1,
                height: '1px',
                background: 'linear-gradient(to left, transparent, #E9D5FF, transparent)'
              }}></div>
            </div>

            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: '#1E1B4B', fontWeight: '700' }}>
              {t('participant.continueWithoutAccount')}
            </h2>
            <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '14px' }}>
              {t('participant.enterNameEmailHint')}
            </p>

            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={t('participant.firstNamePlaceholder')}
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
                e.currentTarget.style.borderColor = '#8B5CF6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E9D5FF';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder={t('participant.emailPlaceholder')}
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
                e.currentTarget.style.borderColor = '#8B5CF6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E9D5FF';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            <div style={{
              marginBottom: '20px',
              fontSize: '13px',
              color: '#6B7280',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              {t('participant.emailOptionalNote')}
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
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.3)';
              }}
            >
              {t('participant.continue')}
            </button>
          </div>
        )}

        {/* Step 2: Disponibilités */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '12px', color: '#1E1B4B', fontWeight: '700' }}>
              {t('participant.whatAvailabilities')}
            </h2>
            <p style={{ color: '#6B7280', marginBottom: '28px', fontSize: '15px' }}>
              {t('participant.tapEachDateHint')}
            </p>

            <div style={{ marginBottom: '32px' }}>
              {event.dates.map((date, index) => {
                const badge = getBadge(date);
                const availability = availabilities[date.label];
                
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
                      onClick={() => handleAvailabilityToggle(date.label)}
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
                          e.currentTarget.style.borderColor = '#8B5CF6';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (availability === null) {
                          e.currentTarget.style.borderColor = '#E9D5FF';
                          e.currentTarget.style.boxShadow = 'none';
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
                            {date.votes} {date.votes > 1 ? t('participant.votes') : t('participant.vote')}
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
              <p
                style={{
                  fontSize: '13px',
                  color: '#92400E',
                  margin: 0,
                  lineHeight: '1.5',
                  fontWeight: '500'
                }}
                dangerouslySetInnerHTML={{ __html: t('participant.tipChangeAvailability') }}
              />
            </div>

            {/* Section Vote Budget */}
            {event.budgetVoteEnabled && event.budgetVotes && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '12px', color: '#1E1B4B', fontWeight: '700' }}>
                  {t('participant.preferredBudget')}
                </h3>
                <p style={{ color: '#6B7280', marginBottom: '16px', fontSize: '14px' }}>
                  {t('participant.selectBudgetRange')}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {event.budgetVotes.map((budgetOption, index) => {
                    const isSelected = selectedBudget === budgetOption.range;
                    const maxVotes = Math.max(...event.budgetVotes.map(b => b.votes));
                    const isPopular = budgetOption.votes === maxVotes && budgetOption.votes > 0;

                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedBudget(budgetOption.range)}
                        style={{
                          padding: '16px 20px',
                          background: isSelected
                            ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                            : 'white',
                          color: isSelected ? 'white' : '#1E1B4B',
                          border: isSelected
                            ? '2px solid #8B5CF6'
                            : '2px solid #E9D5FF',
                          borderRadius: '12px',
                          fontSize: '15px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: isSelected
                              ? '2px solid white'
                              : '2px solid #E9D5FF',
                            background: isSelected
                              ? 'white'
                              : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {isSelected && (
                              <div style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: '#8B5CF6'
                              }}></div>
                            )}
                          </div>
                          {budgetOption.range}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isPopular && (
                            <span style={{
                              fontSize: '11px',
                              background: isSelected ? 'rgba(255,255,255,0.3)' : '#10B981',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontWeight: '700'
                            }}>
                              {t('participant.popular')}
                            </span>
                          )}
                          <span style={{
                            fontSize: '13px',
                            opacity: isSelected ? 1 : 0.7
                          }}>
                            {budgetOption.votes} {budgetOption.votes !== 1 ? t('participant.votes') : t('participant.vote')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bouton cagnotte */}
            {event.cagnotteLink && (
              <div style={{ marginBottom: '32px' }}>
                <a
                  href={event.cagnotteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '18px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '16px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  <PiggyBank size={20} />
                  {t('participant.participatePot')}
                  <ExternalLink size={16} />
                </a>
              </div>
            )}

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
                {t('participant.back')}
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
                {t('participant.submitVote')}
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
              {t('participant.analyzing')}
            </h2>
            <p style={{ color: '#6B7280', fontSize: '16px' }}>
              {t('participant.findingBestDate')}
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
              {t('participant.dateConfirmed')}
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
                  {t('participant.eventLabel')}
                </div>
                <div style={{ fontSize: '19px', fontWeight: '700', color: '#1E1B4B' }}>
                  {event.type}
                </div>
              </div>

              {event.location && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px', fontWeight: '600' }}>
                    {t('participant.locationLabel')}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1E1B4B' }}>
                    {event.location}
                  </div>
                </div>
              )}

              {event.eventSchedule && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px', fontWeight: '600' }}>
                    {t('participant.scheduleLabel')}
                  </div>
                  <div style={{ fontSize: '14px', color: '#1E1B4B', lineHeight: '1.5' }}>
                    {event.eventSchedule}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px', fontWeight: '600' }}>
                  {t('participant.dateTimeLabel')}
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
                  {t('participant.confirmedParticipants')}
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
                {t('participant.addToCalendar')}
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
                  e.currentTarget.style.background = 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#8B5CF6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.1)';
                }}
              >
                <Calendar size={20} />
                {t('participant.addGoogleCalendar')}
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
                  e.currentTarget.style.background = 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(236, 72, 153, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#EC4899';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(236, 72, 153, 0.1)';
                }}
              >
                <Calendar size={20} />
                {t('participant.addOutlookCalendar')}
              </button>

              {/* Bouton Télécharger .ics - Même style que Google/Outlook */}
              <button
                onClick={() => downloadICS()}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  background: 'white',
                  color: '#10B981',
                  border: '2px solid #10B981',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#10B981';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.1)';
                }}
              >
                <Download size={20} />
                {t('participant.downloadIcs')}
              </button>

            </div>

            <div style={{
              marginTop: '32px',
              padding: '18px',
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              borderRadius: '14px',
              border: '2px solid #FCD34D'
            }}>
              <p
                style={{
                  fontSize: '13px',
                  color: '#92400E',
                  margin: 0,
                  lineHeight: '1.6',
                  fontWeight: '500'
                }}
                dangerouslySetInnerHTML={{ __html: t('participant.reminderTip') }}
              />
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
        <p style={{ margin: '0 0 8px 0' }}>{t('participant.version')}</p>
      </div>
    </div>
  );
};

export default Participant;
