import React, { useState } from 'react';
import { ChevronRight, Sparkles, Check, ArrowLeft } from 'lucide-react';

/**
 * Composant de flux de questions intelligentes
 * Affiche les questions une par une avec une UX optimisée
 */
export default function SmartQuestionFlow({
  questions,
  onComplete,
  eventTitle,
  participantName
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswer = async (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // Si dernière question, soumettre
    if (isLastQuestion) {
      await handleSubmit(newAnswers);
    } else {
      // Passer à la question suivante avec une petite animation
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300);
    }
  };

  const handleSubmit = async (finalAnswers) => {
    setIsSubmitting(true);
    try {
      await onComplete(finalAnswers);
    } catch (error) {
      console.error('Error submitting answers:', error);
      setIsSubmitting(false);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Écran de chargement pendant la soumission
  if (isSubmitting) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '24px',
        padding: '40px 20px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite',
          boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
        }}>
          <Sparkles size={40} color="white" />
        </div>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '800',
          color: '#1E1B4B',
          textAlign: 'center',
          margin: 0
        }}>
          L'IA analyse vos préférences...
        </h2>
        <p style={{
          color: '#6B7280',
          fontSize: '16px',
          textAlign: 'center',
          margin: 0
        }}>
          Recherche de la date optimale pour tout le monde ✨
        </p>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '650px',
      margin: '0 auto',
      padding: '40px 20px'
    }}>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '6px',
        background: '#E5E7EB',
        borderRadius: '3px',
        marginBottom: '40px',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
        }} />
      </div>

      {/* Header */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)'
        }}>
          <Sparkles size={30} color="white" />
        </div>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '800',
          color: '#1E1B4B',
          marginBottom: '8px',
          margin: 0
        }}>
          {eventTitle}
        </h1>
        <p style={{
          color: '#6B7280',
          fontSize: '15px',
          margin: '8px 0 0 0'
        }}>
          Question {currentQuestionIndex + 1} sur {questions.length}
          {participantName && ` • ${participantName}`}
        </p>
      </div>

      {/* Question Card */}
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        border: '2px solid #F5F3FF'
      }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: '#1E1B4B',
          marginBottom: '32px',
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {currentQuestion.options.map((option) => {
            const isSelected = answers[currentQuestion.id] === option.value;

            return (
              <button
                key={option.value}
                onClick={() => handleAnswer(currentQuestion.id, option.value)}
                style={{
                  padding: '20px 24px',
                  background: isSelected
                    ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                    : 'white',
                  color: isSelected ? 'white' : '#1E1B4B',
                  border: isSelected
                    ? 'none'
                    : '2px solid #E9D5FF',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected
                    ? '0 8px 24px rgba(139, 92, 246, 0.4)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
                  transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.target.style.background = '#F5F3FF';
                    e.target.style.borderColor = '#8B5CF6';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = '#E9D5FF';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  }
                }}
              >
                <span style={{ fontSize: '28px', flexShrink: 0 }}>
                  {option.icon}
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  {option.label}
                </span>
                {isSelected && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Check size={16} color="#8B5CF6" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        marginTop: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {currentQuestionIndex > 0 ? (
          <button
            onClick={handleBack}
            style={{
              padding: '12px 20px',
              background: 'white',
              border: '2px solid #E9D5FF',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              color: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#F5F3FF';
              e.target.style.borderColor = '#8B5CF6';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#E9D5FF';
            }}
          >
            <ArrowLeft size={18} />
            Retour
          </button>
        ) : (
          <div />
        )}

        {/* Indicateur de progression */}
        <div style={{
          fontSize: '14px',
          color: '#6B7280',
          fontWeight: '600'
        }}>
          {isLastQuestion ? '✨ Dernière question !' : `${questions.length - currentQuestionIndex - 1} restante${questions.length - currentQuestionIndex - 1 > 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Aide contextuelle */}
      <div style={{
        marginTop: '32px',
        padding: '18px 24px',
        background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        borderRadius: '14px',
        border: '2px solid #FCD34D',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '14px',
          color: '#92400E',
          margin: 0,
          lineHeight: '1.6',
          fontWeight: '500'
        }}>
          💡 <strong>Astuce :</strong> Sélectionnez "Flexible" si vous n'avez pas de préférence forte !
        </p>
      </div>
    </div>
  );
}
