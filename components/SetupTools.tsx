import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, migrateGlobalDataToUser, saveRankingData } from '../services/firebase';
import { MAARTEN_2025_FILMS, MAARTEN_2025_SERIES, hydrateInitialData } from '../constants';
import { Database, UserPlus, AlertCircle } from 'lucide-react';

export const SetupTools = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to check valid username
  const isValidUsername = (u: string) => /^[a-zA-Z0-9_]+$/.test(u);

  // Setup Yorrick
  const createYorrick = async () => {
    if (!username || !password) return;
    if (!isValidUsername(username)) {
        setStatus("Username can only contain letters, numbers, and underscores.");
        return;
    }
    
    setIsProcessing(true);
    setStatus('Creating Yorrick account...');
    
    try {
      const email = `${username.toLowerCase().trim()}@cinematen.ranking`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username }); // Use username as displayName
      
      setStatus('Migrating 2025 data from global...');
      const success = await migrateGlobalDataToUser(userCredential.user.uid);
      
      if (success) {
        setStatus('Success! Account created & data migrated.');
        setUsername('');
        setPassword('');
      } else {
        setStatus('Account created, but data migration failed.');
      }
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
          setStatus('Username already exists.');
      } else {
          setStatus(`Error: ${e.message}`);
      }
    }
    setIsProcessing(false);
  };

  // Setup Maarten
  const createMaarten = async () => {
    if (!username || !password) return;
    if (!isValidUsername(username)) {
        setStatus("Username can only contain letters, numbers, and underscores.");
        return;
    }

    setIsProcessing(true);
    setStatus('Creating Maarten account...');
    
    try {
      const email = `${username.toLowerCase().trim()}@cinematen.ranking`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });
      
      setStatus('Injecting Maarten\'s 2025 Top 10...');
      const userId = userCredential.user.uid;

      // Hydrate & Save 2025 Films
      const rankedFilms = hydrateInitialData(MAARTEN_2025_FILMS, 'FILM');
      await saveRankingData(userId, 2025, 'FILM', rankedFilms, []);

      // Hydrate & Save 2025 Series
      const rankedSeries = hydrateInitialData(MAARTEN_2025_SERIES, 'SERIES');
      await saveRankingData(userId, 2025, 'SERIES', rankedSeries, []);

      setStatus('Success! Account created & 2025 data injected.');
      setUsername('');
      setPassword('');
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
          setStatus('Username already exists.');
      } else {
          setStatus(`Error: ${e.message}`);
      }
    }
    setIsProcessing(false);
  };

  return (
    <div className="bg-blue-50/50 p-6 rounded-xl mt-8 border border-blue-100 text-left">
      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
        <Database size={16} /> Setup Console
      </h3>
      
      <div className="space-y-4">
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Username</label>
            <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-[#22d3ee] focus:outline-none placeholder-gray-400 font-medium"
                placeholder="Naam"
            />
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Password</label>
            <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-[#22d3ee] focus:outline-none placeholder-gray-400 font-medium"
                placeholder="********"
            />
        </div>

        <div className="flex gap-2 flex-col sm:flex-row pt-2">
            <button
                onClick={createYorrick}
                disabled={isProcessing || !username || !password}
                className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-wide transition-colors shadow-sm"
            >
                <UserPlus size={14} /> Yorrick Setup
            </button>
            <button
                onClick={createMaarten}
                disabled={isProcessing || !username || !password}
                className="flex-1 bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-wide transition-colors shadow-sm"
            >
                <UserPlus size={14} /> Maarten Setup
            </button>
        </div>

        {status && (
            <div className={`p-3 rounded-lg text-xs font-bold border ${status.includes('Success') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {status}
            </div>
        )}
        
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <AlertCircle size={10} />
            Use this only for initial account creation.
        </p>
      </div>
    </div>
  );
};
