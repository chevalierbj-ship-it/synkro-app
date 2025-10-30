import React, { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

const ThemeSelector = ({ onThemeChange }) => {
  const themes = [
    {
      id: 'purple-pink',
      name: 'Violet-Rose',
      primary: 'from-purple-600 to-pink-500',
      bgLight: 'from-purple-50 to-pink-50',
      border: 'border-purple-200',
      text: 'text-purple-600',
      button: 'from-purple-600 to-pink-600',
      emoji: '💜'
    },
    {
      id: 'blue-cyan',
      name: 'Bleu-Cyan',
      primary: 'from-blue-600 to-cyan-500',
      bgLight: 'from-blue-50 to-cyan-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      button: 'from-blue-600 to-cyan-600',
      emoji: '💙'
    },
    {
      id: 'green-emerald',
      name: 'Vert-Émeraude',
      primary: 'from-green-600 to-emerald-500',
      bgLight: 'from-green-50 to-emerald-50',
      border: 'border-green-200',
      text: 'text-green-600',
      button: 'from-green-600 to-emerald-600',
      emoji: '💚'
    },
    {
      id: 'orange-red',
      name: 'Orange-Rouge',
      primary: 'from-orange-600 to-red-500',
      bgLight: 'from-orange-50 to-red-50',
      border: 'border-orange-200',
      text: 'text-orange-600',
      button: 'from-orange-600 to-red-600',
      emoji: '🧡'
    },
    {
      id: 'indigo-purple',
      name: 'Indigo-Violet',
      primary: 'from-indigo-600 to-purple-500',
      bgLight: 'from-indigo-50 to-purple-50',
      border: 'border-indigo-200',
      text: 'text-indigo-600',
      button: 'from-indigo-600 to-purple-600',
      emoji: '💙'
    },
    {
      id: 'pink-rose',
      name: 'Rose-Fuchsia',
      primary: 'from-pink-600 to-rose-500',
      bgLight: 'from-pink-50 to-rose-50',
      border: 'border-pink-200',
      text: 'text-pink-600',
      button: 'from-pink-600 to-rose-600',
      emoji: '💗'
    }
  ];

  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem('synkro-theme') || 'purple-pink';
  });

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    localStorage.setItem('synkro-theme', themeId);
    const theme = themes.find(t => t.id === themeId);
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };

  useEffect(() => {
    // Charger le thème au démarrage
    const savedTheme = localStorage.getItem('synkro-theme') || 'purple-pink';
    const theme = themes.find(t => t.id === savedTheme);
    if (onThemeChange && theme) {
      onThemeChange(theme);
    }
  }, []);

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-gray-700" />
        <h3 className="font-bold text-gray-900">Thème de couleur</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleThemeSelect(theme.id)}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              selectedTheme === theme.id
                ? 'border-gray-900 scale-105 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:scale-102'
            }`}
          >
            {/* Preview gradient */}
            <div className={`h-12 rounded-lg bg-gradient-to-r ${theme.primary} mb-2`} />
            
            {/* Theme name */}
            <p className="text-xs font-semibold text-gray-700 text-center">
              {theme.emoji} {theme.name}
            </p>

            {/* Check icon if selected */}
            {selectedTheme === theme.id && (
              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-lg">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        Le thème sera appliqué à toute l'application
      </p>
    </div>
  );
};

export default ThemeSelector;
