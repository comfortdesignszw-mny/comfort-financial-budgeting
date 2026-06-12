import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coins, RotateCw, Edit2, Save, X, AlertCircle, Info, Landmark, 
  ArrowRightLeft, Check, Sparkles, AlertTriangle, TrendingUp 
} from 'lucide-react';
import { OfflineCurrencyManager, CachedExchangeRates } from '../utils/offlineCurrency';
import { formatCurrency } from '../utils';

interface CurrencyDashboardProps {
  appCurrency: string; // The primary suite currency
}

export default function CurrencyDashboard({ appCurrency }: CurrencyDashboardProps) {
  // Initialize offline currency manager instance
  const manager = useMemo(() => new OfflineCurrencyManager(), []);
  
  // Local reactive states
  const [rates, setRates] = useState<CachedExchangeRates>(() => manager.getRates());
  const [primaryAccounting, setPrimaryAccounting] = useState<string>(() => rates.baseCurrency);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  
  // Calculator states
  const [calcAmount, setCalcAmount] = useState<string>('1.00');
  const [calcSourceCurrency, setCalcSourceCurrency] = useState<string>('USD');
  
  // Editing individual rate states
  const [editingCurrency, setEditingCurrency] = useState<string | null>(null);
  const [editedRateValue, setEditedRateValue] = useState<string>('');
  const [editedIsInverted, setEditedIsInverted] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>('');

  // Active informative dialog helper
  const [selectedMathPath, setSelectedMathPath] = useState<string | null>(null);

  // Trigger SWR sync immediately on mount
  useEffect(() => {
    handleRevalidateSync();
  }, []);

  const handleRevalidateSync = async () => {
    setIsSyncing(true);
    setSyncMessage("Revalidating rates in background...");
    try {
      const freshRates = await manager.syncRates((freshSnapshot) => {
        setRates(freshSnapshot);
        setSyncMessage("Rates updated successfully via background sync!");
        setTimeout(() => setSyncMessage(null), 3000);
      });
      setRates(freshRates);
      if (!navigator.onLine) {
        setSyncMessage("Offline: Loaded cached rates snapshot");
        setTimeout(() => setSyncMessage(null), 3000);
      }
    } catch (e) {
      setSyncMessage("Background revalidation failed. Standard cache safe.");
      setTimeout(() => setSyncMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Convert amount helper safely avoiding binary float errors
  const conversionGrid = useMemo(() => {
    const numAmount = parseFloat(calcAmount) || 0;
    const currencies = ['USD', 'ZiG', 'ZAR', 'BWP'];
    return currencies.map(target => {
      try {
        const result = manager.convert(numAmount, calcSourceCurrency, target);
        return {
          currency: target,
          amount: result.convertedAmount,
          rate: result.effectiveRate,
          path: result.mathPath
        };
      } catch (e: any) {
        return {
          currency: target,
          amount: 0,
          rate: 1.0,
          path: e.message || 'Error converting'
        };
      }
    });
  }, [rates, calcAmount, calcSourceCurrency]);

  // Handle manual rate editing
  const handleStartEdit = (currency: string) => {
    const rateData = rates.rates[currency];
    if (rateData) {
      setEditingCurrency(currency);
      setEditedRateValue(rateData.rate.toString());
      setEditedIsInverted(rateData.isInverted);
      setEditError('');
    }
  };

  const handleSaveManualRate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = parseFloat(editedRateValue);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      setEditError("Please enter a valid positive number.");
      return;
    }

    try {
      if (editingCurrency) {
        manager.updateManualRate(editingCurrency, parsedRate, editedIsInverted);
        setRates(manager.getRates()); // Reload cached snapshots
        setEditingCurrency(null);
        setSyncMessage(`Manually modified ${editingCurrency} exchange rate successfully!`);
        setTimeout(() => setSyncMessage(null), 3000);
      }
    } catch (err: any) {
      setEditError(err.message || "Failed to update rate manually.");
    }
  };

  // Reset rates to factory defaults
  const handleResetToDefaults = () => {
    if (confirm("Reset rates to standard June 2026 baseline snapshots?")) {
      localStorage.removeItem('comfort_exchange_rates');
      const freshManager = new OfflineCurrencyManager();
      setRates(freshManager.getRates());
      setSyncMessage("Rates reset to standard fallback baselines.");
      setTimeout(() => setSyncMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Status Notification Alert */}
      {syncMessage && (
        <div className="px-4 py-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 rounded-xl text-xs font-semibold text-teal-800 dark:text-teal-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
          <Info size={14} className="text-teal-500 animate-pulse" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Main Stats Summary Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-gradient-to-tr from-emerald-50 to-teal-100 dark:from-slate-800/80 dark:to-teal-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Landmark size={20} />
              </span>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Zimbabwe Local Multi-Currency Suite</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Offline-first rates manager protecting high-precision billing & payments</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRevalidateSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-755 dark:text-slate-300 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              title="Trigger stale-while-revalidate background fetch"
            >
              <RotateCw size={13} className={isSyncing ? 'animate-spin text-teal-500' : 'text-slate-400'} />
              <span>SWR Sync</span>
            </button>
            <button
              onClick={handleResetToDefaults}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200/20 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Reset baselines
            </button>
          </div>
        </div>

        {/* Sync Metadata strip */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-4 text-xs font-medium text-slate-450 dark:text-slate-400 justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            <span>
              {navigator.onLine 
                ? "Live Connected Network revalidations active" 
                : "Offline Sandbox - Zero external blocks active"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-normal">Last rates refresh: </span>
            <span className="font-mono text-slate-650 dark:text-slate-350">{new Date(rates.lastSyncedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Grid of calculator and direct/indirect rate logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION A: Highly interactive conversion billing board */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRightLeft size={14} className="text-teal-500" />
                Multi-Currency Billing Estimator
              </h4>
              <span className="text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Protects precision cents
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Define the source transaction. Enter any amount to immediately calculate equivalent payments and required change across different currencies.
            </p>

            {/* Input values */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-2">
              <div className="sm:col-span-8 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Payment / Bill Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    className="w-full pl-3 pr-16 py-3 border border-slate-200 dark:border-slate-705 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3.5 top-3 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                    Cents Proof
                  </span>
                </div>
              </div>

              <div className="sm:col-span-4 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Origin Currency</label>
                <select
                  value={calcSourceCurrency}
                  onChange={(e) => setCalcSourceCurrency(e.target.value)}
                  className="w-full px-3 py-3 border border-slate-200 dark:border-slate-705 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 text-sm font-extrabold focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="ZiG">ZiG - Zim Gold</option>
                  <option value="ZAR">ZAR - SA Rand</option>
                  <option value="BWP">BWP - Bots Pula</option>
                </select>
              </div>
            </div>

            {/* Dynamic Equivalents List Box - Real-time Change billing metrics */}
            <div className="space-y-3.5 pt-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Equivalent Payments & Cross-Rates</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {conversionGrid.map(item => {
                  const isSelf = item.currency === calcSourceCurrency;
                  return (
                    <div 
                      key={item.currency} 
                      className={`p-4 border rounded-xl flex flex-col justify-between transition ${
                        isSelf 
                          ? 'bg-gradient-to-tr from-teal-50/20 to-emerald-50/15 border-emerald-550/30 dark:border-emerald-900/40 shadow-sm' 
                          : 'bg-slate-50/40 dark:bg-slate-950/20 border-slate-100 dark:border-slate-850'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                            Equivalent in {item.currency}
                          </span>
                          <span className={`text-base font-extrabold font-mono tracking-tight block mt-0.5 ${
                            isSelf ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {item.currency === 'USD' ? '$' : ''} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {item.currency !== 'USD' ? ` ${item.currency}` : ''}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded tracking-wide ${
                          item.currency === 'ZiG' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' :
                          item.currency === 'USD' ? 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300' :
                          item.currency === 'ZAR' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' :
                          'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                        }`}>
                          {item.currency}
                        </span>
                      </div>

                      <div className="mt-3.5 pt-2 border-t border-slate-200/40 dark:border-slate-800/60 flex items-center justify-between">
                        <span className="text-[9px] text-slate-400 font-medium">
                          Ratio: 1 {calcSourceCurrency} = {item.rate.toFixed(4)} {item.currency}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedMathPath(item.path)}
                          className="text-[9px] text-teal-500 hover:text-teal-650 dark:hover:text-teal-400 font-extrabold flex items-center gap-0.5 cursor-pointer"
                        >
                          Show Math Log
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Primary Owner Accounting Choice display */}
          <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Coins size={14} className="text-amber-500" />
              <span className="text-slate-400">Owner baseline accounting standard:</span>
              <span className="text-slate-800 dark:text-slate-100 font-black">{primaryAccounting}</span>
            </div>
            <div className="text-[10px] text-slate-400 italic">
              Zim regulatory standard accounting is auto USD grounded
            </div>
          </div>
        </div>

        {/* SECTION B: Rate snapshots and manual overrides */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-teal-500" />
              Manual Exchange Override Matrix
            </h4>
            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              No Network Needed
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            In Zimbabwe, black-market/parallel interbank exchange rates swing frequently. Update discrete multipliers immediately below under backup constraints.
          </p>

          <div className="space-y-3.5">
            {Object.keys(rates.rates).map(currName => {
              const rDetails = rates.rates[currName];
              const isBaseSymbol = currName === 'USD';
              
              return (
                <div key={currName} className="border border-slate-100 dark:border-slate-850/60 rounded-xl p-3.5 bg-slate-50/20 dark:bg-slate-950/10 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-150 text-xs">{currName}</span>
                        <span className="text-[9px] text-slate-400 block">Relative to USD</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-200 block">
                          {isBaseSymbol ? 'Baseline System' : (
                            rDetails.isInverted 
                              ? `1 ${currName} = ${rDetails.rate} USD` 
                              : `1 USD = ${rDetails.rate} ${currName}`
                          )}
                        </span>
                        <span className="text-[8px] text-slate-400">
                          Updated: {new Date(rDetails.updatedAt).toLocaleTimeString()}
                        </span>
                      </div>

                      {!isBaseSymbol && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(currName)}
                          className="p-1 px-2 border border-slate-200 dark:border-slate-850 hover:border-teal-500 hover:text-teal-500 text-slate-400 dark:text-slate-400 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-950"
                        >
                          <Edit2 size={10} /> Override
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Overruling Editor Form */}
                  {editingCurrency === currName && (
                    <form onSubmit={handleSaveManualRate} className="p-3 border-t border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-950 rounded-lg space-y-3 animate-in slide-in-from-top-2 duration-250 select-text text-left">
                      <div className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest flex items-center justify-between">
                        <span>Set manual {currName} factors</span>
                        <button type="button" onClick={() => setEditingCurrency(null)} className="text-slate-450 hover:text-red-500">
                          <X size={12} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-bold">Local Parallel/Interbank Rate</label>
                          <input
                            type="number"
                            step="any"
                            min="0.000001"
                            value={editedRateValue}
                            onChange={(e) => setEditedRateValue(e.target.value)}
                            className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-teal-500 dark:text-slate-100"
                            placeholder="Rate multiplier"
                            required
                          />
                        </div>

                        <div className="flex items-center gap-1.5 pt-0.5">
                          <input
                            type="checkbox"
                            disabled={currName === 'ZiG'} // ZiG direct rates match standard bank specs
                            id="rateInversionOpt"
                            checked={editedIsInverted}
                            onChange={(e) => setEditedIsInverted(e.target.checked)}
                            className="w-3.5 h-3.5 accent-teal-600 rounded cursor-pointer"
                          />
                          <label htmlFor="rateInversionOpt" className="text-[10px] text-slate-450 font-bold select-none cursor-pointer">
                            Rate is inverted (i.e. 1 {currName} = X USD)
                          </label>
                        </div>
                      </div>

                      {editError && (
                        <span className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                          <AlertTriangle size={10} /> {editError}
                        </span>
                      )}

                      <div className="pt-1 flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingCurrency(null)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 dark:bg-slate-900 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 transition rounded-md cursor-pointer border border-slate-100 dark:border-slate-850"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 text-[10px] bg-teal-600 hover:bg-teal-700 text-white font-black transition rounded-md flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Save size={10} /> Overrule
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Floating explanatory math modal alert */}
      {selectedMathPath && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 max-w-md w-full p-5 space-y-4 rounded-2xl shadow-xl select-all text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-150 uppercase tracking-widest/10">
                <Sparkles size={14} className="text-amber-500" />
                Floating Point Proof Calculations
              </div>
              <button
                type="button"
                onClick={() => setSelectedMathPath(null)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-amber-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Below is the exact math breakdown logging the precise sandbox database rate conversion bounds. This ensures zero runtime floats are exposed to the client interface:
              </p>
              
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 text-[11px] font-mono text-slate-500 dark:text-slate-400 break-words leading-relaxed">
                {selectedMathPath}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMathPath(null)}
                className="px-4.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
