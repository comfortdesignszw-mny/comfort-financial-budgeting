/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Wallet, UserCog, Download, Upload, Trash2, Save, 
  Menu, X, CheckCircle, ShieldAlert, BadgeDollarSign, Info
} from 'lucide-react';
import { AppData, CurrencyType } from './types';
import { initialSampleData } from './sampleData';
import { formatCurrency, currencySymbols } from './utils';
import PersonalSection from './components/PersonalSection';
import BusinessSection from './components/BusinessSection';

export default function App() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const stored = localStorage.getItem('comfortBudgetingData');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading localStorage, falling back to sample data', e);
    }
    return initialSampleData;
  });

  // Active workspace section
  const [dataSpace, setDataSpace] = useState<'personal' | 'business' | 'profile'>('personal');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
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

  const handleUpdateData = (newData: AppData) => {
    setData(newData);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(profileSavingsTarget);
    if (isNaN(target) || target < 0) {
      alert('Please enter a valid savings target.');
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
    alert('Global Profile information updated successfully!');
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
    alert('Company Profile information updated and saved successfully!');
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
    } catch (e) {
      alert('Error creating backup archive.');
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
          alert('Data backup successfully restored!');
        } else {
          alert('Invalid backup structure. Check JSON profile properties.');
        }
      } catch (err) {
        alert('Invalid JSON file. Unable to restore backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // clear input
  };

  // 3. Complete Reset Database
  const handleResetDatabase = () => {
    if (confirm('WARNING: This will permanently delete ALL transactions, budgets, cash-flows, debts, and configuration settings. This action is irreversible. Proceed?')) {
      const freshData: AppData = {
        profile: {
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          currency: 'USD',
          savingsTarget: 1000,
          savingsGoal: 'Emergency Reservoir',
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
      alert('Failsafe complete database reset triggered successfully.');
    }
  };

  const activeSpaceName = dataSpace === 'personal' 
    ? 'Personal Section (Comfort Budgeting)' 
    : dataSpace === 'business' 
    ? 'Business Section (CashFlow Simple)' 
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
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <button 
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <span className="p-1 px-2 bg-teal-600 text-white font-bold rounded text-xs">C</span>
          <span className="font-extrabold text-[#0D9488] font-sans text-sm">Comfort Budgeting</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-teal-600">
          {userInitials}
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
          <div className="flex items-center gap-2 pb-5 border-b border-slate-200 dark:border-slate-800 mb-6">
            <span className="p-2.5 bg-gradient-to-r from-teal-500 to-green-600 text-white rounded-xl shadow-md shrink-0">
              <Wallet size={20} />
            </span>
            <div>
              <h2 className="font-extrabold text-teal-600 dark:text-teal-400 text-base leading-tight font-sans">
                Comfort Budgeting
              </h2>
              <span className="text-[10px] text-slate-400 block tracking-wide">Financial Management</span>
            </div>
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
            <div>
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block mb-1">Comfort Financial Budgeting</span>
              <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans tracking-tight">
                {activeSpaceName}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                A Business and Personal Financial Management Solution
              </p>
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
            />
          )}

          {dataSpace === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Universal Setting & profiling panels</h3>
              <p className="text-xs text-slate-400">Adjust configurations that span across both Comfort segments</p>

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
                        <button
                          onClick={handleResetDatabase}
                          className="w-full py-2.5 px-4 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-transparent hover:border-red-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 size={14} /> Clean Wipe All Sandboxed Data
                        </button>
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

        </main>
      </div>
    </div>
  );
}
