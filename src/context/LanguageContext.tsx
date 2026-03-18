import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

type Language = 'en' | 'hi' | 'es' | 'fr' | 'de';

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: Translations = {
  welcome: {
    en: 'Welcome to VIDYASETU',
    hi: 'विद्यासेतु में आपका स्वागत है',
    es: 'Bienvenido a VIDYASETU',
    fr: 'Bienvenue sur VIDYASETU',
    de: 'Willkommen bei VIDYASETU'
  },
  tagline: {
    en: 'If you are here, you are in the right place',
    hi: 'यदि आप यहाँ हैं, तो आप सही जगह पर हैं',
    es: 'Si estás aquí, estás en el lugar correcto',
    fr: 'Si vous êtes ici, vous êtes au bon endroit',
    de: 'Wenn Sie hier sind, sind Sie am richtigen Ort'
  },
  student: { en: 'Student', hi: 'छात्र', es: 'Estudiante', fr: 'Étudiant', de: 'Student' },
  teacher: { en: 'Teacher', hi: 'शिक्षक', es: 'Profesor', fr: 'Enseignant', de: 'Lehrer' },
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड', es: 'Tablero', fr: 'Tableau de bord', de: 'Dashboard' },
  workspace: { en: 'Workspace', hi: 'कार्यक्षेत्र', es: 'Espacio de trabajo', fr: 'Espace de travail', de: 'Arbeitsbereich' },
  quizArena: { en: 'Quiz Arena', hi: 'क्विज़ एरिना', es: 'Arena de Quiz', fr: 'Arène de Quiz', de: 'Quiz-Arena' },
  reels: { en: 'Reels', hi: 'रील्स', es: 'Reels', fr: 'Reels', de: 'Reels' },
  notes: { en: 'Notes', hi: 'नोट्स', es: 'Notas', fr: 'Notes', de: 'Notizen' },
  aiTutor: { en: 'AI Tutor', hi: 'AI ट्यूटर', es: 'Tutor de IA', fr: 'Tuteur IA', de: 'KI-Tutor' },
  dailyPlanner: { en: 'Daily Planner', hi: 'दैनिक योजनाकार', es: 'Planificador Diario', fr: 'Planificateur Quotidien', de: 'Tagesplaner' },
  aiRoadmap: { en: 'AI Roadmap', hi: 'AI रोडमैप', es: 'Hoja de Ruta de IA', fr: 'Feuille de route IA', de: 'KI-Roadmap' },
  learningDNA: { en: 'Learning DNA', hi: 'लर्निंग डीएनए', es: 'ADN de Aprendizaje', fr: 'ADN d\'apprentissage', de: 'Lern-DNA' },
  studyTimer: { en: 'Study Timer', hi: 'स्टडी टाइमर', es: 'Temporizador de Estudio', fr: 'Minuteur d\'étude', de: 'Studien-Timer' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { profile, updateProfile } = useAuth();
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (profile?.language) {
      setLanguageState(profile.language as Language);
    }
  }, [profile]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    updateProfile({ language: lang });
  };

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
