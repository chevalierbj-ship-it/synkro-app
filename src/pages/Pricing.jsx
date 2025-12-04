import React, { useState } from 'react';
import { Check, X, Zap, Users, BarChart3 } from 'lucide-react';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

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
      highlighted: false
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
      highlighted: true,
      badge: "Populaire"
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
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Plus de 47 messages pour organiser un simple dîner. <br />
            Synkro simplifie la coordination de vos événements.
          </p>

          {/* Toggle Mensuel/Annuel */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-lg font-medium ${!isAnnual ? 'text-blue-600' : 'text-gray-500'}`}>
              Mensuel
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-8 w-16 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg font-medium ${isAnnual ? 'text-blue-600' : 'text-gray-500'}`}>
              Annuel
            </span>
            {isAnnual && (
              <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                🎉 Économisez 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200 transition-all hover:shadow-xl ${
                plan.highlighted ? 'ring-2 ring-blue-600 scale-105 lg:scale-110' : ''
              }`}
            >
              {/* Badge Populaire */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1 text-sm font-semibold text-white shadow-lg">
                    ⭐ {plan.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">{plan.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.subtitle}</p>
              </div>

              {/* Prix */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">
                    {isAnnual ? plan.price.annual : plan.price.monthly}€
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="text-gray-500">/mois</span>
                  )}
                </div>
                {isAnnual && plan.price.monthly > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Soit {plan.price.annual * 12}€/an au lieu de {plan.price.monthly * 12}€
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-3">{plan.description}</p>
              </div>

              {/* CTA Button */}
              <button
                className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-all mb-8 ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>

              {/* Features */}
              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${feature.highlight ? 'text-blue-600' : 'text-green-500'}`} />
                    ) : (
                      <X className="h-5 w-5 flex-shrink-0 text-gray-300 mt-0.5" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'} ${feature.highlight ? 'font-semibold' : ''}`}>
                      {feature.text}
                      {feature.note && <span className="text-gray-400 text-xs ml-1">{feature.note}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Section */}
        <div className="mt-20 text-center">
          <p className="text-sm text-gray-500 mb-4">Utilisé et approuvé par</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
            <div className="text-gray-400 font-semibold">Associations sportives</div>
            <div className="text-gray-400 font-semibold">Clubs d'affaires</div>
            <div className="text-gray-400 font-semibold">PME françaises</div>
            <div className="text-gray-400 font-semibold">Groupes d'amis</div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Ils ont adopté Synkro
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Découvrez comment Synkro simplifie le quotidien d'organisateurs comme vous
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Témoignage 1 - Association */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                  🏀
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Sophie Martinez</h4>
                  <p className="text-sm text-gray-500">Présidente, Club Basket Jeunes</p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-gray-600 italic">
                "Avant Synkro, organiser nos entraînements était un cauchemar de messages WhatsApp. 
                Maintenant, je crée l'événement en 2 minutes et les parents votent directement. 
                Gain de temps immense !"
              </p>
            </div>

            {/* Témoignage 2 - PME */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">
                  💼
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Thomas Dupont</h4>
                  <p className="text-sm text-gray-500">CEO, TechStart Studio</p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-gray-600 italic">
                "Pour nos réunions clients, Synkro fait toute la différence. 
                L'export des données nous permet de suivre les disponibilités. 
                Un outil professionnel qui nous fait gagner en crédibilité."
              </p>
            </div>

            {/* Témoignage 3 - Particulier */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                  👨‍👩‍👧‍👦
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Marie & Julien</h4>
                  <p className="text-sm text-gray-500">Parents de 3 enfants</p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-gray-600 italic">
                "Organiser des sorties avec nos amis et leurs enfants était toujours compliqué. 
                Synkro nous a libérés des groupes de discussion interminables. 
                On l'utilise même pour les anniversaires !"
              </p>
            </div>

            {/* Témoignage 4 - Club d'affaires */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
                  🤝
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Laurent Berger</h4>
                  <p className="text-sm text-gray-500">Président, BNI Provence</p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-gray-600 italic">
                "Nous organisons 2 événements networking par mois avec 40+ participants. 
                Synkro nous permet de trouver LA date qui convient au maximum de membres. 
                C'est devenu indispensable."
              </p>
            </div>

            {/* Témoignage 5 - Association culturelle */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-2xl">
                  🎭
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Isabelle Moreau</h4>
                  <p className="text-sm text-gray-500">Trésorière, Troupe Théâtre Amateur</p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-gray-600 italic">
                "Entre les répétitions, les représentations et les réunions de bureau, 
                on jonglait avec 3 groupes WhatsApp. Synkro a simplifié notre organisation 
                et tout le monde participe davantage !"
              </p>
            </div>

            {/* Témoignage 6 - Entrepreneur loisirs */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-2 border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                  🎪
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Benjamin R.</h4>
                  <p className="text-sm text-gray-500">Gérant, Trampoline Park</p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-gray-600 italic">
                "Pour nos événements corporate et anniversaires de groupe, 
                Synkro nous permet de coordiner facilement les disponibilités. 
                Nos clients adorent la simplicité et nous gagnons un temps précieux."
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-sm text-gray-600">Événements organisés</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">89%</div>
              <div className="text-sm text-gray-600">Trouvent une date en 24h</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">47</div>
              <div className="text-sm text-gray-600">Messages évités en moyenne</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">4.8/5</div>
              <div className="text-sm text-gray-600">Note de satisfaction</div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Puis-je changer de plan à tout moment ?
              </h3>
              <p className="text-gray-600">
                Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Que se passe-t-il si je dépasse mes limites ?
              </h3>
              <p className="text-gray-600">
                Vous recevrez une notification vous proposant de passer au plan supérieur. Vos événements existants restent accessibles.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Comment fonctionne la facturation annuelle ?
              </h3>
              <p className="text-gray-600">
                En choisissant l'abonnement annuel, vous payez une fois par an et économisez 20% par rapport au paiement mensuel.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Y a-t-il une période d'essai ?
              </h3>
              <p className="text-gray-600">
                Le plan Gratuit vous permet de tester Synkro sans engagement. Pour les plans Pro et Entreprise, contactez-nous pour un essai gratuit de 14 jours.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-20 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à simplifier vos événements ?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez des centaines d'organisateurs qui ont dit adieu aux interminables conversations de groupe.
          </p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg">
            Commencer gratuitement
          </button>
        </div>
      </div>
    </div>
  );
}