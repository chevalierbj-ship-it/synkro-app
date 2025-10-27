import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Send, CheckCircle, Sparkles, ChevronLeft, ChevronRight, MapPin, Users as UsersIcon, Share2, User } from 'lucide-react';

const Organizer = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [eventType, setEventType] = useState('');
  const [customEvent, setCustomEvent] = useState('');
  const [location, setLocation] = useState('');
  const [expectedParticipants, setExpectedParticipants] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [eventLink, setEventLink] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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
    const startingDayOfWeek = firstDay.getDay();

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
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
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
    } else if (selectedDates.length < 3) {
      const selectedEventType = eventTypes.find(e => e.id === eventType);
      setSelectedDates([...selectedDates, { 
        date: date, 
        time: selectedEventType?.defaultTime || '18:00' 
      }]);
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
      const response = await fetch('/api/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
body: JSON.stringify({
  eventId: eventId,
  organizerName: organizerName,
  organizerEmail: organizerEmail || null,  // 🆕 EMAIL AJOUTÉ !
  type: eventType === 'other' ? customEvent : selectedEventType.label,
  location: location || '',
  expectedParticipants: expectedParticipants ? parseInt(expectedParticipants) : 0,
  dates: dates  // ✅ Envoyer directement l'objet
})
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la création de l\'événement');
      }
      
      const result = await response.json();
      console.log('Event created successfully:', result);
      
      // Créer le lien
      const fullLink = `${window.location.origin}/respond?id=${result.eventId}`;
      setEventLink(fullLink);
      setStep(6);
      
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue lors de la création de l\'événement: ' + error.message);
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
    alert('Lien copié ! 📋');
    setShowShareMenu(false);
  };

  const selectedEventType = eventTypes.find(e => e.id === eventType);
  const monthYear = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

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
              👋 C'est toi qui organises ?
            </h2>
            <p style={{ 
              color: '#6B7280', 
              fontSize: '14px',
              marginBottom: '24px'
            }}>
              Dis-nous comment t'appeler pour que tes invités te reconnaissent !
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
                Ton prénom
              </label>
              <input
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && organizerName.trim() && setStep(2)}
                placeholder="Ex: Benjamin"
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
    📧 Ton email (optionnel)
  </label>
  <input
    type="email"
    value={organizerEmail}
    onChange={(e) => setOrganizerEmail(e.target.value)}
    placeholder="ton.email@example.com"
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
    💡 Pour recevoir un email de confirmation avec le lien à partager
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
              C'est parti ! →
            </button>
          </div>
        )}

        {/* Step 2: Choose event type */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '26px', marginBottom: '24px', color: '#1E1B4B', fontWeight: '700' }}>
              Salut {organizerName} ! 👋<br/>
              Quel événement organises-tu ?
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
              ← Retour
            </button>
          </div>
        )}

        {/* Step 3: Custom event name */}
        {step === 3 && eventType === 'other' && (
          <div>
            <h2 style={{ fontSize: '26px', marginBottom: '24px', color: '#1E1B4B', fontWeight: '700' }}>
              Nomme ton événement
            </h2>
            <input
              type="text"
              value={customEvent}
              onChange={(e) => setCustomEvent(e.target.value)}
              placeholder="Ex: Réunion projet X, Pique-nique..."
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
              Continuer
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
                  Où ? (optionnel)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Restaurant Le Bistrot, Paris"
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

              <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#1E1B4B', fontWeight: '600' }}>
                Sélectionne 3 dates ({selectedDates.length}/3) :
              </h3>

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
                  {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
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
                    Horaires :
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
                Continuer →
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
                ← Retour
              </button>
            </div>
          );
        })()}

        {/* Step 5: Expected participants (optionnel) */}
        {step === 5 && (
          <div>
            <h2 style={{ fontSize: '26px', marginBottom: '12px', color: '#1E1B4B', fontWeight: '700' }}>
              Combien de personnes invites-tu ?
            </h2>
            <p style={{ 
              color: '#6B7280', 
              fontSize: '14px',
              marginBottom: '24px'
            }}>
              💡 Optionnel mais recommandé<br/>
              Permet d'afficher "4/6 ont répondu"
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
                Nombre de participants
              </label>
              <input
                type="number"
                min="2"
                value={expectedParticipants}
                onChange={(e) => setExpectedParticipants(e.target.value)}
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
            </div>

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
                <>⏳ Création en cours...</>
              ) : (
                <>
                  <Send size={20} />
                  Créer l'événement
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
              Passer cette étape
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
              Événement créé ! 🎉
            </h2>
            <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '15px' }}>
              Partage ce lien avec tes invités
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
                🔐 Ton dashboard organisateur (privé)
              </div>
              <code style={{ color: '#D97706', fontWeight: '700', fontSize: '13px' }}>
                {`${window.location.origin}/admin?id=${eventLink.split('id=')[1]}`}
              </code>
              <div style={{ fontSize: '12px', color: '#92400E', marginTop: '8px', fontStyle: 'italic' }}>
                💡 Garde ce lien pour suivre les votes en temps réel !
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
                📤 Partager
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
                    📋 Copier le lien
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
                setExpectedParticipants('');
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
              Créer un nouvel événement
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
              ← Retour à l'accueil
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
        <p style={{ margin: '0 0 8px 0' }}>✨ Synkro v4.0 - API Serverless</p>
      </div>
    </div>
  );
};

export default Organizer;
