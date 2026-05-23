/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppData } from './types';

export const initialSampleData: AppData = {
  profile: {
    name: 'Comfort Doe',
    email: 'comfort.designs@example.com',
    currency: 'USD',
    savingsTarget: 1500,
    savingsGoal: 'Emergency Reservoir',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days active
  },
  transactions: [
    {
      id: 'p-1',
      type: 'income',
      description: 'Main Salary Credit',
      amount: 4800,
      category: 'salary',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Monthly corporate salary direct deposit',
      createdAt: new Date().toISOString()
    },
    {
      id: 'p-2',
      type: 'income',
      description: 'Creative Contract Design',
      amount: 920,
      category: 'freelance',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Brand toolkit deliverables',
      createdAt: new Date().toISOString()
    },
    {
      id: 'p-3',
      type: 'expense',
      description: 'Organic Groceries Basket',
      amount: 195.40,
      category: 'food',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Weekly whole food items',
      createdAt: new Date().toISOString()
    },
    {
      id: 'p-4',
      type: 'expense',
      description: 'Transit Card Auto-Refill',
      amount: 60.00,
      category: 'transport',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Monthly subway commutes pass',
      createdAt: new Date().toISOString()
    },
    {
      id: 'p-5',
      type: 'expense',
      description: 'Electric & Heating Utility',
      amount: 110.00,
      category: 'bills',
      date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Quarterly power bill bills list',
      createdAt: new Date().toISOString()
    },
    {
      id: 'p-6',
      type: 'expense',
      description: 'Local Indie Movie Ticketing',
      amount: 34.00,
      category: 'entertainment',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Movie night outing with friends',
      createdAt: new Date().toISOString()
    },
    {
      id: 'p-7',
      type: 'expense',
      description: 'Premium Denim Apparel',
      amount: 125.00,
      category: 'shopping',
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Autumn retail shopping',
      createdAt: new Date().toISOString()
    }
  ],
  budgets: [
    {
      id: 'b-1',
      category: 'food',
      limit: 650,
      description: 'Food and dining monthly limit',
      createdAt: new Date().toISOString()
    },
    {
      id: 'b-2',
      category: 'transport',
      limit: 150,
      description: 'Commutes and fuel budget',
      createdAt: new Date().toISOString()
    },
    {
      id: 'b-3',
      category: 'entertainment',
      limit: 250,
      description: 'Leisure and social limits',
      createdAt: new Date().toISOString()
    },
    {
      id: 'b-4',
      category: 'shopping',
      limit: 300,
      description: 'Wardrobes and goods allocation',
      createdAt: new Date().toISOString()
    }
  ],
  businessInvestments: [
    {
      id: 'bi-1',
      amount: 4500,
      date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Starting capital out-of-pocket for baking pop-up setups',
      createdAt: new Date().toISOString()
    }
  ],
  businessTransactions: [
    {
      id: 'bt-1',
      type: 'sale',
      description: 'Bulk Birthday Cakes Client Order',
      amount: 1400,
      date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Paid fully via credit terminal',
      createdAt: new Date().toISOString()
    },
    {
      id: 'bt-2',
      type: 'sale',
      description: 'Sunday Pop-Up Farmers Market sales',
      amount: 2550,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Cash and mobile money receipts',
      createdAt: new Date().toISOString()
    },
    {
      id: 'bt-3',
      type: 'expense',
      category: 'stock',
      description: 'Organic Flour & Premium Baking Dairy',
      amount: 600,
      date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1005).toISOString().split('T')[0],
      notes: 'Bought for resale products',
      createdAt: new Date().toISOString()
    },
    {
      id: 'bt-4',
      type: 'expense',
      category: 'bills',
      description: 'Commercial Kitchen Gas Outlet Power',
      amount: 220,
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Monthly gas fuel lines bills',
      createdAt: new Date().toISOString()
    },
    {
      id: 'bt-5',
      type: 'expense',
      category: 'helpers',
      description: 'Prep-Baker Contractor Stipend',
      amount: 420,
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Weekend bakery assistance helper wages',
      createdAt: new Date().toISOString()
    },
    {
      id: 'bt-6',
      type: 'expense',
      category: 'tools',
      description: 'Electric Industrial Mixer Machine',
      amount: 1200,
      date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Equipments mix setups tools',
      createdAt: new Date().toISOString()
    }
  ],
  businessOweItems: [
    {
      id: 'o-1',
      description: 'Dairy Coop Baker Supply net-15 billing',
      amount: 320,
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completed: false,
      notes: 'Due in 8 days'
    },
    {
      id: 'o-2',
      description: 'Oven Maintenance installment remaining',
      amount: 150,
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completed: true,
      notes: 'Paid fully early'
    }
  ]
};
