import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  BarChart as BarChartIcon, TrendingUp, Clock, Users,
  Calendar, Crown, ArrowLeft, Target, Zap, Filter, Download
} from 'lucide-react';

/**
 * Page Analytics Entreprise
 * Analytics avancées avec filtres de période et graphiques Recharts
 * Réservée au plan Entreprise uniquement
 */
export default function Analytics() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [userPlan, setUserPlan] = useState('gratuit');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('synkro_user_email');
    if (email) {
      setUserEmail(email);
      checkUserPlan(email);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userEmail && userPlan === 'entreprise') {
      loadAnalytics();
    }
  }, [userEmail, userPlan, selectedPeriod, customStartDate, customEndDate]);

  const checkUserPlan = async (email) => {
    try {
      const response = await fetch(`/api/user?action=stats&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setUserPlan(data.plan || 'gratuit');
    } catch (error) {
      console.error('Erreur récupération plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      let url = `/api/get-analytics?email=${encodeURIComponent(userEmail)}&period=${selectedPeriod}`;

      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        console.error('Erreur chargement analytics:', data.message);
      }
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    }
  };

  const isEnterprise = userPlan === 'entreprise';

  // Couleurs pour les graphiques
  const COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  // Écran de verrouillage pour utilisateurs non-Entreprise
  if (!loading && !isEnterprise) {
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
            <BarChartIcon size={40} color="white" />
          </div>

          <h2 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#1E1B4B',
            marginBottom: '16px'
          }}>
            Analytics Entreprise
          </h2>

          <p style={{
            color: '#6B7280',
            marginBottom: '32px',
            fontSize: '18px',
            lineHeight: '1.6'
          }}>
            Débloquez des insights professionnels sur vos événements avec des analyses avancées et des rapports détaillés
          </p>

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
              Fonctionnalités exclusives :
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {[
                'Filtres avancés (7j, 30j, 90j, personnalisé)',
                'Évolution détaillée de vos événements',
                'Taux de réponse par type d\'événement',
                'Temps de réponse moyen des participants',
                'Top types d\'événements',
                'Export des rapports en PDF',
                'Graphiques interactifs professionnels',
                'Analytics en temps réel'
              ].map((feature, index) => (
                <li key={index} style={{
                  padding: '12px 0',
                  borderBottom: index < 7 ? '1px solid #E5E7EB' : 'none',
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
            Passer au plan Entreprise
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

  // Page Analytics pour plan Entreprise
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

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
              <BarChartIcon size={36} color="#8B5CF6" />
              Analytics Entreprise
            </h1>
            <p style={{ color: '#6B7280' }}>
              Insights détaillés et rapports avancés
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
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>
        </div>

        {/* Filtres de période */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <Filter size={20} color="#8B5CF6" />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E1B4B', margin: 0 }}>
              Période d'analyse
            </h3>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center'
          }}>
            {['7d', '30d', '90d', 'custom'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                style={{
                  padding: '10px 20px',
                  background: selectedPeriod === period
                    ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                    : 'white',
                  color: selectedPeriod === period ? 'white' : '#6B7280',
                  border: selectedPeriod === period ? 'none' : '2px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {period === '7d' && '7 derniers jours'}
                {period === '30d' && '30 derniers jours'}
                {period === '90d' && '90 derniers jours'}
                {period === 'custom' && 'Personnalisé'}
              </button>
            ))}
          </div>

          {selectedPeriod === 'custom' && (
            <div style={{
              display: 'flex',
              gap: '16px',
              marginTop: '16px',
              flexWrap: 'wrap'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6B7280',
                  marginBottom: '8px'
                }}>
                  Date de début
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1E1B4B'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6B7280',
                  marginBottom: '8px'
                }}>
                  Date de fin
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1E1B4B'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* KPIs Cards */}
        {analytics && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '40px'
            }}>
              {/* Total événements */}
              <KPICard
                icon={<Calendar size={24} color="#8B5CF6" />}
                title="Événements créés"
                value={analytics.totalEvents}
                subtitle={`Sur la période sélectionnée`}
                color="#8B5CF6"
              />

              {/* Taux de réponse */}
              <KPICard
                icon={<Target size={24} color="#10B981" />}
                title="Taux de réponse moyen"
                value={`${analytics.averageResponseRate}%`}
                subtitle={`${analytics.totalResponses} / ${analytics.totalExpected} participants`}
                color="#10B981"
              />

              {/* Temps de réponse */}
              <KPICard
                icon={<Clock size={24} color="#EC4899" />}
                title="Temps de réponse moyen"
                value={analytics.averageResponseTime}
                subtitle="Délai moyen de participation"
                color="#EC4899"
              />

              {/* Total participants */}
              <KPICard
                icon={<Users size={24} color="#06B6D4" />}
                title="Participants totaux"
                value={analytics.totalParticipants}
                subtitle="Tous événements confondus"
                color="#06B6D4"
              />
            </div>

            {/* Graphique d'évolution */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
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
                Évolution des événements
              </h2>

              {analytics.evolutionData && analytics.evolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      stroke="#6B7280"
                      style={{ fontSize: '12px', fontWeight: '600' }}
                    />
                    <YAxis
                      stroke="#6B7280"
                      style={{ fontSize: '12px', fontWeight: '600' }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '2px solid #E5E7EB',
                        borderRadius: '12px',
                        padding: '12px'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      name="Événements créés"
                      dot={{ fill: '#8B5CF6', r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="responses"
                      stroke="#10B981"
                      strokeWidth={3}
                      name="Réponses"
                      dot={{ fill: '#10B981', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                  background: '#F9FAFB',
                  borderRadius: '12px'
                }}>
                  <BarChartIcon size={48} color="#D1D5DB" />
                  <p style={{ color: '#6B7280', marginTop: '16px' }}>
                    Aucune donnée pour cette période
                  </p>
                </div>
              )}
            </div>

            {/* Top types d'événements */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
              gap: '32px',
              marginBottom: '40px'
            }}>
              {/* Types d'événements - Bar Chart */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1E1B4B',
                  marginBottom: '24px'
                }}>
                  Top types d'événements
                </h2>

                {analytics.topEventTypes && analytics.topEventTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.topEventTypes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="type"
                        stroke="#6B7280"
                        style={{ fontSize: '12px', fontWeight: '600' }}
                      />
                      <YAxis stroke="#6B7280" />
                      <Tooltip
                        contentStyle={{
                          background: 'white',
                          border: '2px solid #E5E7EB',
                          borderRadius: '12px'
                        }}
                      />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: '#6B7280', textAlign: 'center' }}>
                    Aucune donnée disponible
                  </p>
                )}
              </div>

              {/* Taux de réponse par type */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1E1B4B',
                  marginBottom: '24px'
                }}>
                  Taux de réponse par type
                </h2>

                {analytics.responseRateByEventType && analytics.responseRateByEventType.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {analytics.responseRateByEventType.slice(0, 5).map((item, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1E1B4B'
                          }}>
                            {item.type}
                          </span>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#8B5CF6'
                          }}>
                            {item.responseRate}%
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          background: '#E5E7EB',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${item.responseRate}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                            borderRadius: '8px',
                            transition: 'width 0.3s'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#6B7280', textAlign: 'center' }}>
                    Aucune donnée disponible
                  </p>
                )}
              </div>
            </div>
          </>
        )}

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
            <InsightCard
              emoji="📊"
              title="Performance globale"
              description={
                analytics && analytics.averageResponseRate >= 70
                  ? "Excellent taux de réponse ! Continuez ainsi."
                  : "Essayez d'envoyer des relances pour améliorer le taux de réponse."
              }
            />
            <InsightCard
              emoji="⚡"
              title="Réactivité"
              description={
                analytics && analytics.averageResponseTimeMinutes < 1440
                  ? "Vos participants répondent rapidement, félicitations !"
                  : "Envoyer les invitations plus tôt peut améliorer la participation."
              }
            />
            <InsightCard
              emoji="🎯"
              title="Optimisation"
              description="Les groupes de 6-8 personnes trouvent plus facilement une date commune."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant KPI Card
function KPICard({ icon, title, value, subtitle, color }) {
  return (
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
        background: color,
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
            {title}
          </h3>
          {icon}
        </div>
        <div style={{ fontSize: '48px', fontWeight: '800', color: color, marginBottom: '8px' }}>
          {value}
        </div>
        <div style={{ color: '#6B7280', fontSize: '14px' }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

// Composant Insight Card
function InsightCard({ emoji, title, description }) {
  return (
    <div style={{
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{emoji}</div>
      <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', opacity: 0.9 }}>
        {description}
      </p>
    </div>
  );
}
