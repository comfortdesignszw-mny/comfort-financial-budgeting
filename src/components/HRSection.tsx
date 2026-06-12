import React, { useState } from 'react';
import { 
  Users, UserPlus, Briefcase, Calendar, Phone, Mail, MapPin, 
  Edit2, Trash2, Download, Receipt, Plus, FileText, Share2, FileDown, Eye, Scale, X
} from 'lucide-react';
import { AppData, HREmployee, HRPayroll, CurrencyType } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { jsPDF } from 'jspdf';

interface Props {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  currency: CurrencyType;
  showToast?: (message: string) => void;
}

export default function HRSection({ data, onUpdateData, currency, showToast }: Props) {
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll'>('employees');
  
  const employees = data.hrEmployees || [];
  const payrolls = data.hrPayrolls || [];

  // Employee Modal
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [empEditId, setEmpEditId] = useState<string | null>(null);
  
  const [empName, setEmpName] = useState('');
  const [empIdInput, setEmpIdInput] = useState('');
  const [empJobTitle, setEmpJobTitle] = useState('');
  const [empDepartment, setEmpDepartment] = useState('');
  const [empDateHired, setEmpDateHired] = useState('');
  const [empPhoto, setEmpPhoto] = useState('');
  const [empViewMode, setEmpViewMode] = useState<'cards' | 'table'>('cards');
  const [idCardEmployeeId, setIdCardEmployeeId] = useState<string | null>(null);
  const [empPhone, setEmpPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empAddress, setEmpAddress] = useState('');

  // Payroll Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payEditId, setPayEditId] = useState<string | null>(null);
  const [payrollFilterMonth, setPayrollFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  
  const [payEmpId, setPayEmpId] = useState('');
  const [payMonth, setPayMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [payBasic, setPayBasic] = useState('');
  const [payOvertime, setPayOvertime] = useState('');
  const [payBonus, setPayBonus] = useState('');
  const [payIncentives, setPayIncentives] = useState('');
  const [payOtherEarn, setPayOtherEarn] = useState('');
  const [payOtherEarnDesc, setPayOtherEarnDesc] = useState('');
  const [payNassa, setPayNassa] = useState('');
  const [payPaye, setPayPaye] = useState('');
  const [payAids, setPayAids] = useState('');

  // Save Employee
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName) return;

    const emp: HREmployee = {
      id: empEditId || crypto.randomUUID(),
      employeeId: empIdInput || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: empName,
      jobTitle: empJobTitle,
      department: empDepartment,
      dateHired: empDateHired || new Date().toISOString().split('T')[0],
      phone: empPhone,
      email: empEmail,
      address: empAddress,
      createdAt: new Date().toISOString(),
      photo: empPhoto
    };

    const newEmployees = empEditId
      ? employees.map(x => x.id === empEditId ? emp : x)
      : [...employees, emp];

    onUpdateData({ ...data, hrEmployees: newEmployees });
    if (showToast) {
      showToast(empEditId ? 'Employee data successfully updated in sandbox' : 'New employee registered successfully in sandbox');
    }
    setIsEmpModalOpen(false);
    resetEmpForm();
  };

  const resetEmpForm = () => {
    setEmpEditId(null);
    setEmpName('');
    setEmpIdInput('');
    setEmpJobTitle('');
    setEmpDepartment('');
    setEmpDateHired('');
    setEmpPhone('');
    setEmpEmail('');
    setEmpAddress('');
    setEmpPhoto('');
  };

  const openEditEmployee = (emp: HREmployee) => {
    setEmpEditId(emp.id);
    setEmpName(emp.name);
    setEmpIdInput(emp.employeeId);
    setEmpJobTitle(emp.jobTitle);
    setEmpDepartment(emp.department);
    setEmpDateHired(emp.dateHired);
    setEmpPhone(emp.phone);
    setEmpEmail(emp.email);
    setEmpAddress(emp.address);
    setEmpPhoto(emp.photo || '');
    setIsEmpModalOpen(true);
  };

  const [viewEmpId, setViewEmpId] = useState<string | null>(null);

  const downloadEmployeeProfile = async (emp: HREmployee, action: 'download' | 'share' = 'download') => {
    const pdf = new jsPDF();
    let currentY = 20;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor('#4f46e5');
    pdf.text('EMPLOYEE PROFILE', 14, currentY);
    
    // Organization info at top right
    const compName = data.profile.companyName || data.profile.name || 'Your Company Name';
    pdf.setFontSize(10);
    pdf.setTextColor('#0f172a');
    pdf.text(compName.toUpperCase(), 196, currentY, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor('#64748b');
    if (data.profile.companyEmail) {
      pdf.text(data.profile.companyEmail, 196, currentY + 5, { align: 'right' });
    }
    if (data.profile.companyPhone) {
      pdf.text(data.profile.companyPhone, 196, currentY + 10, { align: 'right' });
    }
    
    currentY += 15;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor('#1e293b');
    pdf.text(emp.name, 14, currentY);
    
    currentY += 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#64748b');
    pdf.text(`Employee ID: ${emp.employeeId}`, 14, currentY);
    
    currentY += 12;
    pdf.setDrawColor('#e2e8f0');
    pdf.line(14, currentY, 196, currentY);
    
    currentY += 12;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor('#334155');
    pdf.text('Professional Information', 14, currentY);
    
    currentY += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Job Title: ${emp.jobTitle || 'N/A'}`, 14, currentY);
    pdf.text(`Department: ${emp.department || 'N/A'}`, 100, currentY);
    
    currentY += 8;
    pdf.text(`Date Hired: ${formatDate(emp.dateHired) || 'N/A'}`, 14, currentY);
    
    currentY += 12;
    pdf.setDrawColor('#e2e8f0');
    pdf.line(14, currentY, 196, currentY);
    
    currentY += 12;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Contact Information', 14, currentY);
    
    currentY += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Phone: ${emp.phone || 'N/A'}`, 14, currentY);
    pdf.text(`Email: ${emp.email || 'N/A'}`, 100, currentY);
    
    currentY += 8;
    pdf.text(`Address: ${emp.address || 'N/A'}`, 14, currentY);

    const fileName = `Profile_${emp.name.replace(/\s+/g, '_')}.pdf`;

    if (action === 'download') {
      pdf.save(fileName);
    } else if (action === 'share') {
      if (navigator.share) {
        try {
          const blob = pdf.output('blob');
          const file = new File([blob], fileName, { type: 'application/pdf' });
          await navigator.share({
            files: [file],
            title: `Employee Profile - ${emp.name}`,
            text: `Profile documentation for ${emp.name}`
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

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Delete this employee profile?')) {
      onUpdateData({ ...data, hrEmployees: employees.filter(e => e.id !== id) });
    }
  };

  // Save Payroll
  const handleSavePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payEmpId || !payMonth || !payBasic) return;

    const basic = parseFloat(payBasic) || 0;
    const ovt = parseFloat(payOvertime) || 0;
    const bon = parseFloat(payBonus) || 0;
    const inc = parseFloat(payIncentives) || 0;
    const oth = parseFloat(payOtherEarn) || 0;
    
    const gross = basic + ovt + bon + inc + oth;
    
    const nassa = parseFloat(payNassa) || 0;
    const paye = parseFloat(payPaye) || 0;
    const aids = parseFloat(payAids) || 0;
    
    const net = gross - (nassa + paye + aids);
    const empName = employees.find(e => e.id === payEmpId)?.name || 'Unknown Employee';

    let existingTxId: string | undefined;
    if (payEditId) {
      const existingPay = payrolls.find(p => p.id === payEditId);
      existingTxId = existingPay?.businessTransactionId;
    }

    const txId = existingTxId || crypto.randomUUID();

    const pay: HRPayroll = {
      id: payEditId || crypto.randomUUID(),
      employeeId: payEmpId,
      month: payMonth,
      basicSalary: basic,
      overtime: ovt,
      bonus: bon,
      incentives: inc,
      otherEarnings: oth,
      otherEarningsDesc: payOtherEarnDesc,
      nassa,
      paye,
      aidsLevy: aids,
      grossSalary: gross,
      netSalary: net,
      createdAt: new Date().toISOString(),
      businessTransactionId: txId
    };

    const newPayrolls = payEditId
      ? payrolls.map(x => x.id === payEditId ? pay : x)
      : [...payrolls, pay];

    // Sync to Business Transactions
    const businessTx = data.businessTransactions || [];
    const txObj = {
      id: txId,
      type: 'expense' as const,
      description: `Payroll - ${empName} (${payMonth})`,
      amount: gross,
      category: 'wages' as any,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    const newBusinessTxs = existingTxId 
      ? businessTx.map(t => t.id === existingTxId ? { ...t, amount: txObj.amount, description: txObj.description } : t)
      : [...businessTx, txObj];

    onUpdateData({ 
      ...data, 
      hrPayrolls: newPayrolls,
      businessTransactions: newBusinessTxs 
    });
    if (showToast) {
      showToast(payEditId ? 'Payslip updated & synced to business ledger in sandbox' : 'Monthly payroll logged & synced to business ledger in sandbox');
    }
    setIsPayModalOpen(false);
    resetPayForm();
  };

  const resetPayForm = () => {
    setPayEditId(null);
    setPayEmpId('');
    setPayMonth(new Date().toISOString().slice(0, 7));
    setPayBasic('');
    setPayOvertime('');
    setPayBonus('');
    setPayIncentives('');
    setPayOtherEarn('');
    setPayOtherEarnDesc('');
    setPayNassa('');
    setPayPaye('');
    setPayAids('');
  };

  const openEditPayroll = (pay: HRPayroll) => {
    setPayEditId(pay.id);
    setPayEmpId(pay.employeeId);
    setPayMonth(pay.month);
    setPayBasic(pay.basicSalary.toString());
    setPayOvertime(pay.overtime.toString());
    setPayBonus(pay.bonus.toString());
    setPayIncentives(pay.incentives.toString());
    setPayOtherEarn(pay.otherEarnings.toString());
    setPayOtherEarnDesc(pay.otherEarningsDesc || '');
    setPayNassa(pay.nassa.toString());
    setPayPaye(pay.paye.toString());
    setPayAids(pay.aidsLevy.toString());
    setIsPayModalOpen(true);
  };

  const handleDeletePayroll = (id: string) => {
    const pay = payrolls.find(p => p.id === id);
    if (confirm('Delete this payslip record?')) {
      const newPayrolls = payrolls.filter(p => p.id !== id);
      const businessTx = data.businessTransactions || [];
      const newBusinessTxs = pay?.businessTransactionId 
        ? businessTx.filter(t => t.id !== pay.businessTransactionId)
        : businessTx;

      onUpdateData({ 
        ...data, 
        hrPayrolls: newPayrolls,
        businessTransactions: newBusinessTxs
      });
    }
  };

  // PDF Export
  const generatePayslipPDF = async (pay: HRPayroll, action: 'download' | 'share' | 'view') => {
    const emp = employees.find(e => e.id === pay.employeeId);
    if (!emp) return;

    const pdf = new jsPDF();
    let currentY = 20;

    // Header / Branding
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor('#4f46e5');
    pdf.text('PAYSLIP', 14, currentY);
    
    // Organization info at top right
    const compName = data.profile.companyName || data.profile.name || 'Your Company Name';
    pdf.setFontSize(12);
    pdf.setTextColor('#0f172a');
    pdf.text(compName.toUpperCase(), 196, currentY, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor('#64748b');
    if (data.profile.companyEmail) {
      pdf.text(data.profile.companyEmail, 196, currentY + 6, { align: 'right' });
    }
    if (data.profile.companyPhone) {
      pdf.text(data.profile.companyPhone, 196, currentY + 12, { align: 'right' });
    }
    
    currentY += 15;
    pdf.setFontSize(12);
    pdf.setTextColor('#1e293b');
    pdf.setFont('helvetica', 'bold');
    pdf.text(compName, 14, currentY);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#64748b');
    
    currentY += 6;
    pdf.text(`Month: ${pay.month}`, 14, currentY);
    
    currentY += 15;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor('#1e293b');
    pdf.text('Employee Details', 14, currentY);
    
    currentY += 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${emp.name}`, 14, currentY);
    pdf.text(`Employee ID: ${emp.employeeId}`, 100, currentY);
    
    currentY += 6;
    pdf.text(`Job Title: ${emp.jobTitle}`, 14, currentY);
    pdf.text(`Department: ${emp.department}`, 100, currentY);

    currentY += 15;
    pdf.setDrawColor('#e2e8f0');
    pdf.line(14, currentY, 196, currentY);
    
    currentY += 10;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Earnings', 14, currentY);
    
    currentY += 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Basic Salary', 14, currentY);
    pdf.text(formatCurrency(pay.basicSalary, currency), 160, currentY, { align: 'right' });
    
    if (pay.overtime > 0) {
      currentY += 6;
      pdf.text('Overtime', 14, currentY);
      pdf.text(formatCurrency(pay.overtime, currency), 160, currentY, { align: 'right' });
    }
    if (pay.bonus > 0) {
      currentY += 6;
      pdf.text('Bonus', 14, currentY);
      pdf.text(formatCurrency(pay.bonus, currency), 160, currentY, { align: 'right' });
    }
    if (pay.incentives > 0) {
      currentY += 6;
      pdf.text('Incentives', 14, currentY);
      pdf.text(formatCurrency(pay.incentives, currency), 160, currentY, { align: 'right' });
    }
    if (pay.otherEarnings > 0) {
      currentY += 6;
      pdf.text(`Other Earnings (${pay.otherEarningsDesc || 'N/A'})`, 14, currentY);
      pdf.text(formatCurrency(pay.otherEarnings, currency), 160, currentY, { align: 'right' });
    }

    currentY += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Gross Salary', 14, currentY);
    pdf.text(formatCurrency(pay.grossSalary, currency), 160, currentY, { align: 'right' });

    currentY += 15;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Deductions', 14, currentY);
    
    currentY += 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    if (pay.nassa > 0) {
      pdf.text('NASSA', 14, currentY);
      pdf.text(formatCurrency(pay.nassa, currency), 160, currentY, { align: 'right' });
      currentY += 6;
    }
    if (pay.paye > 0) {
      pdf.text('PAYE', 14, currentY);
      pdf.text(formatCurrency(pay.paye, currency), 160, currentY, { align: 'right' });
      currentY += 6;
    }
    if (pay.aidsLevy > 0) {
      pdf.text('Aids Levy', 14, currentY);
      pdf.text(formatCurrency(pay.aidsLevy, currency), 160, currentY, { align: 'right' });
      currentY += 6;
    }
    const totalDeductions = pay.nassa + pay.paye + pay.aidsLevy;
    if (totalDeductions > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Total Deductions', 14, currentY);
      pdf.text(formatCurrency(totalDeductions, currency), 160, currentY, { align: 'right' });
    } else {
      pdf.text('No Deductions', 14, currentY);
    }

    currentY += 15;
    pdf.setDrawColor('#e2e8f0');
    pdf.line(14, currentY, 196, currentY);
    
    currentY += 10;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor('#0f172a');
    pdf.text('NET SALARY', 14, currentY);
    pdf.text(formatCurrency(pay.netSalary, currency), 160, currentY, { align: 'right' });

    const fileName = `Payslip_${emp.name.replace(/\s+/g, '_')}_${pay.month}.pdf`;

    if (action === 'download' || action === undefined) {
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
            title: `Payslip - ${emp.name}`,
            text: `Payslip for ${emp.name} for ${pay.month}.`
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

  const generateConsolidatedPayrollPDF = async (month: string) => {
    const monthPayrolls = payrolls.filter(p => !month || p.month === month);
    if (monthPayrolls.length === 0) {
      alert(`No payroll records found for ${month || 'all time'}`);
      return;
    }

    const pdf = new jsPDF('landscape');
    let currentY = 20;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor('#4f46e5');
    pdf.text('CONSOLIDATED PAYROLL SUMMARY', 14, currentY);
    
    // Organization info at top right
    const compName = data.profile.companyName || data.profile.name || 'Your Company Name';
    pdf.setFontSize(12);
    pdf.setTextColor('#0f172a');
    pdf.text(compName.toUpperCase(), 283, currentY, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor('#64748b');
    if (data.profile.companyEmail) {
      pdf.text(data.profile.companyEmail, 283, currentY + 6, { align: 'right' });
    }
    if (data.profile.companyPhone) {
      pdf.text(data.profile.companyPhone, 283, currentY + 12, { align: 'right' });
    }
    
    currentY += 12;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor('#1e293b');
    pdf.text(compName, 14, currentY);
    
    currentY += 6;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#64748b');
    pdf.text(`Payroll Period: ${month || 'All Time'}`, 14, currentY);
    pdf.text(`Generated: ${formatDate(new Date().toISOString().split('T')[0])}`, 14, currentY + 6);
    
    currentY += 20;
    
    // Table Header
    pdf.setFillColor('#f8fafc');
    pdf.rect(14, currentY, 268, 12, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor('#475569');
    
    pdf.text('EMPLOYEE', 18, currentY + 8);
    pdf.text('BASIC', 90, currentY + 8, { align: 'right' });
    pdf.text('EARNINGS', 130, currentY + 8, { align: 'right' });
    pdf.text('GROSS', 170, currentY + 8, { align: 'right' });
    pdf.text('DEDUCTIONS', 210, currentY + 8, { align: 'right' });
    pdf.text('NET PAY', 260, currentY + 8, { align: 'right' });
    
    currentY += 20;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#1e293b');
    
    let totalBasic = 0, totalAdd = 0, totalGross = 0, totalDed = 0, totalNet = 0;

    monthPayrolls.forEach((pay, index) => {
      const emp = employees.find(e => e.id === pay.employeeId);
      const name = emp ? emp.name : 'Unknown';
      
      const addEarning = pay.overtime + pay.bonus + pay.incentives + pay.otherEarnings;
      const totalDeductions = pay.nassa + pay.paye + pay.aidsLevy;
      
      totalBasic += pay.basicSalary;
      totalAdd += addEarning;
      totalGross += pay.grossSalary;
      totalDed += totalDeductions;
      totalNet += pay.netSalary;
      
      if (currentY > 180) {
        pdf.addPage('landscape');
        currentY = 20;
        
        pdf.setFillColor('#f8fafc');
        pdf.rect(14, currentY, 268, 12, 'F');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor('#475569');
        pdf.text('EMPLOYEE', 18, currentY + 8);
        pdf.text('BASIC', 90, currentY + 8, { align: 'right' });
        pdf.text('EARNINGS', 130, currentY + 8, { align: 'right' });
        pdf.text('GROSS', 170, currentY + 8, { align: 'right' });
        pdf.text('DEDUCTIONS', 210, currentY + 8, { align: 'right' });
        pdf.text('NET PAY', 260, currentY + 8, { align: 'right' });
        
        currentY += 20;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor('#1e293b');
      }

      pdf.text(name.substring(0, 30), 18, currentY);
      pdf.text(formatCurrency(pay.basicSalary, currency), 90, currentY, { align: 'right' });
      pdf.text(formatCurrency(addEarning, currency), 130, currentY, { align: 'right' });
      pdf.text(formatCurrency(pay.grossSalary, currency), 170, currentY, { align: 'right' });
      pdf.text(formatCurrency(totalDeductions, currency), 210, currentY, { align: 'right' });
      
      pdf.setFont('helvetica', 'bold');
      pdf.text(formatCurrency(pay.netSalary, currency), 260, currentY, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      
      currentY += 10;
    });

    // Totals line
    currentY += 5;
    pdf.setDrawColor('#e2e8f0');
    pdf.line(14, currentY, 282, currentY);
    currentY += 10;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('TOTALS:', 18, currentY);
    pdf.text(formatCurrency(totalBasic, currency), 90, currentY, { align: 'right' });
    pdf.text(formatCurrency(totalAdd, currency), 130, currentY, { align: 'right' });
    pdf.text(formatCurrency(totalGross, currency), 170, currentY, { align: 'right' });
    pdf.text(formatCurrency(totalDed, currency), 210, currentY, { align: 'right' });
    pdf.setTextColor('#0f172a');
    pdf.text(formatCurrency(totalNet, currency), 260, currentY, { align: 'right' });

    pdf.save(`Consolidated_Payroll_${month || 'AllTime'}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl leading-tight font-extrabold text-slate-900 dark:text-white font-sans flex items-center gap-2">
          <Briefcase className="text-purple-600 dark:text-purple-400" />
          HR and Staff Management
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage employee database and generate monthly payroll runs.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl w-max border border-slate-200/60 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
            activeTab === 'employees'
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Users size={16} /> Employee Database
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
            activeTab === 'payroll'
              ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Receipt size={16} /> Payroll Processing
        </button>
      </div>

      {/* Employee Module */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Registered Employees</h4>
              <div className="flex border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden p-0.5 text-[10px] uppercase font-bold bg-slate-50 dark:bg-slate-950">
                <button
                  onClick={() => setEmpViewMode('cards')}
                  className={`px-2 py-1 rounded-lg transition shrink-0 cursor-pointer ${empViewMode === 'cards' ? 'bg-white dark:bg-slate-800 text-purple-650 dark:text-purple-400 shadow-xs' : 'text-slate-400 hover:text-slate-650'}`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setEmpViewMode('table')}
                  className={`px-2 py-1 rounded-lg transition shrink-0 cursor-pointer ${empViewMode === 'table' ? 'bg-white dark:bg-slate-800 text-purple-650 dark:text-purple-400 shadow-xs' : 'text-slate-400 hover:text-slate-650'}`}
                >
                  List
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => { resetEmpForm(); setIsEmpModalOpen(true); }}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer duration-155"
            >
              <UserPlus size={16} /> Add Employee
            </button>
          </div>

          {employees.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <Users className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={48} />
              <p className="font-medium text-sm">No employees registered yet.</p>
              <p className="text-xs text-slate-400 mt-1">Click Add Employee to begin building your team database.</p>
            </div>
          ) : empViewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map(e => (
                <div key={e.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs relative overflow-hidden hover:shadow-md transition duration-200">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
                  
                  <div className="flex items-start gap-4 mt-1">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 font-black text-lg">
                      {e.photo ? (
                        <img src={e.photo} alt={e.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{e.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate leading-tight">{e.name}</h5>
                      <span className="inline-block px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-450 font-mono text-[9px] font-bold rounded-md">{e.employeeId}</span>
                      <p className="text-xs text-slate-500 truncate font-medium mt-0.5">{e.jobTitle}</p>
                      <p className="text-[10px] text-slate-400 truncate">{e.department}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/80 mt-4 pt-3 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      <span className="block text-[8px] uppercase font-bold text-slate-400">Date Hired</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-350">{e.dateHired}</span>
                    </div>
                    <button 
                      onClick={() => setIdCardEmployeeId(e.id)}
                      className="flex items-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold text-[10px] duration-150 hover:opacity-90 shadow-sm cursor-pointer"
                      title="Build dynamic employee badge"
                    >
                      <Scale size={11} /> ID Card
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-850">
                    <button onClick={() => setViewEmpId(e.id)} className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-350 rounded-lg transition hover:text-blue-500 cursor-pointer" title="View Profile">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => downloadEmployeeProfile(e, 'download')} className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-350 rounded-lg transition hover:text-green-500 cursor-pointer" title="Download Profile PDF">
                      <Download size={14} />
                    </button>
                    <button onClick={() => openEditEmployee(e)} className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-350 rounded-lg transition hover:text-purple-500 cursor-pointer" title="Edit Employee">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteEmployee(e.id)} className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-350 rounded-lg transition hover:text-red-500 cursor-pointer" title="Delete Employee">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Photo</th>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">ID & Role</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Hired</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {employees.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                        <td className="px-4 py-3 shrink-0">
                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 font-black text-xs">
                            {e.photo ? (
                              <img src={e.photo} alt={e.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{e.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{e.name}</td>
                        <td className="px-4 py-3">
                          <span className="block font-mono text-xs text-purple-650 dark:text-purple-400 font-bold">{e.employeeId}</span>
                          <span className="block text-xs text-slate-500">{e.jobTitle} • {e.department}</span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div className="flex flex-col gap-1 text-slate-500">
                            {e.phone && <span className="flex items-center gap-1"><Phone size={10} /> {e.phone}</span>}
                            {e.email && <span className="flex items-center gap-1"><Mail size={10} /> {e.email}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{e.dateHired}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setIdCardEmployeeId(e.id)} className="p-1.5 text-slate-400 hover:text-purple-500 rounded-md transition cursor-pointer" title="Build ID Card">
                              <Scale size={16} />
                            </button>
                            <button onClick={() => setViewEmpId(e.id)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-md transition cursor-pointer" title="View Profile">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => downloadEmployeeProfile(e, 'download')} className="p-1.5 text-slate-400 hover:text-green-500 rounded-md transition cursor-pointer" title="Download Profile">
                              <Download size={16} />
                            </button>
                            <button onClick={() => openEditEmployee(e)} className="p-1.5 text-slate-400 hover:text-purple-500 rounded-md transition cursor-pointer" title="Edit Employee">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteEmployee(e.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition cursor-pointer" title="Delete Employee">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payroll Module */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Payroll Records</h4>
            <div className="flex items-center gap-2">
              <input 
                type="month" 
                value={payrollFilterMonth}
                onChange={(e) => setPayrollFilterMonth(e.target.value)}
                className="px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
              />
              <button 
                onClick={() => generateConsolidatedPayrollPDF(payrollFilterMonth)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                title="Export Consolidated PDF"
              >
                <Download size={14} /> Export Summary
              </button>
              <button 
                onClick={() => { resetPayForm(); setIsPayModalOpen(true); }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm relative overflow-hidden group ml-1"
              >
                <div className="absolute inset-0 w-8 h-full bg-white/20 skew-x-[-20deg] -translate-x-12 group-hover:animate-[shimmer_1.5s_infinite]" />
                <Receipt size={16} /> Process Payslip
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {payrolls.filter(p => !payrollFilterMonth || p.month === payrollFilterMonth).length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FileText className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={48} />
                <p>No payroll records found{payrollFilterMonth ? ` for ${payrollFilterMonth}` : ''}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Gross Salary</th>
                      <th className="px-4 py-3">Deductions</th>
                      <th className="px-4 py-3">Net Salary</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {payrolls.filter(p => !payrollFilterMonth || p.month === payrollFilterMonth).map(p => {
                      const emp = employees.find(e => e.id === p.employeeId);
                      const totalDeductions = p.nassa + p.paye + p.aidsLevy;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                          <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{p.month}</td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{emp?.name || 'Unknown'}</span>
                            <span className="block text-[10px] font-mono text-slate-500">{emp?.employeeId}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatCurrency(p.grossSalary, currency)}</td>
                          <td className="px-4 py-3 text-red-500 dark:text-red-400 text-xs font-semibold">-{formatCurrency(totalDeductions, currency)}</td>
                          <td className="px-4 py-3 font-bold text-teal-600 dark:text-teal-400">{formatCurrency(p.netSalary, currency)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openEditPayroll(p)} title="Edit Payslip" className="p-1.5 text-slate-400 hover:text-teal-500 rounded-md transition">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => generatePayslipPDF(p, 'download')} title="Download Payslip" className="p-1.5 text-slate-400 hover:text-teal-500 rounded-md transition">
                                <FileDown size={16} />
                              </button>
                              <button onClick={() => generatePayslipPDF(p, 'share')} title="Share Payslip" className="p-1.5 text-slate-400 hover:text-teal-500 rounded-md transition">
                                <Share2 size={16} />
                              </button>
                              <button onClick={() => handleDeletePayroll(p.id)} title="Delete Payslip" className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserPlus className="text-purple-600" size={18} />
                {empEditId ? 'Edit Employee Profile' : 'Add New Employee'}
              </h3>
            </div>
            <form onSubmit={handleSaveEmployee} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Photo Upload zone */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-3 border border-slate-100 dark:border-slate-800 rounded-2xl">
                <label className="block text-xs font-bold text-slate-500 mb-2">Employee Photograph</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 bg-white dark:bg-slate-950 shadow-inner">
                    {empPhoto ? (
                      <img src={empPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold text-center">No Photo</span>
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-extrabold file:bg-purple-100 dark:file:bg-purple-950/40 file:text-purple-700 dark:file:text-purple-400 hover:file:opacity-90 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) setEmpPhoto(ev.target.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <p className="text-[9px] text-slate-400 leading-none">Upload PNG, JPG or JPEG. Image is embedded locally.</p>
                  </div>
                  {empPhoto && (
                    <button 
                      type="button" 
                      onClick={() => setEmpPhoto('')} 
                      className="py-1 px-2.5 hover:bg-red-200 bg-red-100 text-red-700 font-black text-[10px] rounded-lg cursor-pointer duration-150 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                <input required type="text" value={empName} onChange={e => setEmpName(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Employee ID (Optional)</label>
                  <input type="text" value={empIdInput} onChange={e => setEmpIdInput(e.target.value)} placeholder="Auto-generated if empty" className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Date Hired</label>
                  <input type="date" value={empDateHired} onChange={e => setEmpDateHired(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Job Title</label>
                  <input type="text" value={empJobTitle} onChange={e => setEmpJobTitle(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Department</label>
                  <input type="text" value={empDepartment} onChange={e => setEmpDepartment(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                  <input type="tel" value={empPhone} onChange={e => setEmpPhone(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                  <input type="email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Physical Address</label>
                <textarea rows={2} value={empAddress} onChange={e => setEmpAddress(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsEmpModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold">{empEditId ? 'Update' : 'Save'} Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payroll Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="text-teal-600" size={18} />
                {payEditId ? 'Edit Payslip' : 'Process Process'}
              </h3>
            </div>
            <form onSubmit={handleSavePayroll} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-500">Employee</label>
                    <button type="button" onClick={() => { setIsPayModalOpen(false); resetEmpForm(); setIsEmpModalOpen(true); }} className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1">
                      <Plus size={10} /> New Employee
                    </button>
                  </div>
                  <select required value={payEmpId} onChange={e => setPayEmpId(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:text-white">
                    <option value="">Select Employee...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Payroll Month</label>
                  <input required type="month" value={payMonth} onChange={e => setPayMonth(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:text-white" />
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">Earnings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Basic Salary ({currency})</label>
                    <input required type="number" step="any" min="0" value={payBasic} onChange={e => setPayBasic(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Overtime</label>
                      <input type="number" step="any" value={payOvertime} onChange={e => setPayOvertime(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Bonus</label>
                      <input type="number" step="any" value={payBonus} onChange={e => setPayBonus(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Incentives</label>
                      <input type="number" step="any" value={payIncentives} onChange={e => setPayIncentives(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 dark:text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Other Earnings</label>
                      <input type="number" step="any" value={payOtherEarn} onChange={e => setPayOtherEarn(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Description (Other)</label>
                      <input type="text" value={payOtherEarnDesc} onChange={e => setPayOtherEarnDesc(e.target.value)} placeholder="e.g. Travel Allowance" className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 dark:text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">Deductions (Optional)</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">NASSA</label>
                    <input type="number" step="any" value={payNassa} onChange={e => setPayNassa(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">PAYE</label>
                    <input type="number" step="any" value={payPaye} onChange={e => setPayPaye(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Aids Levy</label>
                    <input type="number" step="any" value={payAids} onChange={e => setPayAids(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 dark:text-white" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold">{payEditId ? 'Update' : 'Process'} Payslip</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Employee Modal */}
      {viewEmpId && employees.find(e => e.id === viewEmpId) && (() => {
        const emp = employees.find(e => e.id === viewEmpId)!;
        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Briefcase className="text-blue-600" size={18} />
                  Employee Profile
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-150/40 dark:border-slate-800/50">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 font-black text-xl">
                    {emp.photo ? (
                      <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{emp.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{emp.name}</h4>
                    <span className="inline-block px-1.5 py-0.5 mt-1 bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 font-mono text-[10px] font-black rounded-md">{emp.employeeId}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Job Title</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{emp.jobTitle || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Department</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{emp.department || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Date Hired</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatDate(emp.dateHired) || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Phone size={14} className="text-slate-400" /> {emp.phone || 'No phone recorded'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Mail size={14} className="text-slate-400" /> {emp.email || 'No email recorded'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-305">
                    <MapPin size={14} className="text-slate-400" /> {emp.address || 'No address recorded'}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => downloadEmployeeProfile(emp, 'download')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer">
                    <Download size={14} /> Download PDF
                  </button>
                  <button type="button" onClick={() => setViewEmpId(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Generated ID Card Preview and Export Modal */}
      {idCardEmployeeId && employees.find(e => e.id === idCardEmployeeId) && (() => {
        const emp = employees.find(e => e.id === idCardEmployeeId)!;

        // Custom function to download ID card as clean portrait print-ready PDF
        const downloadIDCardPDF = () => {
          // Standard badge size: 54mm x 85mm portrait
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [54, 85]
          });

          // Draw dark card body base
          pdf.setFillColor('#020617'); // obsidian deep dark background
          pdf.rect(0, 0, 54, 85, 'F');

          // Header border glow (Teal)
          pdf.setFillColor('#0d9488'); 
          pdf.rect(0, 0, 54, 16, 'F');

          // Header Text
          pdf.setTextColor('#ffffff');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7.5);
          pdf.text('COMFORT FINANCE SUITE', 27, 7, { align: 'center' });
          
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(4.5);
          pdf.text('Unified Finance & Corporate Platform', 27, 11, { align: 'center' });

          // Employee Photo placeholder or base64 image
          if (emp.photo) {
            try {
              pdf.addImage(emp.photo, 'JPEG', 15, 20, 24, 24);
            } catch (e) {
              console.warn("Could not insert image to PDF: ", e);
              // Draw generic box
              pdf.setFillColor('#1e293b');
              pdf.rect(15, 20, 24, 24, 'F');
            }
          } else {
            pdf.setFillColor('#1e293b');
            pdf.rect(15, 20, 24, 24, 'F');
            pdf.setTextColor('#94a3b8');
            pdf.setFontSize(10);
            pdf.text(emp.name.charAt(0).toUpperCase(), 27, 34, { align: 'center' });
          }

          // Badge decorative gold outline border
          pdf.setDrawColor('#0d9488');
          pdf.setLineWidth(0.4);
          pdf.rect(14.5, 19.5, 25, 25, 'D');

          // Employee Details text block
          pdf.setTextColor('#ffffff');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.text(emp.name.toUpperCase(), 27, 51, { align: 'center' });

          pdf.setTextColor('#38bdf8'); // sky blue role title
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(6.5);
          pdf.text(emp.jobTitle ? emp.jobTitle.toUpperCase() : 'STAFF MEMBER', 27, 56, { align: 'center' });

          pdf.setTextColor('#94a3b8');
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(5);
          pdf.text(emp.department ? emp.department.toUpperCase() : 'GENERAL OPERATIONS', 27, 60, { align: 'center' });

          // ID number block
          pdf.setFillColor('#1e293b');
          pdf.rect(6, 65, 42, 6, 'F');
          
          pdf.setTextColor('#22c55e'); // Terminal green code color
          pdf.setFont('courier', 'bold');
          pdf.setFontSize(7.5);
          pdf.text(emp.employeeId || 'ID-UNKNOWN', 27, 69.2, { align: 'center' });

          // Card Footer
          pdf.setTextColor('#475569');
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(4);
          pdf.text('AUTHORIZED COMPANY ISSUE • COMFORT FINANCE SUITE', 27, 76, { align: 'center' });
          pdf.text('IF FOUND, CONTACT SECURITY DESK IMMEDIATELY', 27, 78.5, { align: 'center' });

          pdf.save(`ID_Badge_${emp.name.replace(/\s+/g, '_')}.pdf`);
        };

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1150] flex items-center justify-center p-4">
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                <h3 className="font-extrabold text-xs text-slate-850 dark:text-slate-100 flex items-center gap-2">
                  <Scale size={16} className="text-purple-600 dark:text-purple-400" />
                  Corporate ID Badge Creator
                </h3>
                <button onClick={() => setIdCardEmployeeId(null)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                  <X size={15} />
                </button>
              </div>

              {/* Physical Card Simulation Display Frame */}
              <div className="p-6 flex flex-col items-center justify-center">
                
                {/* ID Card Front face */}
                <div id="badge-front-v" className="w-[220px] h-[346px] bg-slate-950 dark:bg-black rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col items-center relative">
                  
                  {/* Top Teal Brand Header bar */}
                  <div className="w-full h-[65px] bg-[#0F172A] flex flex-col items-center justify-center p-2 border-b-2 border-teal-500 text-center">
                    <span className="text-[10px] uppercase font-black tracking-widest text-white leading-tight">Comfort Finance Suite</span>
                    <span className="text-[7px] text-teal-400 tracking-wider leading-none mt-0.5">Corporate & Unified Finance Engine</span>
                  </div>

                  {/* ID slot connector representative placeholder */}
                  <div className="w-8 h-2 bg-slate-800 dark:bg-slate-900 rounded-full border border-slate-700 mt-2 shrink-0 shadow-inner" />

                  {/* Photograph Zone */}
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-teal-500 mt-4 bg-slate-900 shrink-0 flex items-center justify-center shadow-md relative">
                    {emp.photo ? (
                      <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-slate-400 font-black">{emp.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Personnel information tags */}
                  <div className="mt-5 text-center px-4 w-full flex-1 flex flex-col justify-between pb-4">
                    <div className="space-y-1">
                      <h4 className="font-black text-white text-sm tracking-wide leading-tight truncate uppercase">{emp.name}</h4>
                      <p className="text-[11px] text-sky-450 font-bold tracking-tight uppercase truncate">{emp.jobTitle || 'Staff Member'}</p>
                      <p className="text-[9px] text-slate-400 font-medium truncate">{emp.department || 'Finance Department'}</p>
                    </div>

                    <div className="space-y-2">
                      {/* Barcode representation */}
                      <div className="bg-white/5 py-1 px-3 border border-white/10 rounded-lg flex flex-col items-center gap-0.5">
                        <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase">{emp.employeeId}</span>
                        <div className="flex gap-[1.5px] items-stretch h-3 w-32 justify-center opacity-40">
                          {Array.from({ length: 28 }).map((_, idx) => (
                            <div key={idx} className="bg-white shrink-0" style={{ width: idx % 3 === 0 ? '1.5px' : idx % 5 === 0 ? '3px' : '1px' }} />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-[5px] text-slate-500 leading-tight">AUTHORIZED CO. PROPERTY • IF FOUND PLACE IN MAIL OR RETURN TO SYS_ADMIN</p>
                    </div>

                  </div>
                </div>

                {/* Print button integrations */}
                <div className="mt-5 w-full flex gap-3">
                  <button
                    onClick={downloadIDCardPDF}
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-purple-500/10"
                  >
                    <Download size={14} /> Download PDF Badge
                  </button>
                  <button
                    onClick={() => setIdCardEmployeeId(null)}
                    className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>

              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
