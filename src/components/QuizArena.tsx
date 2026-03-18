import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Users, 
  Timer, 
  Coins,
  CheckCircle2,
  XCircle,
  Sparkles,
  BookOpen,
  Brain,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  Loader2,
  Lightbulb,
  User,
  Bot,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useUserStats, useQuizResults, useFilteredQuestions } from '../hooks/useFirebaseLogic';
import { generateQuiz, getQuestionExplanation, getMotivationalFeedback } from '../services/gemini';

import { io, Socket } from 'socket.io-client';

type QuizStep = 'selection' | 'mode' | 'entry' | 'searching' | 'loading' | 'playing' | 'results';
type QuizMode = '1v1' | 'individual';

const CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Computer', 'General Knowledge'];

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  topic: string;
}

interface PlayerResult {
  name: string;
  score: number;
  isAI?: boolean;
  timeTaken: number;
}

export default function QuizArena() {
  const { profile } = useAuth();
  const { addCoins, addXP } = useUserStats();
  const { saveResult } = useQuizResults();
  const [step, setStep] = useState<QuizStep>('selection');
  const [notification, setNotification] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  
  // Selection State
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedMode, setSelectedMode] = useState<QuizMode>('individual');
  
  // Firestore Questions
  const { questions: dbQuestions, loading: dbLoading } = useFilteredQuestions(selectedClass, selectedSubject);
  
  // Game State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Opponent Simulation
  const [opponentResult, setOpponentResult] = useState<PlayerResult | null>(null);
  
  // Results State
  const [results, setResults] = useState<any>(null);
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [motivationalFeedback, setMotivationalFeedback] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingExplanations, setLoadingExplanations] = useState(false);
  
  // Socket State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [searchingTime, setSearchingTime] = useState(0);
  
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const searchTimerRef = useRef<any>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('match-found', (data) => {
      setRoomData(data);
      setStep('loading');
      clearInterval(searchTimerRef.current);
    });

    newSocket.on('questions-ready', (qs) => {
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(null));
      setStep('playing');
      setTimeLeft(600);
    });

    newSocket.on('room-update', (data) => {
      setRoomData(data);
    });

    newSocket.on('battle-finished', (data) => {
      setRoomData(data);
    });

    return () => {
      newSocket.disconnect();
      clearInterval(searchTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (step === 'playing' && timeLeft > 0) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const startQuiz = async () => {
    if ((profile?.coins || 0) < 20) {
      setNotification({ type: 'error', message: "Insufficient coins! Entry fee is 20 coins." });
      return;
    }

    if (selectedMode === '1v1') {
      setStep('searching');
      setSearchingTime(0);
      
      // Start searching timer
      searchTimerRef.current = setInterval(() => {
        setSearchingTime(prev => {
          const next = prev + 1;
          if (next >= 5) {
            // AI Fallback after 5 seconds
            clearInterval(searchTimerRef.current);
            socket?.emit('leave-queue', { className: selectedClass, subject: selectedSubject, user: { uid: profile?.uid } });
            startAIQuiz();
          }
          return next;
        });
      }, 1000);

      socket?.emit('find-match', {
        className: selectedClass,
        subject: selectedSubject,
        user: { uid: profile?.uid, name: profile?.name }
      });
    } else {
      startAIQuiz();
    }
  };

  const startAIQuiz = async () => {
    setStep('loading');
    try {
      // Try to use DB questions first if enough exist
      let quizQuestions: Question[] = [];
      
      if (dbQuestions.length >= 10) {
        // Shuffle and take 10
        quizQuestions = [...dbQuestions]
          .sort(() => Math.random() - 0.5)
          .slice(0, 10)
          .map(q => ({
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            topic: q.topic
          }));
      } else {
        // Fallback to AI generation
        quizQuestions = await generateQuiz(selectedSubject, selectedClass, 10);
      }

      // Deduct coins only after questions are ready
      await addCoins(-20);
      
      setQuestions(quizQuestions);
      setAnswers(new Array(quizQuestions.length).fill(null));
      
      const aiAccuracy = 0.6 + Math.random() * 0.25;
      const aiScore = Math.floor(aiAccuracy * 10);
      const aiTime = 30 + Math.floor(Math.random() * 50); // 3-8 seconds per question for 10 questions
      
      setOpponentResult({
        name: 'AI Opponent',
        score: aiScore,
        isAI: true,
        timeTaken: aiTime
      });

      setStep('playing');
      setTimeLeft(600);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: "Failed to start quiz. Please try again." });
      setStep('selection');
    }
  };

  // When match is found, both players deduct coins and first player generates questions
  useEffect(() => {
    if (step === 'loading' && selectedMode === '1v1' && roomData && questions.length === 0) {
      const initBattle = async () => {
        try {
          const isFirstPlayer = roomData.players[0].uid === profile?.uid;
          
          let quizQuestions: Question[] = [];
          if (isFirstPlayer) {
            if (dbQuestions.length >= 10) {
              quizQuestions = [...dbQuestions]
                .sort(() => Math.random() - 0.5)
                .slice(0, 10)
                .map(q => ({
                  question: q.question,
                  options: q.options,
                  correctIndex: q.correctIndex,
                  topic: q.topic
                }));
            } else {
              quizQuestions = await generateQuiz(selectedSubject, selectedClass, 10);
            }
            
            // Deduct coins only after questions are ready
            await addCoins(-20);
            socket?.emit('sync-questions', { roomId: roomData.id, questions: quizQuestions });
          } else {
            // Second player also deducts coins
            await addCoins(-20);
          }
        } catch (err) {
          console.error(err);
          setNotification({ type: 'error', message: "Failed to initialize battle." });
          setStep('selection');
        }
      };
      initBattle();
    }
  }, [step, roomData, dbQuestions]);

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = optionIdx;
    setAnswers(newAnswers);
    
    // Sync progress if 1v1
    if (selectedMode === '1v1' && roomData) {
      const score = newAnswers.reduce((acc, ans, idx) => {
        return acc + (ans === questions[idx]?.correctIndex ? 1 : 0);
      }, 0);
      socket?.emit('update-progress', {
        roomId: roomData.id,
        score,
        currentIdx,
        timeTaken: 600 - timeLeft,
        finished: false
      });
    }

    // Auto-advance
    if (currentIdx < questions.length - 1) {
      setTimeout(() => setCurrentIdx(prev => prev + 1), 300);
    }
  };

  const finishQuiz = async () => {
    setIsSubmitting(true);
    clearInterval(timerRef.current);

    const timeTaken = 600 - timeLeft;
    const score = answers.reduce((acc, ans, idx) => {
      return acc + (ans === questions[idx].correctIndex ? 1 : 0);
    }, 0);

    if (selectedMode === '1v1' && roomData) {
      socket?.emit('update-progress', {
        roomId: roomData.id,
        score,
        currentIdx,
        timeTaken,
        finished: true
      });
      // The results will be set when 'battle-finished' is received
      return;
    }

    // Individual Mode Result Logic
    let rank = 1;
    if (opponentResult) {
      if (score < opponentResult.score) {
        rank = 2;
      } else if (score === opponentResult.score) {
        if (timeTaken > opponentResult.timeTaken) {
          rank = 2;
        }
      }
    }

    const coinsWon = rank === 1 ? 30 : 10;
    const quizResult = {
      uid: profile?.uid,
      studentName: profile?.name,
      class: selectedClass,
      subject: selectedSubject,
      mode: selectedMode,
      score,
      totalQuestions: questions.length,
      coinsWon,
      rank,
      timeTaken,
      timestamp: new Date().toISOString(),
      opponent: opponentResult,
      mistakes: questions
        .filter((q, i) => answers[i] !== q.correctIndex)
        .map(q => ({ question: q.question, topic: q.topic }))
    };

    saveResults(quizResult);
  };

  useEffect(() => {
    if (selectedMode === '1v1' && roomData?.players.every((p: any) => p.finished) && !results) {
      const myData = roomData.players.find((p: any) => p.uid === profile?.uid);
      const oppData = roomData.players.find((p: any) => p.uid !== profile?.uid);
      
      let rank = 1;
      if (oppData.score > myData.score) {
        rank = 2;
      } else if (oppData.score === myData.score) {
        if (oppData.timeTaken < myData.timeTaken) {
          rank = 2;
        }
      }

      const coinsWon = rank === 1 ? 30 : 10;
      const quizResult = {
        uid: profile?.uid,
        studentName: profile?.name,
        class: selectedClass,
        subject: selectedSubject,
        mode: selectedMode,
        score: myData.score,
        totalQuestions: questions.length,
        coinsWon,
        rank,
        timeTaken: myData.timeTaken,
        timestamp: new Date().toISOString(),
        opponent: {
          name: oppData.name,
          score: oppData.score,
          timeTaken: oppData.timeTaken,
          isAI: false
        },
        mistakes: questions
          .filter((q, i) => answers[i] !== q.correctIndex)
          .map(q => ({ question: q.question, topic: q.topic }))
      };
      saveResults(quizResult);
    }
  }, [roomData]);

  const saveResults = async (quizResult: any) => {
    try {
      await saveResult(quizResult);
      await addCoins(quizResult.coinsWon);
      await addXP(quizResult.score * 10);

      setResults(quizResult);
      setStep('results');
      fetchExplanations(quizResult.score);
      
      // Leaderboard fetching could also be moved to a hook
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchExplanations = async (score: number) => {
    setLoadingExplanations(true);
    try {
      const wrongIndices = answers.map((ans, i) => ans !== questions[i].correctIndex ? i : -1).filter(i => i !== -1);
      
      // Fetch explanations in parallel
      const explPromises = wrongIndices.slice(0, 3).map(async (idx) => {
        const q = questions[idx];
        const expl = await getQuestionExplanation(q.question, q.options[q.correctIndex], selectedClass);
        return { idx, expl };
      });

      const explResults = await Promise.all(explPromises);
      const newExplanations: Record<number, string> = {};
      explResults.forEach(res => {
        newExplanations[res.idx] = res.expl;
      });
      setExplanations(newExplanations);

      // Get motivational feedback
      const feedback = await getMotivationalFeedback(score, questions.length, selectedSubject, selectedClass);
      setMotivationalFeedback(feedback);
    } catch (err) {
      console.error("Failed to fetch explanations:", err);
    } finally {
      setLoadingExplanations(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'selection') {
    return (
      <div className="max-w-5xl mx-auto space-y-12 pb-20">
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold ${
                notification.type === 'error' ? 'bg-[#FF6B6B] text-white' : 'bg-[#22C55E] text-white'
              }`}
            >
              <AlertCircle size={20} />
              {notification.message}
              <button onClick={() => setNotification(null)} className="ml-4 opacity-60 hover:opacity-100">
                <XCircle size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center space-y-4">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFF5F5] text-[#FF6B6B] rounded-full text-sm font-bold"
          >
            <Sparkles size={16} />
            QUIZ ARENA
          </motion.div>
          <h1 className="text-6xl font-black tracking-tighter text-[#1A1A1A]">
            SELECT YOUR <span className="text-[#FF6B6B]">BATTLE</span>
          </h1>
          <p className="text-xl text-[#8E8E8E] max-w-2xl mx-auto">
            Choose your class and subject to start a high-stakes quiz battle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Class Selection */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-[#F5F5F5] rounded-2xl flex items-center justify-center">
                <GraduationCap className="text-[#1A1A1A]" />
              </div>
              <h3 className="text-2xl font-bold">Select Class</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CLASSES.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedClass(c)}
                  className={`p-4 rounded-2xl text-left font-bold transition-all border-2 ${
                    selectedClass === c ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-[#FDFCFB] border-transparent hover:border-[#E5E5E5]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Selection */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-[#FFF5F5] rounded-2xl flex items-center justify-center">
                <BookOpen className="text-[#FF6B6B]" />
              </div>
              <h3 className="text-2xl font-bold">Select Subject</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSubject(s)}
                  className={`p-4 rounded-2xl text-left font-bold transition-all border-2 ${
                    selectedSubject === s ? 'bg-[#FF6B6B] text-white border-[#FF6B6B]' : 'bg-[#FDFCFB] border-transparent hover:border-[#E5E5E5]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setStep('mode')}
            className="group px-12 py-6 bg-[#1A1A1A] text-white font-black text-xl rounded-3xl shadow-2xl hover:scale-105 transition-all flex items-center gap-4"
          >
            NEXT: CHOOSE MODE
            <ArrowRight className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'mode') {
    return (
      <div className="max-w-4xl mx-auto space-y-12 py-12">
        <div className="text-center space-y-4">
          <h2 className="text-5xl font-black tracking-tighter">CHOOSE BATTLE MODE</h2>
          <p className="text-[#8E8E8E] font-bold uppercase tracking-widest">{selectedSubject} • {selectedClass}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => setSelectedMode('1v1')}
            className={`group p-10 rounded-[3rem] border-4 transition-all text-left space-y-6 ${
              selectedMode === '1v1' ? 'bg-[#FF6B6B] border-[#FF6B6B] text-white' : 'bg-white border-[#E5E5E5] hover:border-[#FF6B6B]/30'
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${selectedMode === '1v1' ? 'bg-white/20' : 'bg-[#FFF5F5]'}`}>
              <Users size={32} className={selectedMode === '1v1' ? 'text-white' : 'text-[#FF6B6B]'} />
            </div>
            <div>
              <h3 className="text-3xl font-black">1 vs 1 Battle</h3>
              <p className={selectedMode === '1v1' ? 'text-white/80' : 'text-[#8E8E8E]'}>
                Compete against another player in real-time. Highest score wins!
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 font-bold ${selectedMode === '1v1' ? 'text-white' : 'text-[#FF6B6B]'}`}>
              Select Mode <ChevronRight size={20} />
            </div>
          </button>

          <button
            onClick={() => setSelectedMode('individual')}
            className={`group p-10 rounded-[3rem] border-4 transition-all text-left space-y-6 ${
              selectedMode === 'individual' ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-white border-[#E5E5E5] hover:border-[#1A1A1A]/30'
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${selectedMode === 'individual' ? 'bg-white/20' : 'bg-[#F5F5F5]'}`}>
              <Bot size={32} className={selectedMode === 'individual' ? 'text-white' : 'text-[#1A1A1A]'} />
            </div>
            <div>
              <h3 className="text-3xl font-black">Individual Mode</h3>
              <p className={selectedMode === 'individual' ? 'text-white/80' : 'text-[#8E8E8E]'}>
                Play against our advanced AI opponent. Can you beat the bot?
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 font-bold ${selectedMode === 'individual' ? 'text-white' : 'text-[#1A1A1A]'}`}>
              Select Mode <ChevronRight size={20} />
            </div>
          </button>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setStep('selection')}
            className="px-12 py-6 bg-[#F5F5F5] text-[#1A1A1A] font-black text-xl rounded-3xl"
          >
            BACK
          </button>
          <button
            onClick={() => setStep('entry')}
            className="px-12 py-6 bg-[#1A1A1A] text-white font-black text-xl rounded-3xl shadow-2xl hover:scale-105 transition-all"
          >
            CONTINUE
          </button>
        </div>
      </div>
    );
  }

  if (step === 'entry') {
    return (
      <div className="max-w-2xl mx-auto py-20">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] border border-[#E5E5E5] shadow-2xl text-center space-y-8"
        >
          <div className="w-24 h-24 bg-[#FFF9E5] rounded-full flex items-center justify-center mx-auto">
            <Coins size={48} className="text-[#FFD93D]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black">ARENA ENTRY FEE</h2>
            <p className="text-[#8E8E8E]">Spend coins to enter the battle and win big!</p>
          </div>
          
          <div className="bg-[#FDFCFB] p-8 rounded-3xl border border-[#E5E5E5] grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="text-xs font-bold text-[#8E8E8E] uppercase mb-1">Entry Fee</p>
              <p className="text-3xl font-black text-[#FF6B6B]">20 Coins</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-[#8E8E8E] uppercase mb-1">Your Balance</p>
              <p className="text-3xl font-black text-[#1A1A1A]">{profile?.coins || 0}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('mode')}
              className="flex-1 py-5 bg-[#F5F5F5] text-[#1A1A1A] font-bold rounded-2xl"
            >
              Cancel
            </button>
            <button
              onClick={startQuiz}
              className="flex-1 py-5 bg-[#1A1A1A] text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-colors"
            >
              Confirm & Enter
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 'searching') {
    return (
      <div className="max-w-2xl mx-auto py-40 text-center space-y-12">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FF6B6B]/10 rounded-full"
          />
          <div className="relative w-32 h-32 mx-auto bg-white rounded-full border-4 border-[#FF6B6B] flex items-center justify-center shadow-2xl">
            <Users size={48} className="text-[#FF6B6B] animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-4xl font-black uppercase tracking-tighter">SEARCHING FOR OPPONENT...</h2>
          <p className="text-[#8E8E8E] font-bold text-xl">
            {selectedSubject} • {selectedClass}
          </p>
          <div className="flex items-center justify-center gap-2 text-[#FF6B6B] font-mono text-2xl font-black">
            <Timer size={24} />
            {searchingTime}s
          </div>
        </div>

        <button
          onClick={() => {
            socket?.emit('leave-queue', { className: selectedClass, subject: selectedSubject, user: { uid: profile?.uid } });
            setStep('mode');
          }}
          className="px-8 py-4 bg-[#F5F5F5] text-[#1A1A1A] font-bold rounded-2xl hover:bg-[#EEEEEE] transition-colors"
        >
          Cancel Search
        </button>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="max-w-2xl mx-auto py-40 text-center space-y-8">
        <div className="relative w-24 h-24 mx-auto">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-full h-full border-4 border-[#FF6B6B] border-t-transparent rounded-full"
          />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#FF6B6B]" size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter">PREPARING ARENA...</h2>
          <p className="text-[#8E8E8E] font-bold">Generating AI questions for {selectedClass} {selectedSubject}</p>
        </div>
      </div>
    );
  }

  if (step === 'playing') {
    const currentQ = questions[currentIdx];
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl border border-[#E5E5E5] flex items-center gap-3">
              <Timer size={20} className={timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-[#22C55E]'} />
              <span className="font-mono font-black text-xl">{formatTime(timeLeft)}</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl border border-[#E5E5E5] font-bold">
              QUESTION {currentIdx + 1} OF 10
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedMode === '1v1' && roomData && (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[#E5E5E5]">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-[#8E8E8E] uppercase">Live Battle</span>
              </div>
            )}
            <div className="bg-[#1A1A1A] text-white px-6 py-3 rounded-2xl font-black">
              SCORE: {answers.reduce((acc, ans, idx) => acc + (ans === questions[idx].correctIndex ? 1 : 0), 0)}
            </div>
          </div>
        </div>

        {selectedMode === '1v1' && roomData && (
          <div className="grid grid-cols-2 gap-4">
            {roomData.players.map((p: any) => (
              <div key={p.id} className={`p-4 rounded-2xl border-2 flex items-center justify-between ${p.uid === profile?.uid ? 'bg-white border-[#1A1A1A]' : 'bg-[#FDFCFB] border-[#E5E5E5]'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F5F5F5] rounded-xl flex items-center justify-center">
                    <User size={20} className={p.uid === profile?.uid ? 'text-[#1A1A1A]' : 'text-[#8E8E8E]'} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{p.name} {p.uid === profile?.uid ? '(You)' : ''}</p>
                    <p className="text-[10px] font-bold text-[#8E8E8E] uppercase">Q: {p.currentIdx + 1}/10</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl">{p.score}</p>
                  <p className="text-[10px] font-bold text-[#8E8E8E] uppercase">Points</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white p-12 rounded-[3rem] border border-[#E5E5E5] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#F5F5F5]">
            <motion.div 
              className="h-full bg-[#FF6B6B]"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx + 1) / 10) * 100}%` }}
            />
          </div>

          <div className="space-y-12">
            <h2 className="text-3xl font-bold text-center leading-tight">
              {currentQ.question}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQ.options.map((option: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className={`p-6 rounded-2xl text-left font-bold transition-all border-2 flex items-center gap-4 ${
                    answers[currentIdx] === i 
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' 
                      : 'bg-[#FDFCFB] border-transparent hover:border-[#FF6B6B]/30'
                  }`}
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    answers[currentIdx] === i ? 'bg-white/20' : 'bg-[#F5F5F5]'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-[#F5F5F5]">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => prev - 1)}
                className="px-8 py-4 text-[#8E8E8E] font-bold disabled:opacity-30"
              >
                Previous
              </button>
              {currentIdx === 9 ? (
                <button
                  onClick={finishQuiz}
                  disabled={isSubmitting}
                  className="px-12 py-4 bg-[#FF6B6B] text-white font-black rounded-2xl shadow-xl shadow-[#FF6B6B]/20 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'SUBMIT QUIZ'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                  className="px-12 py-4 bg-[#1A1A1A] text-white font-black rounded-2xl shadow-xl"
                >
                  Next Question
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results' && results) {
    return (
      <div className="max-w-5xl mx-auto space-y-12 pb-20">
        <div className="bg-white p-12 rounded-[3.5rem] border border-[#E5E5E5] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <div className="bg-[#F0FDF4] text-[#22C55E] px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
              <CheckCircle2 size={16} />
              COMPLETED
            </div>
          </div>

          <div className="text-center space-y-8">
            <div className="w-32 h-32 bg-[#FFF5F5] rounded-full flex items-center justify-center mx-auto">
              <Trophy size={64} className="text-[#FF6B6B]" />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tighter uppercase">BATTLE RESULTS</h1>
              <p className="text-[#8E8E8E] font-bold">{selectedSubject} • {selectedClass}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-[#FDFCFB] p-6 rounded-3xl border border-[#E5E5E5]">
                <p className="text-xs font-bold text-[#8E8E8E] uppercase mb-1">Rank</p>
                <p className="text-3xl font-black text-[#1A1A1A]">#{results.rank}</p>
              </div>
              <div className="bg-[#FDFCFB] p-6 rounded-3xl border border-[#E5E5E5]">
                <p className="text-xs font-bold text-[#8E8E8E] uppercase mb-1">Score</p>
                <p className="text-3xl font-black text-[#FF6B6B]">{results.score}/10</p>
              </div>
              <div className="bg-[#FDFCFB] p-6 rounded-3xl border border-[#E5E5E5]">
                <p className="text-xs font-bold text-[#8E8E8E] uppercase mb-1">Coins Earned</p>
                <p className="text-3xl font-black text-[#FFD93D]">+{results.coinsWon}</p>
              </div>
              <div className="bg-[#FDFCFB] p-6 rounded-3xl border border-[#E5E5E5]">
                <p className="text-xs font-bold text-[#8E8E8E] uppercase mb-1">Correct/Wrong</p>
                <p className="text-3xl font-black text-[#22C55E]">{results.score}/{10 - results.score}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Score Comparison */}
        <div className="bg-white p-10 rounded-[3rem] border border-[#E5E5E5] space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#F5F5F5] rounded-2xl flex items-center justify-center">
              <Users className="text-[#1A1A1A]" />
            </div>
            <h3 className="text-2xl font-bold">Score Comparison</h3>
          </div>
          
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-6 rounded-2xl border-2 ${results.rank === 1 ? 'bg-[#F0FDF4] border-[#22C55E]' : 'bg-white border-[#E5E5E5]'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <User className="text-[#1A1A1A]" />
                </div>
                <div>
                  <p className="font-black text-xl">{profile?.name} (You)</p>
                  <p className="text-sm text-[#8E8E8E]">Time: {formatTime(results.timeTaken)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">{results.score}</p>
                <p className="text-xs font-bold uppercase text-[#8E8E8E]">Points</p>
              </div>
            </div>

            {results.opponent && (
              <div className={`flex items-center justify-between p-6 rounded-2xl border-2 ${results.rank === 2 ? 'bg-[#F0FDF4] border-[#22C55E]' : 'bg-white border-[#E5E5E5]'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    {results.opponent.isAI ? <Bot className="text-[#FF6B6B]" /> : <User className="text-[#FF6B6B]" />}
                  </div>
                  <div>
                    <p className="font-black text-xl">{results.opponent.name}</p>
                    <p className="text-sm text-[#8E8E8E]">Time: {formatTime(results.opponent.timeTaken)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black">{results.opponent.score}</p>
                  <p className="text-xs font-bold uppercase text-[#8E8E8E]">Points</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Explanations */}
          <div className="bg-white p-10 rounded-[3rem] border border-[#E5E5E5] space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#FFF5F5] rounded-2xl flex items-center justify-center">
                <Lightbulb className="text-[#FF6B6B]" />
              </div>
              <h3 className="text-2xl font-bold">AI Explanations</h3>
            </div>

            <div className="space-y-6">
              {loadingExplanations ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#8E8E8E]">
                  <Loader2 className="animate-spin mb-4" />
                  <p>Gemini is generating explanations...</p>
                </div>
              ) : Object.keys(explanations).length > 0 ? (
                Object.entries(explanations).map(([idx, expl]) => {
                  const q = questions[parseInt(idx)];
                  return (
                    <div key={idx} className="p-6 bg-[#FDFCFB] rounded-2xl border border-[#E5E5E5] space-y-3">
                      <p className="font-bold text-lg">{q.question}</p>
                      <div className="flex items-center gap-2 text-[#22C55E] font-bold">
                        <CheckCircle2 size={18} />
                        Correct Answer: {q.options[q.correctIndex]}
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-[#E5E5E5] text-sm text-[#1A1A1A] leading-relaxed">
                        <span className="font-bold text-[#FF6B6B]">AI Explanation:</span> {expl}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 text-[#8E8E8E]">
                  <Sparkles className="mx-auto mb-4 opacity-20" size={48} />
                  <p className="font-bold">Perfect Score! No explanations needed.</p>
                </div>
              )}
            </div>
          </div>

          {/* Motivational Feedback & Leaderboard */}
          <div className="space-y-8">
            <div className="bg-[#1A1A1A] p-10 rounded-[3rem] text-white space-y-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <Sparkles className="text-[#FFD93D]" />
                Motivational Feedback
              </h3>
              {motivationalFeedback ? (
                <p className="text-lg leading-relaxed italic opacity-90">
                  "{motivationalFeedback}"
                </p>
              ) : (
                <div className="flex items-center gap-3 opacity-50">
                  <Loader2 className="animate-spin" size={20} />
                  <p>Generating feedback...</p>
                </div>
              )}
            </div>

            <div className="bg-[#F5F5F5] p-10 rounded-[3rem] space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                  <Trophy className="text-[#FFD93D]" />
                </div>
                <h3 className="text-2xl font-bold">Arena Leaderboard</h3>
              </div>

              <div className="space-y-4">
                {leaderboard.map((entry, i) => (
                  <div key={i} className={`flex items-center justify-between p-5 rounded-2xl bg-white border ${
                    entry.uid === profile?.uid ? 'border-[#FF6B6B] ring-2 ring-[#FF6B6B]/10' : 'border-[#E5E5E5]'
                  }`}>
                    <div className="flex items-center gap-4">
                      <span className={`font-black w-6 ${i === 0 ? 'text-[#FFD93D]' : 'text-[#8E8E8E]'}`}>#{i + 1}</span>
                      <span className="font-bold">{entry.studentName}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-[#8E8E8E] font-bold">SCORE</p>
                        <p className="font-black">{entry.score}/10</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#8E8E8E] font-bold">WON</p>
                        <p className="font-black text-[#FFD93D]">{entry.coinsWon} C</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setStep('selection'); setResults(null); setExplanations({}); setMotivationalFeedback(''); }}
                className="w-full py-5 bg-[#1A1A1A] text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
