import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Mic, 
  Play, 
  Code, 
  Save, 
  BookOpen, 
  Brain, 
  Terminal,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  StickyNote
} from 'lucide-react';
import { motion } from 'motion/react';
import { getAIResponse, getCodeExplanation, generateQuiz } from '../services/gemini';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ReactMarkdown from 'react-markdown';

export default function Workspace() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [code, setCode] = useState('print("Hello VIDYASETU")');
  const [output, setOutput] = useState('');
  const [notes, setNotes] = useState(() => localStorage.getItem('vidyasetu_notes') || '');
  const [isCompiling, setIsCompiling] = useState(false);
  const [tutorMode, setTutorMode] = useState<'teacher' | 'friend' | 'story'>('teacher');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('vidyasetu_notes', notes);
  }, [notes]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const systemPrompt = {
        teacher: "You are a formal, structured teacher explaining concepts clearly.",
        friend: "You are a friendly, casual peer helping a friend learn.",
        story: "You explain everything through engaging stories and metaphors."
      }[tutorMode];

      const aiText = await getAIResponse(input, systemPrompt);
      setMessages(prev => [...prev, { role: 'ai', text: aiText || 'Sorry, I missed that.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting right now. Please try again." }]);
    }
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setOutput("Compiling...");
    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: code, language_id: 71, stdin: "" }) 
      });
      const data = await res.json();
      if (data.error) {
        // Fallback simulation for simple print statements if API fails
        if (code.includes('print(')) {
          const match = code.match(/print\((['"])(.*?)\1\)/);
          setOutput(match ? match[2] : "Execution error (API Key missing)");
        } else {
          setOutput("Execution error: " + data.error);
        }
      } else {
        setOutput(data.stdout || data.stderr || data.compile_output || "Program executed with no output.");
      }
    } catch (err) {
      setOutput("Compilation failed. Please check your connection.");
    }
    setIsCompiling(false);
  };

  const handleExplainCode = async () => {
    setMessages(prev => [...prev, { role: 'ai', text: "Analyzing your code..." }]);
    const explanation = await getCodeExplanation(code);
    setMessages(prev => [...prev, { role: 'ai', text: explanation || "Could not explain this code." }]);
  };

  const handleConvertToQuiz = async () => {
    if (!notes.trim()) return alert("Please write some notes first!");
    setMessages(prev => [...prev, { role: 'ai', text: "Generating a quiz from your notes..." }]);
    try {
      const quiz = await generateQuiz(`these notes: ${notes}`, "General", 3);
      setMessages(prev => [...prev, { role: 'ai', text: `I've generated a quiz! Head over to the Quiz Arena or I can show it here. \n\nSample Question: ${quiz[0].question}` }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "Failed to generate quiz. Try again later." }]);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex gap-4 overflow-hidden">
      {/* LEFT: AI Tutor */}
      <div className="w-1/4 flex flex-col bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between bg-[#FDFCFB]">
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-[#FF6B6B]" />
            <span className="font-bold text-sm">AI Tutor</span>
          </div>
          <select 
            value={tutorMode}
            onChange={(e) => setTutorMode(e.target.value as any)}
            className="text-xs bg-[#F5F5F5] border-none rounded-md px-2 py-1"
          >
            <option value="teacher">Teacher</option>
            <option value="friend">Friend</option>
            <option value="story">Story</option>
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn(
              "max-w-[85%] p-3 rounded-2xl text-sm",
              m.role === 'user' ? "bg-[#FF6B6B] text-white ml-auto" : "bg-[#F5F5F5] text-[#1A1A1A]"
            )}>
              <div className="markdown-body">
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 border-t border-[#E5E5E5] flex gap-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            className="flex-1 bg-[#F5F5F5] border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#FF6B6B]"
          />
          <button onClick={handleSend} className="p-2 bg-[#FF6B6B] text-white rounded-xl hover:scale-105 transition-transform">
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* CENTER: Video & Compiler */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex-1 bg-black rounded-2xl overflow-hidden relative group">
          <iframe 
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
            title="Lesson Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        
        {/* BOTTOM: Coding Compiler */}
        <div className="h-1/3 bg-[#1E1E1E] rounded-2xl border border-[#333] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#333] flex items-center justify-between bg-[#252526]">
            <div className="flex items-center gap-2 text-[#D4D4D4]">
              <Terminal size={16} />
              <span className="text-xs font-mono">main.py</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleExplainCode}
                className="flex items-center gap-1 px-3 py-1 bg-[#3E3E3E] text-white text-xs rounded-md hover:bg-[#4E4E4E]"
              >
                <Sparkles size={14} /> Explain
              </button>
              <button 
                onClick={handleCompile}
                disabled={isCompiling}
                className="flex items-center gap-1 px-4 py-1 bg-[#007ACC] text-white text-xs rounded-md hover:bg-[#1E8AD2] disabled:opacity-50"
              >
                <Play size={14} /> {isCompiling ? 'Running...' : 'Run'}
              </button>
            </div>
          </div>
          <div className="flex-1 flex">
            <textarea 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-transparent text-[#D4D4D4] font-mono text-sm p-4 resize-none outline-none"
              spellCheck={false}
            />
            <div className="w-1/3 border-l border-[#333] bg-[#1A1A1A] p-4 font-mono text-xs text-[#858585] overflow-y-auto">
              <p className="mb-2 text-[#569CD6]">Output:</p>
              <pre className="text-[#D4D4D4]">{output}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Smart Notes */}
      <div className="w-1/4 flex flex-col bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between bg-[#FDFCFB]">
          <div className="flex items-center gap-2">
            <StickyNote size={20} className="text-[#FF6B6B]" />
            <span className="font-bold text-sm">Smart Notes</span>
          </div>
          <button className="p-2 hover:bg-[#F5F5F5] rounded-lg text-[#FF6B6B]">
            <Save size={18} />
          </button>
        </div>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Take notes here... they will be saved automatically."
          className="flex-1 p-6 text-sm leading-relaxed resize-none outline-none text-[#4A4A4A]"
        />
        <div className="p-4 bg-[#FDFCFB] border-t border-[#E5E5E5]">
          <button 
            onClick={handleConvertToQuiz}
            className="w-full py-3 bg-[#F5F5F5] text-[#FF6B6B] font-bold text-xs rounded-xl hover:bg-[#FF6B6B] hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={16} /> Convert to Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
