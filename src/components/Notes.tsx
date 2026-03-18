import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  StickyNote, 
  Trash2, 
  Edit3, 
  Save, 
  Search,
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  topic?: string;
}

export default function Notes() {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('vidyasetu_all_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    localStorage.setItem('vidyasetu_all_notes', JSON.stringify(notes));
  }, [notes]);

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      date: new Date().toLocaleDateString(),
    };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
    setIsEditing(true);
  };

  const saveNote = () => {
    if (!activeNote) return;
    setNotes(notes.map(n => n.id === activeNote.id ? activeNote : n));
    setIsEditing(false);
  };

  const deleteNote = (id: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setNotes(notes.filter(n => n.id !== id));
      if (activeNote?.id === id) setActiveNote(null);
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-160px)] flex gap-8">
      {/* Sidebar: Notes List */}
      <div className="w-1/3 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black tracking-tighter">MY NOTES</h2>
          <button 
            onClick={createNote}
            className="p-3 bg-[#FF6B6B] text-white rounded-2xl shadow-lg shadow-[#FF6B6B]/20 hover:scale-110 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E8E]" size={20} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-white border border-[#E5E5E5] rounded-2xl py-4 pl-12 pr-4 font-medium focus:ring-2 focus:ring-[#FF6B6B] outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
          {filteredNotes.map((note) => (
            <div 
              key={note.id}
              onClick={() => { setActiveNote(note); setIsEditing(false); }}
              className={cn(
                "p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden",
                activeNote?.id === note.id 
                  ? "bg-white border-[#FF6B6B] shadow-xl" 
                  : "bg-white border-[#E5E5E5] hover:border-[#FF6B6B]/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8E8E8E] flex items-center gap-1">
                  <Clock size={10} /> {note.date}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-[#FF6B6B] hover:bg-[#FFF5F5] rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h4 className="font-bold text-lg mb-2 truncate">{note.title}</h4>
              <p className="text-sm text-[#8E8E8E] line-clamp-2 leading-relaxed">{note.content || 'No content yet...'}</p>
              
              {activeNote?.id === note.id && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF6B6B]"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 bg-white rounded-[3rem] border border-[#E5E5E5] shadow-sm overflow-hidden flex flex-col">
        {activeNote ? (
          <>
            <div className="p-8 border-b border-[#E5E5E5] flex items-center justify-between bg-[#FDFCFB]">
              <div className="flex-1">
                {isEditing ? (
                  <input 
                    value={activeNote.title}
                    onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
                    className="text-2xl font-black tracking-tight bg-transparent border-none outline-none w-full"
                    autoFocus
                  />
                ) : (
                  <h3 className="text-2xl font-black tracking-tight">{activeNote.title}</h3>
                )}
              </div>
              <div className="flex gap-3">
                {isEditing ? (
                  <button 
                    onClick={saveNote}
                    className="flex items-center gap-2 px-6 py-3 bg-[#FF6B6B] text-white font-bold rounded-2xl shadow-lg shadow-[#FF6B6B]/20"
                  >
                    <Save size={18} /> Save
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#F5F5F5] text-[#1A1A1A] font-bold rounded-2xl hover:bg-[#E5E5E5]"
                  >
                    <Edit3 size={18} /> Edit
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 p-10 overflow-y-auto">
              {isEditing ? (
                <textarea 
                  value={activeNote.content}
                  onChange={(e) => setActiveNote({ ...activeNote, content: e.target.value })}
                  placeholder="Start writing your thoughts..."
                  className="w-full h-full text-lg leading-relaxed resize-none outline-none font-medium text-[#4A4A4A]"
                />
              ) : (
                <div className="prose prose-lg max-w-none text-[#4A4A4A] font-medium leading-relaxed whitespace-pre-wrap">
                  {activeNote.content || <span className="text-[#8E8E8E] italic">This note is empty. Click edit to start writing.</span>}
                </div>
              )}
            </div>
            <div className="p-6 bg-[#FDFCFB] border-t border-[#E5E5E5] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#8E8E8E] text-xs font-bold">
                <Sparkles size={14} className="text-[#FF6B6B]" />
                AI SUGGESTION: ADD TAGS FOR BETTER ORGANIZATION
              </div>
              <button className="text-[#FF6B6B] font-bold text-sm flex items-center gap-1 hover:underline">
                Convert to Quiz <ChevronRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-[#F5F5F5] rounded-[2rem] flex items-center justify-center mb-6">
              <StickyNote size={48} className="text-[#E5E5E5]" />
            </div>
            <h3 className="text-2xl font-black mb-2">Select a note to view</h3>
            <p className="text-[#8E8E8E] max-w-xs">Choose a note from the sidebar or create a new one to get started.</p>
            <button 
              onClick={createNote}
              className="mt-8 px-8 py-4 bg-[#1A1A1A] text-white font-bold rounded-2xl"
            >
              Create New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
