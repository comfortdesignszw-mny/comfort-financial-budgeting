/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CurrencyType = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'CAD' | 'AUD' | 'NGN' | 'KES' | 'ZAR';

export interface ProfileState {
  name: string;
  email: string;
  currency: CurrencyType;
  savingsTarget: number;
  savingsGoal: string;
  createdAt: string;
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  accumulatedSavings?: number;
}

// Personal space types
export type PersonalTransactionType = 'income' | 'expense';

export type PersonalIncomeCategory = 'salary' | 'freelance' | 'investment' | 'gift' | 'other';
export type PersonalExpenseCategory = 'food' | 'transport' | 'entertainment' | 'shopping' | 'bills' | 'health' | 'education' | 'savings' | 'other';

export interface PersonalTransaction {
  id: string;
  type: PersonalTransactionType;
  description: string;
  amount: number;
  category: string; // matches either PersonalIncomeCategory or PersonalExpenseCategory
  date: string;
  notes?: string;
  createdAt: string;
}

export interface PersonalBudget {
  id: string;
  category: PersonalExpenseCategory;
  limit: number;
  description?: string;
  createdAt: string;
}

// Business space types ("CashFlow Simple")
export type BusinessTransactionType = 'sale' | 'expense'; // "Money Earned" vs "Money Spent"

// Simple, non-accounting categories:
// 1. Stock & Materials (Things bought to resell)
// 2. Rent, Power & Bills (Keeping the lights on)
// 3. Helping Hands (Staff, wages, contractors)
// 4. Tools & Setup (Equipment, machinery, computers)
export type BusinessExpenseCategory = 'stock' | 'bills' | 'helpers' | 'tools' | 'food' | 'transport' | 'other';

export interface BusinessTransaction {
  id: string;
  type: BusinessTransactionType;
  description: string;
  amount: number;
  category?: BusinessExpenseCategory; // Always present for expense, undefined/optional for sale
  customCategoryName?: string;
  date: string;
  notes?: string;
  createdAt: string;
}

// "My Personal Money Put In"
export interface BusinessInvestment {
  id: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

// "What You Owe" tracking list for End of Month Report Card
export interface OweItem {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  completed: boolean;
  notes?: string;
}

export interface FinancialNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
}

export type EventCategoryType = 'Meeting' | 'Consultation' | 'Study Seminar' | 'General Reminder';

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  category: EventCategoryType;
  description: string;
  linkedNoteId?: string;
  createdAt: string;
}

export interface BusinessAsset {
  id: string;
  name: string;
  value: number;
  dateAdded: string;
}

export interface StockProduct {
  id: string;
  name: string;
  value: number;
  quantity?: number;
  dateAdded: string;
}

export interface BusinessProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  createdAt: string;
}

export interface BusinessCustomer {
  id: string;
  name: string;
  phone: string;
  company: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface BusinessDocumentItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface BusinessDocument {
  id: string;
  type: 'quotation' | 'invoice';
  number: string;
  customerId: string;
  customerName?: string;
  items: BusinessDocumentItem[];
  subtotal: number;
  tax: number;
  total: number;
  date: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
}

// Outer application state containing both Personal and Business configurations
export interface AppData {
  profile: ProfileState;
  // Personal database
  transactions: PersonalTransaction[];
  budgets: PersonalBudget[];
  // Business database ("CashFlow Simple")
  businessInvestments: BusinessInvestment[];
  businessTransactions: BusinessTransaction[];
  businessOweItems: OweItem[];
  businessAssets?: BusinessAsset[];
  currentStockProducts?: StockProduct[];
  productsInventory?: BusinessProduct[];
  businessCustomers?: BusinessCustomer[];
  businessDocuments?: BusinessDocument[];
  // Notetaker & Scheduler database
  notes?: FinancialNote[];
  events?: ScheduleEvent[];
}
