/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Wallet, UserCog, Download, Upload, Trash2, Save, 
  Menu, X, CheckCircle, ShieldAlert, BadgeDollarSign, Info, CheckCircle2, Heart, Scale, ShieldCheck,
  Sun, Moon, Sparkles, Smartphone, Laptop, Check, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppData, CurrencyType } from './types';
import { initialSampleData } from './sampleData';
import { formatCurrency, currencySymbols } from './utils';
import PersonalSection from './components/PersonalSection';
import BusinessSection from './components/BusinessSection';
import SchedulerSection from './components/SchedulerSection';
import comfortLogo from './assets/images/comfort_logo_brand_1779617398401.png';

export default function App() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const stored = localStorage.getItem('comfortBudgetingData');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Discard legacy sample data to guarantee a pristine, empty workspace for personalization
        if (
          parsed &&
          parsed.profile &&
          (parsed.profile.name === 'Jane Doe' ||
           parsed.profile.email === 'jane.doe@example.com' ||
           parsed.transactions?.some((t: any) => t.description === 'Weekly Groceries' || t.description === 'Grocery Run') ||
           parsed.businessTransactions?.some((t: any) => t.customerName === 'Acme Corp' || t.description?.includes('Acme'))
          )
        ) {
          localStorage.setItem('comfortBudgetingData', JSON.stringify(initialSampleData));
          return initialSampleData;
        }
        // Ensure all arrays are initialized to prevent crashes on legacy local data structures
        const validated: AppData = {
          ...initialSampleData,
          ...parsed,
          profile: {
            ...initialSampleData.profile,
            ...(parsed.profile || {})
          },
          transactions: parsed.transactions || [],
          budgets: parsed.budgets || [],
          businessInvestments: parsed.businessInvestments || [],
          businessTransactions: parsed.businessTransactions || [],
          businessOweItems: parsed.businessOweItems || [],
          businessAssets: parsed.businessAssets || [],
          currentStockProducts: parsed.currentStockProducts || [],
          notes: parsed.notes || initialSampleData.notes || [],
          events: parsed.events || initialSampleData.events || []
        };
        return validated;
      }
    } catch (e) {
      console.error('Error loading localStorage, falling back to sample data', e);
    }
    return initialSampleData;
  });

  // Active workspace section
  const [dataSpace, setDataSpace] = useState<'personal' | 'business' | 'profile' | 'scheduler'>('personal');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Redirect to Scheduler space immediately if a shared schedule deep-link is opened
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('share_event')) {
        setDataSpace('scheduler');
      }
    } catch (e) {
      console.warn('URL parsing error', e);
    }
  }, []);
  
  // Profile Form fields
  const [profileName, setProfileName] = useState(data.profile.name);
  const [profileEmail, setProfileEmail] = useState(data.profile.email);
  const [profileCurrency, setProfileCurrency] = useState<CurrencyType>(data.profile.currency);
  const [profileSavingsTarget, setProfileSavingsTarget] = useState(data.profile.savingsTarget.toString());
  const [profileSavingsGoal, setProfileSavingsGoal] = useState(data.profile.savingsGoal);

  // Company Profile states
  const [companyName, setCompanyName] = useState(data.profile.companyName || '');
  const [companyPhone, setCompanyPhone] = useState(data.profile.companyPhone || '');
  const [companyEmail, setCompanyEmail] = useState(data.profile.companyEmail || '');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'tos' | 'privacy' | null>(null);
  
  // Theme Switching state and side-effect
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem('comfortBudgetingTheme');
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('comfortBudgetingTheme', theme);
  }, [theme]);

  // PWA beforeinstallprompt hooks and handlers for desktop and mobile
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstallable, setIsAppInstallable] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [pwaInstalledStatus, setPwaInstalledStatus] = useState<boolean>(() => {
    try {
      return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    } catch {
      return false;
    }
  });

  const [platformInfo, setPlatformInfo] = useState({
    isIOS: false,
    isSafari: false,
    isAndroid: false,
    isChrome: false,
    isFirefox: false,
    isEdge: false,
    isDesktop: true
  });

  useEffect(() => {
    // Environment detection
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isChrome = /Chrome|Chromium|CriOS/i.test(ua);
    const isFirefox = /Firefox/i.test(ua);
    const isEdge = /Edg/i.test(ua);
    const isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

    setPlatformInfo({
      isIOS,
      isSafari,
      isAndroid,
      isChrome,
      isFirefox,
      isEdge,
      isDesktop
    });

    setPwaInstalledStatus(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent automatic prompt show
      e.preventDefault();
      // Store event
      setDeferredPrompt(e);
      setIsAppInstallable(true);
      
      setNotification({
        title: 'Native Companion App Ready 📱',
        message: 'Comfort Budgeting can now be installed directly on your device. Click "Install Mobile App" in the sidebar for single-tap download!',
        type: 'info'
      });
    };

    const handleAppInstalled = () => {
      console.log('[Comfort App] App was installed successfully via event listener.');
      setIsAppInstallable(false);
      setDeferredPrompt(null);
      setPwaInstalledStatus(true);
      
      setNotification({
        title: 'App Installed! 🎉',
        message: 'Thank you for installing Comfort Budgeting! It is now accessible directly from your application launcher or home screen.',
        type: 'success'
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Dynamic display mode observation
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (evt: MediaQueryListEvent) => {
      setPwaInstalledStatus(evt.matches);
    };
    try {
      mediaQuery.addEventListener('change', handleDisplayChange);
    } catch {
      mediaQuery.addListener(handleDisplayChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      try {
        mediaQuery.removeEventListener('change', handleDisplayChange);
      } catch {
        mediaQuery.removeListener(handleDisplayChange);
      }
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[Comfort App] User prompt response outcome: ${outcome}`);
        if (outcome === 'accepted') {
          setPwaInstalledStatus(true);
          setIsAppInstallable(false);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error('[Comfort Install App Prompt Error]', err);
      }
    } else {
      // Fallback modal guides
      setShowInstallGuide(true);
    }
  };

  // Custom popup notification state (instead of standard alerts for a premium feel in iFrames)
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'info' | 'error';
    details?: { label: string; value: string }[];
  } | null>(null);

  // Auto-dismiss popup notification after 4.5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Sync back to localstorage whenever data state gets modified
  useEffect(() => {
    localStorage.setItem('comfortBudgetingData', JSON.stringify(data));
    // Also sync local profiling fields
    setProfileName(data.profile.name);
    setProfileEmail(data.profile.email);
    setProfileCurrency(data.profile.currency);
    setProfileSavingsTarget(data.profile.savingsTarget.toString());
    setProfileSavingsGoal(data.profile.savingsGoal);
    setCompanyName(data.profile.companyName || '');
    setCompanyPhone(data.profile.companyPhone || '');
    setCompanyEmail(data.profile.companyEmail || '');
  }, [data]);

  // Synchronize dynamic local data changes across concurrent windows/tabs as first source of truth
  useEffect(() => {
    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === 'comfortBudgetingData' && event.newValue) {
        try {
          const parsedData = JSON.parse(event.newValue);
          setData(parsedData);
          setNotification({
            title: 'Data Synced Instantly',
            message: 'Comfort system retrieved the latest data modifications directly from local storage.',
            type: 'info'
          });
        } catch (err) {
          console.error('[Comfort Admin] Failed to parse cross-window synchronized local storage data:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  const handleUpdateData = (newData: AppData) => {
    setData(newData);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(profileSavingsTarget);
    if (isNaN(target) || target < 0) {
      setNotification({
        title: 'Validation Error',
        message: 'Please enter a valid numeric value for the monthly target savings limit.',
        type: 'error'
      });
      return;
    }

    const updated = {
      ...data,
      profile: {
        ...data.profile,
        name: profileName.trim() || 'User',
        email: profileEmail.trim(),
        currency: profileCurrency,
        savingsTarget: target,
        savingsGoal: profileSavingsGoal.trim() || 'Savings Goal'
      }
    };
    setData(updated);
    setNotification({
      title: 'Personal Settings Updated',
      message: 'Your system identifier details and primary savings threshold targets have been successfully committed to local sandbox memory.',
      type: 'success',
      details: [
        { label: 'Full User Name', value: profileName.trim() || 'User' },
        { label: 'Email Address', value: profileEmail.trim() || 'Not Configured' },
        { label: 'Active Currency', value: profileCurrency },
        { label: 'Monthly Ceiling Target', value: `${currencySymbols[profileCurrency]} ${target.toLocaleString()}` },
        { label: 'Ceiling Label', value: profileSavingsGoal.trim() || 'Savings Goal' }
      ]
    });
  };

  const handleSaveCompanyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...data,
      profile: {
        ...data.profile,
        companyName: companyName.trim(),
        companyPhone: companyPhone.trim(),
        companyEmail: companyEmail.trim()
      }
    };
    setData(updated);
    setNotification({
      title: 'Company Profile Updated',
      message: 'Your corporate business credentials and contact details have been successfully saved offline to this device.',
      type: 'success',
      details: [
        { label: 'Company Name', value: companyName.trim() || 'Not Provided (Standard Entity)' },
        { label: 'Phone Number', value: companyPhone.trim() || 'Not Provided (No Contact Number)' },
        { label: 'Email Address', value: companyEmail.trim() || 'Not Provided (No Billing Email)' }
      ]
    });
  };

  // 1. Export Data Backup
  const handleExportDataBackup = () => {
    try {
      const dataString = JSON.stringify(data, null, 2);
      const blob = new Blob([dataString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comfort-financial-budgeting-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotification({
        title: 'Backup Created Successfully',
        message: 'Your local database archive file (.json) was generated and downloaded. Store it safely to restore your records anytime!',
        type: 'success'
      });
    } catch (e) {
      setNotification({
        title: 'Backup Failed',
        message: 'There was an error while trying to package and export your active workspace database.',
        type: 'error'
      });
    }
  };

  // 2. Import Data Backup
  const handleImportDataBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && imported.profile && imported.transactions) {
          setData(imported);
          setNotification({
            title: 'Database Restored Successfully',
            message: 'All personal transactions, budgets, cashflows, and corporate profiles have been successfully loaded and updated.',
            type: 'success',
            details: [
              { label: 'Imported User', value: imported.profile.name || 'User' },
              { label: 'Imported Company', value: imported.profile.companyName || 'None' },
              { label: 'Source Backup Currency', value: imported.profile.currency || 'USD' }
            ]
          });
        } else {
          setNotification({
            title: 'Invalid Backup File',
            message: 'The structure of the JSON file uploaded is invalid or incompatible with the Comfort Budgeting schema.',
            type: 'error'
          });
        }
      } catch (err) {
        setNotification({
          title: 'Import Error',
          message: 'Could not parse the selected file. Please make sure you are selecting a valid backup file (.json).',
          type: 'error'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // clear input
  };

  // 3. Complete Reset Database
  const handleResetDatabase = () => {
    const freshData: AppData = {
      profile: {
        name: 'Comfort User',
        email: '',
        currency: 'USD',
        savingsTarget: 1000,
        savingsGoal: 'Savings Goal',
        createdAt: new Date().toISOString(),
        companyName: '',
        companyPhone: '',
        companyEmail: ''
      },
      transactions: [],
      budgets: [],
      businessInvestments: [],
      businessTransactions: [],
      businessOweItems: []
    };
    setData(freshData);
    setDataSpace('personal');
    setShowResetConfirm(false);
    setNotification({
      title: 'Database Purged',
      message: 'Safety wipe was fully executed. Your browser database and corporate profile settings are now reset back to factory defaults.',
      type: 'info'
    });
  };

  const activeSpaceName = dataSpace === 'personal' 
    ? 'Personal Section (Comfort Budgeting)' 
    : dataSpace === 'business' 
    ? 'Business Section (CashFlow Simple)' 
    : dataSpace === 'scheduler'
    ? 'Sandbox Calendar & Notes'
    : 'Universal Settings';

  const userInitials = data.profile.name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans antialiased text-[16px]">
      
      {/* Mobile Header Bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 font-sans">
        <button 
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <img
            src={comfortLogo}
            alt="Comfort Financial Budgeting logo"
            className="w-7 h-7 object-cover rounded-lg border border-teal-500/25 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <span className="font-extrabold text-[#0D9488] text-sm">Comfort Budgeting</span>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Mobile Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-200 cursor-pointer flex items-center justify-center"
            title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-500" />}
          </button>
          
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-teal-600">
            {userInitials}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-row relative">
        
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-900/40 z-[990] backdrop-blur-sm"
          />
        )}

        {/* Master Sidebar Drawer */}
        <aside className={`
          fixed lg:static top-0 bottom-0 left-0 z-[1000] lg:z-10
          w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
          p-6 flex flex-col transition-transform duration-300 ease-in-out shrink-0
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          
          {/* Close drawer (Mobile) */}
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>

          {/* Branded Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <img
                src={comfortLogo}
                alt="Comfort Logo Icon"
                className="w-11 h-11 object-cover rounded-xl shadow-md shrink-0 border border-teal-500/10"
                referrerPolicy="no-referrer"
              />
              <div>
                <h2 className="font-extrabold text-teal-600 dark:text-teal-400 text-base leading-tight font-sans">
                  Comfort Budgeting
                </h2>
                <span className="text-[10px] text-slate-400 block tracking-wide">Financial Management</span>
              </div>
            </div>
            {/* Desktop Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition duration-200 cursor-pointer flex items-center justify-center shrink-0"
              title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-500" />}
            </button>
          </div>

          {/* Dual Workspace Toggle pill panel */}
          <div className="space-y-4 flex-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-2">Workspace Rooms</div>
            
            <button
              onClick={() => { setDataSpace('personal'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left p-3 rounded-xl transition-all font-semibold flex items-center gap-3 cursor-pointer ${
                dataSpace === 'personal'
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 ring-1 ring-teal-500/20 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <CheckCircle size={18} className={dataSpace === 'personal' ? 'text-teal-500' : 'text-slate-400'} />
              <div className="text-xs">
                <span className="block font-bold">Personal Section</span>
                <span className="text-[9px] text-slate-400">Comfort Budgeting</span>
              </div>
            </button>

            <button
              onClick={() => { setDataSpace('business'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left p-3 rounded-xl transition-all font-semibold flex items-center gap-3 cursor-pointer ${
                dataSpace === 'business'
                  ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 ring-1 ring-green-500/20 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <BadgeDollarSign size={18} className={dataSpace === 'business' ? 'text-green-500' : 'text-slate-400'} />
              <div className="text-xs">
                <span className="block font-bold">Business Section</span>
                <span className="text-[9px] text-slate-400">CashFlow Simple</span>
              </div>
            </button>

            <button
              onClick={() => { setDataSpace('scheduler'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left p-3 rounded-xl transition-all font-semibold flex items-center gap-3 cursor-pointer ${
                dataSpace === 'scheduler'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 ring-1 ring-blue-500/20 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Calendar size={18} className={dataSpace === 'scheduler' ? 'text-blue-500' : 'text-slate-400'} />
              <div className="text-xs">
                <span className="block font-bold">Notes & Scheduler</span>
                <span className="text-[9px] text-slate-400">Sandbox Calendar Suite</span>
              </div>
            </button>

            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-2 pt-4 mb-2">Configuration</div>

            <button
              onClick={() => { setDataSpace('profile'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left p-3 rounded-xl transition-all font-semibold flex items-center gap-3 cursor-pointer ${
                dataSpace === 'profile'
                  ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <UserCog size={18} className={dataSpace === 'profile' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'} />
              <span className="text-xs font-bold font-sans">Profile & Settings</span>
            </button>
          </div>

          {/* Native PWA Installation CTA */}
          <div className="p-3 mb-3 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                Companion App
              </span>
              {pwaInstalledStatus && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-[8px] font-extrabold rounded-sm uppercase tracking-wide">
                  <Check size={8} /> Active
                </span>
              )}
            </div>
            
            {pwaInstalledStatus ? (
              <div className="space-y-1">
                <p className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold leading-tight">
                  Running standalone client
                </p>
                <span className="text-[9px] text-slate-400 block leading-tight font-sans">
                  Uncompromised security, local sandbox engine active.
                </span>
              </div>
            ) : (
              <>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Access accounts offline anytime on your home screen launcher.
                </p>
                <button
                  onClick={handleInstallApp}
                  className={`w-full mt-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
                    isAppInstallable 
                      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-500/25' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {isAppInstallable ? <Sparkles size={11.5} className="text-amber-300 fill-amber-300 shrink-0" /> : <Download size={11.5} className="shrink-0" />}
                  <span>{isAppInstallable ? 'Install Native App' : 'How to Install'}</span>
                </button>
              </>
            )}
          </div>

          {/* Footer User Avatar summary card */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1 mt-auto">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 font-extrabold bg-gradient-to-r from-teal-500 to-green-600 text-white rounded-lg flex items-center justify-center text-xs">
                {userInitials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{data.profile.name}</p>
                <p className="text-[9px] truncate text-slate-400">{data.profile.email || 'Click profile settings'}</p>
              </div>
            </div>
            {data.profile.companyName && (
              <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800 flex items-center gap-1.5 text-[9px] text-slate-500 dark:text-slate-400">
                <span className="font-bold uppercase text-[8px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 px-1 rounded-sm shrink-0">Company</span>
                <span className="font-semibold truncate flex-1 text-right">{data.profile.companyName}</span>
              </div>
            )}
          </div>
        </aside>

        {/* Master Active Segment Panel */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          
          {/* Universal Header Branding bar */}
          <div className="pb-6 border-b border-slate-200 dark:border-slate-800 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={comfortLogo}
                alt="Comfort Financial Budgeting Logo"
                className="hidden md:block w-14 h-14 object-cover rounded-2xl border border-teal-500/10 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block mb-1">Comfort Financial Budgeting</span>
                <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans tracking-tight">
                  {activeSpaceName}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  A Business and Personal Financial Management Solution
                </p>
              </div>
            </div>
            
            {/* Display status of local date/time */}
            <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl self-start flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping shrink-0" />
              <span className="text-[11px] font-semibold text-slate-500 font-mono tracking-wider">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Workspace conditional routing */}
          {dataSpace === 'personal' && (
            <PersonalSection 
              data={data}
              onUpdateData={handleUpdateData}
              currency={data.profile.currency}
            />
          )}

          {dataSpace === 'business' && (
            <BusinessSection 
              data={data}
              onUpdateData={handleUpdateData}
              currency={data.profile.currency}
              theme={theme}
            />
          )}

          {dataSpace === 'scheduler' && (
            <SchedulerSection 
              data={data}
              onUpdateData={handleUpdateData}
              currency={data.profile.currency}
            />
          )}

          {dataSpace === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Universal Setting & profiling panels</h3>
                <p className="text-xs text-slate-400">Adjust configurations that span across both Comfort segments</p>
              </div>

              {/* Brand Logo & Asset Identity Center */}
              <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/15 dark:border-teal-500/20 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom duration-300">
                <img
                  src={comfortLogo}
                  alt="Comfort Logo Icon High Resolution"
                  className="w-20 h-20 object-cover rounded-2xl shadow-xl border-2 border-white dark:border-slate-800 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-2 flex-1 text-center md:text-left">
                  <span className="px-2.5 py-1 bg-teal-600/15 text-teal-700 dark:text-teal-400 text-[10px] font-extrabold uppercase rounded-full tracking-wider font-sans">
                    Universal Brand Identity Asset
                  </span>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-snug">
                    Comfort Financial Budgeting Logo Image
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                    This official brand logo image is integrated into all system dimensions, driving the <strong>Web App Favicon</strong>, <strong>Mobile / Desktop PWA homescreen launchers</strong>, and dynamic <strong>Social Share previews (OpenGraph metadata)</strong> to maintain corporate visibility across platforms.
                  </p>
                  <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-2.5">
                    <span className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[9px] font-semibold text-slate-500 dark:text-slate-400 rounded-lg">Web Favicon Active</span>
                    <span className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[9px] font-semibold text-slate-500 dark:text-slate-400 rounded-lg">PWA Apple Icon Active</span>
                    <span className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[9px] font-semibold text-slate-500 dark:text-slate-400 rounded-lg">OpenGraph Social Banner Active</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Profile Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1 px-2 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-450 text-[10px] font-bold uppercase rounded-md tracking-wider">
                      User Identity
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Personal Profiling</h4>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Workspace Main Currency</label>
                      <select
                        value={profileCurrency}
                        onChange={(e) => setProfileCurrency(e.target.value as CurrencyType)}
                        className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="CAD">CAD (C$)</option>
                        <option value="AUD">AUD (A$)</option>
                        <option value="NGN">NGN (₦)</option>
                        <option value="KES">KES (KSh)</option>
                        <option value="ZAR">ZAR (R)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Monthly Target</label>
                        <input
                          type="number"
                          value={profileSavingsTarget}
                          onChange={(e) => setProfileSavingsTarget(e.target.value)}
                          className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Target Label</label>
                        <input
                          type="text"
                          value={profileSavingsGoal}
                          onChange={(e) => setProfileSavingsGoal(e.target.value)}
                          className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                      <Save size={14} /> Update Personal Settings
                    </button>
                  </form>
                </div>

                {/* Company Profiling Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="p-1 px-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase rounded-md tracking-wider">
                        Business Entity
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Company Profile details</h4>
                    <p className="text-xs text-slate-400">Set up corporate identifier info saved locally with other user settings.</p>

                    <form onSubmit={handleSaveCompanyProfile} className="space-y-4 mt-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Company / Org Name</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Comfort Designs Shop"
                          className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                          placeholder="e.g. +1 (555) 018-9922"
                          className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          placeholder="e.g. billing@comfortdesigns.com"
                          className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-pointer"
                      >
                        <Save size={14} /> Update Company Profile
                      </button>
                    </form>
                  </div>
                </div>

                {/* Database Backup & Maintenance panel */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="p-1 px-2 bg-red-100 dark:bg-red-950/45 text-red-700 dark:text-red-400 text-[10px] font-bold uppercase rounded-md tracking-wider">
                        Data Control
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Local Sandbox Data Actions</h4>
                    <p className="text-xs text-slate-400">All information is securely stored offline in your device browser storage sandbox.</p>

                    <div className="space-y-3 pt-4">
                      {/* Export backup */}
                      <div>
                        <label className="block text-xs text-slate-500 mb-1 font-semibold">1. Back up data</label>
                        <button
                          onClick={handleExportDataBackup}
                          className="w-full py-2.5 px-4 bg-slate-100 text-slate-700 border border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download size={14} /> Download backup file (.json)
                        </button>
                      </div>

                      {/* Import backup */}
                      <div>
                        <label className="block text-xs text-slate-500 mb-1 font-semibold">2. Restore backup file</label>
                        <div className="relative">
                          <input
                            type="file"
                            id="backup-import"
                            accept=".json"
                            onChange={handleImportDataBackup}
                            className="hidden"
                          />
                          <button
                            onClick={() => document.getElementById('backup-import')?.click()}
                            className="w-full py-2.5 px-4 bg-slate-100 text-teal-600 dark:bg-slate-800 dark:text-teal-400 border border-slate-100 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Upload size={14} /> Choose Backup file & Restore
                          </button>
                        </div>
                      </div>

                      {/* Factory reset */}
                      <div className="pt-2">
                        <label className="block text-xs text-red-500 mb-1 font-semibold">3. Purge Database</label>
                        {!showResetConfirm ? (
                          <button
                            onClick={() => setShowResetConfirm(true)}
                            className="w-full py-2.5 px-4 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-transparent hover:border-red-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition duration-200"
                          >
                            <Trash2 size={14} /> Clean Wipe All Sandboxed Data
                          </button>
                        ) : (
                          <div className="bg-red-50/50 dark:bg-red-950/10 border-2 border-red-500/30 p-4 rounded-2xl space-y-4 animate-in fade-in duration-200">
                            <div className="flex gap-2.5">
                              <ShieldAlert className="text-red-500 shrink-0 w-5 h-5 mt-0.5" />
                              <p className="text-xs font-semibold text-red-700 dark:text-red-400 leading-normal font-sans">
                                Are you sure you want to delete all your personal data,transactions set budgets and settings from the system? This operation is not reversible
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={handleResetDatabase}
                                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-red-500/10 transition"
                              >
                                <Trash2 size={14} /> Reset all User data
                              </button>
                              <button
                                onClick={() => setShowResetConfirm(false)}
                                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer transition"
                              >
                                Cancel, Keep My Data
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-3 bg-teal-50/40 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-900 rounded-xl flex items-center gap-2">
                    <CheckCircle size={18} className="text-teal-600 shrink-0" />
                    <span className="text-[10px] text-slate-500 flex-1 leading-tight font-sans">
                      All calculations are performed entirely clientside within browser storage. Excellent safety for credentials & transactions!
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Elegant System Footer section */}
          <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-850 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <img
                  src={comfortLogo}
                  alt="Comfort Budgeting Logo"
                  className="w-8 h-8 object-cover rounded-lg border border-teal-500/20"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs tracking-tight font-sans">
                    Comfort Financial Budgeting
                  </h4>
                  <p className="text-[10px] text-slate-405 dark:text-slate-400">
                    A Unified Corporate & Personal Finance Engine
                  </p>
                </div>
              </div>
              
              {/* Active Section Indicator Badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`px-2 py-1 text-[9px] font-bold rounded-md ${dataSpace === 'personal' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/10' : 'bg-slate-50 text-slate-400 dark:bg-slate-900 border border-slate-800/10'}`}>
                  ● Personal Suite
                </span>
                <span className={`px-2 py-1 text-[9px] font-bold rounded-md ${dataSpace === 'business' ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-500/10' : 'bg-slate-50 text-slate-400 dark:bg-slate-900 border border-slate-800/10'}`}>
                  ● Business Suite
                </span>
                <span className={`px-2 py-1 text-[9px] font-bold rounded-md ${dataSpace === 'profile' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200' : 'bg-slate-50 text-slate-400 dark:bg-slate-900 border border-slate-800/10'}`}>
                  ● Device Profile
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-900/60 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-slate-450 dark:text-slate-500 text-xs font-sans">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 font-medium">
                <p>&copy; 2026 Comfort Financial Budgeting. All rights reserved.</p>
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-800">•</span>
                  <button 
                    onClick={() => setActiveLegalModal('tos')}
                    className="hover:text-teal-600 dark:hover:text-teal-400 font-bold transition cursor-pointer"
                  >
                    Terms of Service
                  </button>
                  <span className="text-slate-300 dark:text-slate-800">•</span>
                  <button 
                    onClick={() => setActiveLegalModal('privacy')}
                    className="hover:text-teal-600 dark:hover:text-teal-400 font-bold transition cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-705 transition duration-200">
                <span>Designed with</span>
                <Heart size={12} className="text-rose-500 fill-rose-500 animate-pulse shrink-0" />
                <span>by</span>
                <a 
                  href="tel:+263772824132"
                  className="font-extrabold text-[#0D9488] hover:underline"
                >
                  Comfort Designs- +263772824132
                </a>
              </div>
            </div>
          </footer>

        </main>
      </div>

      {/* Floating Animated Custom Pop Notification Component */}
      <AnimatePresence>
        {notification && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] pointer-events-none">
            {/* Backdrop panel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotification(null)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs pointer-events-auto"
            />

            {/* Content card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 max-w-md w-full pointer-events-auto ring-1 ring-slate-900/5 flex flex-col gap-3 relative z-10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full shrink-0 ${
                    notification.type === 'error' 
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' 
                      : notification.type === 'info'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                      : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                  }`}>
                    {notification.type === 'error' ? (
                      <ShieldAlert size={20} />
                    ) : notification.type === 'info' ? (
                      <Info size={20} />
                    ) : (
                      <CheckCircle2 size={20} className="stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-sm leading-snug">
                      {notification.title}
                    </h3>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-extrabold uppercase tracking-wider">
                      Database Committed
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-350 leading-relaxed">
                {notification.message}
              </p>

              {notification.details && notification.details.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-xl p-3 space-y-2 mt-1">
                  <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Saved Parameters:
                  </span>
                  <div className="grid gap-1.5">
                    {notification.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] gap-4">
                        <span className="text-slate-400 font-medium">{detail.label}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[210px]" title={detail.value}>
                          {detail.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setNotification(null)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold leading-none cursor-pointer duration-200 flex items-center justify-center gap-1.5 w-full ${
                    notification.type === 'error'
                      ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-500/10'
                      : notification.type === 'info'
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/10'
                  }`}
                >
                  Dismiss Message
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic PWA Mobile Install Guide Fallback Modal */}
      <AnimatePresence>
        {showInstallGuide && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999]">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstallGuide(false)}
              className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Content card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full relative z-10 flex flex-col max-h-[85vh] font-sans"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl shrink-0 bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
                    <Download size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-105">
                      Install Comfort Companion App
                    </h3>
                    <p className="text-[10px] text-slate-400">Run native on Android, iOS, and Desktop devices</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstallGuide(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Instructions List */}
              <div className="py-4 space-y-4 overflow-y-auto text-xs text-slate-650 dark:text-slate-350">
                <p className="font-semibold text-slate-700 dark:text-slate-200 leading-relaxed text-[11px] font-sans">
                  Comfort Budgeting is custom customized for your environment. Install it in seconds to unlock full-screen viewports, quick long-press workspace shortcuts, and total offline readiness.
                </p>

                <div className="space-y-3.5 pt-1">
                  {/* iOS Safari */}
                  <div className={`p-3 border rounded-xl space-y-1.5 transition-all duration-300 ${
                    platformInfo.isIOS 
                      ? 'border-teal-500 bg-teal-500/[0.04] dark:bg-teal-500/[0.06] shadow-inner' 
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/40 text-slate-500 dark:text-slate-400'
                  }`}>
                    <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">🍏 Apple iOS (Safari Browser)</span>
                      {platformInfo.isIOS && (
                        <span className="text-[8px] bg-teal-600 font-extrabold text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Your Device</span>
                      )}
                    </span>
                    <ol className="list-decimal pl-4.5 space-y-1 text-[11px] font-medium leading-relaxed">
                      <li>Tap the browser's native <strong className="text-teal-600 dark:text-teal-400 font-bold">Share</strong> button at bottom center.</li>
                      <li>In the share sheet sheet, select <strong className="text-teal-650 dark:text-teal-450 font-bold">"Add to Home Screen"</strong>.</li>
                      <li>Press <strong className="font-bold text-teal-600 dark:text-teal-400">Add</strong> at top right to instantly pin the app.</li>
                    </ol>
                  </div>

                  {/* Android Chrome */}
                  <div className={`p-3 border rounded-xl space-y-1.5 transition-all duration-300 ${
                    platformInfo.isAndroid 
                      ? 'border-teal-500 bg-teal-500/[0.04] dark:bg-teal-500/[0.06] shadow-inner' 
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/40 text-slate-500 dark:text-slate-400'
                  }`}>
                    <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">🤖 Android & Chrome Mobile</span>
                      {platformInfo.isAndroid && (
                        <span className="text-[8px] bg-teal-600 font-extrabold text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Your Device</span>
                      )}
                    </span>
                    <ol className="list-decimal pl-4.5 space-y-1 text-[11px] font-medium font-sans leading-relaxed">
                      <li>Tap the Chrome URL address bar's <strong className="text-teal-600 dark:text-teal-400 font-bold">three-dot menu</strong>.</li>
                      <li>Select <strong className="text-teal-650 dark:text-teal-450 font-bold">"Install app"</strong> or <strong className="text-slate-650 dark:text-slate-300 font-bold">"Add to Home Screen"</strong>.</li>
                      <li>Tap <strong className="font-bold text-teal-600 dark:text-teal-400">Install</strong> to complete direct system launcher integration.</li>
                    </ol>
                  </div>

                  {/* Desktop Google Chrome */}
                  <div className={`p-3 border rounded-xl space-y-1.5 transition-all duration-300 ${
                    platformInfo.isDesktop 
                      ? 'border-teal-500 bg-teal-500/[0.04] dark:bg-teal-500/[0.06] shadow-sm' 
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/40 text-slate-500 dark:text-slate-400'
                  }`}>
                    <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">💻 Laptop & Desktop PCs (Chrome & Opera)</span>
                      {platformInfo.isDesktop && (
                        <span className="text-[8px] bg-teal-600 font-extrabold text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Your Device</span>
                      )}
                    </span>
                    <ol className="list-decimal pl-4.5 space-y-1 text-[11px] font-medium leading-relaxed">
                      <li>Look at the browser's right-hand address bar for the <strong className="text-teal-700 dark:text-teal-400 font-bold">"Install App" icon</strong> (monitor with down-arrow).</li>
                      <li>Alternatively, click the top-right menu and choose <strong className="text-teal-600 dark:text-teal-400 font-bold">"Install Comfort Budgeting"</strong>.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Close and settings confirmations */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
                <button
                  onClick={() => setShowInstallGuide(false)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer shadow-sm"
                >
                  Understood & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Animated Custom Modal for Terms of Service & Privacy Policy Documents */}
      <AnimatePresence>
        {activeLegalModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999]">
            {/* Backdrop panel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveLegalModal(null)}
              className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Content card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full relative z-10 flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    activeLegalModal === 'tos' 
                      ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400' 
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  }`}>
                    {activeLegalModal === 'tos' ? (
                      <Scale size={20} />
                    ) : (
                      <ShieldCheck size={20} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-white text-base leading-snug font-sans tracking-tight">
                      {activeLegalModal === 'tos' ? 'Terms of Service Agreement' : 'Privacy Protection Policy'}
                    </h3>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-extrabold uppercase tracking-widest leading-none mt-0.5 font-sans">
                      {activeLegalModal === 'tos' ? 'Legal Summary & Guidelines' : 'Commitment & Sandbox Safety'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveLegalModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Doc content */}
              <div className="overflow-y-auto py-4 space-y-4 pr-1 text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-sans scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {activeLegalModal === 'tos' ? (
                  <>
                    <p className="font-bold text-slate-800 dark:text-slate-150">
                      Welcome to Comfort Financial Budgeting. Please read this summary of our Terms of Service before using the platform.
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                          <span className="text-teal-500 font-mono">1.</span> Safe Client-Side Architecture
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 pl-4">
                          Comfort operates as a local-first utility. You possess absolute custody of raw transaction logs and budgets, saved securely and exclusively nested in your sandboxed web browser.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                          <span className="text-teal-500 font-mono">2.</span> Planning Reference Only
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 pl-4">
                          Visual indicators, growth arrows, cash flow or ledger modules, and budget tracking metrics are generated as helpful decision-support references. They do not constitute official wealth advisory disclosures, bank accounting books, or formal audits.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                          <span className="text-teal-500 font-mono">3.</span> Permitted Usage Actions
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 pl-4">
                          You agree not to modify software assets maliciously, inject harmful javascript queries into client profiling panels, or engage in high-frequency scraping of system routes.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                          <span className="text-teal-500 font-mono">4.</span> Rights of Modification
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 pl-4">
                          Intellectual styling components and visual logo configurations are guarded under Comfort Designs properties. We hold the right to enhance or adapt these features to boost accuracy.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                          <span className="text-teal-500 font-mono">5.</span> Smart Notes & Event Scheduling
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 pl-4">
                          Scheduler calendars, reminder associations, and custom formatted rich-text memos are provided for administrative convenience. Linking budget events with persistent note files is handled solely on the client-side. Users are responsible for their own backups.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3 border border-slate-100 dark:border-slate-850/60 rounded-xl">
                      <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-normal">
                        By navigating this application interface, you fully agree to observe comfort conditions for transaction recording, local database storage mechanisms, and styling provisions.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-slate-800 dark:text-slate-150">
                      Your financial records and accounts deserve complete security. Read how we protect your information below.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                          <span className="text-emerald-500 font-mono">1.</span> Absolute Data Privacy
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 pl-4">
                          Comfort enforces a strict off-grid posture. Raw transactional notes, corporate cash entries, savings balances, or contact parameters are never sent to external servers or remote hosts.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                          <span className="text-emerald-500 font-mono">2.</span> Sandbox Execution
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 pl-4">
                          All financial transactions resides fully in your sandbox storage container. When you perform a Clean Wipe database purge, you permanently destroy all historical files from your browser memory.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                          <span className="text-emerald-500 font-mono">3.</span> Zero Third-Party Advertising
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 pl-4">
                          This platform is built with Zero tracker scripts. We do not maintain telemetry identifiers, cookie profiling hooks, or behavior marketing scripts designed to monetize your financial information.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                          <span className="text-emerald-500 font-mono">4.</span> Technical Communications
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 pl-4">
                          If you contact Comfort Designs at the provided phone line (+263772824132), any feedback details you voluntarily share will be kept highly confidential.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                          <span className="text-emerald-500 font-mono">5.</span> Memo & Schedule Privacy
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 pl-4">
                          Your formatted draft memos, checklists, chosen font styling parameters, calendar entries, and item linking keys reside completely in local browser-sandboxed files. We have zero ability or permission to view, store, or transmit your typed documents.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3 border border-slate-100 dark:border-slate-850/60 rounded-xl">
                      <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-normal">
                        Privacy is the fundamental cornerstone of Comfort Financial Budgeting. Rest easy knowing that you dictate exactly where your data is stored.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Action Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  onClick={() => {
                    setNotification({
                      title: 'Agreement Confirmed',
                      message: `Acknowledged and confirmed the latest ${activeLegalModal === 'tos' ? 'Terms of Service' : 'Privacy Protection Policy'} document principles successfully.`,
                      type: 'success'
                    });
                    setActiveLegalModal(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold leading-none cursor-pointer duration-200 hover:opacity-90 shadow-sm transition ${
                    activeLegalModal === 'tos'
                      ? 'bg-teal-600 text-white shadow-teal-500/10'
                      : 'bg-emerald-600 text-white shadow-emerald-500/10'
                  }`}
                >
                  I Acknowledge & Agree
                </button>
                <button
                  onClick={() => setActiveLegalModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
