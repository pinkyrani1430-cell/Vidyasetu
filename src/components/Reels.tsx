import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  User, 
  Plus, 
  Sparkles,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { getAIResponse } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

const MOCK_REELS = [
  {
    id: 1,
    video: 'https://assets.mixkit.co/videos/preview/mixkit-girl-studying-with-her-laptop-at-home-4245-large.mp4',
    author: 'Prof. Sharma',
    title: 'Top 5 Python Tips',
    likes: '12.4k',
    comments: '1.2k',
    tags: ['#coding', '#python', '#tips'],
    topic: 'Python programming best practices'
  },
  {
    id: 2,
    video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-on-a-laptop-in-a-cafe-4344-large.mp4',
    author: 'Dr. Emily',
    title: 'AI Ethics in 60 Seconds',
    likes: '8.9k',
    comments: '450',
    tags: ['#ai', '#ethics', '#tech'],
    topic: 'Ethical considerations in artificial intelligence'
  },
  {
    id: 3,
    video: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-on-his-laptop-in-a-coffee-shop-4345-large.mp4',
    author: 'Tech Guru',
    title: 'How to build a PWA',
    likes: '15.2k',
    comments: '2.1k',
    tags: ['#webdev', '#pwa', '#javascript'],
    topic: 'Progressive Web App development'
  }
];

export default function Reels() {
  const { profile } = useAuth();
  const [activeReel, setActiveReel] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [liked, setLiked] = useState<number[]>([]);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
      if (index !== activeReel) {
        setActiveReel(index);
        setExplanation(null);
      }
    }
  };

  const handleExplain = async () => {
    setIsExplaining(true);
    try {
      const reel = MOCK_REELS[activeReel];
      const res = await getAIResponse(`Explain the key concepts of ${reel.topic} in 3 bullet points.`, "You are a helpful educational assistant.");
      setExplanation(res || "Could not generate explanation.");
    } catch (err) {
      setExplanation("Error connecting to AI service.");
    }
    setIsExplaining(false);
  };

  const toggleLike = (id: number) => {
    setLiked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleBookmark = (id: number) => {
    setBookmarked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-md mx-auto h-[calc(100vh-160px)] bg-black rounded-[2.5rem] overflow-hidden relative shadow-2xl border-8 border-[#1A1A1A]">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {MOCK_REELS.map((reel, i) => (
          <div key={reel.id} className="h-full w-full snap-start relative group">
            <video 
              src={reel.video}
              autoPlay={i === activeReel && isPlaying}
              loop
              muted={isMuted}
              className="h-full w-full object-cover"
              onClick={() => setIsPlaying(!isPlaying)}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
            
            {/* Controls */}
            <div className="absolute top-6 right-6 flex flex-col gap-4 z-20">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>

            {/* AI Badge */}
            <div className="absolute top-6 left-6 z-20">
              <div className="flex items-center gap-2 bg-[#FF6B6B] text-white px-3 py-1.5 rounded-full text-xs font-black tracking-widest shadow-lg shadow-[#FF6B6B]/40">
                <Sparkles size={12} /> AI GENERATED
              </div>
            </div>

            {/* Interaction Bar */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-20">
              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => toggleLike(reel.id)}
                  className={cn(
                    "p-3 bg-black/20 backdrop-blur-md rounded-full transition-all",
                    liked.includes(reel.id) ? "text-[#FF6B6B]" : "text-white"
                  )}
                >
                  <Heart size={28} fill={liked.includes(reel.id) ? "#FF6B6B" : "none"} />
                </button>
                <span className="text-white text-xs font-bold">{reel.likes}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:text-[#FF6B6B] transition-all">
                  <MessageCircle size={28} />
                </button>
                <span className="text-white text-xs font-bold">{reel.comments}</span>
              </div>
              <button 
                onClick={() => toggleBookmark(reel.id)}
                className={cn(
                  "p-3 bg-black/20 backdrop-blur-md rounded-full transition-all",
                  bookmarked.includes(reel.id) ? "text-[#FFD93D]" : "text-white"
                )}
              >
                <Bookmark size={28} fill={bookmarked.includes(reel.id) ? "#FFD93D" : "none"} />
              </button>
              <button 
                onClick={handleExplain}
                disabled={isExplaining}
                className="p-3 bg-[#FF6B6B] rounded-full text-white shadow-lg shadow-[#FF6B6B]/40 hover:scale-110 transition-all"
              >
                <Sparkles size={28} />
              </button>
            </div>

            {/* Info */}
            <div className="absolute bottom-8 left-8 right-16 z-20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#FF6B6B] border-2 border-white flex items-center justify-center text-white font-bold">
                  {reel.author[0]}
                </div>
                <span className="text-white font-bold">@{reel.author}</span>
                <button className="px-4 py-1 bg-white text-black text-xs font-bold rounded-full">Follow</button>
              </div>
              <h4 className="text-white font-bold text-lg mb-2">{reel.title}</h4>
              <div className="flex gap-2">
                {reel.tags.map(tag => (
                  <span key={tag} className="text-white/60 text-xs font-medium">{tag}</span>
                ))}
              </div>
            </div>

            {/* AI Explanation Modal */}
            <AnimatePresence>
              {explanation && (
                <motion.div 
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl p-8 rounded-t-[2rem] z-40 border-t border-[#E5E5E5]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[#FF6B6B]">
                      <Sparkles size={20} />
                      <span className="font-black text-sm uppercase tracking-widest">AI Explanation</span>
                    </div>
                    <button onClick={() => setExplanation(null)} className="text-[#8E8E8E] hover:text-[#1A1A1A]">
                      <Plus className="rotate-45" size={24} />
                    </button>
                  </div>
                  <div className="text-sm text-[#1A1A1A] leading-relaxed prose prose-sm">
                    <ReactMarkdown>{explanation}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-6 bg-black/40 backdrop-blur-md rounded-full text-white"
                >
                  <Play size={48} fill="white" />
                </motion.div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Teacher Upload Button */}
      {profile?.role === 'teacher' && (
        <button className="absolute bottom-6 left-1/2 -translate-x-1/2 p-4 bg-[#FF6B6B] text-white rounded-full shadow-2xl shadow-[#FF6B6B]/40 z-40 hover:scale-110 transition-transform">
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
