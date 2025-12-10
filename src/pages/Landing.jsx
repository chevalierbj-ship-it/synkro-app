import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Users, Zap, CheckCircle, Sparkles, ArrowRight, MessageSquare } from 'lucide-react';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const seoKeywords = [
    'organisation événement',
    'trouver date groupe',
    'coordination disponibilités',
    'alternative doodle',
    'planification réunion',
    'organiser dîner entre amis',
    'sondage date',
    'événement participatif'
  ];

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
      <SEOHead
        title={t('landing.seo.title')}
        description={t('landing.seo.description')}
        keywords={seoKeywords}
        type="website"
      />

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
              {t('landing.hero.tagline')}<br/>{t('landing.hero.taglineEnd')}
            </h2>

            <p style={{
              fontSize: '24px',
              color: 'rgba(255,255,255,0.95)',
              marginBottom: '48px',
              maxWidth: '700px',
              margin: '0 auto 48px',
              lineHeight: '1.5'
            }}>
              {t('landing.hero.subtitle')}<br/>
              <strong style={{ color: 'white' }}>{t('landing.hero.subtitleHighlight')} ⚡</strong>
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
                {t('landing.hero.cta')}
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
                  placeholder={t('landing.hero.emailPlaceholder')}
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
                  {t('landing.hero.earlyAccess')}
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
                  {t('landing.hero.thankYou')} 🎉
                </h3>
                <p style={{ color: '#6B7280', margin: 0 }}>
                  {t('landing.hero.thankYouMessage')}
                </p>
              </div>
            )}

            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
              marginTop: '20px'
            }}>
              🚀 {t('landing.hero.launchInfo')}
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
              { icon: <Zap size={32} />, value: t('landing.stats.time'), label: t('landing.stats.timeLabel') },
              { icon: <Users size={32} />, value: t('landing.stats.participants'), label: t('landing.stats.participantsLabel') },
              { icon: <MessageSquare size={32} />, value: t('landing.stats.stress'), label: t('landing.stats.stressLabel') }
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
              {t('landing.problem.title')} 😤
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
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', opacity: 0.8 }}>💬 {t('landing.problem.groupName')}</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>Tom:</strong> "{t('landing.problem.message1')}"</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>Sarah:</strong> "{t('landing.problem.message2')}"</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>Marc:</strong> "{t('landing.problem.message3')}"</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>Julie:</strong> "{t('landing.problem.message4')}"</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>Tom:</strong> "{t('landing.problem.message5')}"</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>Marc:</strong> "{t('landing.problem.message6')}"</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>Sarah:</strong> "{t('landing.problem.message7')}"</p>
              <p style={{ margin: '0', fontStyle: 'italic', fontSize: '14px' }}>
                {t('landing.problem.conclusion')} 🤦‍♂️
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
              {t('landing.howItWorks.title')}
            </h2>
            <p style={{ fontSize: '18px', color: '#6B7280' }}>
              {t('landing.howItWorks.subtitle')} ✨
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
                title: t('landing.howItWorks.step1.title'),
                description: t('landing.howItWorks.step1.description')
              },
              {
                step: '2',
                icon: <Users size={40} />,
                title: t('landing.howItWorks.step2.title'),
                description: t('landing.howItWorks.step2.description')
              },
              {
                step: '3',
                icon: <Zap size={40} />,
                title: t('landing.howItWorks.step3.title'),
                description: t('landing.howItWorks.step3.description')
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
          <p style={{ margin: 0, fontSize: '14px' }}>{t('landing.footer.tagline')} ⚡</p>
        </div>

        {/* Navigation Footer */}
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
            {t('nav.home')}
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
            {t('nav.pricing')}
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
            {t('landing.footer.createEvent')}
          </button>
        </div>

        {/* Legal Links */}
        <div style={{
          display: 'flex',
          gap: '24px',
          justifyContent: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/mentions-legales')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.9)'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.5)'}
          >
            {t('legal.mentions')}
          </button>
          <button
            onClick={() => navigate('/cgv')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.9)'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.5)'}
          >
            {t('legal.cgv')}
          </button>
          <button
            onClick={() => navigate('/confidentialite')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.9)'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.5)'}
          >
            {t('legal.privacy')}
          </button>
        </div>

        <p style={{ fontSize: '14px', margin: '0 0 20px 0' }}>
          {t('landing.footer.madeWith')}
        </p>
        <p style={{ fontSize: '12px', margin: 0 }}>
          {t('landing.footer.copyright')}
        </p>
      </footer>
    </div>
  );
};

export default Landing;
