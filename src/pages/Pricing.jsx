import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(null);
  const { user } = useUser();
  const navigate = useNavigate();

  // Load EcoIndex badge script
  useEffect(() => {
    if (!document.querySelector('script[src*="ecoindex-badge"]')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/gh/cnumr/ecoindex_badge@3/assets/js/ecoindex-badge.js';
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  // Handle subscription
  const handleSubscribe = async (plan) => {
    if (plan.price.monthly === 0) {
      window.location.href = '/organizer';
      return;
    }

    setLoading(plan.name);

    try {
      const priceId = isAnnual
        ? (plan.name === 'Pro' ? import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY : import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_YEARLY)
        : (plan.name === 'Pro' ? import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY : import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY);

      if (!priceId) {
        alert('Stripe n\'est pas encore configuré. Veuillez configurer les Price IDs dans .env');
        setLoading(null);
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planName: plan.name,
          planType: isAnnual ? 'yearly' : 'monthly',
          userEmail: user?.primaryEmailAddress?.emailAddress || '',
          userId: user?.id || '',
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
      setLoading(null);
    }
  };

  const plans = [
    {
      name: "Gratuit",
      subtitle: "Pour vos événements personnels",
      icon: "🎉",
      price: { monthly: 0, annual: 0 },
      description: "Parfait pour organiser avec famille et amis",
      features: [
        { text: "5 événements par mois", included: true },
        { text: "20 participants max par événement", included: true },
        { text: "Notifications par email", included: true },
        { text: "Partage WhatsApp, SMS, email", included: true },
        { text: "Branding Synkro", included: true, note: "(\"Créé avec Synkro\")" },
        { text: "Export des données", included: false },
        { text: "Sans branding", included: false },
        { text: "Support prioritaire", included: false }
      ],
      cta: "Commencer gratuitement",
      buttonStyle: "outline"
    },
    {
      name: "Pro",
      subtitle: "Pour les professionnels",
      icon: "💼",
      price: { monthly: 19, annual: 15 },
      description: "Idéal pour clubs, associations, PME",
      features: [
        { text: "15 événements par mois", included: true },
        { text: "50 participants max par événement", included: true },
        { text: "Notifications par email", included: true },
        { text: "Partage WhatsApp, SMS, email", included: true },
        { text: "Sans branding Synkro", included: true, highlight: true },
        { text: "Export données CSV/Excel", included: true, highlight: true },
        { text: "Support prioritaire", included: true, highlight: true },
        { text: "Personnalisation avancée", included: true }
      ],
      cta: "Essayer Pro",
      buttonStyle: "primary",
      highlighted: true,
      badge: "⭐ Populaire"
    },
    {
      name: "Entreprise",
      subtitle: "Pour les organisations",
      icon: "🏢",
      price: { monthly: 49, annual: 40 },
      description: "Solution complète pour équipes",
      features: [
        { text: "Événements illimités", included: true, highlight: true },
        { text: "Participants illimités", included: true, highlight: true },
        { text: "Notifications par email", included: true },
        { text: "Partage WhatsApp, SMS, email", included: true },
        { text: "Sans branding Synkro", included: true },
        { text: "Export données CSV/Excel", included: true },
        { text: "Support prioritaire", included: true },
        { text: "Multi-utilisateurs (3 comptes)", included: true, highlight: true },
        { text: "Analytics avancées", included: true, highlight: true }
      ],
      cta: "Passer à Entreprise",
      buttonStyle: "secondary"
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F3FF 0%, #FFFFFF 50%, #FDF2F8 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <SEOHead
        title="Tarifs Synkro - Plans Gratuit, Pro et Entreprise"
        description="Découvrez nos tarifs transparents. Plan gratuit pour débuter, Pro pour plus d'événements, Entreprise pour les équipes. Essayez gratuitement dès maintenant !"
        type="website"
        keywords={['tarifs', 'prix', 'abonnement', 'plan pro', 'plan gratuit', 'entreprise', 'pricing']}
      />

      {/* Header */}
      <header style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            fontWeight: '800',
            color: '#8B5CF6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ⚡ Synkro
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            background: 'transparent',
            border: '2px solid #8B5CF6',
            borderRadius: '12px',
            color: '#8B5CF6',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#8B5CF6';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#8B5CF6';
          }}
        >
          ← Retour à l'accueil
        </button>
      </header>

      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        padding: '60px 20px 40px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 48px)',
          fontWeight: '800',
          color: '#1E1B4B',
          marginBottom: '16px',
          lineHeight: '1.2'
        }}>
          Choisissez votre plan
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#6B7280',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          Plus de 47 messages pour organiser un simple dîner.<br />
          Synkro simplifie la coordination de vos événements.
        </p>

        {/* Toggle Mensuel/Annuel */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '48px'
        }}>
          <span style={{
            fontSize: '16px',
            fontWeight: '600',
            color: !isAnnual ? '#8B5CF6' : '#9CA3AF',
            transition: 'color 0.3s ease'
          }}>
            Mensuel
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            style={{
              position: 'relative',
              width: '56px',
              height: '32px',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              background: isAnnual
                ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                : '#D1D5DB',
              transition: 'background 0.3s ease'
            }}
          >
            <span style={{
              position: 'absolute',
              top: '4px',
              left: isAnnual ? '28px' : '4px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'left 0.3s ease'
            }} />
          </button>
          <span style={{
            fontSize: '16px',
            fontWeight: '600',
            color: isAnnual ? '#8B5CF6' : '#9CA3AF',
            transition: 'color 0.3s ease'
          }}>
            Annuel
          </span>
          {isAnnual && (
            <span style={{
              marginLeft: '8px',
              padding: '4px 12px',
              background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
              color: '#059669',
              fontSize: '13px',
              fontWeight: '700',
              borderRadius: '20px'
            }}>
              -20%
            </span>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px 60px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {plans.map((plan, index) => (
          <div
            key={index}
            style={{
              position: 'relative',
              marginTop: plan.highlighted ? '-16px' : '0'
            }}
          >
            {/* Glow effect for popular plan */}
            {plan.highlighted && (
              <div style={{
                position: 'absolute',
                inset: '-4px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                borderRadius: '28px',
                filter: 'blur(20px)',
                opacity: '0.3',
                zIndex: '0'
              }} />
            )}

            {/* Card */}
            <div style={{
              position: 'relative',
              background: plan.highlighted
                ? 'rgba(255, 255, 255, 0.95)'
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: plan.highlighted
                ? '0 25px 50px rgba(139, 92, 246, 0.25)'
                : '0 10px 30px rgba(0, 0, 0, 0.08)',
              border: plan.highlighted
                ? '2px solid #8B5CF6'
                : '1px solid rgba(255, 255, 255, 0.5)',
              transition: 'all 0.3s ease',
              zIndex: '1'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = plan.highlighted
                ? '0 30px 60px rgba(139, 92, 246, 0.35)'
                : '0 20px 40px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = plan.highlighted
                ? '0 25px 50px rgba(139, 92, 246, 0.25)'
                : '0 10px 30px rgba(0, 0, 0, 0.08)';
            }}
            >
              {/* Badge Populaire */}
              {plan.badge && (
                <div style={{
                  position: 'absolute',
                  top: '-16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '8px 20px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '700',
                  borderRadius: '20px',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                  whiteSpace: 'nowrap'
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Icon */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: plan.highlighted
                  ? 'linear-gradient(135deg, #F5F3FF 0%, #FCE7F3 100%)'
                  : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '32px' }}>{plan.icon}</span>
              </div>

              {/* Name & Subtitle */}
              <h3 style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#1E1B4B',
                marginBottom: '4px'
              }}>
                {plan.name}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '20px'
              }}>
                {plan.subtitle}
              </p>

              {/* Price */}
              <div style={{ marginBottom: '8px' }}>
                <span style={{
                  fontSize: '48px',
                  fontWeight: '800',
                  color: '#1E1B4B'
                }}>
                  {isAnnual ? plan.price.annual : plan.price.monthly}€
                </span>
                {plan.price.monthly > 0 && (
                  <span style={{
                    fontSize: '16px',
                    color: '#6B7280',
                    marginLeft: '4px'
                  }}>
                    /mois
                  </span>
                )}
              </div>
              {isAnnual && plan.price.monthly > 0 && (
                <p style={{
                  fontSize: '13px',
                  color: '#9CA3AF',
                  marginBottom: '8px'
                }}>
                  Soit {plan.price.annual * 12}€/an au lieu de {plan.price.monthly * 12}€
                </p>
              )}
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '24px'
              }}>
                {plan.description}
              </p>

              {/* CTA Button */}
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loading === plan.name}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: loading === plan.name ? 'not-allowed' : 'pointer',
                  marginBottom: '28px',
                  transition: 'all 0.3s ease',
                  opacity: loading === plan.name ? 0.6 : 1,
                  ...(plan.buttonStyle === 'primary' ? {
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)'
                  } : plan.buttonStyle === 'outline' ? {
                    background: 'transparent',
                    color: '#8B5CF6',
                    border: '2px solid #8B5CF6'
                  } : {
                    background: 'transparent',
                    color: '#374151',
                    border: '2px solid #D1D5DB'
                  })
                }}
                onMouseEnter={(e) => {
                  if (loading !== plan.name) {
                    if (plan.buttonStyle === 'primary') {
                      e.currentTarget.style.boxShadow = '0 12px 28px rgba(139, 92, 246, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    } else if (plan.buttonStyle === 'outline') {
                      e.currentTarget.style.background = '#F5F3FF';
                    } else {
                      e.currentTarget.style.borderColor = '#8B5CF6';
                      e.currentTarget.style.color = '#8B5CF6';
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  if (loading !== plan.name) {
                    if (plan.buttonStyle === 'primary') {
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    } else if (plan.buttonStyle === 'outline') {
                      e.currentTarget.style.background = 'transparent';
                    } else {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.color = '#374151';
                    }
                  }
                }}
              >
                {loading === plan.name ? '⏳ Redirection...' : plan.cta}
              </button>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {plan.features.map((feature, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    {feature.included ? (
                      <Check
                        size={20}
                        style={{
                          flexShrink: 0,
                          marginTop: '2px',
                          color: feature.highlight ? '#8B5CF6' : '#10B981'
                        }}
                      />
                    ) : (
                      <X
                        size={20}
                        style={{
                          flexShrink: 0,
                          marginTop: '2px',
                          color: '#D1D5DB'
                        }}
                      />
                    )}
                    <span style={{
                      fontSize: '14px',
                      color: feature.included ? '#374151' : '#9CA3AF',
                      fontWeight: feature.highlight ? '600' : '400'
                    }}>
                      {feature.text}
                      {feature.note && (
                        <span style={{
                          color: '#9CA3AF',
                          fontSize: '12px',
                          marginLeft: '4px'
                        }}>
                          {feature.note}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Section */}
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        borderTop: '1px solid rgba(139, 92, 246, 0.1)'
      }}>
        <p style={{
          fontSize: '14px',
          color: '#9CA3AF',
          marginBottom: '16px'
        }}>
          Utilisé et approuvé par
        </p>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '32px',
          opacity: '0.6'
        }}>
          <span style={{ color: '#6B7280', fontWeight: '600' }}>Associations sportives</span>
          <span style={{ color: '#6B7280', fontWeight: '600' }}>Clubs d'affaires</span>
          <span style={{ color: '#6B7280', fontWeight: '600' }}>PME françaises</span>
          <span style={{ color: '#6B7280', fontWeight: '600' }}>Groupes d'amis</span>
        </div>
      </div>

      {/* Stats Section */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '40px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '24px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{
            fontSize: '40px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>500+</div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>Événements organisés</div>
        </div>
        <div>
          <div style={{
            fontSize: '40px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>89%</div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>Trouvent une date en 24h</div>
        </div>
        <div>
          <div style={{
            fontSize: '40px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>47</div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>Messages évités en moyenne</div>
        </div>
        <div>
          <div style={{
            fontSize: '40px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>4.8/5</div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>Note de satisfaction</div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 20px'
      }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#1E1B4B',
          textAlign: 'center',
          marginBottom: '12px'
        }}>
          Ils ont adopté Synkro
        </h2>
        <p style={{
          textAlign: 'center',
          color: '#6B7280',
          marginBottom: '48px',
          maxWidth: '600px',
          margin: '0 auto 48px'
        }}>
          Découvrez comment Synkro simplifie le quotidien d'organisateurs comme vous
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {/* Testimonial 1 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>🏀</div>
              <div style={{ marginLeft: '12px' }}>
                <h4 style={{ fontWeight: '700', color: '#1E1B4B', margin: 0 }}>Sophie Martinez</h4>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Présidente, Club Basket Jeunes</p>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              {[...Array(5)].map((_, i) => <span key={i}>⭐</span>)}
            </div>
            <p style={{ color: '#4B5563', fontStyle: 'italic', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              "Avant Synkro, organiser nos entraînements était un cauchemar de messages WhatsApp.
              Maintenant, je crée l'événement en 2 minutes et les parents votent directement."
            </p>
          </div>

          {/* Testimonial 2 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>💼</div>
              <div style={{ marginLeft: '12px' }}>
                <h4 style={{ fontWeight: '700', color: '#1E1B4B', margin: 0 }}>Thomas Dupont</h4>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>CEO, TechStart Studio</p>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              {[...Array(5)].map((_, i) => <span key={i}>⭐</span>)}
            </div>
            <p style={{ color: '#4B5563', fontStyle: 'italic', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              "Pour nos réunions clients, Synkro fait toute la différence.
              L'export des données nous permet de suivre les disponibilités. Un outil professionnel."
            </p>
          </div>

          {/* Testimonial 3 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>👨‍👩‍👧‍👦</div>
              <div style={{ marginLeft: '12px' }}>
                <h4 style={{ fontWeight: '700', color: '#1E1B4B', margin: 0 }}>Marie & Julien</h4>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Parents de 3 enfants</p>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              {[...Array(5)].map((_, i) => <span key={i}>⭐</span>)}
            </div>
            <p style={{ color: '#4B5563', fontStyle: 'italic', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              "Organiser des sorties avec nos amis et leurs enfants était toujours compliqué.
              Synkro nous a libérés des groupes de discussion interminables !"
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '60px 20px'
      }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#1E1B4B',
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          Questions fréquentes
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            {
              q: "Puis-je changer de plan à tout moment ?",
              a: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement."
            },
            {
              q: "Que se passe-t-il si je dépasse mes limites ?",
              a: "Vous recevrez une notification vous proposant de passer au plan supérieur. Vos événements existants restent accessibles."
            },
            {
              q: "Comment fonctionne la facturation annuelle ?",
              a: "En choisissant l'abonnement annuel, vous payez une fois par an et économisez 20% par rapport au paiement mensuel."
            },
            {
              q: "Y a-t-il une période d'essai ?",
              a: "Le plan Gratuit vous permet de tester Synkro sans engagement. Pour les plans Pro et Entreprise, contactez-nous pour un essai gratuit de 14 jours."
            }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#1E1B4B',
                marginBottom: '8px'
              }}>
                {item.q}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                lineHeight: '1.6',
                margin: 0
              }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Final */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto 60px',
        padding: '0 20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
          borderRadius: '32px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(139, 92, 246, 0.3)'
        }}>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: '800',
            color: 'white',
            marginBottom: '16px'
          }}>
            Prêt à simplifier vos événements ?
          </h2>
          <p style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px',
            lineHeight: '1.6'
          }}>
            Rejoignez des centaines d'organisateurs qui ont dit adieu aux interminables conversations de groupe.
          </p>
          <button
            onClick={() => navigate('/organizer')}
            style={{
              padding: '18px 40px',
              background: 'white',
              color: '#8B5CF6',
              border: 'none',
              borderRadius: '14px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
            }}
          >
            Commencer gratuitement
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        {/* Navigation Links */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginBottom: '20px',
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
              textDecoration: 'underline'
            }}
          >
            Accueil
          </button>
          <button
            onClick={() => navigate('/mentions-legales')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Mentions légales
          </button>
          <button
            onClick={() => navigate('/cgv')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            CGV
          </button>
          <button
            onClick={() => navigate('/confidentialite')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Confidentialité
          </button>
        </div>

        {/* Version */}
        <p style={{
          margin: '0 0 16px 0',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '13px'
        }}>
          ✨ Synkro v2.2
        </p>

        {/* EcoIndex Badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div id="ecoindex-badge" data-theme="light"></div>
        </div>
      </footer>
    </div>
  );
}
