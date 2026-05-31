import React, { useState } from 'react';
import { Shield, Delete } from 'lucide-react';

export default function AppLockScreen({ onUnlock }: { onUnlock: (pin: string) => Promise<boolean> }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = async (key: string) => {
    if (error) {
      setError(false);
      setPin('');
    }
    
    if (key === 'delete') {
      setPin(prev => prev.slice(0, -1));
      return;
    }

    if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      
      if (newPin.length === 4) {
        const success = await onUnlock(newPin);
        if (!success) {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 z-[99999]">
      <div className="flex flex-col items-center max-w-sm w-full">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-200 dark:border-blue-800">
          <Shield size={32} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">App Locked</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">Enter your 4-digit PIN to access your data.</p>
        
        <div className={`flex gap-6 mb-12 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full transition-all duration-200 ${pin.length > i ? 'bg-blue-600 dark:bg-blue-500 scale-125 shadow-md shadow-blue-500/20' : 'bg-slate-200 dark:bg-slate-800'}`}
            />
          ))}
        </div>
        
        <div className="h-4 relative mb-4 flex items-center justify-center w-full">
            {error && <p className="text-xs font-bold text-red-500 absolute w-full text-center">Incorrect PIN. Try again.</p>}
        </div>

        <div className="grid grid-cols-3 gap-5 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="h-16 rounded-full text-2xl font-semibold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 shadow-sm"
            >
              {num}
            </button>
          ))}
          <div className="h-16"></div>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-full text-2xl font-semibold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 shadow-sm"
          >
            0
          </button>
          <button
            onClick={() => handleKeyPress('delete')}
             className="h-16 rounded-full text-sm font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition active:scale-95 shadow-sm"
          >
             <Delete size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
