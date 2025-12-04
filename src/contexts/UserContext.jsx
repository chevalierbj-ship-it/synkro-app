import React, { createContext, useState, useContext } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    plan: 'gratuit', // 'gratuit' | 'pro' | 'entreprise'
    eventsThisMonth: 3, // Nombre d'événements créés ce mois-ci
    eventsLimit: 5, // Limite pour le plan gratuit
    participantsLimit: 20, // Limite pour le plan gratuit
    datesLimit: 3, // Limite de dates proposées pour le plan gratuit
    canRemoveBranding: false,
    canExportData: false,
    canCustomize: false, // Personnalisation couleurs/logo
  });

  // Fonction pour vérifier si une limite est atteinte
  const isLimitReached = (limitType) => {
    switch (limitType) {
      case 'events':
        return user.eventsThisMonth >= user.eventsLimit;
      case 'participants':
        return false; // Géré dynamiquement dans le composant
      case 'dates':
        return false; // Géré dynamiquement dans le composant
      default:
        return false;
    }
  };

  // Fonction pour incrémenter le compteur d'événements
  const incrementEvents = () => {
    setUser((prev) => ({
      ...prev,
      eventsThisMonth: prev.eventsThisMonth + 1,
    }));
  };

  return (
    <UserContext.Provider value={{ user, setUser, isLimitReached, incrementEvents }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser doit être utilisé à l\'intérieur d\'un UserProvider');
  }
  return context;
};
