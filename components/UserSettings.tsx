import React, { useState } from 'react';
import { updatePassword, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { X, LogOut, Key, Check, Trash2, AlertTriangle } from 'lucide-react';
import { Category } from '../types';

interface UserSettingsProps {
  onClose: () => void;
  selectedYear: number;
  onReset: (category: Category) => void;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ onClose, selectedYear, onReset }) => {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState<Category | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPassword) return;

    try {
      await updatePassword(user, newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
    } catch (e: any) {
      setMessage({ type: 'error', text: 'Error updating password. You may need to re-login.' });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
  };

  const executeReset = (category: Category) => {
    onReset(category);
    setConfirmReset(null);
    setMessage({ type: 'success', text: `${category === 'FILM' ? 'Movies' : 'Series'} list for ${selectedYear} has been reset.` });
  };

  // Get display name (username) or strip domain from email if display name is missing
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="bg-gray-100 p-4 flex justify-between items-center border-b border-gray-200 sticky top-0">
          <h2 className="font-bold text-gray-800 text-lg">Account Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* User Info */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Signed in as</label>
            <div className="text-xl font-bold text-gray-800">{displayName}</div>
          </div>

          {/* Password Change */}
          <form onSubmit={handleUpdatePassword}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Change Password</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="flex-grow p-2 border border-gray-300 rounded focus:ring-2 focus:ring-movie-600 focus:outline-none"
                minLength={6}
              />
              <button 
                type="submit"
                disabled={!newPassword}
                className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-black disabled:opacity-50 transition-colors"
              >
                <Key size={18} />
              </button>
            </div>
          </form>

          {/* Danger Zone / Data Management */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-red-600 font-bold mb-3 flex items-center gap-2">
                <AlertTriangle size={18} /> Data Management ({selectedYear})
            </h3>
            <p className="text-xs text-gray-500 mb-4">
                If your list for {selectedYear} contains incorrect data or you want to start fresh, you can reset it here. 
                <br /><strong className="text-red-500">Warning: This action cannot be undone.</strong>
            </p>

            <div className="space-y-3">
                {/* Reset Movies */}
                {confirmReset === 'FILM' ? (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-center justify-between animate-fade-in">
                        <span className="text-sm text-red-700 font-bold">Are you sure?</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setConfirmReset(null)}
                                className="px-3 py-1 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => executeReset('FILM')}
                                className="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700"
                            >
                                Confirm Reset
                            </button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => setConfirmReset('FILM')}
                        className="w-full border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={16} /> Reset Movies List ({selectedYear})
                    </button>
                )}

                {/* Reset Series */}
                {confirmReset === 'SERIES' ? (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-center justify-between animate-fade-in">
                        <span className="text-sm text-red-700 font-bold">Are you sure?</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setConfirmReset(null)}
                                className="px-3 py-1 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => executeReset('SERIES')}
                                className="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700"
                            >
                                Confirm Reset
                            </button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => setConfirmReset('SERIES')}
                        className="w-full border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={16} /> Reset Series List ({selectedYear})
                    </button>
                )}
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' && <Check size={14} />}
              {message.text}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <button
                onClick={handleLogout}
                className="w-full border-2 border-red-100 text-red-600 bg-red-50 hover:bg-red-100 hover:border-red-200 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
            >
                <LogOut size={20} /> Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
