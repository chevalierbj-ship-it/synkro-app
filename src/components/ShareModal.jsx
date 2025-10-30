import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Share2, QrCode, Check, Mail, MessageCircle } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, eventLink, eventType }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Copier le lien
  const copyToClipboard = () => {
    navigator.clipboard.writeText(eventLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Partage natif (mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Événement Synkro : ${eventType}`,
          text: `Vote pour notre événement "${eventType}" ! 🗓️`,
          url: eventLink
        });
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      copyToClipboard();
    }
  };

  // Partager par WhatsApp
  const shareWhatsApp = () => {
    const message = encodeURIComponent(`🗓️ Vote pour notre événement "${eventType}" !\n\n${eventLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // Partager par Email
  const shareEmail = () => {
    const subject = encodeURIComponent(`Vote pour : ${eventType}`);
    const body = encodeURIComponent(`Bonjour !\n\nJe t'invite à voter pour notre événement "${eventType}".\n\nClique sur ce lien pour choisir tes disponibilités : ${eventLink}\n\nÀ bientôt ! ✨`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Partager par SMS
  const shareSMS = () => {
    const message = encodeURIComponent(`🗓️ Vote pour "${eventType}" : ${eventLink}`);
    window.location.href = `sms:?body=${message}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-500 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Partage ton événement</h2>
                <p className="text-white/80 text-sm">QR Code et liens de partage</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* QR Code Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">QR Code</h3>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm flex justify-center">
              <QRCodeSVG 
                value={eventLink} 
                size={200}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='70' font-size='70'%3E✨%3C/text%3E%3C/svg%3E",
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>
            
            <p className="text-sm text-gray-600 text-center mt-3">
              Scanne ce code pour accéder directement à l'événement
            </p>
          </div>

          {/* Lien à copier */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lien de l'événement
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={eventLink}
                readOnly
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={copyToClipboard}
                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Lien copié !
              </p>
            )}
          </div>

          {/* Boutons de partage */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Partager via</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Partage natif */}
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                >
                  <Share2 className="w-5 h-5" />
                  Partager
                </button>
              )}

              {/* WhatsApp */}
              <button
                onClick={shareWhatsApp}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>

              {/* Email */}
              <button
                onClick={shareEmail}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all shadow-md"
              >
                <Mail className="w-5 h-5" />
                Email
              </button>

              {/* SMS */}
              <button
                onClick={shareSMS}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition-all shadow-md"
              >
                <MessageCircle className="w-5 h-5" />
                SMS
              </button>
            </div>
          </div>

          {/* Astuce */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>💡 Astuce :</strong> Imprime le QR Code et affiche-le à l'entrée de ton événement pour faciliter les votes !
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 rounded-b-2xl border-t">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
