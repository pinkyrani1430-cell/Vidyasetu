import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Zap, 
  TrendingUp, 
  Target,
  ChevronRight,
  Sparkles,
  Play
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useStudyTimer } from '../context/StudyTimerContext';
import { useStudyHistory } from '../hooks/useFirebaseLogic';

const skillData = [
  { subject: 'Math', A: 80, fullMark: 150 },
  { subject: 'Science', A: 98, fullMark: 150 },
  { subject: 'History', A: 86, fullMark: 150 },
  { subject: 'Coding', A: 99, fullMark: 150 },
  { subject: 'English', A: 85, fullMark: 150 },
  { subject: 'Art', A: 65, fullMark: 150 },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { isRunning, elapsedTime, startTimer, stopTimer } = useStudyTimer();
  const { sessions, loading: historyLoading } = useStudyHistory();
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Complete Python Basics', done: false },
    { id: 2, text: 'Solve 5 Math Quizzes', done: true },
    { id: 3, text: 'Watch "AI Ethics" Reel', done: false },
  ]);

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')} : ${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* LEFT: Stats & Planner */}
      <div className="xl:col-span-2 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E5E5E5] shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#FFF5F5] rounded-2xl flex items-center justify-center">
                <Clock className="text-[#FF6B6B]" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#8E8E8E] uppercase tracking-wider">Study Timer</p>
                <h3 className="text-2xl font-black text-[#1A1A1A]">{formatTime(elapsedTime)}</h3>
              </div>
            </div>
            <button 
              onClick={() => isRunning ? stopTimer() : startTimer()}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-sm transition-all",
                isRunning ? "bg-[#1A1A1A] text-white" : "bg-[#FF6B6B] text-white"
              )}
            >
              {isRunning ? 'Stop Session' : 'Start Focus'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#E5E5E5] shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#F5F5F5] rounded-2xl flex items-center justify-center">
                <Zap className="text-[#FFD93D]" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#8E8E8E] uppercase tracking-wider">Current Streak</p>
                <h3 className="text-2xl font-black text-[#1A1A1A]">{profile?.streak || 1} Days</h3>
              </div>
            </div>
            <div className="w-full h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
              <div className="h-full bg-[#FFD93D] w-[70%]" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#E5E5E5] shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#F0FDF4] rounded-2xl flex items-center justify-center">
                <Target className="text-[#22C55E]" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#8E8E8E] uppercase tracking-wider">Daily Goal</p>
                <h3 className="text-2xl font-black text-[#1A1A1A]">75%</h3>
              </div>
            </div>
            <div className="w-full h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
              <div className="h-full bg-[#22C55E] w-[75%]" />
            </div>
          </div>
        </div>

        {/* AI Roadmap */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-[#1A1A1A]">AI Learning Roadmap</h3>
              <p className="text-[#8E8E8E] font-medium">Your personalized path to mastery</p>
            </div>
            <button className="p-3 bg-[#F5F5F5] rounded-2xl hover:bg-[#E5E5E5] transition-all">
              <Sparkles className="text-[#FF6B6B]" size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl transition-all",
                  step === 1 ? "bg-[#FF6B6B] text-white shadow-xl shadow-[#FF6B6B]/20" : "bg-[#F5F5F5] text-[#8E8E8E]"
                )}>
                  {step}
                </div>
                {step < 4 && <div className="flex-1 h-1 bg-[#F5F5F5] rounded-full" />}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-6 p-6 bg-[#FDFCFB] rounded-2xl border border-[#E5E5E5] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#FF6B6B] uppercase mb-1">Current Topic</p>
              <h4 className="text-lg font-bold">Advanced React Patterns</h4>
            </div>
            <button className="px-6 py-2 bg-[#1A1A1A] text-white text-sm font-bold rounded-xl flex items-center gap-2">
              Continue <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Daily Planner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-sm">
            <h3 className="text-2xl font-black text-[#1A1A1A] mb-6">Daily Planner</h3>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => setTasks(tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                  className={cn(
                    "p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4",
                    task.done ? "bg-[#F0FDF4] border-[#22C55E]/20 text-[#22C55E]" : "bg-[#FDFCFB] border-[#E5E5E5] text-[#1A1A1A]"
                  )}
                >
                  {task.done ? <CheckCircle2 size={24} /> : <Circle size={24} className="text-[#E5E5E5]" />}
                  <span className={cn("font-bold", task.done && "line-through opacity-60")}>{task.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-sm">
            <h3 className="text-2xl font-black text-[#1A1A1A] mb-6">Recent Study Sessions</h3>
            <div className="space-y-4">
              {historyLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF6B6B]"></div>
                </div>
              ) : sessions.length > 0 ? (
                sessions.slice(0, 4).map((session, idx) => (
                  <div key={idx} className="p-4 bg-[#FDFCFB] rounded-2xl border border-[#E5E5E5] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                        <Clock size={18} className="text-[#FF6B6B]" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{Math.floor(session.duration / 60)}m {session.duration % 60}s</p>
                        <p className="text-[10px] text-[#8E8E8E] font-bold uppercase tracking-widest">
                          {session.createdAt ? (typeof session.createdAt === 'string' ? new Date(session.createdAt).toLocaleDateString() : session.createdAt.toDate().toLocaleDateString()) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-[#22C55E]">+{Math.floor(session.duration / 60)} XP</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[#8E8E8E] text-center py-10 font-bold">No sessions yet. Start focusing!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: DNA & Quick Access */}
      <div className="space-y-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-sm">
          <h3 className="text-2xl font-black text-[#1A1A1A] mb-2">Learning DNA</h3>
          <p className="text-[#8E8E8E] text-sm font-medium mb-8">Visualizing your intellectual growth</p>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                <PolarGrid stroke="#E5E5E5" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8E8E8E', fontSize: 12, fontWeight: 600 }} />
                <Radar
                  name="Skills"
                  dataKey="A"
                  stroke="#FF6B6B"
                  fill="#FF6B6B"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between p-4 bg-[#F5F5F5] rounded-2xl">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-[#FF6B6B]" size={18} />
                <span className="text-sm font-bold">Strength</span>
              </div>
              <span className="text-sm font-black text-[#FF6B6B]">Coding</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#F5F5F5] rounded-2xl">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-[#FFD93D] rotate-180" size={18} />
                <span className="text-sm font-bold">Weakness</span>
              </div>
              <span className="text-sm font-black text-[#FFD93D]">Art</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] p-8 rounded-[2.5rem] text-white relative overflow-hidden">
          <h3 className="text-2xl font-black mb-6 relative z-10">Quick Access</h3>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <button className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-left">
              <Play size={20} className="mb-2 text-[#FF6B6B]" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">Latest</p>
              <p className="font-bold">Lesson</p>
            </button>
            <button className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-left">
              <Zap size={20} className="mb-2 text-[#FFD93D]" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">Quick</p>
              <p className="font-bold">Quiz</p>
            </button>
          </div>
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#FF6B6B]/20 rounded-full blur-3xl"
          />
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
