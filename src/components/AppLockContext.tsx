import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getPinHash, hashPin } from '../utils/crypto';
import AppLockScreen from './AppLockScreen';

interface AppLockContextType {
  isLocked: boolean;
  isConfigured: boolean;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  refreshConfig: () => void;
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

  if (loading) return null;

  return (
    <AppLockContext.Provider value={{ isLocked, isConfigured, unlock, lock, refreshConfig }}>
      {isLocked ? <AppLockScreen onUnlock={unlock} /> : children}
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
