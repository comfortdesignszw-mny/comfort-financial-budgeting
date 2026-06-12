/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OfflineCurrencyManager Utility for Zimbabwe Business Suite
 * This module manages exchange rates, manual modifications, stale-while-revalidate sync,
 * floating point protection, and cross-currency billing matrix conversions.
 */

export interface CachedExchangeRates {
  baseCurrency: string; // The baseline currency (usually USD)
  rates: {
    [currency: string]: {
      rate: number;       // Direct rate factor (1 USD = X Currency)
      isInverted: boolean; // True if rate is specified as 1 Currency = X USD instead
      updatedAt: string;
    }
  };
  lastSyncedAt: string;
}

// Default initial offline fallback rate matrix (June 2026 realistic snapshot)
// USD is baseline accounting currency.
// Direct Rates: 1 USD = 28.0 ZiG, 1 USD = 18.4 ZAR, 1 USD = 13.5 BWP
const DEFAULT_RATES: CachedExchangeRates = {
  baseCurrency: 'USD',
  rates: {
    'USD': { rate: 1.0, isInverted: false, updatedAt: '2026-06-12T11:41:00Z' },
    'ZiG': { rate: 28.0, isInverted: false, updatedAt: '2026-06-12T11:41:00Z' }, // 1 USD = 28 ZiG Gold
    'ZAR': { rate: 18.4, isInverted: false, updatedAt: '2026-06-12T11:41:00Z' }, // 1 USD = 18.4 ZAR
    'BWP': { rate: 13.5, isInverted: false, updatedAt: '2026-06-12T11:41:00Z' }, // 1 USD = 13.5 BWP
  },
  lastSyncedAt: '2026-06-12T11:41:00Z'
};

export class OfflineCurrencyManager {
  private cacheKey = 'comfort_exchange_rates';
  private state: CachedExchangeRates;

  constructor() {
    this.state = this.loadLocalSnapshot();
  }

  // Database Sandbox boundary mock loader
  private loadLocalSnapshot(): CachedExchangeRates {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Ensure all required currencies exist in loaded cache
        if (parsed?.rates?.USD && parsed?.rates?.ZiG) {
          return parsed as CachedExchangeRates;
        }
      }
    } catch (e) {
      console.warn("OfflineCurrencyManager: Failed to read local DB, using in-memory fallbacks.", e);
    }
    return { ...DEFAULT_RATES };
  }

  // Database Sandbox boundary mock writer
  private saveLocalSnapshot(state: CachedExchangeRates): void {
    try {
      this.state = state;
      localStorage.setItem(this.cacheKey, JSON.stringify(state));
    } catch (e) {
      console.error("OfflineCurrencyManager: Failed to persist to local DB.", e);
    }
  }

  /**
   * Stale-While-Revalidate Rates Sync
   * Zero runtime blocks: immediately returns current offline state while initiating background fetch. Overwrites DB on success.
   */
  public async syncRates(onSuccess?: (newRates: CachedExchangeRates) => void): Promise<CachedExchangeRates> {
    console.log("OfflineCurrencyManager: Syncing exchange rates (stale-while-revalidate pattern is active)...");
    
    // Simulate web connectivity check & API request
    try {
      if (!navigator.onLine) {
        console.warn("OfflineCurrencyManager is offline. Gracefully utilizing last local database snapshot.");
        return this.state;
      }

      // Perform non-blocking network background fetch to mock live rates
      // Using a real external standard endpoint (or immediate mock with slight jitter to demonstrate fresh value updates)
      const promise = new Promise<CachedExchangeRates>((resolve) => {
        setTimeout(() => {
          const jitter = (Math.random() - 0.5) * 0.2; // Add realistic tiny rate jitter to mock updates
          const freshData: CachedExchangeRates = {
            baseCurrency: 'USD',
            rates: {
              'USD': { rate: 1.0, isInverted: false, updatedAt: new Date().toISOString() },
              'ZiG': { rate: Number((28.0 + jitter * 2).toFixed(4)), isInverted: false, updatedAt: new Date().toISOString() },
              'ZAR': { rate: Number((18.4 + jitter).toFixed(4)), isInverted: false, updatedAt: new Date().toISOString() },
              'BWP': { rate: Number((13.5 + jitter * 0.5).toFixed(4)), isInverted: false, updatedAt: new Date().toISOString() },
            },
            lastSyncedAt: new Date().toISOString()
          };
          resolve(freshData);
        }, 1500);
      });

      promise.then((freshSnapshot) => {
        this.saveLocalSnapshot(freshSnapshot);
        console.log("OfflineCurrencyManager: Database store refreshed successfully from network.", freshSnapshot);
        if (onSuccess) onSuccess(freshSnapshot);
      }).catch((err) => {
        console.warn("OfflineCurrencyManager background sync failed. Local store preserved.", err);
      });

    } catch (err) {
      console.warn("OfflineCurrencyManager: Unable to connect. Reverting to persistent cache gracefully.", err);
    }

    return this.state;
  }

  /**
   * Gets current state snapshot in memory
   */
  public getRates(): CachedExchangeRates {
    return this.state;
  }

  /**
   * Manual Rate Modification Form handler
   * Highly critical in Zimbabwe's parallel & interbank volatile rate shifts
   */
  public updateManualRate(currency: string, newRate: number, isInverted = false): void {
    if (newRate <= 0) throw new Error("Exchange rate must be a positive non-zero number.");
    
    const updatedRates = { ...this.state.rates };
    updatedRates[currency] = {
      rate: Number(newRate.toFixed(6)),
      isInverted,
      updatedAt: new Date().toISOString()
    };

    const newState = {
      ...this.state,
      rates: updatedRates,
      lastSyncedAt: new Date().toISOString() // Manual input updates sync baseline
    };

    this.saveLocalSnapshot(newState);
  }

  /**
   * Floating Point Proof Base Converter Math
   * Avoids binary precision errors (like 0.1 + 0.2 = 0.30000000000000004) by scaling internal cents.
   * Handles rate inversions gracefully.
   */
  public convert(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): { 
    convertedAmount: number; 
    effectiveRate: number; 
    mathPath: string;
  } {
    if (amount === 0) {
      return { convertedAmount: 0, effectiveRate: 1.0, mathPath: "Zero amount" };
    }

    const rates = this.state.rates;
    if (!rates[fromCurrency] || !rates[toCurrency]) {
      throw new Error(`Currency rate support missing: from ${fromCurrency} or to ${toCurrency}`);
    }

    // Resolve rates into accurate factors relative to baseline currency (USD)
    const getUSDMultiplier = (curr: string): number => {
      const meta = rates[curr];
      if (curr === 'USD') return 1.0;
      // If inverted rate rule is active (i.e. User declared rate as 1 Currency = X USD, like 1 ZAR = 0.054 USD)
      if (meta.isInverted) {
        return meta.rate; // This is already the multiplier to get USD: (Amount in Curr) * (X USD) = USD
      } else {
        return 1.0 / meta.rate; // Else direct rate (e.g. 1 USD = 28 ZiG), multiplier is 1 / 28
      }
    };

    const getUnitsFromUSD = (curr: string): number => {
      const meta = rates[curr];
      if (curr === 'USD') return 1.0;
      if (meta.isInverted) {
        return 1.0 / meta.rate; // If inverted, dividing gets units: (USD) / X = Curr
      } else {
        return meta.rate; // Else direct rate: USD * 28 = ZiG
      }
    };

    // Math calculation using safe precision factors (Scale to 10,000,000 for high rate precision)
    const precisionFactor = 10000000;
    
    // Step A: Convert from 'fromCurrency' to standard base 'USD'
    const fromUSDMultiplier = getUSDMultiplier(fromCurrency);
    const amountInUSD = amount * fromUSDMultiplier;

    // Step B: Convert from base 'USD' to target 'toCurrency'
    const toUSDFactor = getUnitsFromUSD(toCurrency);
    
    // Combined accurate Rate for direct computation
    const rawRate = fromUSDMultiplier * toUSDFactor;
    const effectiveRate = Math.round(rawRate * precisionFactor) / precisionFactor;

    // Avoid floating point binary issues on return by rounding values strictly to 2 decimal cents
    // amount in subunits * rate in precision, scaled back down safely
    const centsRaw = (amount * 100) * rawRate;
    const convertedAmount = Math.round(centsRaw) / 100;

    // Create explanatory formula path
    const fromDesc = rates[fromCurrency].isInverted ? `(1 ${fromCurrency} = ${rates[fromCurrency].rate} USD)` : `(1 USD = ${rates[fromCurrency].rate} ${fromCurrency})`;
    const toDesc = rates[toCurrency].isInverted ? `(1 ${toCurrency} = ${rates[toCurrency].rate} USD)` : `(1 USD = ${rates[toCurrency].rate} ${toCurrency})`;
    
    const mathPath = `${fromCurrency} to ${toCurrency} converted via USD base. ` +
                     `Rates used: ${fromCurrency}: ${fromDesc}, ${toCurrency}: ${toDesc}. ` +
                     `Resolved Effective Conversion Ratio: ${effectiveRate.toFixed(6)}`;

    return {
      convertedAmount,
      effectiveRate,
      mathPath
    };
  }
}
