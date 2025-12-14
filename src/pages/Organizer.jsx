import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Send, CheckCircle, Sparkles, ChevronLeft, ChevronRight, MapPin, Users as UsersIcon, Share2, User, Lock, Crown } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import UpgradeModal from '../components/UpgradeModal';

const Organizer = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [eventType, setEventType] = useState('');
  const [customEvent, setCustomEvent] = useState('');
  const [location, setLocation] = useState('');
  const [eventSchedule, setEventSchedule] = useState('');
  const [expectedParticipants, setExpectedParticipants] = useState('');
  const [budgetVoteEnabled, setBudgetVoteEnabled] = useState(false);
  const [budgetRanges, setBudgetRanges] = useState([
    'Moins de 50€',
    '50-100€',
    'Plus de 100€'
  ]);
  const [cagnotteLink, setCagnotteLink] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [eventLink, setEventLink] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // États pour les modals d'upgrade
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const [upgradePlan, setUpgradePlan] = useState('Pro');
  const [upgradePrice, setUpgradePrice] = useState('19€/mois');

  // Liste d'emails participants pour la limitation
  const [participantEmails, setParticipantEmails] = useState([]);

  // 🆕 Mode IA vs Manuel
  const [useAI, setUseAI] = useState(true); // Par défaut: IA activée

  const eventTypes = [
    { id: 'dinner', label: '🍽️ Dîner/Soirée', suggestion: 'Vendredi ou samedi soir, 19h30-21h', defaultTime: '20:00' },
    { id: 'lunch', label: '☕ Déjeuner pro', suggestion: 'Mardi-jeudi, 12h-14h', defaultTime: '12:30' },
    { id: 'meeting', label: '📅 Rendez-vous professionnel', suggestion: 'Semaine, horaires bureau', defaultTime: '14:00' },
    { id: 'weekend', label: '🏖️ Weekend/Vacances', suggestion: 'Weekend complet, 2-3 jours', defaultTime: '10:00' },
    { id: 'sport', label: '⚽ Sport collectif', suggestion: 'Soir de semaine ou samedi matin', defaultTime: '19:00' },
    { id: 'evf', label: '🎉 EVF', suggestion: 'Weekend, généralement 2 jours', defaultTime: '14:00' },
    { id: 'evg', label: '🎊 EVG', suggestion: 'Weekend, généralement 2-3 jours', defaultTime: '14:00' },
    { id: 'birthday', label: '🎂 Anniversaire', suggestion: 'Soirée ou weekend selon l\'occasion', defaultTime: '18:00' },
    { id: 'family', label: '👨‍👩‍👧‍👦 Réunion familiale', suggestion: 'Dimanche midi ou après-midi', defaultTime: '12:00' },
    { id: 'rehearsal', label: '🎭 Répétition', suggestion: 'Soir de semaine, 2-3h', defaultTime: '19:00' },
    { id: 'other', label: '✨ Autre', suggestion: '', defaultTime: '18:00' }
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Ajuster pour que la semaine commence le lundi (format européen)
    // getDay() retourne 0 pour dimanche, on veut 0 pour lundi
    const dayOfWeek = firstDay.getDay();
    const startingDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const formatDate = (date) => {
    const days = t('organizer.daysShort', { returnObjects: true });
    const months = t('organizer.monthsLong', { returnObjects: true });
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    return selectedDates.some(selected => 
      selected.date.toDateString() === date.toDateString()
    );
  };

  const isPastDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date) => {
    if (!date || isPastDate(date)) return;

    const alreadySelected = selectedDates.find(selected =>
      selected.date.toDateString() === date.toDateString()
    );

    if (alreadySelected) {
      setSelectedDates(selectedDates.filter(selected =>
        selected.date.toDateString() !== date.toDateString()
      ));
    } else {
      // Limitation selon le plan utilisateur
      const maxDates = user.plan === 'gratuit' ? user.datesLimit : Infinity;

      if (selectedDates.length < maxDates) {
        const selectedEventType = eventTypes.find(e => e.id === eventType);
        setSelectedDates([...selectedDates, {
          date: date,
          time: selectedEventType?.defaultTime || '18:00'
        }]);
      } else if (user.plan === 'gratuit') {
        // Afficher le modal d'upgrade si limite atteinte
        setShowUpgradeModal(true);
        setUpgradeFeature('Dates illimitées');
        setUpgradePlan('Pro');
        setUpgradePrice('19€/mois');
      }
    }
  };

  const handleTimeChange = (index, newTime) => {
    const updated = [...selectedDates];
    updated[index].time = newTime;
    setSelectedDates(updated);
  };

  const handleEventTypeSelect = (type) => {
    setEventType(type);
    if (type !== 'other') {
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleCustomEventSubmit = () => {
    if (customEvent.trim()) {
      setStep(3);
    }
  };

  const generateLink = async () => {
    setIsCreating(true);
    
    try {
      // Générer ID unique
      const eventId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      
      // Préparer les données
      const selectedEventType = eventTypes.find(e => e.id === eventType);
      const dates = selectedDates.map(d => ({
        id: `date_${Math.random().toString(36).substring(7)}`,
        date: d.date.toISOString(),
        time: d.time,
        label: `${formatDate(d.date)}, ${d.time}`,
        votes: 0,
        voters: []
      }));
      
      // Créer l'événement via l'API serverless
      const response = await fetch('/api/events?action=create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
body: JSON.stringify({
  eventId: eventId,
  organizerName: organizerName,
  organizerEmail: organizerEmail || null,
  type: eventType === 'other' ? customEvent : selectedEventType.label,
  location: location || '',
  eventSchedule: eventSchedule || '',
  expectedParticipants: expectedParticipants ? parseInt(expectedParticipants) : 0,
  budgetVoteEnabled: budgetVoteEnabled,
  budgetRanges: budgetVoteEnabled ? budgetRanges : [],
  cagnotteLink: budgetVoteEnabled ? cagnotteLink : '',
  useAI: useAI, // 🆕 Mode IA activé ou non
  dates: dates
})
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la création de l\'événement');
      }
      
      const result = await response.json();
      console.log('Event created successfully:', result);

      // Tracker l'événement si l'email organisateur est fourni
      if (organizerEmail) {
        try {
          const eventName = eventType === 'other' ? customEvent : selectedEventType.label;
          const trackResponse = await fetch('/api/events?action=track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userEmail: organizerEmail,
              eventName: eventName,
              participantsCount: expectedParticipants ? parseInt(expectedParticipants) : 0,
              eventId: result.eventId
            })
          });

          const trackData = await trackResponse.json();

          // Si limite atteinte, afficher un message
          if (!trackResponse.ok && trackData.error === 'Limite atteinte') {
            alert(`⚠️ ${trackData.message}\n\nVous avez créé ${trackData.currentCount}/${trackData.limit} événements ce mois-ci.`);
            // Note: On continue quand même, l'événement a été créé
          } else if (trackResponse.ok) {
            console.log('Event tracked:', trackData);
            // Informer l'utilisateur de sa progression
            if (trackData.plan === 'gratuit' && trackData.remainingEvents !== 'illimité') {
              console.log(`Événements restants ce mois-ci: ${trackData.remainingEvents}`);
            }
          }
        } catch (trackError) {
          // Ne pas bloquer si le tracking échoue
          console.error('Erreur tracking (non-bloquant):', trackError);
        }
      }

      // Créer le lien
      const fullLink = `${window.location.origin}/participant?id=${result.eventId}`;
      setEventLink(fullLink);
      setStep(6);
      
    } catch (error) {
      console.error('Erreur:', error);
      alert(t('organizer.errorCreating', { error: error.message }));
    } finally {
      setIsCreating(false);
    }
  };

  const shareVia = (platform) => {
    const selectedEventType = eventTypes.find(e => e.id === eventType);
    const eventName = eventType === 'other' ? customEvent : selectedEventType.label;
    const text = `${organizerName} t'invite : ${eventName}${location ? ` à ${location}` : ''}`;
    const encodedLink = encodeURIComponent(eventLink);
    const encodedText = encodeURIComponent(text);

    const urls = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedLink}`,
      messenger: `fb-messenger://share/?link=${encodedLink}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
      email: `mailto:?subject=${encodedText}&body=${encodedText}%20-%20${encodedLink}`,
      sms: `sms:?body=${encodedText}%20${encodedLink}`
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
    
    setShowShareMenu(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(eventLink);
    alert(t('organizer.linkCopiedAlert'));
    setShowShareMenu(false);
  };

  const selectedEventType = eventTypes.find(e => e.id === eventType);
  const monthYear = currentMonth.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' });

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
          {t('organizer.tagline')}
        </p>

        {/* Compteur d'événements (Priorité 1) */}
        {user.plan === 'gratuit' && (
          <div style={{
            background: user.eventsThisMonth >= user.eventsLimit
              ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
              : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            padding: '12px 20px',
            borderRadius: '12px',
            marginTop: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onClick={() => navigate('/pricing')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Calendar size={20} color="white" />
            <span style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: '700'
            }}>
              {user.eventsThisMonth >= user.eventsLimit
                ? t('organizer.limitReached')
                : t('organizer.eventsCounter', { current: user.eventsThisMonth, limit: user.eventsLimit })
              }
            </span>
            <Crown size={18} color="white" />
          </div>
        )}
      </div>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.1)'
      }}>
        
        {/* Step 1: Organizer name */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '26px', marginBottom: '12px', color: '#1E1B4B', fontWeight: '700' }}>
              {t('organizer.step1Title')}
            </h2>
            <p style={{
              color: '#6B7280',
              fontSize: '14px',
              marginBottom: '24px'
            }}>
              {t('organizer.step1Subtitle')}
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                fontSize: '14px',
                color: '#1E1B4B',
                fontWeight: '600'
              }}>
                <User size={18} color="#8B5CF6" />
                {t('organizer.yourFirstName')}
              </label>
              <input
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && organizerName.trim() && setStep(2)}
                placeholder={t('organizer.firstNamePlaceholder')}
                autoFocus
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  border: '2px solid #E9D5FF',
                  borderRadius: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                onBlur={(e) => e.target.style.borderColor = '#E9D5FF'}
              />
              {/* 📧 Email de l'organisateur */}
<div style={{ marginBottom: '24px' }}>
  <label style={{
    display: 'block',
    marginBottom: '8px',
    color: '#1E1B4B',
    fontSize: '15px',
    fontWeight: '600'
  }}>
    {t('organizer.yourEmail')}
  </label>
  <input
    type="email"
    value={organizerEmail}
    onChange={(e) => setOrganizerEmail(e.target.value)}
    placeholder={t('organizer.emailPlaceholder')}
    style={{
      width: '100%',
      padding: '14px',
      border: '2px solid #E9D5FF',
      borderRadius: '12px',
      fontSize: '16px',
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
  <p style={{
    fontSize: '13px',
    color: '#6B7280',
    marginTop: '6px',
    fontStyle: 'italic'
  }}>
    {t('organizer.emailHint')}
  </p>
</div>
            </div>

            <button
              onClick={() => organizerName.trim() && setStep(2)}
              disabled={!organizerName.trim()}
              style={{
                width: '100%',
                padding: '18px',
                background: organizerName.trim()
                  ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                  : '#E9D5FF',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: organizerName.trim() ? 'pointer' : 'not-allowed',
                boxShadow: organizerName.trim() ? '0 8px 20px rgba(139, 92, 246, 0.3)' : 'none',
                transition: 'all 0.3s'
              }}
            >
              {t('organizer.letsGo')}
            </button>
          </div>
        )}

        {/* Step 2: Choose event type */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '26px', marginBottom: '24px', color: '#1E1B4B', fontWeight: '700' }}>
              {t('organizer.step2Title', { name: organizerName })}<br/>
              {t('organizer.step2Subtitle')}
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {eventTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleEventTypeSelect(type.id)}
                  style={{
                    padding: '18px',
                    background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
                    border: '2px solid transparent',
                    borderRadius: '16px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s',
                    fontWeight: '600',
                    color: '#1E1B4B'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.borderColor = '#8B5CF6';
                    e.target.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.borderColor = 'transparent';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#8B5CF6',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '16px',
                fontWeight: '600'
              }}
            >
              {t('organizer.back')}
            </button>
          </div>
        )}

        {/* Step 3: Custom event name */}
        {step === 3 && eventType === 'other' && (
          <div>
            <h2 style={{ fontSize: '26px', marginBottom: '24px', color: '#1E1B4B', fontWeight: '700' }}>
              {t('organizer.step3Title')}
            </h2>
            <input
              type="text"
              value={customEvent}
              onChange={(e) => setCustomEvent(e.target.value)}
              placeholder={t('organizer.customEventPlaceholder')}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                border: '2px solid #E9D5FF',
                borderRadius: '14px',
                marginBottom: '20px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
              onBlur={(e) => e.target.style.borderColor = '#E9D5FF'}
            />
            <button
              onClick={handleCustomEventSubmit}
              disabled={!customEvent.trim()}
              style={{
                width: '100%',
                padding: '16px',
                background: customEvent.trim() 
                  ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                  : '#E9D5FF',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: customEvent.trim() ? 'pointer' : 'not-allowed',
                boxShadow: customEvent.trim() ? '0 8px 20px rgba(139, 92, 246, 0.3)' : 'none',
                transition: 'all 0.3s'
              }}
            >
              {t('organizer.continue')}
            </button>
          </div>
        )}

        {/* Step 4: Calendar & Time Selection */}
        {(step === 4 || (step === 3 && eventType !== 'other')) && (() => {
          if (step === 3) setStep(4);
          return (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '26px', marginBottom: '12px', color: '#1E1B4B', fontWeight: '700' }}>
                  {selectedEventType?.label || customEvent}
                </h2>
                {selectedEventType && selectedEventType.suggestion && (
                  <p style={{
                    color: '#6B7280',
                    fontSize: '14px',
                    background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
                    padding: '14px',
                    borderRadius: '12px',
                    margin: '0 0 24px 0',
                    border: '1px solid #E9D5FF'
                  }}>
                    💡 {selectedEventType.suggestion}
                  </p>
                )}
              </div>

              {/* 🆕 UI Toggle : Choix mode IA vs Manuel */}
              <div style={{
                background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '32px',
                border: '2px solid #E9D5FF'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  marginBottom: '16px',
                  color: '#1E1B4B',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Sparkles size={20} color="#8B5CF6" />
                  {t('organizer.votingMethod')}
                </h3>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <button
                    onClick={() => setUseAI(true)}
                    style={{
                      flex: 1,
                      padding: '20px 16px',
                      background: useAI
                        ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                        : 'white',
                      color: useAI ? 'white' : '#1E1B4B',
                      border: useAI ? 'none' : '2px solid #E9D5FF',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      fontSize: '15px',
                      fontWeight: '600',
                      boxShadow: useAI ? '0 6px 16px rgba(139, 92, 246, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!useAI) {
                        e.target.style.background = '#F5F3FF';
                        e.target.style.borderColor = '#8B5CF6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!useAI) {
                        e.target.style.background = 'white';
                        e.target.style.borderColor = '#E9D5FF';
                      }
                    }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🤖</div>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>{t('organizer.aiQuick')}</div>
                    <div style={{ fontSize: '13px', opacity: useAI ? 0.95 : 0.7 }}>
                      {t('organizer.aiQuickDesc')}
                    </div>
                  </button>

                  <button
                    onClick={() => setUseAI(false)}
                    style={{
                      flex: 1,
                      padding: '20px 16px',
                      background: !useAI
                        ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                        : 'white',
                      color: !useAI ? 'white' : '#1E1B4B',
                      border: !useAI ? 'none' : '2px solid #E9D5FF',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      fontSize: '15px',
                      fontWeight: '600',
                      boxShadow: !useAI ? '0 6px 16px rgba(139, 92, 246, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (useAI) {
                        e.target.style.background = '#F5F3FF';
                        e.target.style.borderColor = '#8B5CF6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (useAI) {
                        e.target.style.background = 'white';
                        e.target.style.borderColor = '#E9D5FF';
                      }
                    }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>📅</div>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>{t('organizer.manualVote')}</div>
                    <div style={{ fontSize: '13px', opacity: !useAI ? 0.95 : 0.7 }}>
                      {t('organizer.manualVoteDesc')}
                    </div>
                  </button>
                </div>

                <div style={{
                  padding: '12px 16px',
                  background: useAI ? '#FEF3C7' : '#E0E7FF',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: useAI ? '#92400E' : '#1E40AF',
                  lineHeight: '1.5'
                }}>
                  <span dangerouslySetInnerHTML={{ __html: '💡 ' + (useAI ? t('organizer.aiRecommendedHint') : t('organizer.manualHint')) }} />
                </div>
              </div>

              {/* Lieu (optionnel) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                  fontSize: '14px',
                  color: '#1E1B4B',
                  fontWeight: '600'
                }}>
                  <MapPin size={18} color="#8B5CF6" />
                  {t('organizer.whereOptional')}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('organizer.locationPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '15px',
                    border: '2px solid #E9D5FF',
                    borderRadius: '12px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                  onBlur={(e) => e.target.style.borderColor = '#E9D5FF'}
                />
              </div>

              {/* Déroulé de la soirée (optionnel) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                  fontSize: '14px',
                  color: '#1E1B4B',
                  fontWeight: '600'
                }}>
                  <Clock size={18} color="#8B5CF6" />
                  {t('organizer.scheduleOptional')}
                </label>
                <textarea
                  value={eventSchedule}
                  onChange={(e) => setEventSchedule(e.target.value.slice(0, 500))}
                  placeholder={t('organizer.schedulePlaceholder')}
                  maxLength={500}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '15px',
                    border: '2px solid #E9D5FF',
                    borderRadius: '12px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.3s',
                    resize: 'vertical',
                    minHeight: '80px',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                  onBlur={(e) => e.target.style.borderColor = '#E9D5FF'}
                />
                <div style={{
                  textAlign: 'right',
                  fontSize: '12px',
                  color: eventSchedule.length >= 450 ? '#EF4444' : '#6B7280',
                  marginTop: '6px'
                }}>
                  {t('organizer.characters', { count: eventSchedule.length, max: 500 })}
                </div>
              </div>

              <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#1E1B4B', fontWeight: '600' }}>
                {user.plan === 'gratuit'
                  ? t('organizer.selectDates', { count: user.datesLimit, selected: selectedDates.length, max: user.datesLimit })
                  : t('organizer.selectDatesUnlimited', { selected: selectedDates.length })
                }
              </h3>

              {/* Badge limitation dates PRO (Priorité 3) */}
              {user.plan === 'gratuit' && selectedDates.length >= user.datesLimit && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: '2px solid #E9D5FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => {
                    setShowUpgradeModal(true);
                    setUpgradeFeature('Dates illimitées');
                    setUpgradePlan('Pro');
                    setUpgradePrice('19€/mois');
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Lock size={20} color="#8B5CF6" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E1B4B' }}>
                        🔒 Proposer plus de dates
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                        Dates illimitées avec le plan Pro
                      </div>
                    </div>
                  </div>
                  <Crown size={20} color="#8B5CF6" />
                </div>
              )}

              <div style={{
                background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
                padding: '20px',
                borderRadius: '16px',
                marginBottom: '24px',
                border: '2px solid #E9D5FF'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    style={{
                      background: 'white',
                      border: '2px solid #E9D5FF',
                      borderRadius: '10px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <ChevronLeft size={20} color="#8B5CF6" />
                  </button>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1E1B4B',
                    textTransform: 'capitalize',
                    margin: 0
                  }}>
                    {monthYear}
                  </h4>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    style={{
                      background: 'white',
                      border: '2px solid #E9D5FF',
                      borderRadius: '10px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <ChevronRight size={20} color="#8B5CF6" />
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  {/* Semaine commence le lundi (format européen) */}
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                    <div key={i} style={{
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#8B5CF6'
                    }}>
                      {day}
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '8px'
                }}>
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    const isSelected = isDateSelected(date);
                    const isPast = isPastDate(date);
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleDateClick(date)}
                        disabled={!date || isPast}
                        style={{
                          aspectRatio: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isSelected 
                            ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                            : date && !isPast ? 'white' : 'transparent',
                          color: isSelected ? 'white' : isPast ? '#D1D5DB' : '#1E1B4B',
                          border: isSelected ? 'none' : date && !isPast ? '2px solid #E9D5FF' : 'none',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: isSelected ? '700' : '500',
                          cursor: date && !isPast ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
                        }}
                      >
                        {date ? date.getDate() : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDates.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '14px', color: '#1E1B4B', fontWeight: '600' }}>
                    {t('organizer.times')}
                  </h3>
                  {selectedDates.map((item, index) => (
                    <div key={index} style={{
                      background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
                      padding: '16px',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      border: '2px solid #E9D5FF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1E1B4B' }}>
                          {formatDate(item.date)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={18} color="#8B5CF6" />
                        <input
                          type="time"
                          value={item.time}
                          onChange={(e) => handleTimeChange(index, e.target.value)}
                          style={{
                            padding: '8px 12px',
                            fontSize: '14px',
                            border: '2px solid #E9D5FF',
                            borderRadius: '8px',
                            background: 'white',
                            color: '#1E1B4B',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setStep(5)}
                disabled={selectedDates.length === 0}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: selectedDates.length > 0
                    ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                    : '#E9D5FF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: selectedDates.length > 0 ? 'pointer' : 'not-allowed',
                  marginBottom: '12px',
                  boxShadow: selectedDates.length > 0 ? '0 8px 20px rgba(139, 92, 246, 0.3)' : 'none',
                  transition: 'all 0.3s'
                }}
              >
                {t('organizer.continueArrow')}
              </button>

              <button
                onClick={() => {
                  setStep(2);
                  setLocation('');
                  setSelectedDates([]);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  color: '#8B5CF6',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {t('organizer.back')}
              </button>
            </div>
          );
        })()}

        {/* Step 5: Expected participants (optionnel) */}
        {step === 5 && (
          <div>
            <h2 style={{ fontSize: '26px', marginBottom: '12px', color: '#1E1B4B', fontWeight: '700' }}>
              {t('organizer.step5Title')}
            </h2>
            <p style={{
              color: '#6B7280',
              fontSize: '14px',
              marginBottom: '24px'
            }}>
              {t('organizer.step5Hint')}<br/>
              {t('organizer.step5HintSub')}
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                fontSize: '14px',
                color: '#1E1B4B',
                fontWeight: '600'
              }}>
                <UsersIcon size={18} color="#8B5CF6" />
                {t('organizer.participantsNumber')}
              </label>
              <input
                type="number"
                min="2"
                max={user.plan === 'gratuit' ? user.participantsLimit : user.plan === 'pro' ? 50 : undefined}
                value={expectedParticipants}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  // Limitation selon le plan
                  if (user.plan === 'gratuit' && value > user.participantsLimit) {
                    setShowUpgradeModal(true);
                    setUpgradeFeature('50 participants max');
                    setUpgradePlan('Pro');
                    setUpgradePrice('19€/mois');
                    return;
                  } else if (user.plan === 'pro' && value > 50) {
                    setShowUpgradeModal(true);
                    setUpgradeFeature('Participants illimités');
                    setUpgradePlan('Entreprise');
                    setUpgradePrice('49€/mois');
                    return;
                  }
                  setExpectedParticipants(e.target.value);
                }}
                placeholder="Ex: 6"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  border: '2px solid #E9D5FF',
                  borderRadius: '12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                onBlur={(e) => e.target.style.borderColor = '#E9D5FF'}
              />

              {/* Compteur de participants avec limitation (Priorité 2) */}
              {user.plan === 'gratuit' && (
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: parseInt(expectedParticipants) >= user.participantsLimit
                    ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
                    : 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
                  borderRadius: '8px',
                  border: parseInt(expectedParticipants) >= user.participantsLimit
                    ? '2px solid #F59E0B'
                    : '2px solid #E9D5FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: parseInt(expectedParticipants) >= user.participantsLimit ? '#92400E' : '#1E1B4B'
                    }}>
                      {parseInt(expectedParticipants) || 0}/{user.participantsLimit} participants (plan Gratuit)
                    </span>
                  </div>
                  {parseInt(expectedParticipants) >= user.participantsLimit && (
                    <button
                      onClick={() => {
                        setShowUpgradeModal(true);
                        setUpgradeFeature('50 participants max');
                        setUpgradePlan('Pro');
                        setUpgradePrice('19€/mois');
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      <Lock size={12} />
                      Passer en Pro
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Vote de budget - uniquement pour EVG, EVF, Anniversaire */}
            {['evg', 'evf', 'birthday'].includes(eventType) && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '2px solid #FCD34D'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: budgetVoteEnabled ? '16px' : '0'
                  }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#92400E', marginBottom: '4px' }}>
                        💰 Activer le vote de budget
                      </div>
                      <div style={{ fontSize: '13px', color: '#92400E' }}>
                        Les participants pourront voter pour une tranche de budget
                      </div>
                    </div>
                    <button
                      onClick={() => setBudgetVoteEnabled(!budgetVoteEnabled)}
                      style={{
                        width: '52px',
                        height: '28px',
                        borderRadius: '14px',
                        border: 'none',
                        background: budgetVoteEnabled
                          ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                          : '#D1D5DB',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.3s'
                      }}
                    >
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: '3px',
                        left: budgetVoteEnabled ? '27px' : '3px',
                        transition: 'left 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}></div>
                    </button>
                  </div>

                  {budgetVoteEnabled && (
                    <div>
                      <div style={{ fontSize: '13px', color: '#92400E', marginBottom: '12px', fontWeight: '600' }}>
                        Définir les 3 tranches de budget :
                      </div>
                      {budgetRanges.map((range, index) => (
                        <input
                          key={index}
                          type="text"
                          value={range}
                          onChange={(e) => {
                            const newRanges = [...budgetRanges];
                            newRanges[index] = e.target.value;
                            setBudgetRanges(newRanges);
                          }}
                          placeholder={`Tranche ${index + 1}`}
                          style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '14px',
                            border: '2px solid #FCD34D',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            boxSizing: 'border-box',
                            outline: 'none',
                            background: 'white'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                          onBlur={(e) => e.target.style.borderColor = '#FCD34D'}
                        />
                      ))}
                    </div>
                  )}

                  {/* Lien cagnotte */}
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #FCD34D' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      color: '#92400E',
                      marginBottom: '8px',
                      fontWeight: '600'
                    }}>
                      💰 Lien vers la cagnotte (optionnel)
                    </label>
                    <input
                      type="url"
                      value={cagnotteLink}
                      onChange={(e) => setCagnotteLink(e.target.value)}
                      placeholder="https://www.leetchi.com/c/ma-cagnotte"
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '14px',
                        border: '2px solid #FCD34D',
                        borderRadius: '8px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        background: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                      onBlur={(e) => e.target.style.borderColor = '#FCD34D'}
                    />
                    <p style={{
                      fontSize: '12px',
                      color: '#92400E',
                      marginTop: '6px',
                      marginBottom: '0',
                      fontStyle: 'italic'
                    }}>
                      Crée ta cagnotte sur Leetchi, Pot Commun ou Lydia puis colle le lien ici
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={generateLink}
              disabled={isCreating}
              style={{
                width: '100%',
                padding: '18px',
                background: isCreating ? '#E9D5FF' : 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: isCreating ? 'wait' : 'pointer',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: isCreating ? 'none' : '0 8px 20px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.3s'
              }}
            >
              {isCreating ? (
                <>{t('organizer.creating')}</>
              ) : (
                <>
                  <Send size={20} />
                  {t('organizer.createEvent')}
                </>
              )}
            </button>

            <button
              onClick={generateLink}
              disabled={isCreating}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#8B5CF6',
                border: 'none',
                fontSize: '14px',
                cursor: isCreating ? 'wait' : 'pointer',
                fontWeight: '600'
              }}
            >
              {t('organizer.skipStep')}
            </button>
          </div>
        )}

        {/* Step 6: Link generated with share buttons */}
        {step === 6 && (
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

            <h2 style={{ fontSize: '28px', marginBottom: '12px', color: '#1E1B4B', fontWeight: '700' }}>
              {t('organizer.eventCreated')}
            </h2>
            <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '15px' }}>
              {t('organizer.shareWithInvitees')}
            </p>

            <div style={{
              background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
              padding: '20px',
              borderRadius: '16px',
              marginBottom: '24px',
              wordBreak: 'break-all',
              border: '2px solid #E9D5FF'
            }}>
              <code style={{ color: '#8B5CF6', fontWeight: '700', fontSize: '13px' }}>
                {eventLink}
              </code>
            </div>

            {/* Admin Link */}
            <div style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              padding: '20px',
              borderRadius: '16px',
              marginBottom: '24px',
              wordBreak: 'break-all',
              border: '2px solid #FDE68A'
            }}>
              <div style={{ fontSize: '13px', color: '#92400E', marginBottom: '8px', fontWeight: '600' }}>
                {t('organizer.adminDashboard')}
              </div>
              <code style={{ color: '#D97706', fontWeight: '700', fontSize: '13px' }}>
                {`${window.location.origin}/admin?id=${eventLink.split('id=')[1]}`}
              </code>
              <div style={{ fontSize: '12px', color: '#92400E', marginTop: '8px', fontStyle: 'italic' }}>
                {t('organizer.keepLinkHint')}
              </div>
            </div>

            {/* Share buttons */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
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
                  boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <Share2 size={20} />
                {t('organizer.share')}
              </button>

              {showShareMenu && (
                <div style={{
                  position: 'absolute',
                  top: '70px',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '2px solid #E9D5FF',
                  borderRadius: '14px',
                  padding: '12px',
                  boxShadow: '0 8px 20px rgba(139, 92, 246, 0.2)',
                  zIndex: 10
                }}>
                  {[
                    { id: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
                    { id: 'messenger', label: 'Messenger', emoji: '💙' },
                    { id: 'linkedin', label: 'LinkedIn', emoji: '💼' },
                    { id: 'email', label: 'Email', emoji: '📧' },
                    { id: 'sms', label: 'SMS', emoji: '💬' },
                  ].map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => shareVia(platform.id)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1E1B4B',
                        cursor: 'pointer',
                        marginBottom: '8px',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#E9D5FF'}
                      onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)'}
                    >
                      {platform.emoji} {platform.label}
                    </button>
                  ))}
                  <button
                    onClick={copyLink}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {t('organizer.copyLinkBtn')}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setStep(1);
                setOrganizerName('');
                setOrganizerEmail('');
                setEventType('');
                setCustomEvent('');
                setLocation('');
                setEventSchedule('');
                setExpectedParticipants('');
                setBudgetVoteEnabled(false);
                setBudgetRanges(['Moins de 50€', '50-100€', 'Plus de 100€']);
                setCagnotteLink('');
                setSelectedDates([]);
                setEventLink('');
                setShowShareMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#8B5CF6',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {t('organizer.createNewEvent')}
            </button>

            <button
              onClick={() => navigate('/')}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#6B7280',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              {t('organizer.backToHome')}
            </button>
          </div>
        )}
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: '40px',
        color: 'rgba(255,255,255,0.9)',
        fontSize: '14px'
      }}>
        <p style={{ margin: '0 0 8px 0' }}>{t('organizer.version')}</p>
      </div>

      {/* Modal d'upgrade */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
        plan={upgradePlan}
        price={upgradePrice}
      />
    </div>
  );
};

export default Organizer;
