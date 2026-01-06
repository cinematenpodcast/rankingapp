import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { SetupTools } from './SetupTools';
import { LogIn } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [canAccessSetup, setCanAccessSetup] = useState(false);

  // Check for URL parameter to enable setup mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('setup') === 'true') {
      setCanAccessSetup(true);
      setShowSetup(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Append fake domain to username to satisfy Firebase Auth requirements
      const email = `${username.toLowerCase().trim()}@cinematen.ranking`;
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setError('Invalid username or password.');
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 font-sans flex flex-col">
      
      {/* Header Section (Always Dark Background) */}
      <div className="w-full bg-gradient-to-r from-[#240b36] to-[#1e40af] py-12 px-4 shadow-xl text-center">
        <img 
          src="https://www.cinematen.be/images/LogoCleanSmaller.png" 
          alt="Cinematen Logo" 
          className="h-20 w-auto object-contain mx-auto mb-6 drop-shadow-lg"
        />
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-wide uppercase drop-shadow-md">
          Cinematen Ranker
        </h1>
      </div>

      {/* Card Section (Below the Header) */}
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-white/50 backdrop-blur-sm">
            <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Username</label>
                <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#22d3ee] focus:border-transparent focus:outline-none transition-all placeholder-gray-400 font-medium"
                placeholder="Naam"
                required 
                />
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#22d3ee] focus:border-transparent focus:outline-none transition-all placeholder-gray-400 font-medium"
                placeholder="••••••••"
                required 
                />
            </div>

            {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center justify-center font-medium">{error}</div>}

            <button 
                type="submit" 
                className="w-full bg-[#22d3ee] hover:bg-[#06b6d4] text-black p-4 rounded-xl font-black shadow-lg hover:shadow-cyan-200/50 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
            >
                <LogIn size={20} className="stroke-[3]" /> Login
            </button>
            </form>

            {/* ONLY SHOW IF URL HAS ?setup=true */}
            {canAccessSetup && (
                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <button 
                        onClick={() => setShowSetup(!showSetup)}
                        className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors font-medium"
                    >
                        {showSetup ? 'Sluit Setup Tools' : 'Setup accounts'}
                    </button>
                    
                    {showSetup && <SetupTools />}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
