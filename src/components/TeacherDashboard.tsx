import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Video, 
  Film, 
  FileText, 
  Users, 
  BarChart3, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  MessageCircle,
  Brain,
  Trash2,
  Save,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useQuestions, useAllQuizResults } from '../hooks/useFirebaseLogic';

interface QuizResult {
  id: string;
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  class: string;
  subject: string;
  topics: string[];
  mistakes: string[];
  timestamp: any;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  class: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
}

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const { questions, loading: questionsLoading, addQuestion, deleteQuestion } = useQuestions();
  const { results: quizResults, loading: resultsLoading } = useAllQuizResults();
  const [activeTab, setActiveTab] = useState<'analytics' | 'questions' | 'content'>('analytics');
  
  // New Question Form State
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    class: 'Class 10',
    subject: 'Science',
    difficulty: 'Medium',
    topic: ''
  });

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.question || !newQuestion.topic) return;

    try {
      await addQuestion(newQuestion);
      setShowAddQuestion(false);
      setNewQuestion({
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        class: 'Class 10',
        subject: 'Science',
        difficulty: 'Medium',
        topic: ''
      });
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteQuestion(id);
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  // Analytics Calculations
  const avgScore = quizResults.length > 0 
    ? Math.round((quizResults.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0) / quizResults.length) * 100)
    : 0;

  const strugglingStudents = Array.from(new Set(quizResults.filter(r => (r.score / r.totalQuestions) < 0.5).map(r => r.studentName))).slice(0, 5);
  
  const topicMistakes: Record<string, number> = {};
  quizResults.forEach(result => {
    result.mistakes?.forEach((mistake: any) => {
      if (mistake.topic) {
        if (!topicMistakes[mistake.topic]) topicMistakes[mistake.topic] = 0;
        topicMistakes[mistake.topic]++;
      }
    });
  });
  const weakTopics = Object.entries(topicMistakes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const stats = [
    { label: 'Total Quizzes', value: quizResults.length.toString(), icon: FileText, color: '#FF6B6B' },
    { label: 'Avg. Score', value: `${avgScore}%`, icon: TrendingUp, color: '#22C55E' },
    { label: 'Questions Bank', value: questions.length.toString(), icon: Brain, color: '#3B82F6' },
    { label: 'Weak Topics', value: weakTopics.length.toString(), icon: AlertCircle, color: '#FFD93D' },
  ];

  const loading = questionsLoading || resultsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B6B]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header with Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#1A1A1A]">Teacher Dashboard</h2>
          <p className="text-[#8E8E8E] font-medium">Manage your classroom and track student progress.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-[#E5E5E5] shadow-sm">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-[#1A1A1A] text-white' : 'text-[#8E8E8E] hover:bg-[#F5F5F5]'}`}
          >
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('questions')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'questions' ? 'bg-[#1A1A1A] text-white' : 'text-[#8E8E8E] hover:bg-[#F5F5F5]'}`}
          >
            Questions
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'content' ? 'bg-[#1A1A1A] text-white' : 'text-[#8E8E8E] hover:bg-[#F5F5F5]'}`}
          >
            Content
          </button>
        </div>
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white p-6 rounded-3xl border border-[#E5E5E5] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                    <stat.icon style={{ color: stat.color }} size={24} />
                  </div>
                </div>
                <p className="text-xs font-bold text-[#8E8E8E] uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black text-[#1A1A1A]">{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {/* Struggling Students */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-[#1A1A1A]">Struggling Students</h3>
                <Users className="text-[#FF6B6B]" size={24} />
              </div>
              <div className="space-y-4">
                {strugglingStudents.length > 0 ? strugglingStudents.map((name, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[#FDFCFB] rounded-2xl border border-[#E5E5E5]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center font-bold text-[#FF6B6B]">
                        {name[0]}
                      </div>
                      <span className="font-bold text-[#1A1A1A]">{name}</span>
                    </div>
                    <span className="text-xs font-black text-[#FF6B6B] bg-[#FF6B6B15] px-3 py-1 rounded-full">Needs Attention</span>
                  </div>
                )) : (
                  <p className="text-[#8E8E8E] text-center py-10">No students currently struggling. Great job!</p>
                )}
              </div>
            </div>

            {/* Weak Topics */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-[#1A1A1A]">Weak Topics</h3>
                <AlertCircle className="text-[#FFD93D]" size={24} />
              </div>
              <div className="space-y-4">
                {weakTopics.length > 0 ? weakTopics.map(([topic, count], i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span>{topic}</span>
                      <span className="text-[#FF6B6B]">{count} students struggling</span>
                    </div>
                    <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((count / quizResults.length) * 100, 100)}%` }}
                        className="h-full bg-[#FF6B6B]"
                      />
                    </div>
                  </div>
                )) : (
                  <p className="text-[#8E8E8E] text-center py-10">No weak topics identified yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Quiz Activity */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-sm">
            <h3 className="text-2xl font-black text-[#1A1A1A] mb-8">Recent Quiz Activity</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-[#F5F5F5]">
                    <th className="pb-4 text-xs font-bold text-[#8E8E8E] uppercase tracking-widest">Student</th>
                    <th className="pb-4 text-xs font-bold text-[#8E8E8E] uppercase tracking-widest">Class/Subject</th>
                    <th className="pb-4 text-xs font-bold text-[#8E8E8E] uppercase tracking-widest">Score</th>
                    <th className="pb-4 text-xs font-bold text-[#8E8E8E] uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                  {quizResults.slice(0, 10).map((result) => (
                    <tr key={result.id} className="group hover:bg-[#FDFCFB] transition-all">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center text-xs font-bold">
                            {result.studentName[0]}
                          </div>
                          <span className="font-bold text-[#1A1A1A]">{result.studentName}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="text-sm">
                          <p className="font-bold text-[#1A1A1A]">{result.class}</p>
                          <p className="text-xs text-[#8E8E8E]">{result.subject}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`text-sm font-black ${result.score / result.totalQuestions >= 0.7 ? 'text-[#22C55E]' : 'text-[#FF6B6B]'}`}>
                          {result.score}/{result.totalQuestions}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-[#8E8E8E]">
                        {result.timestamp ? (typeof result.timestamp === 'string' ? new Date(result.timestamp).toLocaleDateString() : result.timestamp.toDate().toLocaleDateString()) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-[#1A1A1A]">Question Bank</h3>
            <button 
              onClick={() => setShowAddQuestion(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-2xl font-bold hover:bg-[#333] transition-all"
            >
              <Plus size={20} />
              Add Question
            </button>
          </div>

          <AnimatePresence>
            {showAddQuestion && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-8 rounded-[2.5rem] border-2 border-[#1A1A1A] shadow-xl"
              >
                <form onSubmit={handleAddQuestion} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-[#8E8E8E]">Class</label>
                      <select 
                        value={newQuestion.class}
                        onChange={(e) => setNewQuestion({...newQuestion, class: e.target.value})}
                        className="w-full p-4 bg-[#F5F5F5] rounded-2xl border-none focus:ring-2 focus:ring-[#1A1A1A] font-bold"
                      >
                        {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-[#8E8E8E]">Subject</label>
                      <select 
                        value={newQuestion.subject}
                        onChange={(e) => setNewQuestion({...newQuestion, subject: e.target.value})}
                        className="w-full p-4 bg-[#F5F5F5] rounded-2xl border-none focus:ring-2 focus:ring-[#1A1A1A] font-bold"
                      >
                        {['Mathematics', 'Science', 'English', 'Computer', 'General Knowledge'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-[#8E8E8E]">Question Text</label>
                    <textarea 
                      required
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                      className="w-full p-4 bg-[#F5F5F5] rounded-2xl border-none focus:ring-2 focus:ring-[#1A1A1A] font-bold min-h-[100px]"
                      placeholder="Enter your question here..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {newQuestion.options?.map((opt, idx) => (
                      <div key={idx} className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-[#8E8E8E]">Option {idx + 1}</label>
                        <input 
                          required
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(newQuestion.options || [])];
                            newOpts[idx] = e.target.value;
                            setNewQuestion({...newQuestion, options: newOpts});
                          }}
                          className="w-full p-4 bg-[#F5F5F5] rounded-2xl border-none focus:ring-2 focus:ring-[#1A1A1A] font-bold"
                          placeholder={`Option ${idx + 1}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-[#8E8E8E]">Correct Answer</label>
                      <select 
                        value={newQuestion.correctIndex}
                        onChange={(e) => setNewQuestion({...newQuestion, correctIndex: parseInt(e.target.value)})}
                        className="w-full p-4 bg-[#F5F5F5] rounded-2xl border-none focus:ring-2 focus:ring-[#1A1A1A] font-bold"
                      >
                        {newQuestion.options?.map((_, idx) => (
                          <option key={idx} value={idx}>Option {idx + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-[#8E8E8E]">Difficulty</label>
                      <select 
                        value={newQuestion.difficulty}
                        onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value as any})}
                        className="w-full p-4 bg-[#F5F5F5] rounded-2xl border-none focus:ring-2 focus:ring-[#1A1A1A] font-bold"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-[#8E8E8E]">Topic</label>
                      <input 
                        required
                        type="text"
                        value={newQuestion.topic}
                        onChange={(e) => setNewQuestion({...newQuestion, topic: e.target.value})}
                        className="w-full p-4 bg-[#F5F5F5] rounded-2xl border-none focus:ring-2 focus:ring-[#1A1A1A] font-bold"
                        placeholder="e.g. Algebra, Photosynthesis"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-[#1A1A1A] text-white rounded-2xl font-black hover:bg-[#333] transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={20} />
                      Save Question
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowAddQuestion(false)}
                      className="px-8 py-4 bg-[#F5F5F5] text-[#1A1A1A] rounded-2xl font-black hover:bg-[#E5E5E5] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 gap-6">
            {questions.map((q) => (
              <div key={q.id} className="bg-white p-6 rounded-3xl border border-[#E5E5E5] shadow-sm hover:border-[#1A1A1A] transition-all group">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-[#F5F5F5] px-2 py-0.5 rounded text-[#8E8E8E]">{q.class}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-[#F5F5F5] px-2 py-0.5 rounded text-[#8E8E8E]">{q.subject}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        q.difficulty === 'Easy' ? 'bg-[#22C55E15] text-[#22C55E]' : 
                        q.difficulty === 'Medium' ? 'bg-[#FFD93D15] text-[#FFD93D]' : 
                        'bg-[#FF6B6B15] text-[#FF6B6B]'
                      }`}>{q.difficulty}</span>
                    </div>
                    <h4 className="font-bold text-[#1A1A1A]">{q.question}</h4>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {q.options.map((opt, idx) => (
                        <div key={idx} className={`text-xs p-2 rounded-lg border ${idx === q.correctIndex ? 'bg-[#22C55E10] border-[#22C55E] text-[#22C55E] font-bold' : 'bg-[#FDFCFB] border-[#E5E5E5] text-[#8E8E8E]'}`}>
                          {opt}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-[#8E8E8E] mt-2">Topic: {q.topic}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-2 text-[#8E8E8E] hover:text-[#FF6B6B] hover:bg-[#FF6B6B10] rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border border-[#E5E5E5] border-dashed">
                <Brain className="mx-auto mb-4 text-[#E5E5E5]" size={48} />
                <p className="text-[#8E8E8E] font-bold">No questions in your bank yet.</p>
                <button 
                  onClick={() => setShowAddQuestion(true)}
                  className="mt-4 text-[#FF6B6B] font-black hover:underline"
                >
                  Add your first question
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-[#1A1A1A]">Quick Upload</h3>
                <div className="flex gap-2">
                  <button className="p-3 bg-[#F5F5F5] rounded-2xl hover:bg-[#E5E5E5] transition-all">
                    <Sparkles className="text-[#FF6B6B]" size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <button className="p-8 bg-[#FDFCFB] border-2 border-dashed border-[#E5E5E5] rounded-3xl hover:border-[#FF6B6B] hover:bg-[#FFF5F5] transition-all group">
                  <Video className="mx-auto mb-4 text-[#8E8E8E] group-hover:text-[#FF6B6B]" size={32} />
                  <p className="text-sm font-bold">Long Video</p>
                  <p className="text-xs text-[#8E8E8E] mt-1">MP4, MOV</p>
                </button>
                <button className="p-8 bg-[#FDFCFB] border-2 border-dashed border-[#E5E5E5] rounded-3xl hover:border-[#FF6B6B] hover:bg-[#FFF5F5] transition-all group">
                  <Film className="mx-auto mb-4 text-[#8E8E8E] group-hover:text-[#FF6B6B]" size={32} />
                  <p className="text-sm font-bold">Short Reel</p>
                  <p className="text-xs text-[#8E8E8E] mt-1">9:16 Format</p>
                </button>
                <button className="p-8 bg-[#FDFCFB] border-2 border-dashed border-[#E5E5E5] rounded-3xl hover:border-[#FF6B6B] hover:bg-[#FFF5F5] transition-all group">
                  <FileText className="mx-auto mb-4 text-[#8E8E8E] group-hover:text-[#FF6B6B]" size={32} />
                  <p className="text-sm font-bold">PDF / Links</p>
                  <p className="text-xs text-[#8E8E8E] mt-1">Study Material</p>
                </button>
              </div>
            </div>
          </div>

          {/* AI Assistant Sidebar */}
          <div className="space-y-8">
            <div className="bg-[#1A1A1A] p-8 rounded-[2.5rem] text-white">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="text-[#FF6B6B]" size={24} />
                <h3 className="text-xl font-black">AI Assistant</h3>
              </div>
              <div className="space-y-4">
                <button className="w-full p-5 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-left flex items-center justify-between group">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Generate</p>
                    <p className="font-bold">Smart Quiz</p>
                  </div>
                  <ChevronRight size={18} className="opacity-40 group-hover:opacity-100 transition-all" />
                </button>
                <button className="w-full p-5 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-left flex items-center justify-between group">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Generate</p>
                    <p className="font-bold">Lesson Plan</p>
                  </div>
                  <ChevronRight size={18} className="opacity-40 group-hover:opacity-100 transition-all" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
