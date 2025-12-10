import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, TrendingUp, Sparkles, ArrowRight, Crown, Mail, MoreVertical, ExternalLink, Copy, Trash2, Edit, Link2, Check } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import CustomizationPanel from '../components/CustomizationPanel';
import TeamManagement from '../components/TeamManagement';
import SEOHead from '../components/SEOHead';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isSignedIn, user, isLoaded } = useUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [copiedEventId, setCopiedEventId] = useState(null);

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
      const response = await fetch(`/api/user?action=stats&email=${encodeURIComponent(email)}`);
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

      const response = await fetch(`/api/event-utils?action=list&email=${encodeURIComponent(email)}`);
      const data = await response.json();

      console.log('📊 API Response:', data);
      console.log('📊 Total events count:', data.count);

      if (data.success && data.events) {
        console.log('✅ Events loaded:', data.events.length);
        // Debug: Log all events with their IDs
        data.events.forEach((evt, i) => {
          console.log(`  Event ${i + 1}:`, evt.eventName, '- ID:', evt.eventId, '- Status:', evt.status);
        });
        setEvents(data.events); // Show all events from API (already limited to 10)
      } else {
        console.warn('⚠️ No events found or API error:', data);
        setEvents([]);
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Copy event link to clipboard
  const copyEventLink = async (eventId, e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/participant?id=${eventId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedEventId(eventId);
      setTimeout(() => setCopiedEventId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
    setOpenMenuId(null);
  };

  // Handle event click - navigate to admin
  const handleEventClick = (event) => {
    if (event.eventId) {
      navigate(`/admin?id=${event.eventId}`);
    } else {
      console.warn('⚠️ Event has no eventId:', event);
      // Fallback: try to navigate with the record ID
      if (event.id) {
        navigate(`/admin?id=${event.id}`);
      }
    }
  };

  // Get status config with emoji
  const getStatusConfig = (status) => {
    const configs = {
      draft: {
        label: t('dashboard.status.draft'),
        emoji: '🟡',
        color: '#F59E0B',
        bg: '#FEF3C7',
        description: t('dashboard.status.draftDesc')
      },
      active: {
        label: t('dashboard.status.active'),
        emoji: '🔵',
        color: '#3B82F6',
        bg: '#DBEAFE',
        description: t('dashboard.status.activeDesc')
      },
      completed: {
        label: t('dashboard.status.completed'),
        emoji: '✅',
        color: '#10B981',
        bg: '#D1FAE5',
        description: t('dashboard.status.completedDesc')
      },
      cancelled: {
        label: t('dashboard.status.cancelled'),
        emoji: '❌',
        color: '#EF4444',
        bg: '#FEE2E2',
        description: t('dashboard.status.cancelledDesc')
      }
    };
    return configs[status] || configs.draft;
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
            {t('dashboard.loading')}
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
      <SEOHead
        title={t('dashboard.seo.title')}
        description={t('dashboard.seo.description')}
        type="website"
        keywords={['tableau de bord', 'gestion événements', 'statistiques', 'analytics', 'organisation']}
      />

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
              {t('dashboard.title')}
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
              ← {t('dashboard.backHome')}
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
                <div style={{ fontSize: '14px', color: '#6B7280' }}>{t('dashboard.plan.label')}</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1E1B4B',
                  textTransform: 'capitalize'
                }}>
                  {stats?.plan ? t(`dashboard.plan.${stats.plan === 'gratuit' ? 'free' : stats.plan}`) : t('dashboard.plan.free')}
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
                {t('dashboard.plan.upgrade')}
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
                <div style={{ fontSize: '14px', color: '#6B7280' }}>{t('dashboard.events.thisMonth')}</div>
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
                {t('dashboard.events.remaining', { count: stats?.remainingEvents || 0 })}
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
                {t('dashboard.promo.title')}
              </h3>
              <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '16px' }}>
                {t('dashboard.promo.description')}
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '700'
              }}>
                {t('dashboard.promo.cta')}
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
            {t('dashboard.quickActions.title')}
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
              <div>{t('dashboard.quickActions.createEvent')}</div>
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
              <div>{t('dashboard.quickActions.viewOffers')}</div>
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
              {t('dashboard.recentEvents.title')}
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
                {t('dashboard.recentEvents.newEvent')}
              </button>
            )}
          </div>

          {loadingEvents ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              <p style={{ color: '#6B7280' }}>{t('dashboard.recentEvents.loading')}</p>
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <p style={{ color: '#6B7280', fontSize: '16px', marginBottom: '24px' }}>
                {t('dashboard.recentEvents.noEvents')}
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
                {t('dashboard.recentEvents.createFirst')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {events.map((event, index) => {
                const status = event.status || 'draft';
                const config = getStatusConfig(status);
                const participantsCount = event.participantsCount || 0;
                const expectedParticipants = event.expectedParticipants || 10;
                const progressPercent = Math.min((participantsCount / expectedParticipants) * 100, 100);

                return (
                  <div
                    key={event.id || index}
                    style={{
                      padding: '20px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      position: 'relative',
                      background: 'white'
                    }}
                    onClick={() => handleEventClick(event)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8B5CF6';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Header: Title + Status + Menu */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                      gap: '12px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '4px'
                        }}>
                          <span style={{ fontSize: '20px' }}>📅</span>
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#1E1B4B',
                            margin: 0
                          }}>
                            {event.eventName || t('dashboard.recentEvents.untitled')}
                          </h3>
                        </div>
                      </div>

                      {/* Status badge */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          padding: '6px 14px',
                          background: config.bg,
                          color: config.color,
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span>{config.emoji}</span>
                          {config.label}
                        </div>

                        {/* Action menu button */}
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === event.id ? null : event.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#6B7280',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#F3F4F6';
                              e.currentTarget.style.color = '#1E1B4B';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'none';
                              e.currentTarget.style.color = '#6B7280';
                            }}
                          >
                            <MoreVertical size={18} />
                          </button>

                          {/* Dropdown menu */}
                          {openMenuId === event.id && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              marginTop: '4px',
                              background: 'white',
                              borderRadius: '12px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              border: '1px solid #E5E7EB',
                              zIndex: 100,
                              minWidth: '180px',
                              overflow: 'hidden'
                            }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(event);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  fontSize: '14px',
                                  color: '#1E1B4B',
                                  textAlign: 'left'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#F5F3FF'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                              >
                                <ExternalLink size={16} color="#8B5CF6" />
                                {t('dashboard.actions.viewDetails')}
                              </button>
                              {event.eventId && (
                                <button
                                  onClick={(e) => copyEventLink(event.eventId, e)}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontSize: '14px',
                                    color: '#1E1B4B',
                                    textAlign: 'left'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#F5F3FF'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                >
                                  {copiedEventId === event.eventId ? (
                                    <>
                                      <Check size={16} color="#10B981" />
                                      {t('dashboard.actions.copied')}
                                    </>
                                  ) : (
                                    <>
                                      <Link2 size={16} color="#8B5CF6" />
                                      {t('dashboard.actions.copyLink')}
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Info row: Date + Participants */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      color: '#6B7280',
                      fontSize: '14px',
                      marginBottom: '16px',
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
                        <span style={{ fontWeight: '600', color: '#8B5CF6' }}>{participantsCount}</span>
                        {' '}{t('dashboard.recentEvents.responded')}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {status === 'active' && (
                      <div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '6px'
                        }}>
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>
                            {t('dashboard.recentEvents.progress')}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#8B5CF6' }}>
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: '#E5E7EB',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${progressPercent}%`,
                            height: '100%',
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                            borderRadius: '3px',
                            transition: 'width 0.5s'
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Click indicator */}
                    <div style={{
                      position: 'absolute',
                      right: '20px',
                      bottom: '20px',
                      opacity: 0.5
                    }}>
                      <ArrowRight size={20} color="#8B5CF6" />
                    </div>
                  </div>
                );
              })}

              {events.length >= 10 && (
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
                  {t('dashboard.recentEvents.viewAll')} →
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
