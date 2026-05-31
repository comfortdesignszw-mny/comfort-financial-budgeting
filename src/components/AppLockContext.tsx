import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getPinHash, hashPin, savePinHash } from '../utils/crypto';
import AppLockScreen from './AppLockScreen';

interface AppLockContextType {
  isLocked: boolean;
  isConfigured: boolean;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  refreshConfig: () => void;
  resetPin: (pin: string) => Promise<void>;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

export function AppLockProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hash = getPinHash();
    if (hash) {
      setIsConfigured(true);
      setIsLocked(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isConfigured) {
        setIsLocked(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConfigured]);

  const refreshConfig = () => {
    const hash = getPinHash();
    if (hash) {
      setIsConfigured(true);
    } else {
      setIsConfigured(false);
      setIsLocked(false);
    }
  };

  const unlock = async (pin: string): Promise<boolean> => {
    const storedHash = getPinHash();
    if (!storedHash) return true;
    
    const inputHash = await hashPin(pin);
    if (inputHash === storedHash) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lock = () => {
    if (isConfigured) {
      setIsLocked(true);
    }
  };

  const resetPin = async (newPin: string) => {
    const hash = await hashPin(newPin);
    savePinHash(hash);
    setIsConfigured(true);
    setIsLocked(false);
  };

  if (loading) return null;

  return (
    <AppLockContext.Provider value={{ isLocked, isConfigured, unlock, lock, refreshConfig, resetPin }}>
      {isLocked ? <AppLockScreen onUnlock={unlock} onResetPin={resetPin} /> : children}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (context === undefined) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
}

