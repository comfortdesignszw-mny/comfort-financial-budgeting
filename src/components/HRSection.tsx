import React, { useState } from 'react';
import { 
  Users, UserPlus, Briefcase, Calendar, Phone, Mail, MapPin, 
  Edit2, Trash2, Download, Receipt, Plus, FileText, Share2, FileDown, Eye
} from 'lucide-react';
import { AppData, HREmployee, HRPayroll, CurrencyType } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { jsPDF } from 'jspdf';

interface Props {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  currency: CurrencyType;
}

export default function HRSection({ data, onUpdateData, currency }: Props) {
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
  const [empPhone, setEmpPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empAddress, setEmpAddress] = useState('');

  // Payroll Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payEditId, setPayEditId] = useState<string | null>(null);
  
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
      createdAt: new Date().toISOString()
    };

    const newEmployees = empEditId
      ? employees.map(x => x.id === empEditId ? emp : x)
      : [...employees, emp];

    onUpdateData({ ...data, hrEmployees: newEmployees });
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
    
    currentY += 15;
    pdf.setFontSize(14);
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
      createdAt: new Date().toISOString()
    };

    const newPayrolls = payEditId
      ? payrolls.map(x => x.id === payEditId ? pay : x)
      : [...payrolls, pay];

    onUpdateData({ ...data, hrPayrolls: newPayrolls });
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
    if (confirm('Delete this payslip record?')) {
      onUpdateData({ ...data, hrPayrolls: payrolls.filter(p => p.id !== id) });
    }
  };

  // PDF Export
  const generatePayslipPDF = async (pay: HRPayroll, action: 'download' | 'share' | 'view') => {
    const emp = employees.find(e => e.id === pay.employeeId);
    if (!emp) return;

    const pdf = new jsPDF();
    let currentY = 20;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor('#4f46e5');
    pdf.text('PAYSLIP', 14, currentY);
    
    currentY += 15;
    pdf.setFontSize(12);
    pdf.setTextColor('#1e293b');
    pdf.text(`${data.profile.companyName || 'Our Company'}`, 14, currentY);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl leading-tight font-extrabold text-slate-900 dark:text-white font-sans flex items-center gap-2">
          <Briefcase className="text-purple-600 dark:text-purple-400" />
          Human Resources Management
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
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Registered Employees</h4>
            <button 
              onClick={() => { resetEmpForm(); setIsEmpModalOpen(true); }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <UserPlus size={16} /> Add Employee
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {employees.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Users className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={48} />
                <p>No employees registered yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
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
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{e.name}</td>
                        <td className="px-4 py-3">
                          <span className="block font-mono text-xs text-purple-600 dark:text-purple-400">{e.employeeId}</span>
                          <span className="block text-xs text-slate-500">{e.jobTitle} • {e.department}</span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div className="flex flex-col gap-1 text-slate-500">
                            {e.phone && <span className="flex items-center gap-1"><Phone size={10} /> {e.phone}</span>}
                            {e.email && <span className="flex items-center gap-1"><Mail size={10} /> {e.email}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(e.dateHired)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setViewEmpId(e.id)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-md transition" title="View Profile">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => downloadEmployeeProfile(e, 'download')} className="p-1.5 text-slate-400 hover:text-green-500 rounded-md transition" title="Download Profile">
                              <Download size={16} />
                            </button>
                            <button onClick={() => openEditEmployee(e)} className="p-1.5 text-slate-400 hover:text-purple-500 rounded-md transition" title="Edit Employee">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteEmployee(e.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition" title="Delete Employee">
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

      {/* Payroll Module */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Payroll Records</h4>
            <button 
              onClick={() => { resetPayForm(); setIsPayModalOpen(true); }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm relative overflow-hidden group"
            >
              <div className="absolute inset-0 w-8 h-full bg-white/20 skew-x-[-20deg] -translate-x-12 group-hover:animate-[shimmer_1.5s_infinite]" />
              <Receipt size={16} /> Process Payslip
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {payrolls.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FileText className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={48} />
                <p>No payroll records processed yet.</p>
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
                    {payrolls.map(p => {
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
                <div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{emp.name}</h4>
                  <p className="text-sm font-mono text-blue-600 dark:text-blue-400 font-bold">{emp.employeeId}</p>
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
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <MapPin size={14} className="text-slate-400" /> {emp.address || 'No address recorded'}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => downloadEmployeeProfile(emp, 'download')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2">
                    <Download size={14} /> Download PDF
                  </button>
                  <button type="button" onClick={() => setViewEmpId(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-xs font-bold transition">
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
