/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurrencyType, BusinessTransaction, BusinessInvestment } from './types';

export const currencySymbols: Record<CurrencyType, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
  CAD: 'C$',
  AUD: 'A$',
  NGN: '₦',
  KES: 'KSh',
  ZAR: 'R'
};

export function formatCurrency(amount: number, currency: CurrencyType): string {
  const symbol = currencySymbols[currency] || '$';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Calculates current Cash on Hand (Bucket 1) for the Business
 * Total money earned (sales) minus total money spent (expenses) plus personal investments.
 */
export function calculateBusinessCashOnHand(
  transactions: BusinessTransaction[],
  investments: BusinessInvestment[]
): number {
  const salesSum = transactions
    .filter((t) => t.type === 'sale')
    .reduce((sum, t) => sum + t.amount, 0);

  const expensesSum = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const investmentsSum = investments.reduce((sum, i) => sum + i.amount, 0);

  return salesSum - expensesSum + investmentsSum;
}

/**
 * Calculates What the Business Owns (Bucket 2)
 * Sum of values from "Tools & Setup" category plus current estimated stock values.
 */
export function calculateBusinessOwnedAssets(
  transactions: BusinessTransaction[]
): number {
  // Tools & Setup sum + Stock & Materials sum (bought elements represent asset possession in simplified model)
  const toolsSum = transactions
    .filter((t) => t.type === 'expense' && t.category === 'tools')
    .reduce((sum, t) => sum + t.amount, 0);

  const stockSum = transactions
    .filter((t) => t.type === 'expense' && t.category === 'stock')
    .reduce((sum, t) => sum + t.amount, 0);

  return toolsSum + stockSum;
}

/**
 * Calculates the Runway Metric:
 * "At your current spending habits, your cash will keep your doors open for [X] days."
 * Current cash divided by daily average spend over the logged data.
 */
export function calculateBusinessRunway(
  transactions: BusinessTransaction[],
  cashOnHand: number
): { days: number | 'infinite' | 'empty'; dailyAverage: number } {
  const expenses = transactions.filter((t) => t.type === 'expense');
  if (expenses.length === 0) {
    return { days: 'infinite', dailyAverage: 0 };
  }

  // Get date range of logged expenses
  const dates = expenses.map((t) => new Date(t.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates, new Date().getTime()); // defaults to up to today

  // Difference in days (min 1 day to avoid dividing by 0)
  const diffTime = Math.abs(maxDate - minDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  const totalExpenseAmount = expenses.reduce((sum, t) => sum + t.amount, 0);
  const dailyAverageSpend = totalExpenseAmount / diffDays;

  if (dailyAverageSpend <= 0) {
    return { days: 'infinite', dailyAverage: 0 };
  }

  if (cashOnHand <= 0) {
    return { days: 0, dailyAverage: dailyAverageSpend };
  }

  const days = Math.round(cashOnHand / dailyAverageSpend);
  return { days, dailyAverage: dailyAverageSpend };
}

/**
 * Rule-based sentence generator for the End-of-Month Report Card
 */
export function generateMonthlyInsight(
  transactions: BusinessTransaction[],
  selectedMonthStr: string // "YYYY-MM" format
): string {
  const [year, month] = selectedMonthStr.split('-').map(Number);
  const currentMonthDate = new Date(year, month - 1, 1);
  
  // Previous month helper
  const prevMonthDate = new Date(year, month - 2, 1);
  const prevMonthYear = prevMonthDate.getFullYear();
  const prevMonthMonth = prevMonthDate.getMonth() + 1;
  const prevMonthStr = `${prevMonthYear}-${String(prevMonthMonth).padStart(2, '0')}`;

  // Filter current and previous transactions
  const currentMonthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && (d.getMonth() + 1) === month;
  });

  const prevMonthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === prevMonthYear && (d.getMonth() + 1) === prevMonthMonth;
  });

  // Calculate current categories
  const currentSales = currentMonthTx.filter((t) => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
  const currentExpenses = currentMonthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentHelpers = currentMonthTx.filter((t) => t.type === 'expense' && t.category === 'helpers').reduce((sum, t) => sum + t.amount, 0);
  const currentBills = currentMonthTx.filter((t) => t.type === 'expense' && t.category === 'bills').reduce((sum, t) => sum + t.amount, 0);
  const currentStock = currentMonthTx.filter((t) => t.type === 'expense' && t.category === 'stock').reduce((sum, t) => sum + t.amount, 0);

  // Calculate previous helper spend
  const prevHelpers = prevMonthTx.filter((t) => t.type === 'expense' && t.category === 'helpers').reduce((sum, t) => sum + t.amount, 0);
  const prevSales = prevMonthTx.filter((t) => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);

  // Analyze Helping Hands condition explicitly requested:
  // "If helping hands expense increased by 20% compared to previous month: 'You spent more on Helping Hands this month than last month. Make sure your sales grew enough to support the extra help.'"
  if (currentHelpers > 0) {
    if (prevHelpers === 0 || (currentHelpers - prevHelpers) / prevHelpers >= 0.2) {
      // Sales check
      const salesGrowth = prevSales > 0 ? (currentSales - prevSales) / prevSales : 0;
      if (salesGrowth < 0.1) {
        return `You spent more on Helping Hands (staff & wages) this month than last month, but your sales did not grow enough to support the extra help (${currentSales > 0 ? 'grew by ' + Math.round(salesGrowth * 100) + '%' : 'no previous sales'}). Focus on boosting sales or adjusting help schedules.`;
      } else {
        return `You spent more on Helping Hands this month than last month. It looks like your sales grew as well to support this extra help! Maintain this momentum.`;
      }
    }
  }

  // Fallback insights based on general state:
  if (currentSales === 0 && currentExpenses === 0) {
    return "No transactions found for this month range. Grab a bucket and map out some money flows!";
  }

  if (currentSales > currentExpenses) {
    const margin = currentSales - currentExpenses;
    if (currentStock > currentExpenses * 0.4) {
      return `Awesome! You generated a sweet take-home surplus of ${margin.toLocaleString()} this month. A big chunk went into 'Stock & Materials'—make sure to put in energy to turn that inventory into new sales next month!`;
    }
    return `Looking grand! You made more money than you spent, locking in a take-home surplus of ${margin.toLocaleString()} this month. Keep your pipes clean and flows steady.`;
  } else {
    const deficit = currentExpenses - currentSales;
    if (currentBills > currentSales) {
      return `Attention: Your 'Rent, Power & Bills' of ${currentBills.toLocaleString()} completely washed out your intake of ${currentSales.toLocaleString()} this month. Examine if you can negotiate power rates, lower rent, or adjust bills.`;
    }
    return `Heads up: Flows out exceeded flows in by ${deficit.toLocaleString()} this month. Look through your expense lists to see which bucket (e.g., Stock, Setup, or Bills) can be turned off or patched.`;
  }
}
