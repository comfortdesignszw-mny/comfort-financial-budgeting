import React, { useState } from 'react';
import { 
  ArrowDownCircle, ArrowUpCircle, Shield, HelpCircle, Flame, 
  Layers, Package, Building, Users, Trash2, Calendar, 
  Plus, DollarSign, PenTool, CheckSquare, Square, FileCheck, ArrowRight, Eye, Info, X,
  FileSpreadsheet, FileText, Utensils, Car, Download, Share2, Edit2, Warehouse
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { AppData, BusinessTransaction, BusinessInvestment, OweItem, BusinessExpenseCategory, CurrencyType, BusinessDocument } from '../types';
import { formatCurrency, formatDate, calculateBusinessCashOnHand, calculateBusinessOwnedAssets, calculateBusinessRunway, generateMonthlyInsight, currencySymbols } from '../utils';

interface BusinessSectionProps {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  currency: CurrencyType;
  theme: 'light' | 'dark';
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
  wages: { 
    icon: <Users size={20} />, 
    label: '💰 Wages & Salaries', 
    desc: 'Payroll and team payments', 
    color: 'border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-purple-600', 
    bg: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400' 
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
  },
  food: { 
    icon: <Utensils size={20} />, 
    label: '🍲 Daily Food Expenses', 
    desc: 'Business food and meals', 
    color: 'border-yellow-550 hover:bg-yellow-50/50 dark:hover:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400', 
    bg: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400' 
  },
  transport: { 
    icon: <Car size={20} />, 
    label: '🚗 Transport Expenses', 
    desc: 'Wander, taxi, bus, delivery fuel', 
    color: 'border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 text-teal-600 dark:text-teal-400', 
    bg: 'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400' 
  },
  other: { 
    icon: <PenTool size={20} />, 
    label: '✏️ Other Expenses', 
    desc: 'Specify another custom expense', 
    color: 'border-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-400', 
    bg: 'bg-slate-100 dark:bg-slate-950/40 text-slate-700 dark:text-slate-450' 
  }
};

export default function BusinessSection({ data, onUpdateData, currency, theme }: BusinessSectionProps) {
  const businessTransactions = data.businessTransactions || [];
  const businessInvestments = data.businessInvestments || [];
  const businessOweItems = data.businessOweItems || [];
  const businessAssets = data.businessAssets || [];
  const currentStockProducts = data.currentStockProducts || [];
  
  const businessStockData = data.businessStockData || [];
  const businessPropertyData = data.businessPropertyData || [];

  const productsInventory = data.productsInventory || [];
  const businessCustomers = data.businessCustomers || [];
  const businessDocuments = data.businessDocuments || [];

  const [activeTab, setActiveTab] = useState<'dashboard' | 'investment' | 'reportCard' | 'inventory' | 'customers' | 'documents' | 'stock-and-property'>('dashboard');
  const [txFilter, setTxFilter] = useState<'all' | 'sales' | 'expenses'>('all');
  const [txSearch, setTxSearch] = useState('');
  
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
  const [expenseCustomCategory, setExpenseCustomCategory] = useState('');

  // Manage Possession Bucket 2 States
  const [possessionsTab, setPossessionsTab] = useState<'business-stock' | 'property-database'>('business-stock');
  
  // New Property Sub-form
  const [newPropName, setNewPropName] = useState('');
  const [newPropLocation, setNewPropLocation] = useState('');
  const [newPropCondition, setNewPropCondition] = useState<'new'|'used'|'old'>('new');
  const [newPropValue, setNewPropValue] = useState('');

  // New Stock Sub-form
  const [newStockType, setNewStockType] = useState<'product' | 'service'>('product');
  const [newStockPropName, setNewStockPropName] = useState('');
  const [newStockQty, setNewStockQty] = useState('');
  const [newStockUnitValue, setNewStockUnitValue] = useState('');
  const [newStockTotalValue, setNewStockTotalValue] = useState('');
  const [newStockLifecycle, setNewStockLifecycle] = useState('');

  // Personal Injected Cash states ("My Personal Money Put In")
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentNotes, setInvestmentNotes] = useState('');
  const [investmentDate, setInvestmentDate] = useState(new Date().toISOString().split('T')[0]);

  // Outstanding Owe Checks Ledger states
  const [oweDesc, setOweDesc] = useState('');
  const [oweAmount, setOweAmount] = useState('');
  const [oweDueDate, setOweDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Products Inventory States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [prodEditId, setProdEditId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodQty, setProdQty] = useState('');

  // Customer Database States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [custEditId, setCustEditId] = useState<string | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [customerSortColumn, setCustomerSortColumn] = useState<'name' | 'company' | null>(null);
  const [customerSortDirection, setCustomerSortDirection] = useState<'asc' | 'desc'>('asc');

  // Document (Quotation/Invoice) States
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [docEditId, setDocEditId] = useState<string | null>(null);
  const [docType, setDocType] = useState<'quotation' | 'invoice'>('quotation');
  const [docCustomerId, setDocCustomerId] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [docItems, setDocItems] = useState<{ productId: string; name: string; quantity: number; price: number }[]>([]);
  const [docNotes, setDocNotes] = useState('');
  const [itemToAdd, setItemToAdd] = useState('');
  const [itemAddQty, setItemAddQty] = useState('1');

  // Month selection for Report Card (Format: YYYY-MM)
  const [reportMonth, setReportMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Calculate global Metrics based on current data
  const cashOnHand = calculateBusinessCashOnHand(businessTransactions, businessInvestments);
  // Calculate backwards compatibility legacy sums + new structure sums
  const legacyAssetsSum = businessAssets.reduce((sum, a) => sum + a.value, 0);
  const newPropertySum = businessPropertyData.reduce((sum, p) => sum + p.estimatedValue, 0);
  const assetsSum = legacyAssetsSum + newPropertySum;
  
  const legacyStockSum = currentStockProducts.reduce((sum, s) => sum + (s.value * (s.quantity || 1)), 0);
  const newStockSum = businessStockData.reduce((sum, s) => sum + s.totalValue, 0);
  const stockProductsSum = legacyStockSum + newStockSum;
  
  const businessOwned = calculateBusinessOwnedAssets(businessTransactions) + assetsSum + stockProductsSum;
  const runwayStats = calculateBusinessRunway(businessTransactions, cashOnHand);

  // Filter current month transactions for traffic lights
  const now = new Date();
  const currentMonthNum = now.getMonth();
  const currentYearNum = now.getFullYear();

  const currentMonthTransactions = businessTransactions.filter((t) => {
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
      businessTransactions: [newTx, ...businessTransactions]
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
    if (expenseCategory === 'other' && !expenseCustomCategory.trim()) {
      alert('Please specify the custom expense Name.');
      return;
    }

    const newTx: BusinessTransaction = {
      id: `bt-${Date.now()}`,
      type: 'expense',
      description: expenseDesc.trim(),
      amount,
      category: expenseCategory,
      customCategoryName: expenseCategory === 'other' ? expenseCustomCategory.trim() : undefined,
      date: expenseDate,
      notes: expenseNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    onUpdateData({
      ...data,
      businessTransactions: [newTx, ...businessTransactions]
    });

    setIsLogExpenseOpen(false);
    setExpenseDesc('');
    setExpenseAmount('');
    setExpenseCustomCategory('');
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
      businessInvestments: [newInv, ...businessInvestments]
    });

    setInvestmentAmount('');
    setInvestmentNotes('');
    alert('Logged successfully! Added to your Out-of-Pocket money.');
  };

  const handleDeleteInvestment = (id: string) => {
    if (confirm('Are you sure you want to remove this investment logging?')) {
      onUpdateData({
        ...data,
        businessInvestments: businessInvestments.filter(i => i.id !== id)
      });
    }
  };

  const handleDeleteBusinessTransaction = (id: string) => {
    if (confirm('Remove this money transaction from your logs?')) {
      onUpdateData({
        ...data,
        businessTransactions: businessTransactions.filter(t => t.id !== id)
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
      businessOweItems: [...businessOweItems, newOwe]
    });

    setOweDesc('');
    setOweAmount('');
  };

  const handleToggleOweItem = (id: string) => {
    onUpdateData({
      ...data,
      businessOweItems: businessOweItems.map(o => o.id === id ? { ...o, completed: !o.completed } : o)
    });
  };

  const handleDeleteOweItem = (id: string) => {
    onUpdateData({
      ...data,
      businessOweItems: businessOweItems.filter(o => o.id !== id)
    });
  };

  // --- PRODUCTS, CUSTOMERS & DOCUMENTS HANDLERS ---
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) return;
    
    if (prodEditId) {
      const updatedProducts = productsInventory.map(p => 
        p.id === prodEditId 
          ? { ...p, name: prodName, description: prodDesc, category: prodCat, price: parseFloat(prodPrice) || 0, quantity: parseInt(prodQty, 10) || 0 }
          : p
      );
      onUpdateData({ ...data, productsInventory: updatedProducts });
    } else {
      const newProduct = {
        id: `prod-${Date.now()}`,
        name: prodName,
        description: prodDesc,
        category: prodCat,
        price: parseFloat(prodPrice) || 0,
        quantity: parseInt(prodQty, 10) || 0,
        createdAt: new Date().toISOString()
      };
      onUpdateData({ ...data, productsInventory: [newProduct, ...productsInventory] });
    }
    
    setProdEditId(null);
    setProdName(''); setProdDesc(''); setProdCat(''); setProdPrice(''); setProdQty('');
    setIsProductModalOpen(false);
  };
  
  const handleDeleteProduct = (id: string) => {
    if (confirm('Delete this product from your inventory?')) {
      onUpdateData({ ...data, productsInventory: productsInventory.filter(p => p.id !== id) });
    }
  };

  const handleEditProduct = (p: any) => {
    setProdEditId(p.id);
    setProdName(p.name);
    setProdDesc(p.description || '');
    setProdCat(p.category || '');
    setProdPrice(p.price.toString());
    setProdQty(p.quantity.toString());
    setIsProductModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) return;
    
    if (custEditId) {
      const updatedCustomers = businessCustomers.map(c => 
        c.id === custEditId 
          ? { ...c, name: custName, phone: custPhone, company: custCompany, email: custEmail, address: custAddress }
          : c
      );
      onUpdateData({ ...data, businessCustomers: updatedCustomers });
    } else {
      const newCustomer = {
        id: `cust-${Date.now()}`,
        name: custName,
        phone: custPhone,
        company: custCompany,
        email: custEmail,
        address: custAddress,
        createdAt: new Date().toISOString()
      };
      onUpdateData({ ...data, businessCustomers: [newCustomer, ...businessCustomers] });
    }
    
    setCustEditId(null);
    setCustName(''); setCustPhone(''); setCustCompany(''); setCustEmail(''); setCustAddress('');
    setIsCustomerModalOpen(false);
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm('Delete this customer?')) {
      onUpdateData({ ...data, businessCustomers: businessCustomers.filter(c => c.id !== id) });
    }
  };

  const handleEditCustomer = (c: any) => {
    setCustEditId(c.id);
    setCustName(c.name);
    setCustPhone(c.phone || '');
    setCustCompany(c.company || '');
    setCustEmail(c.email || '');
    setCustAddress(c.address || '');
    setIsCustomerModalOpen(true);
  };

  const handleAddDocItem = () => {
    if (!itemToAdd || !itemAddQty) return;
    const selectedProd = productsInventory.find(p => p.id === itemToAdd);
    if (!selectedProd) return;
    
    const qty = parseInt(itemAddQty, 10) || 1;
    setDocItems([...docItems, { 
      productId: selectedProd.id, 
      name: selectedProd.name, 
      quantity: qty, 
      price: selectedProd.price 
    }]);
    
    setItemToAdd(''); setItemAddQty('1');
  };

  const handleRemoveDocItem = (index: number) => {
    setDocItems(docItems.filter((_, i) => i !== index));
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docCustomerId || docItems.length === 0) {
      alert("Please select a customer and add at least one item.");
      return;
    }
    
    let targetCustomerId = docCustomerId;
    let targetCustomerName = '';
    
    if (docCustomerId === 'new') {
      if (!custName) {
        alert("Please provide the new customer's name");
        return;
      }
      if (confirm('Save new Customer to the database?')) {
        targetCustomerId = `cust-${Date.now()}`;
        const newCustomer = {
          id: targetCustomerId, name: custName, phone: custPhone, company: custCompany, email: custEmail, address: custAddress, createdAt: new Date().toISOString()
        };
        onUpdateData({ ...data, businessCustomers: [newCustomer, ...businessCustomers] });
      } else {
        // Did not want to save, keep abstract reference... wait, it fails relational integrity gently, we'll assign 'temp' ID
        targetCustomerId = `temp-${Date.now()}`;
      }
      targetCustomerName = custName;
    } else {
       targetCustomerName = businessCustomers.find(c => c.id === docCustomerId)?.name || 'Unknown';
    }

    const subtotal = docItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = 0; // Keeping simple
    const total = subtotal + tax;

    let updatedDocs = [...businessDocuments];
    let updatedTxs = [...(data.businessTransactions || [])];

    if (docEditId) {
      updatedDocs = businessDocuments.map(d => 
        d.id === docEditId
          ? { ...d, customerId: targetCustomerId, customerName: targetCustomerName, items: docItems, subtotal, tax, total, date: docDate, notes: docNotes, number: docNumber || d.number }
          : d
      );
    } else {
      const newDocId = `doc-${Date.now()}`;
      const newDoc: BusinessDocument = {
        id: newDocId,
        type: docType as 'quotation' | 'invoice',
        number: docNumber || `${docType === 'quotation' ? 'Q-' : 'INV-'}${Math.floor(Math.random() * 10000)}`,
        customerId: targetCustomerId,
        customerName: targetCustomerName,
        items: docItems as any,
        subtotal,
        tax,
        total,
        date: docDate,
        notes: docNotes,
        status: docType === 'invoice' ? 'pending' : undefined,
        createdAt: new Date().toISOString()
      };
      updatedDocs = [newDoc, ...businessDocuments];
    }
    
    onUpdateData({ ...data, businessDocuments: updatedDocs, businessTransactions: updatedTxs });
    
    // reset form
    setDocEditId(null);
    setDocCustomerId(''); setDocNumber(''); setDocItems([]); setDocNotes('');
    setCustName(''); setCustPhone(''); setCustCompany(''); setCustEmail(''); setCustAddress('');
    setIsDocumentModalOpen(false);
  };

  const handleProcessInvoice = (doc: any) => {
    if (confirm(`Mark Invoice ${doc.number} as Processed (Paid) and log the Sales Revenue?`)) {
      const productNames = doc.items.map((i: any) => i.description).join(', ');
      const dateDesc = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const timeDesc = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const newSale = {
        id: `tx-${Date.now()}`,
        type: 'sale' as const,
        description: `${dateDesc} ${timeDesc}, ${productNames}, Sales (Inv #${doc.number})`,
        amount: doc.total,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      
      const updatedDocs = businessDocuments.map(d => d.id === doc.id ? { ...d, status: 'processed' as const } : d);
      const updatedTxs = [newSale, ...(data.businessTransactions || [])];
      
      onUpdateData({ ...data, businessDocuments: updatedDocs, businessTransactions: updatedTxs });
    }
  };
  
  const handleEditDocument = (doc: any) => {
    setDocEditId(doc.id);
    setDocType(doc.type);
    setDocCustomerId(doc.customerId);
    setDocNumber(doc.number);
    setDocDate(doc.date);
    setDocItems(doc.items);
    setDocNotes(doc.notes || '');
    setIsDocumentModalOpen(true);
  };

  const handleDeleteDocument = (id: string) => {
    if (confirm('Delete this document?')) {
      onUpdateData({ ...data, businessDocuments: businessDocuments.filter(d => d.id !== id) });
    }
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockPropName || !newStockTotalValue) return;

    const newItem = {
      id: `stock-${Date.now()}`,
      type: newStockType,
      name: newStockPropName,
      quantity: newStockType === 'product' ? parseFloat(newStockQty) || 0 : undefined,
      unitValue: newStockType === 'product' ? parseFloat(newStockUnitValue) || 0 : undefined,
      totalValue: parseFloat(newStockTotalValue),
      lifecycle: newStockType === 'service' ? newStockLifecycle : undefined,
      dateLogged: new Date().toISOString()
    };
    onUpdateData({ ...data, businessStockData: [newItem, ...businessStockData] });
    setNewStockPropName(''); setNewStockQty(''); setNewStockUnitValue(''); setNewStockTotalValue(''); setNewStockLifecycle('');
  };

  const handleDeleteStock = (id: string) => {
    onUpdateData({ ...data, businessStockData: businessStockData.filter(s => s.id !== id) });
  };

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName || !newPropValue) return;

    const newItem = {
      id: `prop-${Date.now()}`,
      name: newPropName,
      location: newPropLocation,
      condition: newPropCondition,
      estimatedValue: parseFloat(newPropValue),
      dateLogged: new Date().toISOString()
    };
    onUpdateData({ ...data, businessPropertyData: [newItem, ...businessPropertyData] });
    setNewPropName(''); setNewPropLocation(''); setNewPropValue('');
  };

  const handleDeleteProperty = (id: string) => {
    onUpdateData({ ...data, businessPropertyData: businessPropertyData.filter(p => p.id !== id) });
  };

  // Compile calculations for "End-of-Month Report Card"
  const getMonthlyReportMetrics = () => {
    const [year, month] = reportMonth.split('-').map(Number);
    // Filter transactions happening in this specific calendar month
    const listTx = businessTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });

    const sales = listTx.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
    const expenses = listTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const takeHomeProfit = sales - expenses;

    // What You Own (Assets) [Calculated as Cash remaining + Cumulative value of logged Tools/Setup]
    // Note: Cash remaining is the global cashOnHand, and setup tools represent static business assets
    const runToolsSum = businessTransactions
      .filter(t => t.type === 'expense' && t.category === 'tools')
      .reduce((sum, t) => sum + t.amount, 0);

    const stockSum = businessTransactions
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
  const monthInsightSentence = generateMonthlyInsight(businessTransactions, reportMonth);

  const getLast6MonthsData = () => {
    const [yearStr, monthStr] = (reportMonth || '2026-05').split('-');
    const endYear = parseInt(yearStr, 10);
    const endMonth = parseInt(monthStr, 10) - 1; // 0-indexed
    
    interface MonthDataPoint {
      name: string;
      sales: number;
      expenses: number;
      profit: number;
      key: string;
    }
    const monthsList: MonthDataPoint[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(endYear, endMonth - i, 1);
      const mYear = d.getFullYear();
      const mMonth = d.getMonth(); // 0-indexed
      const label = d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear().toString().slice(-2);
      const key = `${mYear}-${String(mMonth + 1).padStart(2, '0')}`;
      
      const txForMonth = businessTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate.getFullYear() === mYear && txDate.getMonth() === mMonth;
      });
      
      const sales = txForMonth.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
      const expenses = txForMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const profit = sales - expenses;
      
      monthsList.push({
        name: label,
        sales,
        expenses,
        profit,
        key
      });
    }
    return monthsList;
  };

  const handleExportCSV = () => {
    const [year, month] = reportMonth.split('-').map(Number);
    const listTx = businessTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });

    const symbol = currencySymbols[currency] || '$';
    const headers = ['Date', 'Description', 'Category', 'Type', `Amount (${symbol})`].join(',');
    
    const rows = listTx.map(t => {
      const sanitizedDescription = `"${(t.description || '').replace(/"/g, '""')}"`;
      const categoryLabel = t.type === 'sale' 
        ? 'Sale Income' 
        : t.category === 'other'
          ? `Other: ${t.customCategoryName || 'General'}`
          : (businessExpenseCategories[t.category as BusinessExpenseCategory]?.label || t.category || '');
      const typeLabel = t.type === 'sale' ? 'Income' : 'Expense';
      return [
        t.date,
        sanitizedDescription,
        `"${categoryLabel.replace(/"/g, '""')}"`,
        typeLabel,
        t.amount
      ].join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Comfort_Business_Report_${reportMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async (action: 'download' | 'share' | 'view' = 'download') => {
    const [year, month] = reportMonth.split('-').map(Number);
    const listTx = businessTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const symbol = currencySymbols[currency] || '$';

    // Teal branding header
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, 210, 40, 'F');

    // Title & Brand info
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('COMFORT FINANCIAL BUDGETING', 14, 16);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Unified Corporate & Personal Finance Engine', 14, 22);
    doc.text(`Report Period: ${reportMonth}`, 14, 28);

    // Organization info at top right
    if (data.profile.companyName) {
      doc.setFont('Helvetica', 'bold');
      doc.text(data.profile.companyName.toUpperCase(), 196, 16, { align: 'right' });
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      if (data.profile.companyEmail) doc.text(data.profile.companyEmail, 196, 21, { align: 'right' });
      if (data.profile.companyPhone) doc.text(data.profile.companyPhone, 196, 25, { align: 'right' });
    }

    // Summary Section
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);
    doc.setFont('Helvetica', 'bold');
    doc.text('MONTHLY SNAPSHOT SUMMARY', 14, 52);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 55, 196, 55);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('Net Take-Home Surplus/Deficit:', 14, 63);
    doc.text('Gross Business Sales:', 14, 69);
    doc.text('Spent Outflow Drain:', 14, 75);
    doc.text('Possessional Assets Sum:', 14, 81);

    doc.setFont('Helvetica', 'bold');
    const takeHomeStr = `${reportMetrics.takeHomeProfit >= 0 ? '+' : '-'}${symbol} ${Math.abs(reportMetrics.takeHomeProfit).toLocaleString()}`;
    const salesStr = `+${symbol} ${reportMetrics.sales.toLocaleString()}`;
    const expensesStr = `-${symbol} ${reportMetrics.expenses.toLocaleString()}`;
    const assetsStr = `${symbol} ${reportMetrics.assetSum.toLocaleString()}`;

    // Color code the net profit
    if (reportMetrics.takeHomeProfit >= 0) {
      doc.setTextColor(16, 124, 65);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(takeHomeStr, 80, 63);

    doc.setTextColor(30, 41, 59);
    doc.text(salesStr, 80, 69);
    doc.text(expensesStr, 80, 75);
    doc.text(assetsStr, 80, 81);

    // Monthly Insight Section
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text('MONTHLY SYSTEM INSIGHTS', 14, 93);
    doc.line(14, 95, 196, 95);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    
    const splitInsight = doc.splitTextToSize(monthInsightSentence || "No transaction logs recorded for this period to compile insights.", 182);
    doc.text(splitInsight, 14, 101);

    // List of Transactions Header
    const tableStartY = 115 + (splitInsight.length * 4.5);
    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('TRANSACTION HISTORY LOG', 14, tableStartY);
    doc.line(14, tableStartY + 2, 196, tableStartY + 2);

    // Table Headers
    const headersY = tableStartY + 8;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, headersY - 4.5, 182, 6.5, 'F');
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    
    doc.text('Date', 16, headersY);
    doc.text('Description', 42, headersY);
    doc.text('Category', 110, headersY);
    doc.text('Type', 152, headersY);
    doc.text('Amount', 194, headersY, { align: 'right' });

    let currentY = headersY + 6.5;
    
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    if (listTx.length === 0) {
      doc.text('No transaction events recorded during this calendar period.', 16, currentY);
    } else {
      listTx.forEach((tx, idx) => {
        if (currentY > 275) {
          doc.addPage();
          currentY = 20;
          
          doc.setFillColor(241, 245, 249);
          doc.rect(14, currentY - 4.5, 182, 6.5, 'F');
          doc.setFont('Helvetica', 'bold');
          doc.setTextColor(71, 85, 105);
          doc.text('Date', 16, currentY);
          doc.text('Description', 42, currentY);
          doc.text('Category', 110, currentY);
          doc.text('Type', 152, currentY);
          doc.text('Amount', 194, currentY, { align: 'right' });
          currentY += 6.5;
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
        }

        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, currentY - 3.5, 182, 5.5, 'F');
        }

        const dateStr = tx.date;
        const rawDesc = tx.description || 'N/A';
        const truncatedDesc = rawDesc.length > 34 ? rawDesc.substring(0, 31) + '...' : rawDesc;
        const catText = tx.type === 'sale' 
          ? 'Sale Income' 
          : tx.category === 'other'
            ? `Other: ${tx.customCategoryName || 'General'}`
            : (businessExpenseCategories[tx.category as BusinessExpenseCategory]?.label || tx.category || '');
        const cleanedCatText = catText.replace(/[^\x00-\x7F]/g, ""); // clear emoji icons for PDF compatibility
        const typeText = tx.type === 'sale' ? 'INCOME' : 'EXPENSE';
        const amtStr = `${tx.type === 'sale' ? '+' : '-'}${symbol} ${tx.amount.toLocaleString()}`;

        doc.text(dateStr, 16, currentY);
        doc.text(truncatedDesc, 42, currentY);
        doc.text(cleanedCatText.trim(), 110, currentY);
        
        if (tx.type === 'sale') {
          doc.setTextColor(16, 124, 65);
        } else {
          doc.setTextColor(185, 28, 28);
        }
        doc.text(typeText, 152, currentY);
        doc.text(amtStr, 194, currentY, { align: 'right' });
        
        doc.setTextColor(30, 41, 59);
        currentY += 5.5;
      });
    }

    const fileName = `Comfort_Business_Report_${reportMonth}.pdf`;
    
    if (action === 'download' || action === undefined) {
      doc.save(fileName);
    } else if (action === 'view') {
      window.open(doc.output('bloburl'), '_blank');
    } else if (action === 'share') {
      if (navigator.share) {
        try {
          const blob = doc.output('blob');
          const file = new File([blob], fileName, { type: 'application/pdf' });
          await navigator.share({
            files: [file],
            title: `Business Monthly Report - ${reportMonth}`,
            text: `Please find attached the business report for ${reportMonth}.`
          });
        } catch (err) {
          console.error("Error sharing PDF:", err);
        }
      } else {
        alert('Sharing is not supported on this device/browser. Downloading instead.');
        doc.save(fileName);
      }
    }
  };

  const handleExportCustomerPDF = async (c: any, action: 'download' | 'share' | 'view') => {
    const pdf = new jsPDF();
    pdf.setFillColor(13, 148, 136);
    pdf.rect(0, 0, 210, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CLIENT PROFILE', 14, 20);
    
    // Organization info at top right
    const compName = data.profile.companyName || data.profile.name || 'Your Company Name';
    pdf.setFontSize(10);
    pdf.text(compName.toUpperCase(), 196, 12, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    if (data.profile.companyEmail) pdf.text(data.profile.companyEmail, 196, 17, { align: 'right' });
    if (data.profile.companyPhone) pdf.text(data.profile.companyPhone, 196, 22, { align: 'right' });
    
    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(c.name, 14, 45);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    let y = 55;
    if (c.company) { pdf.text(`Company: ${c.company}`, 14, y); y += 8; }
    if (c.email) { pdf.text(`Email: ${c.email}`, 14, y); y += 8; }
    if (c.phone) { pdf.text(`Phone: ${c.phone}`, 14, y); y += 8; }
    if (c.address) { 
        pdf.text(`Address: ${c.address}`, 14, y); 
        y += 8; 
    }
    
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text('Generated via Comfort Budgeting / CashFlow Simple', 14, 280);

    const fileName = `Customer_${c.name.replace(/ /g, '_')}.pdf`;
    if (action === 'download') pdf.save(fileName);
    else if (action === 'view') window.open(pdf.output('bloburl'), '_blank');
    else if (action === 'share' && navigator.share) {
      try {
        const file = new File([pdf.output('blob')], fileName, { type: 'application/pdf' });
        await navigator.share({ files: [file], title: `Customer ${c.name}` });
      } catch (e) {}
    } else if (action === 'share') {
      pdf.save(fileName);
    }
  };

  const handleExportProductPDF = async (p: any, action: 'download' | 'share' | 'view') => {
    const pdf = new jsPDF();
    pdf.setFillColor(13, 148, 136);
    pdf.rect(0, 0, 210, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PRODUCT PORTFOLIO', 14, 20);
    
    // Organization info at top right
    const compName = data.profile.companyName || data.profile.name || 'Your Company Name';
    pdf.setFontSize(10);
    pdf.text(compName.toUpperCase(), 196, 12, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    if (data.profile.companyEmail) pdf.text(data.profile.companyEmail, 196, 17, { align: 'right' });
    if (data.profile.companyPhone) pdf.text(data.profile.companyPhone, 196, 22, { align: 'right' });
    
    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(p.name, 14, 45);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Price: ${formatCurrency(p.price, currency)}`, 14, 55);
    if (p.category) pdf.text(`Category: ${p.category}`, 14, 63);
    pdf.text(`Quantity in Stock: ${p.quantity}`, 14, 71);
    
    if (p.description) {
        pdf.text('Description:', 14, 85);
        pdf.setFontSize(10);
        const lines = pdf.splitTextToSize(p.description, 180);
        pdf.text(lines, 14, 92);
    }
    
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text('Generated via Comfort Budgeting / CashFlow Simple', 14, 280);

    const fileName = `Product_${p.name.replace(/ /g, '_')}.pdf`;
    if (action === 'download') pdf.save(fileName);
    else if (action === 'view') window.open(pdf.output('bloburl'), '_blank');
    else if (action === 'share' && navigator.share) {
      try {
        const file = new File([pdf.output('blob')], fileName, { type: 'application/pdf' });
        await navigator.share({ files: [file], title: `Product ${p.name}` });
      } catch (e) {}
    } else if (action === 'share') {
      pdf.save(fileName);
    }
  };

  const handleExportDocPDF = async (docObj: any, action: 'download' | 'share' | 'view') => {
    const pdf = new jsPDF();
    
    // Formatting variables
    const rightMargin = 196;
    
    // Branding/Header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(docObj.type === 'invoice' ? '#059669' : '#4f46e5');
    pdf.text((docObj.type === 'invoice' ? 'INVOICE' : 'QUOTATION'), 14, 24);
    
    // Company Branding on the top right
    pdf.setTextColor('#0f172a');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    const compName = data.profile.companyName || data.profile.name || 'Your Company Name';
    pdf.text(compName, rightMargin, 20, { align: 'right' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#64748b');
    if (data.profile.companyEmail) {
      pdf.text(data.profile.companyEmail, rightMargin, 26, { align: 'right' });
    }
    if (data.profile.companyPhone) {
      pdf.text(data.profile.companyPhone, rightMargin, 32, { align: 'right' });
    }
    
    pdf.setTextColor('#334155');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Document #: ${docObj.number}`, 14, 34);
    pdf.text(`Date Issued: ${formatDate(docObj.date)}`, 14, 40);
    
    pdf.setDrawColor('#e2e8f0');
    pdf.line(14, 46, 196, 46);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Billed To:', 14, 56);
    pdf.setFont('helvetica', 'normal');
    const customer = businessCustomers.find(c => c.id === docObj.customerId);
    pdf.text(docObj.customerName || 'Unknown Client', 14, 62);
    if (customer) {
      if (customer.company) pdf.text(customer.company, 14, 68);
      if (customer.email) pdf.text(`Email: ${customer.email}`, 14, 74);
      if (customer.phone) pdf.text(`Phone: ${customer.phone}`, 14, 80);
    }

    let lastY = customer ? 94 : 74;
    
    // Table Header
    pdf.setFillColor(docObj.type === 'invoice' ? 236 : 238, docObj.type === 'invoice' ? 253 : 242, docObj.type === 'invoice' ? 245 : 255);
    pdf.rect(14, lastY, 182, 12, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(docObj.type === 'invoice' ? '#065f46' : '#3730a3');
    pdf.text('ITEM DESCRIPTION', 18, lastY + 8);
    pdf.text('QTY', 120, lastY + 8);
    pdf.text('PRICE', 144, lastY + 8);
    pdf.text('AMOUNT', 170, lastY + 8);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#334155');
    lastY += 20;
    
    docObj.items.forEach((item: any) => {
      const lineTotal = item.quantity * item.price;
      pdf.text(item.name.substring(0, 50), 18, lastY);
      pdf.text(item.quantity.toString(), 120, lastY);
      pdf.text(formatCurrency(item.price, currency).replace(currencySymbols[currency] || '$', ''), 144, lastY);
      pdf.text(formatCurrency(lineTotal, currency).replace(currencySymbols[currency] || '$', ''), 170, lastY);
      lastY += 10;
    });
    
    lastY += 6;
    pdf.setDrawColor('#e2e8f0');
    pdf.line(14, lastY, 196, lastY);
    lastY += 12;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TOTAL AMOUNT DUE:', 110, lastY);
    pdf.text(formatCurrency(docObj.total, currency), 170, lastY);
    
    if (docObj.notes) {
        lastY += 30;
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor('#64748b');
        const notesLines = pdf.splitTextToSize(docObj.notes, 180);
        pdf.text(notesLines, 14, lastY);
    }
    
    // Footer
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor('#94a3b8');
    pdf.text('Generated via Comfort Budgeting / CashFlow Simple', 14, 280);

    const fileName = `${docObj.type}_${docObj.number}.pdf`;
    
    if (action === 'download') {
      pdf.save(fileName);
    } else if (action === 'view') {
      window.open(pdf.output('bloburl'), '_blank');
    } else if (action === 'share') {
      if (navigator.share) {
        try {
          const blob = pdf.output('blob');
          const file = new File([blob], fileName, { type: 'application/pdf' });
          await navigator.share({
            files: [file],
            title: `Business ${docObj.type.charAt(0).toUpperCase() + docObj.type.slice(1)}`,
            text: `Please find attached the ${docObj.type} document.`
          });
        } catch (err) {
          console.error("Error sharing PDF:", err);
        }
      } else {
        alert('Sharing is not supported on this device/browser. Downloading instead.');
        pdf.save(fileName);
      }
    }
  };

  const sortedBusinessCustomers = [...businessCustomers].sort((a, b) => {
    if (!customerSortColumn) return 0;
    
    const aValue = a[customerSortColumn]?.toLowerCase() || '';
    const bValue = b[customerSortColumn]?.toLowerCase() || '';
    
    if (customerSortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const handleCustomerSort = (column: 'name' | 'company') => {
    if (customerSortColumn === column) {
      setCustomerSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setCustomerSortColumn(column);
      setCustomerSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* 2nd Tier Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 mb-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-3 rounded-xl font-semibold text-[11px] sm:text-xs transition-all flex flex-col items-center justify-center gap-2 border-2 text-center leading-tight ${
            activeTab === 'dashboard'
              ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
              : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <Layers size={20} className={activeTab === 'dashboard' ? 'text-green-600 dark:text-green-400' : 'text-slate-400'} />
          Buckets & Pipes Dashboard
        </button>
        <button
          onClick={() => setActiveTab('investment')}
          className={`px-3 py-3 rounded-xl font-semibold text-[11px] sm:text-xs transition-all flex flex-col items-center justify-center gap-2 border-2 text-center leading-tight ${
            activeTab === 'investment'
              ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
              : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <DollarSign size={20} className={activeTab === 'investment' ? 'text-green-600 dark:text-green-400' : 'text-slate-400'} />
          My Personal Money Put In
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-3 py-3 rounded-xl font-semibold text-[11px] sm:text-xs transition-all flex flex-col items-center justify-center gap-2 border-2 text-center leading-tight ${
            activeTab === 'inventory'
              ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
              : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <Package size={20} className={activeTab === 'inventory' ? 'text-green-600 dark:text-green-400' : 'text-slate-400'} />
          Products Inventory
        </button>
        <button
          onClick={() => setActiveTab('stock-and-property')}
          className={`px-3 py-3 rounded-xl font-semibold text-[11px] sm:text-xs transition-all flex flex-col items-center justify-center gap-2 border-2 text-center leading-tight ${
            activeTab === 'stock-and-property'
              ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
              : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <Warehouse size={20} className={activeTab === 'stock-and-property' ? 'text-green-600 dark:text-green-400' : 'text-slate-400'} />
          Stock & Property DB
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-3 py-3 rounded-xl font-semibold text-[11px] sm:text-xs transition-all flex flex-col items-center justify-center gap-2 border-2 text-center leading-tight ${
            activeTab === 'customers'
              ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
              : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <Users size={20} className={activeTab === 'customers' ? 'text-green-600 dark:text-green-400' : 'text-slate-400'} />
          Customer Database
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-3 py-3 rounded-xl font-semibold text-[11px] sm:text-xs transition-all flex flex-col items-center justify-center gap-2 border-2 text-center leading-tight ${
            activeTab === 'documents'
              ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
              : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <FileText size={20} className={activeTab === 'documents' ? 'text-green-600 dark:text-green-400' : 'text-slate-400'} />
          Quotations & Invoices
        </button>
        <button
          onClick={() => setActiveTab('reportCard')}
          className={`px-3 py-3 rounded-xl font-semibold text-[11px] sm:text-xs transition-all flex flex-col items-center justify-center gap-2 border-2 text-center leading-tight ${
            activeTab === 'reportCard'
              ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
              : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <FileSpreadsheet size={20} className={activeTab === 'reportCard' ? 'text-green-600 dark:text-green-400' : 'text-slate-400'} />
          End-of-Month Report Card
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
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
                    {formatCurrency(businessTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0), currency)}
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
                  
                  {/* Detailed breakdown below */}
                  <div className="w-full mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 space-y-1 text-left px-2">
                    <div className="flex justify-between">
                      <span>⚙️ Expense Tools/Stock:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(calculateBusinessOwnedAssets(businessTransactions), currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>🛠️ Business Assets (Equipments):</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(assetsSum, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>📦 Current Stock Value:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(stockProductsSum, currency)}
                      </span>
                    </div>
                  </div>
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
                    {formatCurrency(businessTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0), currency)}
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

          {/* Chronological ledger activity list below */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Expense Logs & Transaction Ledger</h3>
                <p className="text-xs text-slate-400">Search and filter your sales inflows and spend deductions</p>
              </div>
              
              {/* Type Filters and Search Box */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setTxFilter('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${txFilter === 'all' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    All Flows
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxFilter('sales')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${txFilter === 'sales' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Sales Inflow
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxFilter('expenses')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${txFilter === 'expenses' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Expense Logs
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search logs description..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none w-full sm:w-44"
                />
              </div>
            </div>

            {/* Deduction & Profit Calculation breakdown statistics banner */}
            {businessTransactions.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total Money Earned</span>
                  <div className="text-lg font-bold text-slate-800 dark:text-white font-mono">
                    {formatCurrency(businessTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0), currency)}
                  </div>
                  <p className="text-[10px] text-slate-400">Combined gross client sales</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total Deductions (Spent)</span>
                  <div className="text-lg font-bold text-red-500 font-mono">
                    -{formatCurrency(businessTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0), currency)}
                  </div>
                  <p className="text-[10px] text-slate-400">Total spent from gross earnings</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Sales Deduction Rate</span>
                  {(() => {
                    const salesVal = businessTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
                    const expensesVal = businessTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                    const percent = salesVal > 0 ? (expensesVal / salesVal) * 100 : 0;
                    
                    let bgBar = 'bg-green-500';
                    let textMsg = 'Healthy bounds';
                    if (percent > 65) {
                      bgBar = 'bg-red-500';
                      textMsg = 'High spent warnings';
                    } else if (percent > 35) {
                      bgBar = 'bg-amber-500';
                      textMsg = 'Moderate deductions';
                    }

                    return (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                            {percent.toFixed(1)}%
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">{textMsg}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full ${bgBar}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Main Log List */}
            {(() => {
              const matches = businessTransactions.filter((t) => {
                // Type filter
                if (txFilter === 'sales' && t.type !== 'sale') return false;
                if (txFilter === 'expenses' && t.type !== 'expense') return false;

                // Search query
                if (txSearch.trim()) {
                  const q = txSearch.toLowerCase();
                  const descMatch = (t.description || '').toLowerCase().includes(q);
                  const noteMatch = (t.notes || '').toLowerCase().includes(q);
                  const catMatch = t.category ? t.category.toLowerCase().includes(q) : false;
                  const customCatMatch = t.customCategoryName ? t.customCategoryName.toLowerCase().includes(q) : false;
                  return descMatch || noteMatch || catMatch || customCatMatch;
                }
                return true;
              });

              if (matches.length === 0) {
                return (
                  <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-850 rounded-xl text-slate-400 text-xs">
                    {txSearch.trim() ? 'No transaction logs match your search term.' : 'No transactions found of this selected type.'}
                  </div>
                );
              }

              return (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto pr-1">
                  {matches.map((t) => {
                    const isSale = t.type === 'sale';
                    const catDetails = !isSale && t.category ? businessExpenseCategories[t.category] : null;

                    return (
                      <div key={t.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 px-2 rounded-lg transition">
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
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-600 dark:text-slate-400">
                                {isSale 
                                  ? '💰 Client Sale Inflow' 
                                  : t.category === 'other' 
                                    ? `✏️ Other: ${t.customCategoryName || 'General'}` 
                                    : catDetails?.label || 'Other Spent'
                                }
                              </span>
                              <span>•</span>
                              <span>{formatDate(t.date)}</span>
                              {t.notes && <span className="italic truncate text-slate-400 max-w-[150px]">("{t.notes}")</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className={`text-sm font-bold font-mono ${isSale ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isSale ? '+' : '-'}{formatCurrency(t.amount, currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteBusinessTransaction(t.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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

      {/* Products Inventory Section */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Products & Services Inventory</h3>
              <p className="text-xs text-slate-400">Manage what you sell. Add products or services.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsProductModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Add Product/Service
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            {productsInventory.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">No products in inventory. Start by adding one.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productsInventory.map(p => (
                  <div key={p.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-blue-200 dark:hover:border-blue-900/50 transition bg-slate-50/50 dark:bg-slate-950/30">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 pr-2">{p.name}</h4>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider shrink-0">{p.category || 'General'}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{p.description || 'No description provided'}</p>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/80">
                      <div>
                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{formatCurrency(p.price, currency)}</div>
                        <div className="text-[10px] text-slate-400 font-medium">Stock/Qty: {p.quantity}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => handleEditProduct(p)} title="Edit Product" className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition cursor-pointer">
                          <Edit2 size={14} />
                        </button>
                        <button type="button" onClick={() => handleExportProductPDF(p, 'share')} title="Share Info" className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition cursor-pointer">
                          <Share2 size={14} />
                        </button>
                        <button type="button" onClick={() => handleDeleteProduct(p.id)} title="Delete Product" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Database Section */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Customer Database</h3>
              <p className="text-xs text-slate-400">Keep track of your clients and valuable contacts.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Add Customer
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {businessCustomers.length === 0 ? (
              <div className="text-center py-10 border-2 m-5 border-dashed border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 text-xs">No customers saved yet. Add a customer to start building your database.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition" onClick={() => handleCustomerSort('name')}>
                        <div className="flex items-center gap-1">
                          Client Name
                          {customerSortColumn === 'name' && (
                            customerSortDirection === 'asc' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition" onClick={() => handleCustomerSort('company')}>
                        <div className="flex items-center gap-1">
                          Company
                          {customerSortColumn === 'company' && (
                            customerSortDirection === 'asc' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-3">Contact Email & Phone</th>
                      <th className="px-5 py-3">Address</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {sortedBusinessCustomers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                        <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">{c.name}</td>
                        <td className="px-5 py-4 text-xs font-medium">{c.company || '-'}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col text-xs space-y-1">
                            <span className="font-medium">{c.email || 'No email'}</span>
                            <span className="text-slate-400">{c.phone || 'No phone'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs max-w-[200px] truncate text-slate-500">{c.address || '-'}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => handleEditCustomer(c)} title="Edit Customer" className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-md transition cursor-pointer">
                              <Edit2 size={16} />
                            </button>
                            <button type="button" onClick={() => handleExportCustomerPDF(c, 'download')} title="Download Profile" className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-md transition cursor-pointer">
                              <Download size={16} />
                            </button>
                            <button type="button" onClick={() => handleExportCustomerPDF(c, 'share')} title="Share Profile" className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-md transition cursor-pointer">
                              <Share2 size={16} />
                            </button>
                            <button type="button" onClick={() => handleDeleteCustomer(c.id)} title="Delete Customer" className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition cursor-pointer">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quotations & Invoices Section */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Quotations & Invoices</h3>
              <p className="text-xs text-slate-400">Create, track, and download professional PDF documents.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setDocType('quotation'); setIsDocumentModalOpen(true); }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer gap-2 flex items-center"
              >
                <Plus size={14} /> Create Quotation
              </button>
              <button
                type="button"
                onClick={() => { setDocType('invoice'); setIsDocumentModalOpen(true); }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer gap-2 flex items-center"
              >
                <Plus size={14} /> Create Invoice
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            {businessDocuments.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 text-xs">No documents created yet. Generate one above.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessDocuments.map(doc => (
                  <div key={doc.id} className="border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition bg-slate-50/30 dark:bg-slate-950/20">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md ${doc.type === 'invoice' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400'}`}>
                            {doc.type}
                          </span>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 mt-2 text-lg font-mono">{doc.number}</h4>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono font-medium">{formatDate(doc.date)}</span>
                      </div>
                      <div className="text-sm mt-3 text-slate-600 dark:text-slate-300 flex flex-col gap-1">
                        <div><span className="font-semibold text-slate-400 text-xs uppercase tracking-wider mr-2">Client:</span> {doc.customerName}</div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-3 line-clamp-2 leading-relaxed bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded-lg">
                        <span className="font-semibold mr-1">Items:</span> {doc.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                    </div>
                    <div className="flex justify-between items-end mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Total Amount</div>
                        <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 line-clamp-1">{formatCurrency(doc.total, currency)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button" 
                          onClick={() => handleEditDocument(doc)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                          title="Edit Document"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button" 
                          onClick={() => handleExportDocPDF(doc, 'view')}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                          title="Preview PDF"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button" 
                          onClick={() => handleExportDocPDF(doc, 'download')}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button" 
                          onClick={() => handleExportDocPDF(doc, 'share')}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                          title="Share PDF"
                        >
                          <Share2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)} 
                          className="p-2 ml-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                          title="Delete Document"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {doc.type === 'invoice' && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-slate-400">Status:</span>
                          {doc.status === 'processed' ? (
                            <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md">Processed & Paid</span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 px-2.5 py-1 rounded-md">Pending</span>
                          )}
                        </div>
                        {doc.status !== 'processed' && (
                          <button
                            type="button"
                            onClick={() => handleProcessInvoice(doc)}
                            className="text-[11px] font-bold px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                          >
                            <FileCheck size={14} /> Mark Processed & Log Sales
                          </button>
                        )}
                      </div>
                    )}
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-normal font-sans">
                  📊 Month Report Details: {reportMonth}
                </h4>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/45 dark:text-teal-400 dark:hover:bg-teal-950 text-teal-700 border border-teal-500/10 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
                    title="Export transaction records as a spreadsheet CSV file"
                  >
                    <FileSpreadsheet size={13.5} />
                    <span>CSV Log</span>
                  </button>
                  <button
                    onClick={() => handleExportPDF('view')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/45 dark:text-teal-400 dark:hover:bg-teal-950 text-teal-700 border border-teal-500/10 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
                    title="View compiled PDF document Statement"
                  >
                    <Eye size={13.5} />
                  </button>
                  <button
                    onClick={() => handleExportPDF('share')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/45 dark:text-teal-400 dark:hover:bg-teal-950 text-teal-700 border border-teal-500/10 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
                    title="Share PDF Statement"
                  >
                    <Share2 size={13.5} />
                  </button>
                  <button
                    onClick={() => handleExportPDF('download')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer shadow-sm hover:shadow-md"
                    title="Download clean compiled PDF document Statement"
                  >
                    <Download size={13.5} />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                </div>
              </div>

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

              {/* 6-Month Profit Trend Line Chart */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-teal-650 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                      📈 Trailing 6-Month Profit Trend
                    </h5>
                    <p className="text-[10px] text-slate-400">Net take-home profit leading to {reportMonth}</p>
                  </div>
                  <div className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                    {getLast6MonthsData().filter(item => item.profit >= 0).length}/6 Profitable
                  </div>
                </div>

                <div className="h-[200px] w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getLast6MonthsData()}
                      margin={{ top: 12, right: 12, left: -22, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} 
                        tickLine={false}
                        axisLine={false}
                        dy={8}
                        style={{ fontSize: 9, fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} 
                        tickLine={false}
                        axisLine={false}
                        dx={-4}
                        style={{ fontSize: 9, fontFamily: 'monospace' }}
                        tickFormatter={(value) => `${currencySymbols[currency] || '$'}${value.toLocaleString()}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                          borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                          borderRadius: '0.75rem',
                          fontSize: '11px',
                          color: theme === 'dark' ? '#cbd5e1' : '#334155',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                        }}
                        labelStyle={{ fontWeight: 'bold', color: theme === 'dark' ? '#cbd5e1' : '#1e293b', marginBottom: '4px' }}
                        formatter={(value: any) => [`${currencySymbols[currency] || '$'}${value.toLocaleString()}`, 'Net Profit']}
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="#0d9488"
                        strokeWidth={2.5}
                        dot={{ r: 3, strokeWidth: 1.5, fill: theme === 'dark' ? '#0f172a' : '#ffffff' }}
                        activeDot={{ r: 5, strokeWidth: 2 }}
                        name="Profit"
                      />
                    </LineChart>
                  </ResponsiveContainer>
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

      {/* MODAL: Add Product */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200 my-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Add Product / Service</h3>
              <button type="button" onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
                <input required type="text" value={prodName} onChange={e => setProdName(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-slate-100" placeholder="e.g. Website Design Package" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                <textarea rows={2} value={prodDesc} onChange={e => setProdDesc(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-slate-100" placeholder="Details of the product or service..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Price</label>
                  <input required type="number" step="any" min="0" value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Quantity/Stock</label>
                  <input type="number" min="0" value={prodQty} onChange={e => setProdQty(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-slate-100" placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                <input type="text" value={prodCat} onChange={e => setProdCat(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-slate-100" placeholder="e.g. Service, Hardware, etc." />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => { setIsProductModalOpen(false); setProdEditId(null); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold font-sans cursor-pointer transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition shadow-sm">{prodEditId ? 'Update' : 'Save'} Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Customer */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200 my-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Add Customer</h3>
              <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Client Name</label>
                <input required type="text" value={custName} onChange={e => setCustName(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-slate-100" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Company</label>
                <input type="text" value={custCompany} onChange={e => setCustCompany(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-slate-100" placeholder="Company Name" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                  <input type="email" value={custEmail} onChange={e => setCustEmail(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                  <input type="text" value={custPhone} onChange={e => setCustPhone(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                <textarea rows={2} value={custAddress} onChange={e => setCustAddress(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-slate-100" placeholder="Client physical or postal address" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => { setIsCustomerModalOpen(false); setCustEditId(null); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold font-sans cursor-pointer transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition shadow-sm">{custEditId ? 'Update' : 'Save'} Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Document */}
      {isDocumentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200 my-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm capitalize">Create {docType}</h3>
              <button type="button" onClick={() => setIsDocumentModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveDocument} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Select Customer</label>
                  <select 
                    value={docCustomerId} 
                    onChange={e => {
                      setDocCustomerId(e.target.value);
                      if (e.target.value === 'new') {
                        setCustName(''); setCustCompany(''); setCustPhone(''); setCustEmail(''); setCustAddress('');
                      }
                    }} 
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">-- Choose existing or new --</option>
                    <option value="new">+ Add New Customer</option>
                    {businessCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{docType === 'invoice' ? 'Invoice' : 'Quotation'} #</label>
                    <input type="text" value={docNumber} onChange={e => setDocNumber(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-slate-100" placeholder="Auto-generated" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Date Issued</label>
                    <input type="date" value={docDate} onChange={e => setDocDate(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-slate-100" />
                  </div>
                </div>
              </div>

              {/* Show new customer inline form if "new" is selected */}
              {docCustomerId === 'new' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">New Customer Details</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Full Name *" value={custName} onChange={e => setCustName(e.target.value)} required={docCustomerId === 'new'} className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" />
                    <input type="text" placeholder="Company Name" value={custCompany} onChange={e => setCustCompany(e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" />
                    <input type="email" placeholder="Email" value={custEmail} onChange={e => setCustEmail(e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" />
                    <input type="text" placeholder="Phone" value={custPhone} onChange={e => setCustPhone(e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" />
                  </div>
                  <textarea rows={1} placeholder="Address" value={custAddress} onChange={e => setCustAddress(e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"></textarea>
                </div>
              )}

              {/* Items Section */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
                  <select 
                    value={itemToAdd} 
                    onChange={e => setItemToAdd(e.target.value)} 
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
                  >
                    <option value="">-- Add product from inventory --</option>
                    {productsInventory.map(p => <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price, currency)})</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      min="1" 
                      value={itemAddQty} 
                      onChange={e => setItemAddQty(e.target.value)} 
                      placeholder="Qty" 
                      className="w-16 px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 text-center" 
                    />
                    <button type="button" onClick={handleAddDocItem} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold transition cursor-pointer">Add</button>
                  </div>
                </div>
                <div className="p-0 max-h-[150px] overflow-y-auto overflow-x-auto">
                  {docItems.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">No items added yet.</div>
                  ) : (
                    <table className="w-full text-left text-xs bg-white dark:bg-transparent min-w-[350px]">
                      <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                        <tr>
                          <th className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300">Item</th>
                          <th className="px-4 py-2 font-semibold w-16 text-center text-slate-600 dark:text-slate-300">Qty</th>
                          <th className="px-4 py-2 font-semibold w-24 text-right text-slate-600 dark:text-slate-300">Price</th>
                          <th className="px-4 py-2 font-semibold w-24 text-right text-slate-600 dark:text-slate-300">Total</th>
                          <th className="px-4 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {docItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-300">
                            <td className="px-4 py-2 font-medium truncate max-w-[150px]">{item.name}</td>
                            <td className="px-4 py-2 text-center">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(item.price, currency)}</td>
                            <td className="px-4 py-2 text-right font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(item.quantity * item.price, currency)}</td>
                            <td className="px-4 py-2 text-center">
                              <button type="button" onClick={() => handleRemoveDocItem(idx)} className="text-slate-400 hover:text-red-500 cursor-pointer"><X size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 p-3 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Total Amount:</span>
                  <span className="font-black text-lg text-slate-800 dark:text-slate-100">{formatCurrency(docItems.reduce((acc, it) => acc + (it.price * it.quantity), 0), currency)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Notes / Terms (Optional)</label>
                <textarea rows={2} value={docNotes} onChange={e => setDocNotes(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-slate-100" placeholder="Additional conditions, bank details, or thank you note..." />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => { setIsDocumentModalOpen(false); setDocEditId(null); }} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold font-sans cursor-pointer transition">Cancel</button>
                <button type="submit" className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition shadow-sm ${docType === 'invoice' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{docEditId ? 'Update' : 'Save'} {docType === 'invoice' ? 'Invoice' : 'Quotation'}</button>
              </div>
            </form>
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

              {expenseCategory === 'other' && (
                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-105 dark:border-slate-800 p-3.5 rounded-xl space-y-1.5 animate-in slide-in-from-top-1">
                  <label className="block text-xs font-bold text-slate-650 dark:text-slate-300">Custom Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Legal, Insurances, Vehicle Tax..."
                    value={expenseCustomCategory}
                    onChange={(e) => setExpenseCustomCategory(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">Provide a custom label for ledger and report cards.</span>
                </div>
              )}

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

      {activeTab === 'stock-and-property' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Stock and Business Property Database</h3>
              <p className="text-xs text-slate-400 mt-1">Manage Business Stock (products/services) and Tangible Property & Equipment.</p>
            </div>
            
            <div className="flex bg-slate-100/50 dark:bg-slate-950/20 p-1 rounded-xl">
              <button 
                onClick={() => setPossessionsTab('business-stock')}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${possessionsTab === 'business-stock' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-sky-450' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Business Stock
              </button>
              <button 
                onClick={() => setPossessionsTab('property-database')}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${possessionsTab === 'property-database' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-sky-450' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Property Database
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {possessionsTab === 'business-stock' ? (
              <>
                <div className="lg:col-span-1 bg-blue-50/30 dark:bg-slate-900/40 border border-blue-100 dark:border-slate-800 rounded-xl p-5 shadow-sm h-fit">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Plus size={16} className="text-blue-500" /> New Stock Take
                  </h4>
                  <form onSubmit={handleAddStock} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Stock Type</label>
                      <select 
                        value={newStockType} 
                        onChange={(e) => setNewStockType(e.target.value as 'product'|'service')} 
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none"
                      >
                        <option value="product">Physical Product</option>
                        <option value="service">Service</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{newStockType === 'product' ? 'Product Name' : 'Service Name'}</label>
                      <input type="text" placeholder={newStockType === 'product' ? 'e.g. Leather Bags' : 'e.g. Software Subscription'} value={newStockPropName} onChange={e => setNewStockPropName(e.target.value)} required className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none" />
                    </div>

                    {newStockType === 'product' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Number of Items</label>
                          <input type="number" placeholder="0" value={newStockQty} onChange={e => setNewStockQty(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Unit Value</label>
                          <input type="number" step="0.01" placeholder="0.00" value={newStockUnitValue} onChange={e => setNewStockUnitValue(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none" />
                        </div>
                      </div>
                    )}

                    {newStockType === 'service' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Service Lifecycle (Duration)</label>
                        <input type="text" placeholder="e.g. 1 Year, 6 Months" value={newStockLifecycle} onChange={e => setNewStockLifecycle(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none" />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Stock Value</label>
                      <input type="number" step="0.01" placeholder="0.00" value={newStockTotalValue} onChange={e => setNewStockTotalValue(e.target.value)} required className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none bg-blue-50/50 dark:bg-blue-900/10" />
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition">
                      Log New Stock
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  {businessStockData.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 text-slate-400 text-xs border-dashed border-2 border-slate-200 dark:border-slate-800 m-4 rounded-xl">
                      No stock logged yet. Use the form to initiate a stock take.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-[10px] uppercase tracking-wider text-slate-500">
                            <th className="p-3 font-semibold">Stock Details</th>
                            <th className="p-3 font-semibold text-right">Qty/Lifecycle</th>
                            <th className="p-3 font-semibold text-right">Value</th>
                            <th className="p-3 font-semibold text-center w-16">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                          {businessStockData.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                              <td className="p-3 leading-tight">
                                <div className="font-bold text-slate-800 dark:text-slate-200">{s.name}</div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{s.type}</div>
                              </td>
                              <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                                {s.type === 'product' ? (
                                  s.quantity ? `${s.quantity} units` : '-'
                                ) : (
                                  s.lifecycle || '-'
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <span className="font-bold font-mono text-blue-600 dark:text-sky-400">{formatCurrency(s.totalValue, currency)}</span>
                                {s.type === 'product' && s.unitValue ? <div className="text-[10px] text-slate-400 block mt-0.5">{formatCurrency(s.unitValue, currency)}/ea</div> : null}
                              </td>
                              <td className="p-3 text-center">
                                <button type="button" onClick={() => handleDeleteStock(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition cursor-pointer">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="lg:col-span-1 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-5 shadow-sm h-fit">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Building size={16} className="text-emerald-500" /> Add New Property/Equipment
                  </h4>
                  <form onSubmit={handleAddProperty} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Property/Equipment Name</label>
                      <input type="text" placeholder="e.g. Delivery Van, Office AC" value={newPropName} onChange={e => setNewPropName(e.target.value)} required className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Place Located</label>
                      <input type="text" placeholder="e.g. Main Office, Warehouse B" value={newPropLocation} onChange={e => setNewPropLocation(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Condition</label>
                      <select 
                        value={newPropCondition} 
                        onChange={(e) => setNewPropCondition(e.target.value as 'new'|'used'|'old')} 
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none"
                      >
                        <option value="new">New</option>
                        <option value="used">Used / Good</option>
                        <option value="old">Old / Needing Fix</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Estimated Value</label>
                      <input type="number" step="0.01" placeholder="0.00" value={newPropValue} onChange={e => setNewPropValue(e.target.value)} required className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none bg-emerald-50/50 dark:bg-emerald-900/10" />
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition">
                      Log Property
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  {businessPropertyData.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 text-slate-400 text-xs border-dashed border-2 border-slate-200 dark:border-slate-800 m-4 rounded-xl">
                      No property or equipment logged yet. Use the form to record tangibles.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-[10px] uppercase tracking-wider text-slate-500">
                            <th className="p-3 font-semibold">Equipment / Asset</th>
                            <th className="p-3 font-semibold">Condition</th>
                            <th className="p-3 font-semibold text-right">Value</th>
                            <th className="p-3 font-semibold text-center w-16">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                          {businessPropertyData.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                              <td className="p-3 leading-tight">
                                <div className="font-bold text-slate-800 dark:text-slate-200">{p.name}</div>
                                {p.location && <div className="text-[10px] text-slate-400 mt-0.5">Loc: {p.location}</div>}
                              </td>
                              <td className="p-3">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${p.condition === 'new' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' : p.condition === 'used' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'}`}>
                                  {p.condition}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(p.estimatedValue, currency)}</span>
                              </td>
                              <td className="p-3 text-center">
                                <button type="button" onClick={() => handleDeleteProperty(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition cursor-pointer">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
