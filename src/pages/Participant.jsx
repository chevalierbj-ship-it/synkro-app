import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Users, CheckCircle, Clock, Download, Sparkles, MapPin, AlertCircle } from 'lucide-react';

const Participant = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');
  
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [availabilities, setAvailabilities] = useState({});
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔥 LOGS DE DEBUG
  console.log('🎯 [PARTICIPANT] Rendering component');
  console.log('🔑 [PARTICIPANT] Event ID:', eventId);
  console.log('⏱️ [PARTICIPANT] Loading state:', loading);
  console.log('❌ [PARTICIPANT] Error state:', error);
  console.log('📦 [PARTICIPANT] Event state:', event);

  // Charger l'événement
  useEffect(() => {
    console.log('🚀 [PARTICIPANT] useEffect triggered');
    
    if (!eventId) {
      console.error('❌ [PARTICIPANT] No event ID!');
      setError("Lien invalide");
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      console.log('📥 [PARTICIPANT] Fetching event...');
      
      try {
        const apiUrl = `/api/get-event?id=${eventId}`;
        console.log('🌐 [PARTICIPANT] API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('📡 [PARTICIPANT] Response status:', response.status);
        
        if (!response.ok) {
          console.error('❌ [PARTICIPANT] Response not OK');
          setError("Événement introuvable");
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('📦 [PARTICIPANT] Raw data:', data);
        
        if (!data.event) {
          console.error('❌ [PARTICIPANT] No event in response!');
          setError("Format invalide");
          setLoading(false);
          return;
        }
        
        console.log('✅ [PARTICIPANT] Event found:', data.event);
        setEvent(data.event);
        
        // Initialiser availabilities
        const initialAvailabilities = {};
        data.event.dates.forEach(date => {
          initialAvailabilities[date.id] = null;
        });
        setAvailabilities(initialAvailabilities);
        
        console.log('✅ [PARTICIPANT] Setting loading to false');
        setLoading(false);
        
      } catch (err) {
        console.error('💥 [PARTICIPANT] Error:', err);
        setError("Erreur de chargement");
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
        newValue = true;
      } else if (current === true) {
        newValue = false;
      } else {
        newValue = null;
      }
      
      return {
        ...prev,
        [dateId]: newValue
      };
    });
  };

  const handleSubmit = async () => {
    if (!userName.trim()) {
      alert('Merci de renseigner ton prénom ! 😊');
      return;
    }

    try {
      const response = await fetch('/api/update-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventId,
          userName: userName,
          availabilities: availabilities
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi');
      }

      setStep(3);
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Une erreur est survenue. Réessaye !');
    }
  };

  // LOADING
  if (loading) {
    console.log('⏳ [PARTICIPANT] Rendering loading screen');
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <Clock size={64} />
          <p style={{ marginTop: '20px', fontSize: '20px', fontWeight: '600' }}>Chargement...</p>
          <p style={{ marginTop: '10px', fontSize: '14px', opacity: 0.8 }}>Event ID: {eventId}</p>
        </div>
      </div>
    );
  }

  // ERROR
  if (error) {
    console.log('❌ [PARTICIPANT] Rendering error screen');
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
          textAlign: 'center'
        }}>
          <AlertCircle size={64} color="#EF4444" />
          <h2 style={{ marginTop: '20px', color: '#1E1B4B' }}>{error}</h2>
          <p style={{ color: '#6B7280', marginTop: '10px' }}>Event ID: {eventId}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '20px',
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  // NO EVENT
  if (!event) {
    console.log('⚠️ [PARTICIPANT] No event in state!');
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <p>Aucun événement chargé</p>
        </div>
      </div>
    );
  }

  console.log('✅ [PARTICIPANT] Rendering main content');

  // MAIN CONTENT
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#1E1B4B' }}>
            {event.type}
          </h1>
          {event.location && (
            <p style={{ color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <MapPin size={16} />
              {event.location}
            </p>
          )}
        </div>

        {/* Step 1: Dates */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#1E1B4B' }}>
              📅 Dates proposées
            </h3>
            {event.dates.map((date) => (
              <div key={date.id} style={{
                padding: '16px',
                marginBottom: '12px',
                border: '2px solid #E9D5FF',
                borderRadius: '12px',
                cursor: 'pointer',
                background: availabilities[date.id] === true ? '#D1FAE5' : availabilities[date.id] === false ? '#FEE2E2' : 'white'
              }}
              onClick={() => handleAvailabilityToggle(date.id)}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1E1B4B' }}>
                  {date.label}
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                  {availabilities[date.id] === true ? '✅ Disponible' : availabilities[date.id] === false ? '❌ Indisponible' : '⚪ Pas de réponse'}
                </div>
              </div>
            ))}
            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '16px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* Step 2: Name */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#1E1B4B' }}>
              👤 Ton prénom
            </h3>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ex: Sophie"
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid #E9D5FF',
                borderRadius: '12px',
                fontSize: '16px',
                marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'white',
                  color: '#8B5CF6',
                  border: '2px solid #8B5CF6',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ← Retour
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  flex: 2,
                  padding: '16px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Valider ✨
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <CheckCircle size={48} color="white" />
            </div>
            <h2 style={{ fontSize: '24px', marginBottom: '12px', color: '#1E1B4B' }}>
              Merci {userName} ! 🎉
            </h2>
            <p style={{ color: '#6B7280', marginBottom: '24px' }}>
              Tes disponibilités ont été enregistrées. L'organisateur t'informera dès que la date sera confirmée !
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Créer mon événement
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Participant;
