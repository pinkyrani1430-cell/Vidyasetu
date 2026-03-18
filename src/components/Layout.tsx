import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  Film, 
  StickyNote, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Coins,
  Zap,
  Mic,
  Clock,
  Play,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudyTimer } from '../context/StudyTimerContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { profile, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { isRunning, elapsedTime, stopTimer } = useStudyTimer();

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')} : ${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { id: 'workspace', icon: BookOpen, label: t('workspace') },
    { id: 'quiz', icon: Trophy, label: t('quizArena') },
    { id: 'reels', icon: Film, label: t('reels') },
    { id: 'notes', icon: StickyNote, label: t('notes') },
  ];

  const startVoiceGuide = () => {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = language;
    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      if (command.includes('quiz')) setActiveTab('quiz');
      if (command.includes('workspace')) setActiveTab('workspace');
      if (command.includes('dashboard')) setActiveTab('dashboard');
      if (command.includes('reels')) setActiveTab('reels');
    };
    recognition.start();
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-[#FF6B6B] selection:text-white">
      {/* Voice Guide Button */}
      <button 
        onClick={startVoiceGuide}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#FF6B6B] text-white rounded-full shadow-2xl z-50 flex items-center justify-center hover:scale-110 transition-transform group"
      >
        <Mic size={24} />
        <div className="absolute right-20 bg-white text-[#1A1A1A] px-4 py-2 rounded-xl border border-[#E5E5E5] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-bold text-sm">
          Try saying "Open Quiz"
        </div>
      </button>
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="fixed left-0 top-0 h-full bg-white border-r border-[#E5E5E5] z-50 flex flex-col"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-black tracking-tighter text-[#FF6B6B]"
            >
              VIDYASETU
            </motion.h1>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-[#F5F5F5] rounded-lg">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200",
                activeTab === item.id 
                  ? "bg-[#FF6B6B] text-white shadow-lg shadow-[#FF6B6B]/20" 
                  : "hover:bg-[#F5F5F5] text-[#4A4A4A]"
              )}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E5E5E5]">
          {isSidebarOpen && (
            <div className="mb-4 p-3 bg-[#FFF5F5] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins size={18} className="text-[#FF6B6B]" />
                <span className="font-bold text-[#FF6B6B]">{profile?.coins || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-[#FFD93D]" />
                <span className="font-bold text-[#FFD93D]">Lvl {profile?.level || 1}</span>
              </div>
            </div>
          )}
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#FFF5F5] text-[#FF6B6B] transition-all"
          >
            <LogOut size={22} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        isSidebarOpen ? "ml-[260px]" : "ml-[80px]"
      )}>
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#E5E5E5] sticky top-0 z-40 px-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          {/* Persistent Study Timer */}
          <AnimatePresence>
            {isRunning && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-4 bg-[#1A1A1A] text-white px-6 py-2.5 rounded-2xl shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#FF6B6B] rounded-full animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest opacity-60">Study Session</span>
                  <span className="font-mono font-black text-lg">{formatElapsedTime(elapsedTime)}</span>
                </div>
                <button 
                  onClick={stopTimer}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-[#FF6B6B]"
                  title="Stop Study Timer"
                >
                  <Square size={18} fill="currentColor" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-6">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-[#F5F5F5] border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-[#FF6B6B]"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{profile?.name}</p>
                <p className="text-xs text-[#8E8E8E] capitalize">{profile?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FF6B6B] flex items-center justify-center text-white font-bold">
                {profile?.name?.[0]}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
