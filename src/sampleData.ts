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
  businessOweItems: [],
  notes: [
    {
      id: 'default-note-1',
      title: 'Comfort Finance Suite Welcome Memo',
      content: `# Welcome to Comfort Notes!\n\nThis is a responsive, **offline-first text editor** optimized for personal budgeting notes and investment analysis.\n\n### Features:\n* Supports **Markdown** previews.\n* Local-first automated drafts saving instantly.\n* Portable exports as **PDF**, **Word**, and **TXT** files.\n* Links notes directly to scheduling cards on your calendar!\n\nUse this space for outlining business expenses or jotting down personal purchase targets.`,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      color: 'bg-teal-500/10 dark:bg-teal-500/20'
    }
  ],
  events: [
    {
      id: 'default-event-1',
      title: 'Monthly Budget Audit',
      date: new Date().toISOString().split('T')[0], // Today's date
      time: '10:00',
      category: 'Meeting',
      description: 'Audit monthly personal and business cash flows, print EOM reports, and update corporate investments.',
      linkedNoteId: 'default-note-1',
      createdAt: new Date().toISOString()
    }
  ]
};
