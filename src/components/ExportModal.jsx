import React, { useState } from 'react';
import { X, Download, FileText, Users, Calendar, CheckCircle } from 'lucide-react';

const ExportModal = ({ isOpen, onClose, event }) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Générer le CSV des participants
  const generateParticipantsCSV = () => {
    const headers = ['Nom', 'Email', 'Date de vote'];
    const rows = event.participants.map(p => [
      p.name,
      p.email || 'Non renseigné',
      new Date(p.votedAt).toLocaleString('fr-FR')
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    return csvContent;
  };

  // Générer le CSV des votes par date
  const generateVotesCSV = () => {
    const headers = ['Date proposée', 'Nombre de votes', 'Participants disponibles'];
    const rows = event.dates.map(d => [
      d.label,
      d.votes,
      d.voters ? d.voters.join(', ') : ''
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    return csvContent;
  };

  // Générer le CSV complet (matrice)
  const generateFullCSV = () => {
    if (!event.participants || event.participants.length === 0) {
      return 'Aucune donnée disponible';
    }

    // Headers : Nom, Email + toutes les dates
    const headers = ['Nom', 'Email', ...event.dates.map(d => d.label)];
    
    // Rows : un participant par ligne avec ses disponibilités
    const rows = event.participants.map(participant => {
      const availabilities = event.dates.map(date => {
        return participant.availabilities[date.label] ? 'Disponible' : 'Indisponible';
      });
      
      return [
        participant.name,
        participant.email || 'Non renseigné',
        ...availabilities
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    return csvContent;
  };

  // Télécharger le CSV
  const downloadCSV = (content, filename) => {
    setIsExporting(true);
    
    // Ajouter le BOM pour UTF-8 (pour Excel)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      setIsExporting(false);
    }, 1000);
  };

  // Exporter selon le type choisi
  const handleExport = (type) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const eventName = event.type.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    switch(type) {
      case 'participants':
        downloadCSV(
          generateParticipantsCSV(),
          `synkro_participants_${eventName}_${timestamp}.csv`
        );
        break;
      case 'votes':
        downloadCSV(
          generateVotesCSV(),
          `synkro_votes_${eventName}_${timestamp}.csv`
        );
        break;
      case 'full':
        downloadCSV(
          generateFullCSV(),
          `synkro_complet_${eventName}_${timestamp}.csv`
        );
        break;
      default:
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Exporter les données</h2>
                <p className="text-white/80 text-sm">Télécharge les résultats en CSV</p>
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
        <div className="p-6 space-y-4">
          {/* Stats rapides */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-purple-600" />
                <p className="text-xs font-semibold text-purple-700">Participants</p>
              </div>
              <p className="text-2xl font-bold text-purple-900">{event.participants?.length || 0}</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-semibold text-blue-700">Dates</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{event.dates?.length || 0}</p>
            </div>
          </div>

          {/* Options d'export */}
          <h3 className="font-bold text-gray-900 mb-3">Choisir le type d'export</h3>

          {/* Export participants */}
          <button
            onClick={() => handleExport('participants')}
            disabled={isExporting}
            className="w-full p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 rounded-xl transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Liste des participants</h4>
                  <p className="text-sm text-gray-600">Nom, email, date de vote</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-blue-600" />
            </div>
          </button>

          {/* Export votes par date */}
          <button
            onClick={() => handleExport('votes')}
            disabled={isExporting}
            className="w-full p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-200 rounded-xl transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Votes par date</h4>
                  <p className="text-sm text-gray-600">Résumé des votes pour chaque date</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-purple-600" />
            </div>
          </button>

          {/* Export complet (matrice) */}
          <button
            onClick={() => handleExport('full')}
            disabled={isExporting}
            className="w-full p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-200 rounded-xl transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Export complet (matrice)</h4>
                  <p className="text-sm text-gray-600">Toutes les disponibilités en tableau</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-green-600" />
            </div>
          </button>

          {/* Info CSV */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>📊 Format CSV :</strong> Les fichiers sont compatibles Excel et Google Sheets. Le séparateur utilisé est le point-virgule (;).
            </p>
          </div>

          {/* Status */}
          {isExporting && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 animate-pulse" />
              <p className="text-sm text-green-800 font-medium">
                Téléchargement en cours...
              </p>
            </div>
          )}
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

export default ExportModal;
