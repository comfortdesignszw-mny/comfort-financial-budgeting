import React, { useState } from 'react';
import { 
  TrendingDown, TrendingUp, Scale, PiggyBank, Briefcase, Laptop, 
  LineChart, Gift, Coins, Utensils, Car, Film, ShoppingBag, 
  FileText, Heart, GraduationCap, Ellipsis, Trash2, Edit2, 
  Plus, Calendar, Tag, Info, AlertTriangle, ChevronRight, X, Repeat,
  PieChart
} from 'lucide-react';
import { AppData, PersonalTransaction, PersonalBudget, PersonalExpenseCategory, CurrencyType } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface PersonalSectionProps {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  currency: CurrencyType;
}

export const personalExpenseCategories: { [key in PersonalExpenseCategory]: { icon: React.ReactNode; label: string; color: string; bg: string } } = {
  food: { icon: <Utensils size={18} />, label: 'Food & Dining', color: '#D97706', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  transport: { icon: <Car size={18} />, label: 'Transportation', color: '#2563EB', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
  entertainment: { icon: <Film size={18} />, label: 'Entertainment', color: '#DB2777', bg: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400' },
  shopping: { icon: <ShoppingBag size={18} />, label: 'Shopping', color: '#4F46E5', bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' },
  bills: { icon: <FileText size={18} />, label: 'Bills & Utilities', color: '#DC2626', bg: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  health: { icon: <Heart size={18} />, label: 'Healthcare', color: '#059669', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  education: { icon: <GraduationCap size={18} />, label: 'Education', color: '#7C3AED', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' },
  savings: { icon: <PiggyBank size={18} />, label: 'Savings Deposit', color: '#0891B2', bg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400' },
  other: { icon: <Ellipsis size={18} />, label: 'Other Expenses', color: '#475569', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400' }
};

export const personalIncomeCategories: { [key: string]: { icon: React.ReactNode; label: string; color: string; bg: string } } = {
  salary: { icon: <Briefcase size={18} />, label: 'Salary', color: '#10B981', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  freelance: { icon: <Laptop size={18} />, label: 'Freelance Work', color: '#D97706', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  investment: { icon: <LineChart size={18} />, label: 'Investments', color: '#3B82F6', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
  gift: { icon: <Gift size={18} />, label: 'Gifts & Grants', color: '#EC4899', bg: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400' },
  other: { icon: <Coins size={18} />, label: 'Other Earnings', color: '#64748B', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400' }
};

export default function PersonalSection({ data, onUpdateData, currency }: PersonalSectionProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'expenses' | 'budgets'>('dashboard');
  const [incomeFilter, setIncomeFilter] = useState<string>('all');
  const [expenseFilter, setExpenseFilter] = useState<string>('all');
  
  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<'income' | 'expense'>('income');
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  
  // Form fields
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNotes, setTxNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [recurrenceCount, setRecurrenceCount] = useState<number>(6);
  
  const [budgetCategory, setBudgetCategory] = useState<PersonalExpenseCategory>('food');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetDesc, setBudgetDesc] = useState('');
  const [editingBudget, setEditingBudget] = useState<string | null>(null);

  // Savings adjustment and monthly reset states
  const [deductAmount, setDeductAmount] = useState('');
  const [showSavingsResetConfirm, setShowSavingsResetConfirm] = useState(false);

  // Time metrics filter: Current Month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = data.transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalIncome - totalExpenses;

  // Savings Goal calculations: lifetime accumulated savings + current month dynamic balance
  const accumulatedSavings = data.profile.accumulatedSavings || 0;
  const currentMonthSavings = Math.max(0, currentBalance);
  const totalSavingsAmount = accumulatedSavings + currentMonthSavings;
  const savingsTarget = data.profile.savingsTarget || 500;
  const savingsPercent = Math.min(100, (totalSavingsAmount / savingsTarget) * 100);

  // 1. Transaction Handlers
  const openAddTxModal = (type: 'income' | 'expense') => {
    setTxModalType(type);
    setTxDesc('');
    setTxAmount('');
    setTxCategory(type === 'income' ? 'salary' : 'food');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxNotes('');
    setIsRecurring(false);
    setRecurrenceFreq('monthly');
    setRecurrenceCount(6);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(txAmount);
    if (!txDesc.trim() || isNaN(amount) || amount <= 0 || !txDate) {
      alert('Please fill in description, a valid amount, and date.');
      return;
    }

    const baseDate = new Date(txDate);
    const generatedTxs: PersonalTransaction[] = [];
    const count = isRecurring ? recurrenceCount : 1;

    for (let i = 0; i < count; i++) {
      const occurrenceDate = new Date(baseDate);
      if (isRecurring) {
        if (recurrenceFreq === 'weekly') {
          occurrenceDate.setDate(baseDate.getDate() + (i * 7));
        } else if (recurrenceFreq === 'monthly') {
          occurrenceDate.setMonth(baseDate.getMonth() + i);
        } else if (recurrenceFreq === 'yearly') {
          occurrenceDate.setFullYear(baseDate.getFullYear() + i);
        }
      }

      const occurrenceDateStr = occurrenceDate.toISOString().split('T')[0];
      const txId = i === 0 ? `p-${Date.now()}` : `p-${Date.now()}-${i}`;
      const descSuffix = (isRecurring && i > 0) ? ` (Recurring #${i + 1})` : '';

      generatedTxs.push({
        id: txId,
        type: txModalType,
        description: `${txDesc.trim()}${descSuffix}`,
        amount,
        category: txCategory,
        date: occurrenceDateStr,
        notes: txNotes.trim() ? `${txNotes.trim()}${isRecurring ? ` [Recurring: ${recurrenceFreq}]` : ''}` : (isRecurring ? `Recurring setup: ${recurrenceFreq}` : undefined),
        createdAt: new Date().toISOString()
      });
    }

    onUpdateData({
      ...data,
      transactions: [...generatedTxs, ...data.transactions]
    });

    setIsTxModalOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Delete this transaction?')) {
      onUpdateData({
        ...data,
        transactions: data.transactions.filter(t => t.id !== id)
      });
    }
  };

  // Savings and Monthly Reset Handlers
  const handleDeductFromSavings = (e: React.FormEvent) => {
    e.preventDefault();
    const amountToDeduct = parseFloat(deductAmount);
    if (isNaN(amountToDeduct) || amountToDeduct <= 0) {
      alert('Please enter a valid positive amount to deduct.');
      return;
    }

    const currentAccumulated = data.profile.accumulatedSavings || 0;
    const updatedSavings = currentAccumulated - amountToDeduct;

    onUpdateData({
      ...data,
      profile: {
        ...data.profile,
        accumulatedSavings: updatedSavings
      }
    });

    setDeductAmount('');
    alert(`Successfully deducted ${formatCurrency(amountToDeduct, currency)} from savings.`);
  };

  const handleResetSavingsAccount = () => {
    onUpdateData({
      ...data,
      profile: {
        ...data.profile,
        accumulatedSavings: 0
      },
      transactions: [] // reset transactions of the month to 0 as well
    });
    setShowSavingsResetConfirm(false);
    alert('Savings account has been reset to 0 and all transactions have been cleared.');
  };

  const handleMonthlyReset = () => {
    if (confirm(`Are you sure you want to perform a monthly reset? This will save your current positive balance of ${formatCurrency(Math.max(0, currentBalance), currency)} to your persistent savings and empty all transaction logs to start the next month fresh.`)) {
      const savingsToAdd = Math.max(0, currentBalance);
      onUpdateData({
        ...data,
        profile: {
          ...data.profile,
          accumulatedSavings: (data.profile.accumulatedSavings || 0) + savingsToAdd
        },
        transactions: []
      });
      alert('Monthly Reset Successful! Savings have been rolled over and transaction log is cleared.');
    }
  };

  // 2. Budget Handlers
  const openAddBudgetModal = (budgetToEdit?: PersonalBudget) => {
    if (budgetToEdit) {
      setEditingBudget(budgetToEdit.id);
      setBudgetCategory(budgetToEdit.category);
      setBudgetLimit(budgetToEdit.limit.toString());
      setBudgetDesc(budgetToEdit.description || '');
    } else {
      setEditingBudget(null);
      setBudgetCategory('food');
      setBudgetLimit('');
      setBudgetDesc('');
    }
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetLimit);
    if (isNaN(limit) || limit <= 0) {
      alert('Please enter a valid limit amount.');
      return;
    }

    const existingIndex = data.budgets.findIndex(b => b.category === budgetCategory);
    let updatedBudgets = [...data.budgets];

    const budgetPayload: PersonalBudget = {
      id: editingBudget || `b-${Date.now()}`,
      category: budgetCategory,
      limit,
      description: budgetDesc.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    if (existingIndex >= 0 && !editingBudget) {
      // Overwrite existing budget of same category if adding duplicate
      updatedBudgets[existingIndex] = budgetPayload;
    } else if (editingBudget) {
      updatedBudgets = updatedBudgets.map(b => b.id === editingBudget ? budgetPayload : b);
    } else {
      updatedBudgets.push(budgetPayload);
    }

    onUpdateData({
      ...data,
      budgets: updatedBudgets
    });

    setIsBudgetModalOpen(false);
  };

  const handleDeleteBudget = (id: string) => {
    if (confirm('Are you sure you want to delete this budget limit?')) {
      onUpdateData({
        ...data,
        budgets: data.budgets.filter(b => b.id !== id)
      });
    }
  };

  // Calculate spent per budget category
  const calculateBudgetSpent = (category: PersonalExpenseCategory) => {
    return monthlyTransactions
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // 3. Category Spending (SVG Doughnut Helper)
  const expenseSpendingByCategory = React.useMemo<Record<string, number>>(() => {
    const totals: Record<string, number> = {};
    monthlyTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      });
    return totals;
  }, [monthlyTransactions]);

  const totalExpenseSum = (Object.values(expenseSpendingByCategory) as number[]).reduce((sum, v) => sum + v, 0);

  // SVG Doughnut Circles properties
  const radius = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius; // ~314.16

  let accumulatedPercent = 0;
  const doughnutSegments = (Object.entries(expenseSpendingByCategory) as [string, number][]).map(([cat, total]) => {
    const percent = totalExpenseSum > 0 ? (total / totalExpenseSum) * 100 : 0;
    const strokeDash = (percent / 100) * circumference;
    const strokeOffset = circumference - (accumulatedPercent / 100) * circumference;
    accumulatedPercent += percent;

    const catDetails = personalExpenseCategories[cat as PersonalExpenseCategory] || personalExpenseCategories.other;
    return {
      category: cat,
      label: catDetails.label,
      total,
      percent,
      strokeDash,
      strokeOffset,
      color: catDetails.color
    };
  });

  return (
    <div className="space-y-6">
      {/* 2nd Tier Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-3 rounded-xl font-semibold text-[11px] sm:text-xs transition-all flex flex-col items-center justify-center gap-2 border-2 text-center leading-tight ${
            activeTab === 'dashboard'
              ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400'
              : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <PieChart size={20} className={activeTab === 'dashboard' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'} />
          Overview Dashboard
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`px-3 py-3 rounded-xl font-semibold text-[11px] sm:text-xs transition-all flex flex-col items-center justify-center gap-2 border-2 text-center leading-tight ${
            activeTab === 'income'
              ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400'
              : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <TrendingUp size={20} className={activeTab === 'income' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'} />
          Income Streams
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-3 py-3 rounded-xl font-semibold text-[11px] sm:text-xs transition-all flex flex-col items-center justify-center gap-2 border-2 text-center leading-tight ${
            activeTab === 'expenses'
              ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400'
              : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <TrendingDown size={20} className={activeTab === 'expenses' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'} />
          Expense Tracking
        </button>
        <button
          onClick={() => setActiveTab('budgets')}
          className={`px-3 py-3 rounded-xl font-semibold text-[11px] sm:text-xs transition-all flex flex-col items-center justify-center gap-2 border-2 text-center leading-tight ${
            activeTab === 'budgets'
              ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400'
              : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <Scale size={20} className={activeTab === 'budgets' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'} />
          Budget Planning
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stat: Income */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all hover:shadow-md duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse"></div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider font-sans">Total Income</span>
                <span className="p-2 bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg">
                  <TrendingUp size={18} />
                </span>
              </div>
              <div className="text-2xl font-black font-sans text-slate-900 dark:text-white">{formatCurrency(totalIncome, currency)}</div>
              <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-1 font-medium font-mono uppercase">Logged this month</p>
            </div>

            {/* Stat: Expense */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all hover:shadow-md duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider font-sans">Total Expenses</span>
                <span className="p-2 bg-red-100/80 text-red-700 dark:bg-red-950/40 dark:text-red-400 rounded-lg">
                  <TrendingDown size={18} />
                </span>
              </div>
              <div className="text-2xl font-black font-sans text-slate-900 dark:text-white">{formatCurrency(totalExpenses, currency)}</div>
              <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-1 font-medium font-mono uppercase">Spent this month</p>
            </div>

            {/* Stat: Net Position */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all hover:shadow-md duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-teal-500 animate-pulse"></div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider font-sans">Current Balance</span>
                <span className="p-2 bg-teal-100/80 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 rounded-lg">
                  <Scale size={18} />
                </span>
              </div>
              <div className={`text-2xl font-black font-sans ${currentBalance >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'}`}>
                {currentBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(currentBalance), currency)}
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-1 font-medium font-mono uppercase">Net monthly cash flow</p>
            </div>

            {/* Stat: Savings Goal */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all hover:shadow-md duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 animate-pulse"></div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider font-sans">Savings Progress</span>
                <span className="p-2 bg-amber-100/80 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 rounded-lg">
                  <PiggyBank size={18} />
                </span>
              </div>
              <div className="text-2xl font-black font-sans text-slate-900 dark:text-white">{formatCurrency(totalSavingsAmount, currency)}</div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{savingsPercent.toFixed(0)}% of target</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide text-[11px]">{data.profile.savingsGoal || 'Goal'}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${savingsPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Quick Act buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button 
              onClick={() => openAddTxModal('income')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Add Income
            </button>
            <button 
              onClick={() => openAddTxModal('expense')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Add Expense
            </button>
          </div>

          {/* Savings Vault Ledger Controls & Monthly Reset Card */}
          <div id="savings-management-ledger" className="glass-card rounded-2xl p-6 border border-amber-500/10 dark:border-amber-500/5 bg-amber-50/5 dark:bg-amber-950/5 shadow-sm space-y-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 rounded-xl">
                  <PiggyBank size={24} />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">PiggyBank Vault & Monthly Reset Center</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Secure persistent savings, log deducts, and reset monthly transaction ledger metrics</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Total Savings</span>
                <div className="text-2xl font-black font-sans text-amber-600 dark:text-amber-400">{formatCurrency(totalSavingsAmount, currency)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Monthly Reset Ledger Container */}
              <div id="monthly-reset-workflow-box" className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">1. Monthly Closer & Roll-over</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    Wipe this month's transactions to prepare for a fresh ledger cycle. The remaining current balance of <strong>{formatCurrency(currentMonthSavings, currency)}</strong> will be persistently committed to your lifelong savings balance and will not be cleared of.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    id="btn-perform-monthly-reset"
                    onClick={handleMonthlyReset}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Repeat size={14} /> Perform Monthly Reset of Transactions
                  </button>
                </div>
              </div>

              {/* Savings Adjustments (Deduct & Reset) Container */}
              <div id="savings-manual-adjustments-box" className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-850 pt-4 md:pt-0 md:pl-8">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">2. Savings Ledger Adjustments</h4>

                {/* Deduct Custom Amount Section */}
                <form onSubmit={handleDeductFromSavings} className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Deduct balance from Savings</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">{currency}</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="Enter amount to deduct..."
                        value={deductAmount}
                        onChange={(e) => setDeductAmount(e.target.value)}
                        className="w-full pl-12 pr-4 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl focus:outline-none dark:text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      id="btn-submit-savings-deduct"
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Deduct from Savings
                    </button>
                  </div>
                </form>

                {/* Reset Savings Section */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                  {!showSavingsResetConfirm ? (
                    <button
                      type="button"
                      id="btn-trigger-reset-savings"
                      onClick={() => setShowSavingsResetConfirm(true)}
                      className="w-full py-2 px-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 text-xs font-bold rounded-xl hover:bg-red-100 transition duration-200 cursor-pointer text-center"
                    >
                      Reset Savings balance
                    </button>
                  ) : (
                    <div id="savings-reset-confirmation-pop" className="bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/40 p-4 rounded-xl space-y-3 animate-in fade-in zoom-in duration-200">
                      <p className="text-xs font-semibold text-red-800 dark:text-red-300">
                        Are you sure you want to remove all the total amount from your savings account
                      </p>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          id="btn-execute-savings-reset"
                          onClick={handleResetSavingsAccount}
                          className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl transition cursor-pointer"
                        >
                          reset savings account
                        </button>
                        <button
                          type="button"
                          id="btn-cancel-savings-reset"
                          onClick={() => setShowSavingsResetConfirm(false)}
                          className="w-full py-1.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Cancel, Keep savings
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Charts & Budget Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="glass-card rounded-2xl p-5 lg:col-span-8">
              <h3 className="font-extrabold text-slate-950 dark:text-slate-50 text-base mb-4 flex items-center gap-2">
                <Info size={18} className="text-teal-500" /> Current Month Budget Overview
              </h3>

              {data.budgets.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-400 text-sm mb-4">No budget plans created yet. Plan ahead to secure your goals!</p>
                  <button 
                    onClick={() => { setActiveTab('budgets'); openAddBudgetModal(); }}
                    className="px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 text-xs font-medium rounded-lg"
                  >
                    Set Budget Limits
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  {data.budgets.map(b => {
                    const spent = calculateBudgetSpent(b.category);
                    const overspent = spent > b.limit;
                    const percent = Math.min(100, (spent / b.limit) * 100);
                    const catDetails = personalExpenseCategories[b.category];

                    let barColor = 'bg-emerald-500';
                    if (percent >= 90) barColor = 'bg-red-500';
                    else if (percent >= 70) barColor = 'bg-amber-400';

                    return (
                      <div key={b.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-md ${catDetails.bg}`}>
                              {catDetails.icon}
                            </span>
                            <div>
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{catDetails.label}</div>
                              <div className="text-[10px] text-slate-400">Limit: {formatCurrency(b.limit, currency)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-bold ${overspent ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                              {formatCurrency(spent, currency)}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">({percent.toFixed(0)}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div className={`${barColor} h-full rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Doughnut Category Breakdown */}
            <div className="glass-card rounded-2xl p-5 lg:col-span-4 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-black dark:text-slate-50 text-base mb-3">Expenses by Category</h3>
                <p className="text-xs text-slate-400 mb-4">Percentage distribution this calendar month</p>
              </div>

              {totalExpenseSum === 0 ? (
                <div className="h-48 flex items-center justify-center text-center">
                  <p className="text-slate-400 text-xs">No expending logged this calendar month.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Custom SVG Doughnut */}
                  <div className="relative w-44 h-44 mb-3">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="transparent"
                        stroke="#e2e8f0"
                        strokeWidth={strokeWidth - 2}
                        className="dark:stroke-slate-800"
                      />
                      {doughnutSegments.map((seg, i) => (
                        <circle
                          key={i}
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${seg.strokeDash} ${circumference}`}
                          strokeDashoffset={seg.strokeOffset}
                          className="transition-all duration-500 hover:stroke-[14px]"
                        />
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">Spent</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatCurrency(totalExpenseSum, currency)}</span>
                    </div>
                  </div>

                  {/* Legend listing */}
                  <div className="w-full max-h-[120px] overflow-y-auto space-y-1 pr-1 grid grid-cols-1 gap-1">
                    {doughnutSegments.map((seg, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
                          <span className="truncate max-w-[100px]">{seg.label}</span>
                        </div>
                        <span className="font-semibold shrink-0">{seg.percent.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Ledger list */}
          <div className="glass-card rounded-2xl p-5 shadow-sm">
            <h3 className="font-extrabold text-slate-950 dark:text-slate-50 text-base mb-4 flex items-center justify-between">
              <span>Recent Entries Ledger</span>
              <button 
                onClick={() => setActiveTab('expenses')}
                className="text-teal-600 hover:text-teal-700 text-xs font-semibold"
              >
                Log Streams Directory
              </button>
            </h3>

            {data.transactions.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No money logged. Hit "Add Income" or "Add Expense" to initiate!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto pr-1">
                {data.transactions.slice(0, 5).map(t => {
                  const isIncome = t.type === 'income';
                  const catDetails = isIncome 
                    ? (personalIncomeCategories[t.category] || personalIncomeCategories.other)
                    : (personalExpenseCategories[t.category as PersonalExpenseCategory] || personalExpenseCategories.other);

                  return (
                    <div key={t.id} className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`p-2 rounded-xl scale-95 shrink-0 ${catDetails.bg}`}>
                          {catDetails.icon}
                        </span>
                        <div className="truncate">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{t.description}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>{catDetails.label}</span>
                            <span>•</span>
                            <span>{formatDate(t.date)}</span>
                            {t.notes && (t.notes.includes('Recurring') || t.notes.includes('[Recurring')) && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 text-teal-600 dark:text-teal-400 font-semibold uppercase text-[9px] tracking-wider leading-none">
                                  <Repeat size={9} className="animate-pulse" />
                                  <span>Recurring</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className={`text-sm font-bold font-mono ${isIncome ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(t.amount, currency)}
                        </span>
                        <button 
                          onClick={() => handleDeleteTransaction(t.id)}
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
        </>
      )}

      {/* Income Stream Section */}
      {activeTab === 'income' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">Personal Income Streams</h3>
              <p className="text-xs text-slate-400">Chronological list of logged income</p>
            </div>
            <button 
              onClick={() => openAddTxModal('income')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold cursor-pointer"
            >
              <Plus size={16} /> Add Income Stream
            </button>
          </div>

          <div className="flex gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
            {['all', 'salary', 'freelance', 'investment', 'gift', 'other'].map(cat => (
              <button
                key={cat}
                onClick={() => setIncomeFilter(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition ${
                  incomeFilter === cat
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {cat === 'all' ? 'All Income' : personalIncomeCategories[cat]?.label || cat}
              </button>
            ))}
          </div>

          {/* List display */}
          {data.transactions.filter(t => t.type === 'income').length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No personal income recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto pr-1 space-y-1">
              {data.transactions
                .filter(t => t.type === 'income' && (incomeFilter === 'all' || t.category === incomeFilter))
                .map(t => {
                  const catDetails = personalIncomeCategories[t.category] || personalIncomeCategories.other;
                  return (
                    <div key={t.id} className="py-3 flex items-center justify-between hover:bg-slate-5/40 dark:hover:bg-slate-800/40 px-2 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`p-2 rounded-xl shrink-0 ${catDetails.bg}`}>
                          {catDetails.icon}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.description}</div>
                          <div className="text-[11px] text-slate-400">
                            {formatDate(t.date)} {t.notes && <span className="italic">• "{t.notes}"</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold font-mono text-emerald-500">
                          +{formatCurrency(t.amount, currency)}
                        </span>
                        <button 
                          onClick={() => handleDeleteTransaction(t.id)}
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
      )}

      {/* Expense Tracking Section */}
      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">Expense Log Records</h3>
              <p className="text-xs text-slate-400">Every single logged outgoing transaction</p>
            </div>
            <button 
              onClick={() => openAddTxModal('expense')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold cursor-pointer"
            >
              <Plus size={16} /> Add Expense Outlay
            </button>
          </div>

          <div className="flex gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
            <button
              onClick={() => setExpenseFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition ${
                expenseFilter === 'all'
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              All Outgoings
            </button>
            {Object.entries(personalExpenseCategories).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setExpenseFilter(key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 transition ${
                  expenseFilter === key
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {value.label}
              </button>
            ))}
          </div>

          {/* Table display list */}
          {data.transactions.filter(t => t.type === 'expense').length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No expenses logged.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto pr-1 space-y-1">
              {data.transactions
                .filter(t => t.type === 'expense' && (expenseFilter === 'all' || t.category === expenseFilter))
                .map(t => {
                  const catDetails = personalExpenseCategories[t.category as PersonalExpenseCategory] || personalExpenseCategories.other;
                  return (
                    <div key={t.id} className="py-3 flex items-center justify-between hover:bg-slate-5/40 dark:hover:bg-slate-800/40 px-2 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`p-2 rounded-xl shrink-0 ${catDetails.bg}`}>
                          {catDetails.icon}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.description}</div>
                          <div className="text-[11px] text-slate-400">
                            {formatDate(t.date)} {t.notes && <span className="italic">• "{t.notes}"</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold font-mono text-red-500">
                          -{formatCurrency(t.amount, currency)}
                        </span>
                        <button 
                          onClick={() => handleDeleteTransaction(t.id)}
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
      )}

      {/* Budget limits setup tab */}
      {activeTab === 'budgets' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">Budget Category Limits Planner</h3>
              <p className="text-xs text-slate-400">Establish and modify monthly ceilings for your spending</p>
            </div>
            <button
              onClick={() => openAddBudgetModal()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition cursor-pointer self-start"
            >
              <Plus size={16} /> Establish New Budget Limit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.budgets.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-10 col-span-full text-center text-slate-400 text-sm">
                No active budget limits configured. Get starting to optimize savings!
              </div>
            ) : (
              data.budgets.map(b => {
                const spent = calculateBudgetSpent(b.category);
                const remaining = Math.max(0, b.limit - spent);
                const percent = Math.min(100, (spent / b.limit) * 100);
                const isOver = spent > b.limit;
                const catDetails = personalExpenseCategories[b.category] || personalExpenseCategories.other;

                let barColor = 'bg-emerald-500';
                let stateText = 'Optimized Spend';
                let stateColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30';
                if (percent >= 90) {
                  barColor = 'bg-red-500';
                  stateText = isOver ? 'OVER BUDGETED CAP' : 'DANGER ZONE';
                  stateColor = 'text-red-500 bg-red-50 dark:bg-red-900/30';
                } else if (percent >= 70) {
                  barColor = 'bg-amber-400';
                  stateText = 'APPROACHING CEILING';
                  stateColor = 'text-amber-500 bg-amber-50 dark:bg-amber-900/10';
                }

                return (
                  <div key={b.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`p-2 rounded-xl ${catDetails.bg}`}>
                          {catDetails.icon}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{catDetails.label}</h4>
                          <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{b.description || 'Monthly allocation limit'}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded ${stateColor}`}>
                        {stateText}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs dark:text-slate-300">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{formatCurrency(b.limit, currency)}</div>
                        <div className="text-[9px] text-slate-400">Total Limit</div>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{formatCurrency(spent, currency)}</div>
                        <div className="text-[9px] text-slate-400">Sum Outflow</div>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg col-span-2 flex justify-between px-4">
                        <span className="text-[10px] text-slate-400">Free Balance:</span>
                        <span className={`font-semibold ${isOver ? 'text-red-500' : 'text-emerald-500'}`}>
                          {isOver ? '-' : ''}{formatCurrency(remaining, currency)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                        <span>Allocated Space Used</span>
                        <span>{percent.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className={`${barColor} h-full rounded-full transition-all duration-300`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => openAddBudgetModal(b)}
                        className="flex-1 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-100 dark:border-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteBudget(b.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-xs font-semibold rounded-lg flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: Save/Add Transaction */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                Add {txModalType === 'income' ? 'Income' : 'Expense'} Entry
              </h3>
              <button 
                onClick={() => setIsTxModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setTxModalType('income'); setTxCategory('salary'); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition ${
                    txModalType === 'income' ? 'bg-white shadow dark:bg-slate-900 text-teal-600 dark:text-teal-400' : 'text-slate-500'
                  }`}
                >
                  Income Tab
                </button>
                <button
                  type="button"
                  onClick={() => { setTxModalType('expense'); setTxCategory('food'); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition ${
                    txModalType === 'expense' ? 'bg-white shadow dark:bg-slate-900 text-teal-600 dark:text-teal-400' : 'text-slate-500'
                  }`}
                >
                  Expense Tab
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Description Entry</label>
                <input
                  type="text"
                  placeholder="e.g. Groceries, Freelance fee..."
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Amount ($ / Local)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Category Classification</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none focus:border-teal-500"
                  >
                    {txModalType === 'income' 
                      ? Object.entries(personalIncomeCategories).map(([key, value]) => (
                          <option key={key} value={key}>{value.label}</option>
                        ))
                      : Object.entries(personalExpenseCategories).map(([key, value]) => (
                          <option key={key} value={key}>{value.label}</option>
                        ))
                    }
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Date Logged</label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              {/* Recurring Switch and Frequency controls */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-100 dark:border-slate-900 rounded-xl space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 pointer-events-auto"
                  />
                  <div className="flex items-center gap-1.5">
                    <Repeat size={14} className="text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">Set as Recurring Transaction</span>
                  </div>
                </label>

                {isRecurring && (
                  <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-1 font-sans">Frequency</label>
                      <select
                        value={recurrenceFreq}
                        onChange={(e) => setRecurrenceFreq(e.target.value as 'weekly' | 'monthly' | 'yearly')}
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-teal-500"
                      >
                        <option value="weekly">Weekly Frequency</option>
                        <option value="monthly">Monthly Frequency</option>
                        <option value="yearly">Yearly Frequency</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-1 font-sans">Repetitions Count</label>
                      <select
                        value={recurrenceCount}
                        onChange={(e) => setRecurrenceCount(parseInt(e.target.value))}
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-teal-500"
                      >
                        <option value="3">3 cycles</option>
                        <option value="6">6 cycles</option>
                        <option value="12">12 cycles</option>
                        <option value="24">24 cycles</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Additional metadata notes..."
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Establish Budget limit */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                {editingBudget ? 'Edit Budget Category Limit' : 'Configure New Budget Limit'}
              </h3>
              <button 
                onClick={() => setIsBudgetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveBudget} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Expense Category</label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value as PersonalExpenseCategory)}
                  className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none focus:border-teal-500"
                  disabled={editingBudget !== null}
                >
                  {Object.entries(personalExpenseCategories).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Monthly Cost Ceiling</label>
                <input
                  type="number"
                  placeholder="e.g. 500.00"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Clarifying Scope Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Target grocery cap limits"
                  value={budgetDesc}
                  onChange={(e) => setBudgetDesc(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition"
                >
                  Configure Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
