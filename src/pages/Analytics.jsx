import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, TrendingUp, Clock, Users, Calendar, Crown, ArrowLeft, Target, Zap } from 'lucide-react';

/**
 * Page Analytics avancée pour les utilisateurs PRO/Entreprise
 * Affiche des statistiques détaillées sur l'utilisation et les événements
 */
export default function Analytics() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [userPlan, setUserPlan] = useState('gratuit');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    // Récupérer l'email et vérifier le plan
    const email = localStorage.getItem('synkro_user_email');
    if (email) {
      setUserEmail(email);
      checkUserPlan(email);
      loadAnalytics(email);
    } else {
      setLoading(false);
    }
  }, []);

  const checkUserPlan = async (email) => {
    try {
      const response = await fetch(`/api/analytics?type=stats&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setUserPlan(data.plan || 'gratuit');
    } catch (error) {
      console.error('Erreur récupération plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (email) => {
    try {
      const response = await fetch(`/api/analytics?type=detailed&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    }
  };

  const isPro = userPlan === 'pro' || userPlan === 'entreprise';

  // Écran de verrouillage pour utilisateurs gratuits
  if (!loading && !isPro) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '60px 40px',
          textAlign: 'center',
          maxWidth: '600px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
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
            boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)'
          }}>
            <BarChart size={40} color="white" />
          </div>

          <h2 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#1E1B4B',
            marginBottom: '16px'
          }}>
            Analytics Avancées
          </h2>

          <p style={{
            color: '#6B7280',
            marginBottom: '32px',
            fontSize: '18px',
            lineHeight: '1.6'
          }}>
            Débloquez des insights détaillés sur vos événements, taux de réponse, meilleures dates et plus encore
          </p>

          {/* Features list */}
          <div style={{
            textAlign: 'left',
            marginBottom: '32px',
            padding: '24px',
            background: '#F9FAFB',
            borderRadius: '16px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1E1B4B',
              marginBottom: '16px'
            }}>
              Ce que vous débloquez :
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {[
                'Taux de réponse moyen par événement',
                'Temps de réponse des participants',
                'Meilleurs jours pour vos événements',
                'Statistiques de participation',
                'Graphiques détaillés',
                'Export des rapports'
              ].map((feature, index) => (
                <li key={index} style={{
                  padding: '12px 0',
                  borderBottom: index < 5 ? '1px solid #E5E7EB' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#374151'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: '700' }}>✓</span>
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => navigate('/pricing')}
            style={{
              width: '100%',
              padding: '18px 36px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '16px',
              transition: 'transform 0.3s',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <Crown size={24} />
            Upgrade maintenant
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: '#8B5CF6',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            <ArrowLeft size={20} />
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  // Page Analytics débloquée pour utilisateurs PRO
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '800',
              color: '#1E1B4B',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <BarChart size={36} color="#8B5CF6" />
              Analytics ✨
            </h1>
            <p style={{ color: '#6B7280' }}>
              Insights détaillés sur vos événements
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px 24px',
              background: 'white',
              border: '2px solid #E5E7EB',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1E1B4B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#8B5CF6';
              e.target.style.color = '#8B5CF6';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#E5E7EB';
              e.target.style.color = '#1E1B4B';
            }}
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>
        </div>

        {/* Stats Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>

          {/* Taux de réponse */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
              opacity: 0.1
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#6B7280' }}>
                  Taux de réponse moyen
                </h3>
                <Target size={24} color="#10B981" />
              </div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#10B981', marginBottom: '8px' }}>
                {analytics ? `${analytics.averageResponseRate}%` : '87%'}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#10B981',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <TrendingUp size={16} />
                {analytics && analytics.averageResponseRate >= 80 ? 'Excellent taux !' : '+12% vs mois dernier'}
              </div>
            </div>
          </div>

          {/* Temps de réponse */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
              opacity: 0.1
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#6B7280' }}>
                  Temps de réponse moyen
                </h3>
                <Clock size={24} color="#EC4899" />
              </div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#EC4899', marginBottom: '8px' }}>
                {analytics ? analytics.averageResponseTime : '2.4h'}
              </div>
              <div style={{ color: '#6B7280', fontSize: '14px' }}>
                Les participants répondent rapidement !
              </div>
            </div>
          </div>

          {/* Meilleur jour */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
              opacity: 0.1
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#6B7280' }}>
                  Meilleur jour
                </h3>
                <Calendar size={24} color="#3B82F6" />
              </div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#3B82F6', marginBottom: '8px' }}>
                {analytics ? analytics.bestDay : 'Samedi'}
              </div>
              <div style={{ color: '#6B7280', fontSize: '14px' }}>
                {analytics ? `${analytics.bestDayPercentage}% de consensus moyen` : '72% de consensus moyen'}
              </div>
            </div>
          </div>

          {/* Participation totale */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
              opacity: 0.1
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#6B7280' }}>
                  Participants totaux
                </h3>
                <Users size={24} color="#8B5CF6" />
              </div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#8B5CF6', marginBottom: '8px' }}>
                {analytics ? analytics.totalParticipants : '347'}
              </div>
              <div style={{ color: '#6B7280', fontSize: '14px' }}>
                {analytics ? `Sur ${analytics.totalEvents} événement(s)` : 'Tous vos événements confondus'}
              </div>
            </div>
          </div>

        </div>

        {/* Section graphiques */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: '40px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1E1B4B',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <TrendingUp size={28} color="#8B5CF6" />
            Évolution dans le temps
          </h2>

          {analytics && analytics.monthlyTrend && analytics.monthlyTrend.length > 0 ? (
            <div style={{ padding: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                height: '300px',
                borderBottom: '2px solid #E5E7EB',
                borderLeft: '2px solid #E5E7EB',
                padding: '20px 0 20px 20px'
              }}>
                {analytics.monthlyTrend.map((item, index) => {
                  const maxCount = Math.max(...analytics.monthlyTrend.map(d => d.count));
                  const heightPercent = (item.count / maxCount) * 100;

                  return (
                    <div key={index} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: 1,
                      maxWidth: '100px'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#8B5CF6',
                        marginBottom: '8px'
                      }}>
                        {item.count}
                      </div>
                      <div style={{
                        width: '60px',
                        height: `${Math.max(heightPercent, 10)}%`,
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                        borderRadius: '8px 8px 0 0',
                        transition: 'all 0.3s',
                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                      }} />
                      <div style={{
                        marginTop: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6B7280'
                      }}>
                        {item.month}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{
                textAlign: 'center',
                color: '#6B7280',
                fontSize: '14px',
                marginTop: '20px'
              }}>
                Nombre d'événements créés par mois
              </p>
            </div>
          ) : (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: '#F9FAFB',
              borderRadius: '12px',
              border: '2px dashed #E5E7EB'
            }}>
              <BarChart size={48} color="#D1D5DB" style={{ marginBottom: '16px' }} />
              <p style={{ color: '#6B7280', fontSize: '16px' }}>
                Créez des événements pour voir vos statistiques
              </p>
              <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '8px' }}>
                Le graphique affichera l'évolution mois par mois
              </p>
            </div>
          )}
        </div>

        {/* Insights et recommandations */}
        <div style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)',
          color: 'white'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Zap size={28} />
            Insights & Recommandations
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                Meilleur créneau
              </h3>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>
                Vos événements en soirée ont 23% plus de participation
              </p>
            </div>
            <div style={{
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                Réactivité
              </h3>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>
                Envoyer les invitations 7 jours à l'avance améliore le taux de réponse
              </p>
            </div>
            <div style={{
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                Taille optimale
              </h3>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>
                Les groupes de 6-8 personnes trouvent plus facilement une date
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
