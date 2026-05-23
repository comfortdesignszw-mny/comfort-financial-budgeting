import React, { useState } from 'react';
import { 
  ArrowDownCircle, ArrowUpCircle, Shield, HelpCircle, Flame, 
  Layers, Package, Building, Users, Trash2, Calendar, 
  Plus, DollarSign, PenTool, CheckSquare, Square, FileCheck, ArrowRight, Eye, Info, X 
} from 'lucide-react';
import { AppData, BusinessTransaction, BusinessInvestment, OweItem, BusinessExpenseCategory, CurrencyType } from '../types';
import { formatCurrency, formatDate, calculateBusinessCashOnHand, calculateBusinessOwnedAssets, calculateBusinessRunway, generateMonthlyInsight } from '../utils';

interface BusinessSectionProps {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  currency: CurrencyType;
}

export const businessExpenseCategories: Record<BusinessExpenseCategory, { icon: React.ReactNode; label: string; desc: string; color: string; bg: string }> = {
  stock: { 
    icon: <Package size={20} />, 
    label: '📦 Stock & Materials', 
    desc: 'Things bought to resell', 
    color: 'border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 text-orange-600', 
    bg: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400' 
  },
  bills: { 
    icon: <Building size={20} />, 
    label: '🏢 Rent, Power & Bills', 
    desc: 'Keeping the lights on', 
    color: 'border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 text-sky-600', 
    bg: 'bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400' 
  },
  helpers: { 
    icon: <Users size={20} />, 
    label: '👥 Helping Hands', 
    desc: 'Staff, wages, contractors', 
    color: 'border-pink-500 hover:bg-pink-50/50 dark:hover:bg-pink-950/20 text-pink-600', 
    bg: 'bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400' 
  },
  tools: { 
    icon: <Layers size={20} />, 
    label: '⚙️ Tools & Setup', 
    desc: 'Equipment, machinery, computers', 
    color: 'border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-indigo-600', 
    bg: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400' 
  }
};

export default function BusinessSection({ data, onUpdateData, currency }: BusinessSectionProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'investment' | 'reportCard'>('dashboard');
  
  // Modal configurations
  const [isLogSaleOpen, setIsLogSaleOpen] = useState(false);
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  
  // Entry states
  const [saleDesc, setSaleDesc] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [saleNotes, setSaleNotes] = useState('');

  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<BusinessExpenseCategory>('stock');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');

  // Personal Injected Cash states ("My Personal Money Put In")
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentNotes, setInvestmentNotes] = useState('');
  const [investmentDate, setInvestmentDate] = useState(new Date().toISOString().split('T')[0]);

  // Outstanding Owe Checks Ledger states
  const [oweDesc, setOweDesc] = useState('');
  const [oweAmount, setOweAmount] = useState('');
  const [oweDueDate, setOweDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Month selection for Report Card (Format: YYYY-MM)
  const [reportMonth, setReportMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Calculate global Metrics based on current data
  const cashOnHand = calculateBusinessCashOnHand(data.businessTransactions, data.businessInvestments);
  const businessOwned = calculateBusinessOwnedAssets(data.businessTransactions);
  const runwayStats = calculateBusinessRunway(data.businessTransactions, cashOnHand);

  // Filter current month transactions for traffic lights
  const now = new Date();
  const currentMonthNum = now.getMonth();
  const currentYearNum = now.getFullYear();

  const currentMonthTransactions = data.businessTransactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonthNum && d.getFullYear() === currentYearNum;
  });

  const monthSales = currentMonthTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
  const monthExpenses = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // Traffic light state
  let trafficLightColor = 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-300';
  let trafficLightMessage = "No sales or expenses logged this month yet. Start tracking to see your status!";
  if (monthSales > monthExpenses) {
    trafficLightColor = 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/25 dark:border-emerald-900/40 dark:text-emerald-300 animate-pulse';
    trafficLightMessage = "Looking Good! You are making more than you spend this month. The pipes are flowing in your direction!";
  } else if (monthSales < monthExpenses) {
    trafficLightColor = 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/25 dark:border-red-900/40 dark:text-red-300';
    trafficLightMessage = "Heads Up: You spent more than you brought in this month. Keep an eye on your pipe expenditures.";
  }

  // 1. Log Actions
  const handleLogSale = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(saleAmount);
    if (!saleDesc.trim() || isNaN(amount) || amount <= 0) {
      alert('Enter description and a positive amount.');
      return;
    }

    const newTx: BusinessTransaction = {
      id: `bt-${Date.now()}`,
      type: 'sale',
      description: saleDesc.trim(),
      amount,
      date: saleDate,
      notes: saleNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    onUpdateData({
      ...data,
      businessTransactions: [newTx, ...data.businessTransactions]
    });

    setIsLogSaleOpen(false);
    setSaleDesc('');
    setSaleAmount('');
    setSaleNotes('');
  };

  const handleLogExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount);
    if (!expenseDesc.trim() || isNaN(amount) || amount <= 0) {
      alert('Enter description and a positive amount.');
      return;
    }

    const newTx: BusinessTransaction = {
      id: `bt-${Date.now()}`,
      type: 'expense',
      description: expenseDesc.trim(),
      amount,
      category: expenseCategory,
      date: expenseDate,
      notes: expenseNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    onUpdateData({
      ...data,
      businessTransactions: [newTx, ...data.businessTransactions]
    });

    setIsLogExpenseOpen(false);
    setExpenseDesc('');
    setExpenseAmount('');
    setExpenseNotes('');
  };

  // Log Investment Cash Out-of-Pocket
  const handleAddInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(investmentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Enter a valid positive amount.');
      return;
    }

    const newInv: BusinessInvestment = {
      id: `bi-${Date.now()}`,
      amount,
      date: investmentDate,
      notes: investmentNotes.trim() || 'Personal cash injection',
      createdAt: new Date().toISOString()
    };

    onUpdateData({
      ...data,
      businessInvestments: [newInv, ...data.businessInvestments]
    });

    setInvestmentAmount('');
    setInvestmentNotes('');
    alert('Logged successfully! Added to your Out-of-Pocket money.');
  };

  const handleDeleteInvestment = (id: string) => {
    if (confirm('Are you sure you want to remove this investment logging?')) {
      onUpdateData({
        ...data,
        businessInvestments: data.businessInvestments.filter(i => i.id !== id)
      });
    }
  };

  const handleDeleteBusinessTransaction = (id: string) => {
    if (confirm('Remove this money transaction from your logs?')) {
      onUpdateData({
        ...data,
        businessTransactions: data.businessTransactions.filter(t => t.id !== id)
      });
    }
  };

  // Track manual Outstanding Bills/Owe items
  const handleAddOweItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(oweAmount);
    if (!oweDesc.trim() || isNaN(amount) || amount <= 0) {
      alert('Please fill out descriptions and costs');
      return;
    }

    const newOwe: OweItem = {
      id: `o-${Date.now()}`,
      description: oweDesc.trim(),
      amount,
      dueDate: oweDueDate,
      completed: false
    };

    onUpdateData({
      ...data,
      businessOweItems: [...data.businessOweItems, newOwe]
    });

    setOweDesc('');
    setOweAmount('');
  };

  const handleToggleOweItem = (id: string) => {
    onUpdateData({
      ...data,
      businessOweItems: data.businessOweItems.map(o => o.id === id ? { ...o, completed: !o.completed } : o)
    });
  };

  const handleDeleteOweItem = (id: string) => {
    onUpdateData({
      ...data,
      businessOweItems: data.businessOweItems.filter(o => o.id !== id)
    });
  };

  // Compile calculations for "End-of-Month Report Card"
  const getMonthlyReportMetrics = () => {
    const [year, month] = reportMonth.split('-').map(Number);
    // Filter transactions happening in this specific calendar month
    const listTx = data.businessTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });

    const sales = listTx.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
    const expenses = listTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const takeHomeProfit = sales - expenses;

    // What You Own (Assets) [Calculated as Cash remaining + Cumulative value of logged Tools/Setup]
    // Note: Cash remaining is the global cashOnHand, and setup tools represent static business assets
    const runToolsSum = data.businessTransactions
      .filter(t => t.type === 'expense' && t.category === 'tools')
      .reduce((sum, t) => sum + t.amount, 0);

    const stockSum = data.businessTransactions
      .filter(t => t.type === 'expense' && t.category === 'stock')
      .reduce((sum, t) => sum + t.amount, 0);

    const assetSum = cashOnHand + runToolsSum + stockSum;

    return {
      sales,
      expenses,
      takeHomeProfit,
      assetSum,
    };
  };

  const reportMetrics = getMonthlyReportMetrics();
  const monthInsightSentence = generateMonthlyInsight(data.businessTransactions, reportMonth);

  return (
    <div className="space-y-6">
      {/* 2nd Tier Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-3 font-semibold text-sm transition-all relative ${
            activeTab === 'dashboard' 
              ? 'text-green-600 dark:text-green-400 border-b-2 border-green-500' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Buckets & Pipes Dashboard
        </button>
        <button
          onClick={() => setActiveTab('investment')}
          className={`px-5 py-3 font-semibold text-sm transition-all relative ${
            activeTab === 'investment' 
              ? 'text-green-600 dark:text-green-400 border-b-2 border-green-500' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          My Personal Money Put In
        </button>
        <button
          onClick={() => setActiveTab('reportCard')}
          className={`px-5 py-3 font-semibold text-sm transition-all relative ${
            activeTab === 'reportCard' 
              ? 'text-green-600 dark:text-green-400 border-b-2 border-green-500' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          End-of-Month Report Card
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Traffic Light Monthly Banner */}
          <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm transition-all ${trafficLightColor}`}>
            <Info size={24} className="shrink-0" />
            <div className="text-sm font-semibold">{trafficLightMessage}</div>
          </div>

          {/* Core Visual "Bucket & Pipe" Engine Dashboard */}
          <div className="glass-card rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-950 dark:text-slate-50 flex items-center gap-2 mb-2">
              ⚙️ Business Cashflow Engine
            </h3>
            <p className="text-xs text-slate-400 mb-6">A physical model visualizing how money pours in and drains out</p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative">
              {/* Pipe A: Flowing into Cash bucket from Sales (Left) */}
              <div className="lg:col-span-4 glass-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 dark:bg-green-500/10 rounded-full translate-x-12 -translate-y-12"></div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-green-600 uppercase tracking-wider bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded">Sales Stream Pipe</span>
                    <HelpCircle size={14} className="text-slate-400 cursor-pointer" title="Money earned from sellable activities" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-950 dark:text-slate-50">Total Money Earned</h4>
                  <p className="text-[11px] text-slate-400">Pouring directly into your cash reservoir</p>
                </div>
                <div className="mt-8">
                  <div className="text-3xl font-extrabold text-green-600 dark:text-green-400 font-mono">
                    {formatCurrency(data.businessTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0), currency)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span> Active inflow channel
                  </div>
                </div>
              </div>

              {/* Bucket 1 + Bucket 2 (Center) */}
              <div className="lg:col-span-4 flex flex-col gap-6 items-center justify-center">
                {/* Bucket 1: Cash on Hand */}
                <div className="w-full glass-card border-2 border-emerald-500 rounded-2xl p-5 relative group flex flex-col items-center text-center overflow-hidden">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl opacity-5 dark:opacity-10"></div>
                  <span className="text-[10px] font-bold text-white bg-emerald-600 px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 relative z-10">Reservoir Bucket 1</span>
                  <h4 className="text-sm font-extrabold text-slate-950 dark:text-slate-50 uppercase tracking-wide relative z-10 flex items-center gap-1.5">
                    Cash on Hand
                  </h4>
                  <p className="text-[11px] text-slate-400 relative z-10 max-w-[180px]">Your current liquid water tank</p>
                  
                  {/* Fluid liquid level representation in Bucket! */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-28 rounded-xl my-4 relative overflow-hidden flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700">
                    <div className="absolute bottom-0 left-0 w-full bg-emerald-500/10 dark:bg-emerald-500/20 transition-all duration-700 h-[65%]" />
                    <div className="relative z-10 text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                      {formatCurrency(cashOnHand, currency)}
                    </div>
                    <div className="relative z-10 text-[10px] text-slate-600 dark:text-slate-400 font-semibold px-2 py-0.5 bg-white/80 dark:bg-slate-900/80 rounded mt-1">
                      Bucket Balance
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1 font-sans">Money Earned Minus Money Spent + Personal Money</p>
                </div>

                {/* Bucket 2: What the Business Owns */}
                <div className="w-full glass-card rounded-2xl p-4 flex flex-col items-center text-center relative group">
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-full mb-2 uppercase tracking-wide">Possessions Bucket 2</span>
                  <h4 className="text-sm font-extrabold text-slate-950 dark:text-slate-50 flex items-center gap-1 justify-center">
                    What The Business Owns
                  </h4>
                  <p className="text-[11px] text-slate-400">Sum of machinery value & stock items purchased</p>
                  <div className="text-xl font-extrabold text-blue-600 dark:text-sky-400 font-mono mt-3">
                    {formatCurrency(businessOwned, currency)}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Logged Setup Tools & materials to resell</p>
                </div>
              </div>

              {/* Pipe B: Flowing Out of Cash Bucket to Expenses (Right) */}
              <div className="lg:col-span-4 glass-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 dark:bg-red-500/10 rounded-full translate-x-12 -translate-y-12"></div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-red-650 uppercase tracking-wider bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded">Expense Drain Pipe</span>
                    <HelpCircle size={14} className="text-slate-400 cursor-pointer" title="Direct business spent outflowing out of cash tank" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-950 dark:text-slate-50">Total Money Spent</h4>
                  <p className="text-[11px] text-slate-400 font-sans">Water draining out of your reservoir</p>
                </div>
                <div className="mt-8">
                  <div className="text-3xl font-extrabold text-red-600 dark:text-red-400 font-mono">
                    {formatCurrency(data.businessTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0), currency)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Active drain outflow
                  </div>
                </div>
              </div>
            </div>

            {/* Runway Metric Card displaying in center */}
            <div className="mt-8 bg-gradient-to-r from-teal-500 to-green-600 rounded-2xl p-5 text-white shadow relative overflow-hidden max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-4">
              <div className="p-3 bg-white/15 rounded-xl text-white">
                <Flame size={28} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/80">Doors Open Runway Forecast</h4>
                <p className="text-sm font-medium mt-1">
                  At your current spending habits, your cash will keep your doors open for{' '}
                  <span className="text-lg font-bold font-mono px-2 py-0.5 bg-white/10 rounded">
                    {runwayStats.days === 'infinite' 
                      ? 'Infinite' 
                      : runwayStats.days === 'empty' 
                      ? 'Add Cash' 
                      : `${runwayStats.days} days`}
                  </span>
                </p>
                <p className="text-[10px] text-white/70 mt-1.5">
                  Calculated dynamically from Cash Reservoirs divided by daily spending averages ({formatCurrency(runwayStats.dailyAverage, currency)}/day).
                </p>
              </div>
            </div>
          </div>

          {/* Business Split Action fast money tracker layout */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">⚡ Instant Inflow & Outflow Tracker</h3>
            <p className="text-xs text-slate-500 mb-6 font-sans">Quickly stream incoming cash (Sales) or log outgoing money (Expenses) without any accounting jargon.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Giant Green Inflow action */}
              <button
                onClick={() => setIsLogSaleOpen(true)}
                className="p-5 border-2 border-emerald-500 hover:border-emerald-600 bg-emerald-50/20 hover:bg-emerald-50/50 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 rounded-2xl flex flex-col items-center justify-center text-center gap-2 group transition duration-300 transform hover:-translate-y-1 cursor-pointer shadow-sm"
              >
                <div className="p-3 bg-emerald-500 text-white rounded-full group-hover:scale-105 transition">
                  <ArrowDownCircle size={32} />
                </div>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 underline decoration-emerald-400 decoration-2">[ + Log Money Earned (Sales) ]</span>
                <span className="text-xs text-slate-500 max-w-[280px]">Log money from selling items, catering jobs, rendering services, or pop-up markets!</span>
              </button>

              {/* Giant Red Outflow action */}
              <button
                onClick={() => setIsLogExpenseOpen(true)}
                className="p-5 border-2 border-red-500 hover:border-red-600 bg-red-50/10 hover:bg-red-50/30 dark:bg-red-950/10 dark:hover:bg-red-950/20 rounded-2xl flex flex-col items-center justify-center text-center gap-2 group transition duration-300 transform hover:-translate-y-1 cursor-pointer shadow-sm"
              >
                <div className="p-3 bg-red-500 text-white rounded-full group-hover:scale-105 transition">
                  <ArrowUpCircle size={32} />
                </div>
                <span className="text-base font-bold text-red-700 dark:text-red-400 underline decoration-red-400 decoration-2">[ — Log Money Spent (Expense) ]</span>
                <span className="text-xs text-slate-500 max-w-[280px]">Instant logging of raw inventory stock, power utility bills, helpers' wages, or kitchen equipment setup!</span>
              </button>
            </div>
          </div>

          {/* Chronological ledger activity list below */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-4">Chronological Business Transactions</h3>

            {data.businessTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">No business flow data logged yet. Hit sales or expenses above.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[350px] overflow-y-auto pr-1">
                {data.businessTransactions.map((t) => {
                  const isSale = t.type === 'sale';
                  const catDetails = !isSale && t.category ? businessExpenseCategories[t.category] : null;

                  return (
                    <div key={t.id} className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 px-2 rounded-lg transition">
                      <div className="flex items-center gap-3 min-w-0">
                        {isSale ? (
                          <span className="p-2 bg-emerald-100/10 text-emerald-500 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-xl shrink-0">
                            <ArrowDownCircle size={18} />
                          </span>
                        ) : (
                          <span className={`p-2 rounded-xl shrink-0 ${catDetails?.bg || 'bg-red-100 text-red-500 bg-red-50 dark:bg-red-950/30 dark:text-red-400'}`}>
                            {catDetails?.icon || <ArrowUpCircle size={18} />}
                          </span>
                        )}
                        <div className="truncate">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{t.description}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{isSale ? '💰 Client Sale Inflow' : catDetails?.label || 'Other Spent'}</span>
                            <span>•</span>
                            <span>{formatDate(t.date)}</span>
                            {t.notes && <span className="italic truncate max-w-[150px]">("{t.notes}")</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className={`text-sm font-bold font-mono ${isSale ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isSale ? '+' : '-'}{formatCurrency(t.amount, currency)}
                        </span>
                        <button
                          onClick={() => handleDeleteBusinessTransaction(t.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Welcome & My Personal Money Put In section */}
      {activeTab === 'investment' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Out of pocket balance container left */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm text-center">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">Personal Money Reservoir</span>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">Out-of-Pocket Cash Investment</h4>
              <p className="text-xs text-slate-500 mt-1">Total cash pumped into this business out of your own wallet</p>
              
              <div className="text-3xl font-extrabold text-blue-600 dark:text-sky-400 font-mono my-6">
                {formatCurrency(data.businessInvestments.reduce((sum, i) => sum + i.amount, 0), currency)}
              </div>

              <div className="text-left text-xs text-slate-500 space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <p>💡 <strong>What is this?</strong> In standard accounts, this is called "Owner's Equity". Here, we track exactly how much personal money was pumped into business cash drawers from start-up to inventory purchase.</p>
              </div>
            </div>

            {/* Quick adding container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1">
                ➕ Pump in Personal Cash
              </h4>
              <form onSubmit={handleAddInvestment} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Amount ($ / Local)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Date Logged</label>
                  <input
                    type="date"
                    value={investmentDate}
                    onChange={(e) => setInvestmentDate(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Investment Note Scope</label>
                  <input
                    type="text"
                    placeholder="e.g. Started-up the shop kitchen, extra flour pack..."
                    value={investmentNotes}
                    onChange={(e) => setInvestmentNotes(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  [ + Add Personal Cash ]
                </button>
              </form>
            </div>
          </div>

          {/* Historical Investments List right */}
          <div className="col-span-1 lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Historical Personal Money Injections</h3>
            <p className="text-xs text-slate-400">Chronological feed of your pumped-in capital cash balances</p>

            {data.businessInvestments.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-sm">No out-of-pocket investments logged yet. Add some to build initial reservoir!</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 pr-1 max-h-[500px] overflow-y-auto space-y-1">
                {data.businessInvestments.map(inv => (
                  <div key={inv.id} className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 px-2 rounded-lg transition">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-xl">
                        <DollarSign size={18} />
                      </span>
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans">Pumped Cash Inflow</div>
                        <div className="text-[11px] text-slate-400">
                          {formatDate(inv.date)} • <span className="italic"> "{inv.notes}" </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold font-mono text-blue-600 dark:text-sky-400">
                        +{formatCurrency(inv.amount, currency)}
                      </span>
                      <button
                        onClick={() => handleDeleteInvestment(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* End-of-Month Report Card Section */}
      {activeTab === 'reportCard' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Monthly Snapshot Report Card</h3>
              <p className="text-xs text-slate-400">Simpified overview of financial standing at various calendar ranges</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Month Period</label>
              <input 
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="p-2 text-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Report Metrics left panel */}
            <div className="col-span-1 lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              {data.profile.companyName && (
                <div className="p-4 bg-gradient-to-r from-blue-50/50 to-blue-100/10 dark:from-slate-950 dark:to-slate-900/40 border border-blue-100/55 dark:border-slate-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-105/10 dark:bg-blue-950/40 px-1.5 py-0.5 rounded tracking-wider">
                      Business Entity
                    </span>
                    <h5 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {data.profile.companyName}
                    </h5>
                    {data.profile.companyEmail && (
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400">{data.profile.companyEmail}</p>
                    )}
                  </div>
                  {data.profile.companyPhone && (
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] text-slate-400 block font-mono">Contact Phone</span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-350">{data.profile.companyPhone}</span>
                    </div>
                  )}
                </div>
              )}

              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base pb-3 border-b border-slate-100 dark:border-slate-800">
                📊 Month Report Details: {reportMonth}
              </h4>

              {/* Row 1: Your Take-Home Profit/Loss */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-350">Row 1: Your Take-Home Profit/Loss</span>
                  <HelpCircle size={14} className="text-slate-400 cursor-pointer" title="Sales surplus minus expenses incurred during this calendar month" />
                </div>
                <div className="flex justify-between items-end mt-1">
                  <span className="text-xs text-slate-450 uppercase tracking-widest font-semibold text-slate-400">Net Take-Home Surplus</span>
                  <span className={`text-2xl font-extrabold font-mono ${reportMetrics.takeHomeProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                    {reportMetrics.takeHomeProfit < 0 ? '-' : ''}{formatCurrency(Math.abs(reportMetrics.takeHomeProfit), currency)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Gross Sales Stream: +{formatCurrency(reportMetrics.sales, currency)}</span>
                  <span>Spent Outflow Drain: -{formatCurrency(reportMetrics.expenses, currency)}</span>
                </div>
              </div>

              {/* Row 2: What You Own (Assets) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Row 2: What You Own (Assets)</span>
                  <HelpCircle size={14} className="text-slate-500 cursor-pointer" title="Cash remaining plus cumulative machinery or tools & Setup values" />
                </div>
                <div className="flex justify-between items-end mt-1">
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold text-slate-500">Possessional Stock Balance</span>
                  <span className="text-2xl font-extrabold font-mono text-blue-600 dark:text-sky-400">
                    {formatCurrency(reportMetrics.assetSum, currency)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-550 font-sans italic pt-1 border-t border-slate-200 dark:border-slate-700">
                  Calculated as: Reservoir Cash remaining + logged Tools/Setup mixing equipment value + materials stock value.
                </div>
              </div>

              {/* Row 3: What You Owe (Bills/Loans / Outstanding ledger) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Row 3: What You Owe (Bills, Loans & Debts due)</span>
                  <HelpCircle size={14} className="text-slate-400 cursor-pointer" title="Self-managed tracking ledger for bills details" />
                </div>
                
                {/* Active Outstanding Owed list summary */}
                <div className="flex justify-between items-end">
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold text-slate-500">Active Unpaid Outstandings</span>
                  <span className="text-2xl font-extrabold font-mono text-red-500">
                    {formatCurrency(data.businessOweItems.filter(o => !o.completed).reduce((sum, o) => sum + o.amount, 0), currency)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                  Checkboxes for tracking invoice bill dues on your kitchen mixers or organic flour bags outstanding.
                </div>
              </div>

              {/* Plain text generator metric container */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl space-y-2">
                <h5 className="text-xs font-bold text-blue-700 dark:text-sky-450 flex items-center gap-1.5 uppercase">
                  💡 Physical Flow Analysis & Advice
                </h5>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  "{monthInsightSentence}"
                </p>
              </div>
            </div>

            {/* Owe tracking checklist panel right */}
            <div className="col-span-1 lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Row 3 Owed Checks Planner</h4>
                <p className="text-[11px] text-slate-500">Tick off power utilities or oven balances as paid</p>
              </div>

              {/* Simple Owe Ledger Form Adding */}
              <form onSubmit={handleAddOweItem} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 rounded-xl space-y-3.5">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-350">Create Outstanding Check Dues</div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flour Pack net-15 supplier due..."
                    value={oweDesc}
                    onChange={(e) => setOweDesc(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Amount"
                    value={oweAmount}
                    onChange={(e) => setOweAmount(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none"
                  />
                  <input
                    type="date"
                    required
                    value={oweDueDate}
                    onChange={(e) => setOweDueDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none animate-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 hover:bg-slate-905 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  [ Add Owed Ledger Bill Check ]
                </button>
              </form>

              {/* Item logs listing checkbox */}
              {data.businessOweItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs text-[11px]">No outstanding ledger bills logged. Awesome!</div>
              ) : (
                <div className="space-y-2 pr-1 max-h-[280px] overflow-y-auto">
                  {data.businessOweItems.map(o => (
                    <div 
                      key={o.id} 
                      className={`p-3 border rounded-xl flex items-center justify-between group transition ${
                        o.completed 
                          ? 'bg-slate-50/70 border-slate-100 text-slate-400 dark:bg-slate-800/20 dark:border-slate-900' 
                          : 'bg-white border-slate-200 h-auto dark:bg-slate-900 border-red-200 dark:border-red-950/20'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleOweItem(o.id)}
                        className="flex items-center gap-2.5 text-left text-xs min-w-0"
                      >
                        <span className="shrink-0 text-slate-500 cursor-pointer">
                          {o.completed ? <FileCheck size={18} className="text-emerald-500" /> : <Square size={18} />}
                        </span>
                        <div className="truncate">
                          <span className={`font-semibold shrink-0 group-hover:underline ${o.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {o.description}
                          </span>
                          <div className="text-[9px] text-slate-400">Due Date: {formatDate(o.dueDate)}</div>
                        </div>
                      </button>
                      <div className="flex items-center gap-2.5 shrink-0 ml-3">
                        <span className={`text-xs font-mono font-bold ${o.completed ? 'text-slate-400 line-through' : 'text-red-500'}`}>
                          {formatCurrency(o.amount, currency)}
                        </span>
                        <button
                          onClick={() => handleDeleteOweItem(o.id)}
                          className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-slate-400 dark:hover:bg-red-950/20"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Log Inflow Sale */}
      {isLogSaleOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Log Cash Incoming Inflow (Sale)
              </h3>
              <button onClick={() => setIsLogSaleOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleLogSale} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Incoming description / Client name</label>
                <input
                  type="text"
                  placeholder="e.g. Wedding cookies order base, daily sales..."
                  value={saleDesc}
                  onChange={(e) => setSaleDesc(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Volume ($ / Local)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Date Logged</label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Details Context Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Cash register pop-up total..."
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsLogSaleOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition">
                  Save Inflow Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Log Outflow Expense */}
      {isLogExpenseOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Log Cash Outgoing Drain (Expense)
              </h3>
              <button onClick={() => setIsLogExpenseOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleLogExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Drain Description (What bought)</label>
                <input
                  type="text"
                  placeholder="e.g. Mixing flour packs, assistant wage, grid bill..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                  required
                />
              </div>

              {/* Categorization Pickers: instead of accounts tree, standard 4 simple color buttons */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Category Bucket Drainage Flow</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(businessExpenseCategories) as BusinessExpenseCategory[]).map((cat) => {
                    const active = expenseCategory === cat;
                    const catDetails = businessExpenseCategories[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setExpenseCategory(cat)}
                        className={`p-3 border text-left rounded-xl transition cursor-pointer flex flex-col gap-0.5 ${
                          active 
                            ? `${catDetails.bg} border-slate-700 ring-2 ring-slate-800 dark:ring-emerald-500` 
                            : 'bg-white border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:bg-slate-50/50'
                        }`}
                      >
                        <span className="text-xs font-bold font-sans">{catDetails.label}</span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-405">{catDetails.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Amount spent</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Date Logged</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Metadata Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ordered mixing packs invoice due..."
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsLogExpenseOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-705">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-red-650 dark:bg-red-600 hover:bg-red-700 bg-red-600 text-white text-sm font-semibold rounded-lg transition animate-none">
                  Save Outflow Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
