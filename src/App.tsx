import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TeacherDashboard from './components/TeacherDashboard';
import Workspace from './components/Workspace';
import QuizArena from './components/QuizArena';
import Reels from './components/Reels';
import Notes from './components/Notes';
import Auth from './components/Auth';

import { StudyTimerProvider } from './context/StudyTimerContext';

import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="w-16 h-16 border-4 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return profile?.role === 'teacher' ? <TeacherDashboard /> : <Dashboard />;
      case 'workspace':
        return <Workspace />;
      case 'quiz':
        return <QuizArena />;
      case 'reels':
        return <Reels />;
      case 'notes':
        return <Notes />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <StudyTimerProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </StudyTimerProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

