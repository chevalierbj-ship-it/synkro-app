import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Participant = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');

  // TEST ULTRA SIMPLE
  console.log('========================================');
  console.log('🔥 PARTICIPANT.JSX IS LOADED!');
  console.log('🔥 Event ID:', eventId);
  console.log('========================================');

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
        maxWidth: '600px',
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 24px 60px rgba(139, 92, 246, 0.3)'
      }}>
        <h1 style={{ fontSize: '32px', color: '#1E1B4B', marginBottom: '20px' }}>
          ✅ PARTICIPANT.JSX FONCTIONNE !
        </h1>
        <p style={{ fontSize: '18px', color: '#6B7280', marginBottom: '10px' }}>
          Event ID: {eventId || 'Aucun ID'}
        </p>
        <p style={{ fontSize: '14px', color: '#8B5CF6' }}>
          Si vous voyez ce message, le fichier est bien chargé !
        </p>
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#F5F3FF',
          borderRadius: '12px',
          border: '2px solid #8B5CF6'
        }}>
          <p style={{ fontSize: '14px', color: '#1E1B4B', fontWeight: '600' }}>
            🔍 Vérifiez la Console (F12) pour voir les logs !
          </p>
        </div>
      </div>
    </div>
  );
};

export default Participant;
