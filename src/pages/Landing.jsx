import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, Zap, CheckCircle, Sparkles, ArrowRight, MessageSquare } from 'lucide-react';
import Header from '../components/Header';

const Landing = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (email.trim() && email.includes('@')) {
      try {
        const response = await fetch('/api/newsletter-signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (data.success) {
          setSubmitted(true);
          console.log('Email enregistré:', email);
        } else {
          console.error('Erreur:', data.error);
          // Afficher quand même le message de succès pour ne pas bloquer l'UX
          setSubmitted(true);
        }
      } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        // Afficher quand même le message de succès pour ne pas bloquer l'UX
        setSubmitted(true);
      }
    }
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1E1B4B'
    }}>
      {/* Header Navigation */}
      <Header />

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '100px 20px 40px', // Ajouté padding-top pour compenser le header fixe
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'float 6s ease-in-out infinite'
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '40px'
            }}>
              <Sparkles size={48} color="white" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} />
              <h1 style={{ 
                fontSize: '56px', 
                fontWeight: '900',
                color: 'white',
                margin: 0,
                textShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                Synkro
              </h1>
            </div>

            <h2 style={{
              fontSize: '48px',
              fontWeight: '800',
              color: 'white',
              marginBottom: '24px',
              lineHeight: '1.2',
              textShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              47 messages pour un dîner ?<br/>C'est fini.
            </h2>

            <p style={{
              fontSize: '24px',
              color: 'rgba(255,255,255,0.95)',
              marginBottom: '48px',
              maxWidth: '700px',
              margin: '0 auto 48px',
              lineHeight: '1.5'
            }}>
              Trouve la date parfaite pour ton événement<br/>
              <strong style={{ color: 'white' }}>en 1 minute ⚡</strong>
            </p>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/create')}
                style={{
                  padding: '18px 36px',
                  background: 'white',
                  color: '#8B5CF6',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                }}
              >
                <Sparkles size={20} />
                Tester maintenant
              </button>
            </div>

            {!submitted ? (
              <div style={{
                maxWidth: '500px',
                margin: '0 auto',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="ton@email.com"
                  style={{
                    flex: '1',
                    minWidth: '280px',
                    padding: '18px 24px',
                    fontSize: '16px',
                    border: 'none',
                    borderRadius: '14px',
                    outline: 'none',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                  }}
                />
                <button
                  onClick={handleSubmit}
                  style={{
                    padding: '18px 36px',
                    background: 'white',
                    color: '#8B5CF6',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                  }}
                >
                  Accès anticipé
                  <ArrowRight size={20} />
                </button>
              </div>
            ) : (
              <div style={{
                background: 'white',
                padding: '24px 32px',
                borderRadius: '16px',
                maxWidth: '500px',
                margin: '0 auto',
                boxShadow: '0 12px 32px rgba(0,0,0,0.2)'
              }}>
                <CheckCircle size={48} color="#8B5CF6" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '24px', marginBottom: '8px', color: '#1E1B4B' }}>
                  Merci ! 🎉
                </h3>
                <p style={{ color: '#6B7280', margin: 0 }}>
                  Tu fais partie des premiers ! On te contacte très bientôt.
                </p>
              </div>
            )}

            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
              marginTop: '20px'
            }}>
              🚀 Lancement prévu : Novembre 2025 • 100% gratuit pendant la beta
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {[
              { icon: <Zap size={32} />, value: '< 1 min', label: 'Pour organiser' },
              { icon: <Users size={32} />, value: 'Illimité', label: 'Participants' },
              { icon: <MessageSquare size={32} />, value: '0', label: 'Prise de tête' }
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                padding: '24px',
                borderRadius: '16px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ color: 'white', marginBottom: '12px' }}>{stat.icon}</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-20px) translateX(10px); }
          }
        `}</style>
      </section>

      {/* Problem Section */}
      <section style={{
        padding: '100px 20px',
        background: 'white'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '20px', color: '#1E1B4B' }}>
              Tu connais ça ? 😤
            </h2>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            padding: '40px',
            borderRadius: '24px',
            border: '2px solid #FCD34D',
            marginBottom: '40px'
          }}>
            <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#92400E' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', opacity: 0.8 }}>💬 Groupe "Dîner entre potes"</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>Tom:</strong> "On se fait un dîner quand ?"</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>Sarah:</strong> "Moi je peux les 15, 16 ou 22"</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>Marc:</strong> "Attendez je regarde mon agenda..."</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>Julie:</strong> "Moi plutôt en mars"</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>Tom:</strong> "Donc le 15 ça va ?"</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>Marc:</strong> "Ah merde j'ai pas vu, moi non"</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>Sarah:</strong> "Du coup on fait quoi ??"</p>
              <p style={{ margin: '0', fontStyle: 'italic', fontSize: '14px' }}>
                ... 47 messages plus tard, toujours pas de date 🤦‍♂️
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{
        padding: '100px 20px',
        background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '20px', color: '#1E1B4B' }}>
              Comment ça marche ?
            </h2>
            <p style={{ fontSize: '18px', color: '#6B7280' }}>
              3 étapes, 1 minute, et c'est réglé ✨
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px'
          }}>
            {[
              {
                step: '1',
                icon: <Calendar size={40} />,
                title: 'Tu proposes 3 dates',
                description: 'Choisis le type d\'événement, Synkro te suggère des dates pertinentes'
              },
              {
                step: '2',
                icon: <Users size={40} />,
                title: 'Tes potes répondent',
                description: 'Ils cliquent sur le lien et indiquent leurs dispos en 30 secondes'
              },
              {
                step: '3',
                icon: <Zap size={40} />,
                title: 'Synkro choisit pour vous',
                description: 'La meilleure date est automatiquement ajoutée à vos agendas'
              }
            ].map((item, i) => (
              <div key={i} style={{
                background: 'white',
                padding: '40px',
                borderRadius: '20px',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1)',
                border: '2px solid #E9D5FF',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: '800',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}>
                  {item.step}
                </div>
                <div style={{ color: '#8B5CF6', marginBottom: '20px', marginTop: '20px' }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px', color: '#1E1B4B' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#6B7280', lineHeight: '1.6', margin: 0 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '60px 20px',
        background: '#1E1B4B',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.7)'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <Sparkles size={32} color="white" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '24px', color: 'white', marginBottom: '8px' }}>Synkro</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>Une date en 1 minute ⚡</p>
        </div>
        
        {/* Navigation Footer - NOUVEAU */}
        <div style={{
          display: 'flex',
          gap: '24px',
          justifyContent: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.color = 'white'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
          >
            Accueil
          </button>
          <button
            onClick={() => navigate('/pricing')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.color = 'white'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
          >
            Tarifs
          </button>
          <button
            onClick={() => navigate('/create')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.color = 'white'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
          >
            Créer un événement
          </button>
        </div>
        
        <p style={{ fontSize: '14px', margin: '0 0 20px 0' }}>
          Créé avec 💜 en France
        </p>
        <p style={{ fontSize: '12px', margin: 0 }}>
          © 2025 Synkro • Prototype de test
        </p>
      </footer>
    </div>
  );
};

export default Landing;
