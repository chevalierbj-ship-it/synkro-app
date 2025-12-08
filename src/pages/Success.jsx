import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, Loader } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

export default function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const planName = searchParams.get('plan') || 'Pro';
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('pending'); // pending, success, error
  const { user } = useUser();

  useEffect(() => {
    // Force synchronization of the plan from Stripe to Airtable
    const syncPlan = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        console.warn('⚠️ No user email available for sync');
        setLoading(false);
        return;
      }

      try {
        const email = user.primaryEmailAddress.emailAddress;
        console.log('🔄 Forcing plan sync for:', email);

        const response = await fetch(`/api/user?action=sync-plan&email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (data.success) {
          console.log('✅ Plan synchronized successfully:', data.data);
          setSyncStatus('success');
        } else {
          console.error('❌ Plan sync failed:', data);
          setSyncStatus('error');
        }
      } catch (error) {
        console.error('❌ Error during plan sync:', error);
        setSyncStatus('error');
      } finally {
        setLoading(false);
      }
    };

    // Wait for user to load, then sync
    if (user) {
      syncPlan();
    } else {
      // Fallback: just show success page after timeout
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  }, [user]);

  // Define features for each plan
  const planFeatures = {
    'Pro': [
      '15 événements par mois',
      '50 participants max',
      'Sans branding Synkro',
      'Export CSV/Excel',
      'Support prioritaire',
      'Personnalisation avancée'
    ],
    'Entreprise': [
      'Événements illimités',
      'Participants illimités',
      'Multi-utilisateurs (3 comptes)',
      'Sans branding Synkro',
      'Analytics avancées',
      'Support premium'
    ]
  };

  const features = planFeatures[planName] || planFeatures['Pro'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Confirmation de votre abonnement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mx-auto flex items-center justify-center animate-bounce">
              <Check className="w-12 h-12 text-white stroke-[3]" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🎉 Bienvenue dans Synkro {planName} !
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-8">
            Votre abonnement a été activé avec succès
          </p>

          {/* Features unlocked */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Fonctionnalités débloquées
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Email confirmation notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-800">
              📧 Un email de confirmation a été envoyé à votre adresse email avec tous les détails de votre abonnement.
            </p>
          </div>

          {/* Session ID (for debugging) */}
          {sessionId && (
            <p className="text-xs text-gray-400 mb-6">
              ID de session : {sessionId.substring(0, 20)}...
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/organizer')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
            >
              Créer mon premier événement
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all"
            >
              Voir mon tableau de bord
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Une question ? Notre équipe support est là pour vous aider.
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
