import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';

export default function Cancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Cancel Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto flex items-center justify-center">
              <XCircle className="w-12 h-12 text-white stroke-[2.5]" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Paiement annulé
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-8">
            Vous avez annulé le processus de paiement. Aucun montant n'a été débité.
          </p>

          {/* Info Box */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8 text-left">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Vous avez des questions sur nos offres ?
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Nous sommes là pour vous aider à choisir le plan qui correspond le mieux à vos besoins.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Période d'essai gratuite de 14 jours disponible</li>
                  <li>• Annulation possible à tout moment</li>
                  <li>• Support dédié pour vous accompagner</li>
                </ul>
              </div>
            </div>
          </div>

          {/* What you can do */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">
              Que faire maintenant ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl mb-2">💬</div>
                <h4 className="font-semibold text-gray-900 mb-1">Contactez-nous</h4>
                <p className="text-gray-600">
                  Posez vos questions à notre équipe
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl mb-2">📋</div>
                <h4 className="font-semibold text-gray-900 mb-1">Voir les plans</h4>
                <p className="text-gray-600">
                  Comparez nos différentes offres
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl mb-2">🎉</div>
                <h4 className="font-semibold text-gray-900 mb-1">Plan gratuit</h4>
                <p className="text-gray-600">
                  Commencez sans engagement
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/pricing')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour aux tarifs
            </button>
            <button
              onClick={() => navigate('/organizer')}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all"
            >
              Essayer gratuitement
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Besoin d'aide pour choisir ? Contactez notre équipe support.
            <br />
            <a href="mailto:support@synkro.app" className="text-purple-600 hover:underline font-medium">
              support@synkro.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
