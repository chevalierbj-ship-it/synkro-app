import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, TrendingUp, Sparkles, ArrowRight, Crown, Mail } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import CustomizationPanel from '../components/CustomizationPanel';
import TeamManagement from '../components/TeamManagement';

export default function Dashboard() {
  const navigate = useNavigate();
  const { isSignedIn, user, isLoaded } = useUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    // Rediriger vers sign-in si non connecté
    if (isLoaded && !isSignedIn) {
      navigate('/sign-in');
      return;
    }

    // Charger les stats si connecté
    if (isSignedIn && user?.primaryEmailAddress?.emailAddress) {
      fetchUserStats(user.primaryEmailAddress.emailAddress);
      fetchUserEvents(user.primaryEmailAddress.emailAddress);
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  const fetchUserStats = async (email) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?type=stats&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erreur récupération stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEvents = async (email) => {
    try {
      setLoadingEvents(true);
      console.log('📧 Loading events for:', email);

      const response = await fetch(`/api/get-user-events?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      console.log('📊 API Response:', data);

      if (data.success && data.events) {
        console.log('✅ Events loaded:', data.events.length);
        setEvents(data.events.slice(0, 5)); // Garder seulement les 5 derniers
      } else {
        console.warn('⚠️ No events found or API error');
        setEvents([]);
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const getPlanEmoji = (plan) => {
    switch (plan) {
      case 'gratuit':
        return '🎉';
      case 'pro':
        return '💼';
      case 'entreprise':
        return '🏢';
      default:
        return '🎉';
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'pro':
        return 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)';
      case 'entreprise':
        return 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)';
      default:
        return '#E5E7EB';
    }
  };

  // Écran de chargement
  if (!isLoaded || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            ✨
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1E1B4B' }}>
            Chargement de vos statistiques...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header avec navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1E1B4B', marginBottom: '8px' }}>
              Mon Dashboard
            </h1>
            <p style={{ color: '#6B7280', fontSize: '16px' }}>
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                background: 'white',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1E1B4B',
                cursor: 'pointer',
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
              ← Accueil
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>

          {/* Card Plan */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            transition: 'transform 0.3s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: getPlanColor(stats?.plan),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                {getPlanEmoji(stats?.plan)}
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>Votre plan</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1E1B4B',
                  textTransform: 'capitalize'
                }}>
                  {stats?.plan || 'Gratuit'}
                </div>
              </div>
            </div>
            {stats?.plan === 'gratuit' && (
              <button
                onClick={() => navigate('/pricing')}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'transform 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <Crown size={18} />
                Passer en Pro
              </button>
            )}
          </div>

          {/* Card Événements */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Calendar size={24} color="#8B5CF6" />
              <div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>Événements ce mois</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#1E1B4B' }}>
                  {stats?.eventsCreatedThisMonth || 0} / {stats?.eventsLimit || 5}
                </div>
              </div>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: '#E5E7EB',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(
                  ((stats?.eventsCreatedThisMonth || 0) / (stats?.eventsLimit === 'illimité' ? 100 : stats?.eventsLimit || 5)) * 100,
                  100
                )}%`,
                height: '100%',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                transition: 'width 0.5s'
              }} />
            </div>
            {stats?.remainingEvents !== 'illimité' && (
              <p style={{
                marginTop: '12px',
                fontSize: '14px',
                color: '#6B7280'
              }}>
                Encore {stats?.remainingEvents || 0} événement{(stats?.remainingEvents || 0) > 1 ? 's' : ''} disponible{(stats?.remainingEvents || 0) > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Card Upgrade CTA */}
          {stats?.plan === 'gratuit' && (
            <div style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.3s'
            }}
            onClick={() => navigate('/pricing')}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚀</div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                Passez en Pro !
              </h3>
              <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '16px' }}>
                Événements illimités, export CSV, personnalisation et plus
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '700'
              }}>
                Découvrir les offres
                <ArrowRight size={18} />
              </div>
            </div>
          )}

        </div>

        {/* Section Personnalisation */}
        <div style={{ marginBottom: '40px' }}>
          <CustomizationPanel
            userData={stats}
            onSave={() => console.log('Saved')}
          />
        </div>

        {/* Section Gestion d'équipe */}
        <div style={{ marginBottom: '40px' }}>
          <TeamManagement
            userData={stats}
            clerkUserId={user?.id}
          />
        </div>

        {/* Nouvelle section : Actions rapides */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: '40px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E1B4B', marginBottom: '24px' }}>
            Actions rapides
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <button
              onClick={() => navigate('/create')}
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.3s',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <Calendar size={24} style={{ marginBottom: '8px' }} />
              <div>Créer un événement</div>
            </button>

            <button
              onClick={() => navigate('/pricing')}
              style={{
                padding: '20px',
                background: '#F3F4F6',
                color: '#1E1B4B',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#E5E7EB';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#F3F4F6';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <Crown size={24} style={{ marginBottom: '8px' }} />
              <div>Voir les offres</div>
            </button>
          </div>
        </div>

        {/* Historique des événements */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E1B4B', margin: 0 }}>
              Mes derniers événements
            </h2>
            {events.length > 0 && (
              <button
                onClick={() => navigate('/create')}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Calendar size={16} />
                Nouvel événement
              </button>
            )}
          </div>

          {loadingEvents ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              <p style={{ color: '#6B7280' }}>Chargement...</p>
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <p style={{ color: '#6B7280', fontSize: '16px', marginBottom: '24px' }}>
                Vous n'avez pas encore créé d'événement
              </p>
              <button
                onClick={() => navigate('/create')}
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Créer mon premier événement
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {events.map((event, index) => {
                const status = event.status || 'draft';
                const statusConfig = {
                  draft: { label: 'Brouillon', color: '#6B7280', bg: '#F3F4F6' },
                  active: { label: 'Actif', color: '#10B981', bg: '#D1FAE5' },
                  completed: { label: 'Complété', color: '#8B5CF6', bg: '#EDE9FE' }
                };
                const config = statusConfig[status] || statusConfig.draft;

                return (
                  <div
                    key={event.id || index}
                    style={{
                      padding: '20px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      cursor: event.eventId ? 'pointer' : 'default',
                      transition: 'all 0.3s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}
                    onClick={() => {
                      if (event.eventId) {
                        window.open(`/admin?id=${event.eventId}`, '_blank');
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (event.eventId) {
                        e.currentTarget.style.borderColor = '#8B5CF6';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#1E1B4B',
                        marginBottom: '8px'
                      }}>
                        {event.eventName || 'Événement sans titre'}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        color: '#6B7280',
                        fontSize: '14px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={16} />
                          {new Date(event.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={16} />
                          {event.participantsCount || 0} participant{event.participantsCount > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        padding: '6px 16px',
                        background: config.bg,
                        color: config.color,
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {config.label}
                      </div>
                      {event.eventId && <ArrowRight size={20} color="#8B5CF6" />}
                    </div>
                  </div>
                );
              })}

              {events.length >= 5 && (
                <button
                  onClick={() => navigate('/analytics')}
                  style={{
                    padding: '14px',
                    background: 'transparent',
                    border: '2px dashed #E5E7EB',
                    borderRadius: '12px',
                    color: '#8B5CF6',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#8B5CF6';
                    e.target.style.background = '#F5F3FF';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#E5E7EB';
                    e.target.style.background = 'transparent';
                  }}
                >
                  Voir tous mes événements →
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
