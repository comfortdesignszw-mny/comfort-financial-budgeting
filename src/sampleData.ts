/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppData } from './types';

export const initialSampleData: AppData = {
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
