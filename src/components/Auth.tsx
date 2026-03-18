import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles,
  GraduationCap,
  Presentation
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Profile will be created by AuthContext listener
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFCFB]">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3rem] overflow-hidden border border-[#E5E5E5] shadow-2xl">
        {/* Left: Form */}
        <div className="p-12 lg:p-20">
          <div className="mb-12">
            <h1 className="text-4xl font-black tracking-tighter text-[#FF6B6B] mb-2">VIDYASETU</h1>
            <p className="text-[#8E8E8E] font-medium">Your AI-powered learning bridge.</p>
          </div>

          <div className="flex gap-4 mb-10 p-1.5 bg-[#F5F5F5] rounded-2xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
                isLogin ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#8E8E8E]"
              )}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
                !isLogin ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#8E8E8E]"
              )}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button 
                  type="button"
                  onClick={() => setRole('student')}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                    role === 'student' ? "border-[#FF6B6B] bg-[#FFF5F5] text-[#FF6B6B]" : "border-[#E5E5E5] text-[#8E8E8E]"
                  )}
                >
                  <GraduationCap size={24} />
                  <span className="text-xs font-bold uppercase tracking-widest">Student</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                    role === 'teacher' ? "border-[#FF6B6B] bg-[#FFF5F5] text-[#FF6B6B]" : "border-[#E5E5E5] text-[#8E8E8E]"
                  )}
                >
                  <Presentation size={24} />
                  <span className="text-xs font-bold uppercase tracking-widest">Teacher</span>
                </button>
              </div>
            )}

            <div className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E8E]" size={20} />
                  <input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-[#F5F5F5] border-none rounded-2xl py-4 pl-12 pr-4 font-medium focus:ring-2 focus:ring-[#FF6B6B]"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E8E]" size={20} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-[#F5F5F5] border-none rounded-2xl py-4 pl-12 pr-4 font-medium focus:ring-2 focus:ring-[#FF6B6B]"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E8E]" size={20} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-[#F5F5F5] border-none rounded-2xl py-4 pl-12 pr-4 font-medium focus:ring-2 focus:ring-[#FF6B6B]"
                />
              </div>
            </div>

            {error && <p className="text-[#FF6B6B] text-sm font-medium">{error}</p>}

            <button 
              disabled={loading}
              className="w-full py-4 bg-[#FF6B6B] text-white font-bold rounded-2xl shadow-xl shadow-[#FF6B6B]/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={20} />
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E5E5]"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-[#8E8E8E] font-bold">Or continue with</span></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-4 bg-white border-2 border-[#E5E5E5] text-[#1A1A1A] font-bold rounded-2xl hover:bg-[#F5F5F5] transition-all flex items-center justify-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Google Account
            </button>
          </form>
        </div>

        {/* Right: Branding */}
        <div className="hidden lg:flex bg-[#FF6B6B] p-20 flex-col justify-center relative overflow-hidden">
          <div className="relative z-10 text-white">
            <Sparkles className="w-16 h-16 mb-8" />
            <h2 className="text-5xl font-black leading-tight mb-6">Unlock your <br />learning DNA.</h2>
            <p className="text-xl opacity-90 leading-relaxed">Join thousands of students and teachers in the world's most advanced learning workspace.</p>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-20 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
