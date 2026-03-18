import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { firestoreService } from '../services/firestoreService';
import { serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface StudySession {
  uid: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  createdAt: any;
}

interface StudyTimerContextType {
  isRunning: boolean;
  elapsedTime: number;
  startTimer: () => void;
  stopTimer: () => void;
}

const StudyTimerContext = createContext<StudyTimerContextType | undefined>(undefined);

export function StudyTimerProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<any>(null);

  // Load state from localStorage on mount and listen for changes
  useEffect(() => {
    const loadState = () => {
      const savedStartTime = localStorage.getItem('study_timer_start_time');
      const savedIsRunning = localStorage.getItem('study_timer_is_running') === 'true';

      if (savedIsRunning && savedStartTime) {
        setStartTime(parseInt(savedStartTime));
        setIsRunning(true);
      } else {
        setStartTime(null);
        setIsRunning(false);
      }
    };

    loadState();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'study_timer_start_time' || e.key === 'study_timer_is_running') {
        loadState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update elapsed time every second if running
  useEffect(() => {
    if (isRunning && startTime) {
      const updateElapsed = () => {
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      };

      updateElapsed(); // initial call
      timerRef.current = setInterval(updateElapsed, 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsedTime(0);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, startTime]);

  const startTimer = () => {
    const now = Date.now();
    setStartTime(now);
    setIsRunning(true);
    localStorage.setItem('study_timer_start_time', now.toString());
    localStorage.setItem('study_timer_is_running', 'true');
  };

  const stopTimer = async () => {
    if (!startTime) return;

    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);

    // Save to database
    if (profile?.uid) {
      await firestoreService.addDocument('studySessions', {
        uid: profile.uid,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: duration,
        createdAt: serverTimestamp(),
      });
    }

    // Reset state
    setIsRunning(false);
    setStartTime(null);
    setElapsedTime(0);
    localStorage.removeItem('study_timer_start_time');
    localStorage.removeItem('study_timer_is_running');
  };

  return (
    <StudyTimerContext.Provider value={{ isRunning, elapsedTime, startTimer, stopTimer }}>
      {children}
    </StudyTimerContext.Provider>
  );
}

export function useStudyTimer() {
  const context = useContext(StudyTimerContext);
  if (context === undefined) {
    throw new Error('useStudyTimer must be used within a StudyTimerProvider');
  }
  return context;
}
