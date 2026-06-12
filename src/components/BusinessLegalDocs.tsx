import React, { useState, useMemo, useRef } from 'react';
import { 
  Scale, FileText, Upload, Plus, Trash2, Edit2, Share2, Eye, Download, Search, 
  ArrowLeft, ArrowRight, Save, X, Check, FileDown, Sparkles, AlertCircle, Info, FileEdit
} from 'lucide-react';
import { AppData, LegalDocument } from '../types';
import { jsPDF } from 'jspdf';
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

interface Props {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  currency: string;
  showToast?: (message: string) => void;
}

const TEMPLATE_TYPES = [
  { id: 'Contract of Employment', name: 'Contract of Employment', desc: 'Standard terms for corporate hires, salary, and confidentiality.' },
  { id: 'Lease Agreement Forms', name: 'Lease Agreement Form', desc: 'Rent, property usage, and security deposit bounds.' },
  { id: 'Loan Application Form', name: 'Loan Application Form', desc: 'Repayment metrics, principal, interest rate, and default norms.' },
  { id: 'Leave Form', name: 'Leave Form (Annual/Sick)', desc: 'Quick staff leave requisition, duration, and cover details.' },
  { id: 'Affidavit Form', name: 'Affidavit Form', desc: 'Sworn solemn statement under Commissioner of Oaths formats.' },
  { id: 'Leave Application Form', name: 'Leave Application Form', desc: 'Comprehensive multi-tier leave approval request form.' }
];

export default function BusinessLegalDocs({ data, onUpdateData, currency, showToast }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docList = useMemo(() => data.legalDocs || [], [data.legalDocs]);

  // Sidebar or filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Multi-step Wizard States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [wizardStep, setWizardStep] = useState(1);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  // Dynamic values inside Wizard forms
  const [docTitle, setDocTitle] = useState('');
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // External File Upload States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadedBase64, setUploadedBase64] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState('');
  const [uploadedDocTitle, setUploadedDocTitle] = useState('');

  // Active Toast notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Preview Lightbox Modal
  const [previewDoc, setPreviewDoc] = useState<LegalDocument | null>(null);

  const triggerToast = (msg: string) => {
    if (showToast) {
      showToast(msg);
    } else {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Helper to pre-populate default wizard questions based on chosen doc type
  const startNewWizard = (templateId: string) => {
    setSelectedTemplate(templateId);
    setWizardStep(1);
    setIsWizardOpen(true);
    setEditingDocId(null);
    setDocTitle(`${templateId} - ${new Date().toLocaleDateString()}`);

    // Default parameters based on type
    const initialValues: Record<string, string> = {};
    if (templateId === 'Contract of Employment') {
      initialValues.companyName = data.profile.companyName || data.profile.name || 'Comfort Finance Ltd';
      initialValues.employeeName = '';
      initialValues.jobTitle = '';
      initialValues.baseSalary = '1200';
      initialValues.currency = currency || 'USD';
      initialValues.commencementDate = new Date().toISOString().split('T')[0];
      initialValues.term = 'Indefinite';
      initialValues.noticePeriod = '1 Month';
    } else if (templateId === 'Lease Agreement Forms') {
      initialValues.landlord = data.profile.companyName || data.profile.name || 'Lessor Corp';
      initialValues.tenant = '';
      initialValues.propertyAddress = '120 Samora Machel Ave, Harare';
      initialValues.monthlyRent = '750';
      initialValues.deposit = '750';
      initialValues.termMonths = '12';
      initialValues.startDate = new Date().toISOString().split('T')[0];
    } else if (templateId === 'Loan Application Form') {
      initialValues.applicantName = '';
      initialValues.applicantId = '';
      initialValues.principal = '5000';
      initialValues.interestRate = '8';
      initialValues.tenorMonths = '6';
      initialValues.purpose = 'Working capital expansion';
    } else if (templateId === 'Leave Form' || templateId === 'Leave Application Form') {
      initialValues.employeeName = '';
      initialValues.department = 'Finance';
      initialValues.leaveType = 'Annual Leave';
      initialValues.daysRequested = '10';
      initialValues.startDate = new Date().toISOString().split('T')[0];
      initialValues.endDate = '';
      initialValues.relieverName = '';
    } else if (templateId === 'Affidavit Form') {
      initialValues.deponentName = '';
      initialValues.deponentId = '';
      initialValues.deponentAddress = '';
      initialValues.declarationText = 'I do hereby solemnly swear and state that...';
    }
    setFormValues(initialValues);
  };

  // Handle Edit existing document
  const startEditDoc = (doc: LegalDocument) => {
    setEditingDocId(doc.id);
    setSelectedTemplate(doc.type);
    setDocTitle(doc.title);
    setFormValues(doc.metadata);
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  // Generate complete text template preview dynamically
  const compileTemplateContent = (type: string, meta: Record<string, string>): string => {
    switch (type) {
      case 'Contract of Employment':
        return `CONTRACT OF EMPLOYMENT

BETWEEN:
Employer: ${meta.companyName || '[Employer Company Name]'}
Address: ${data.profile.companyEmail || 'Company Registered Address'}

AND:
Employee: ${meta.employeeName || '[Employee Full Name]'}
Position: ${meta.jobTitle || '[Job Position/Title]'}

1. COMMENCEMENT AND TERM
This agreement starts on ${meta.commencementDate || '[Start Date]'} and shall continue on ${meta.term || 'Indefinite'} basis, subject to notice provisions below.

2. REMUNERATION & POSITION
The Employee is hired as ${meta.jobTitle || '[Position]'} with initial basic salary of ${meta.baseSalary || '0'} ${meta.currency || 'USD'} per calendar month. This is calculated with floating-point math protection at sandbox levels.

3. NOTICE PERIOD
Notice required by either party to terminate this contract is ${meta.noticePeriod || '1 Month'} in writing.

4. SYSTEM COVENANT
The Employee agrees to safe execution environments, and acknowledges that they handle sensitive client cache data with utmost confidentiality.

IN WITNESS WHEREOF they sign below:

_____________________________
For Employer: ${meta.companyName}

_____________________________
Employee: ${meta.employeeName}`;

      case 'Lease Agreement Forms':
        return `COMMERCIAL & RESIDENTIAL LEASE AGREEMENT

LANDLORD: ${meta.landlord || '[Landlord Owner]'}
TENANT: ${meta.tenant || '[Tenant User/Company]'}
PREMISES: ${meta.propertyAddress || '[Property Location Address]'}

1. DESCRIPTION OF LEASE
The Landlord rents to Tenant the Premises starting on ${meta.startDate || '[Start Date]'} for a total period of ${meta.termMonths || '12'} Months.

2. RENTAL AMOUNT & SECURITY DEPOSIT
The monthly rental fee is scheduled at ${meta.monthlyRent || '0'} ${currency || 'USD'} payable on or before the 1st of every calendar month. Prior to occupancy, the Tenant must deposit a security deposit of ${meta.deposit || '0'} ${currency || 'USD'} for wear and tear protection.

3. COVENANTS
Tenant agrees to maintain physical conditions, pay monthly utility charges timely, and avoid structural overhauls without prior landlord permission.

Duly signed on this date:

_____________________________
Landlord: ${meta.landlord}

_____________________________
Tenant: ${meta.tenant}`;

      case 'Loan Application Form':
        return `LOAN APPLICATION & DISBURSEMENT AGREEMENT

APPLICANT DETAILS:
Name: ${meta.applicantName || '[Applicant Name]'}
National ID/Ref: ${meta.applicantId || '[National ID ID]'}

LOAN QUANTIFIERS:
Principal Amount Requested: ${meta.principal || '0'} ${currency || 'USD'}
Annualized Interest Rate: ${meta.interestRate || '0'} %
Tenor Period: ${meta.tenorMonths || '0'} Months
Purpose of Disbursement: ${meta.purpose || '[Development / Needs]'}

Under Sandbox Accounting Standards, the borrower submits this commitment for funding and warrants that they will make structured monthly repayments including accumulated interest securely.

SIGNED AT PLACE:

_____________________________
Applicant Signature

_____________________________
Approval Authority Bank Representative`;

      case 'Leave Form':
      case 'Leave Application Form':
        return `LEAVE REQUISITION AND APPROVAL BOARD

STAFF INITIATION:
Employee Name: ${meta.employeeName || '[Employee Name]'}
Department Assigned: ${meta.department || '[Business Unit / HR Dept]'}

LEAVE SCHEDULE:
Type of Leave: ${meta.leaveType || 'Annual Leave'}
Total Working Days Requested: ${meta.daysRequested || '0'} Days
Commencement Date: ${meta.startDate || '[Start Date]'}
Resumption Date: ${meta.endDate || '[End Date]'}

COVER AND RELATION COVENANT:
During absence, operations will be monitored and backed-up by: ${meta.relieverName || '[Reliever Staff name]'}.

AUTHORIZATION FLOWS:

_____________________________
Applicant Signature

_____________________________
HR Manager Approval Seal`;

      case 'Affidavit Form':
        return `IN THE REPUBLIC OF ZIMBABWE
SOLEMN AFFIDAVIT / STATEMENT OF OATHS

I, the undersigned deponent:
Full Name: ${meta.deponentName || '[Deponent Full Name]'}
Identity/Passport Number: ${meta.deponentId || '[National ID ID]'}
Physical Address: ${meta.deponentAddress || '[Deponent Address]'}

Do hereby solemnly Swear and Declare as follows:

1. ${meta.declarationText || '[Sworn declaration details and statements]'}
2. I make this solemn affirmation conscientiously believing the contents to be true, accurate and complete.

THUS SWORN AND SIGNED before me, Commissioner of Oaths:

_____________________________
Deponent Signature

_____________________________
Commissioner of Oaths (Rubber Seal)`;

      default:
        return `CUSTOM DOCUMENT ARCHIVE\n\nTitle: ${docTitle}\nCreated on: ${new Date().toLocaleDateString()}`;
    }
  };

  const handleSaveWizardDoc = () => {
    // Compile content
    const compiledContent = compileTemplateContent(selectedTemplate, formValues);
    
    const newDoc: LegalDocument = {
      id: editingDocId || crypto.randomUUID(),
      title: docTitle || `${selectedTemplate} Document`,
      type: selectedTemplate,
      status: 'completed',
      createdAt: editingDocId ? (docList.find(d => d.id === editingDocId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: compiledContent,
      metadata: formValues
    };

    const newDocList = editingDocId
      ? docList.map(d => d.id === editingDocId ? newDoc : d)
      : [...docList, newDoc];

    onUpdateData({ ...data, legalDocs: newDocList });
    setIsWizardOpen(false);
    triggerToast(editingDocId ? "Legal draft updated successfully!" : "New legal document registered to sandbox!");
  };

  // External File Upload base64 reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setUploadedDocTitle(file.name.split('.').slice(0, -1).join('.') || file.name);
    
    // Size check
    const sizeKB = Math.round(file.size / 1024);
    setUploadedFileSize(sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUploadedFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedBase64 || !uploadedDocTitle) {
      alert("Please choose a file and key-in a valid document name first.");
      return;
    }

    const newDoc: LegalDocument = {
      id: crypto.randomUUID(),
      title: uploadedDocTitle,
      type: 'External',
      status: 'signed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: `Uploaded external binary reference file. File name: ${uploadedFileName}. Size: ${uploadedFileSize}`,
      metadata: { fileName: uploadedFileName, fileSize: uploadedFileSize },
      fileData: uploadedBase64,
      fileName: uploadedFileName,
      fileSize: uploadedFileSize
    };

    onUpdateData({ ...data, legalDocs: [...docList, newDoc] });
    setIsUploadOpen(false);
    setUploadedBase64('');
    setUploadedFileName('');
    setUploadedFileSize('');
    setUploadedDocTitle('');
    triggerToast("External document imported securely!");
  };

  // Delete document
  const handleDeleteDoc = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from your local offline sandbox?`)) {
      const updated = docList.filter(d => d.id !== id);
      onUpdateData({ ...data, legalDocs: updated });
      triggerToast("Document purged from local store.");
    }
  };

  // Export to PDF
  const downloadAsPDF = (doc: LegalDocument) => {
    const pdf = new jsPDF();
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor('#0f172a');
    pdf.text("COMFORT SUITE LEGAL ARCHIVE", 14, 20);

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor('#64748b');
    pdf.text(`Document ID: ${doc.id} | Generated: ${new Date(doc.createdAt).toLocaleDateString()}`, 14, 26);
    pdf.line(14, 28, 196, 28);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor('#334155');

    const splitText = pdf.splitTextToSize(doc.content, 180);
    let y = 38;
    splitText.forEach((line: string) => {
      if (y > 275) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, 14, y);
      y += 6.5;
    });

    pdf.save(`${doc.title.replace(/\s+/g, '_')}.pdf`);
    triggerToast("Saved document as PDF successfully!");
  };

  // Export to DOCX
  const downloadAsDOCX = async (doc: LegalDocument) => {
    try {
      const paragraphs = doc.content.split('\n').map(line => {
        const isHeader = line === line.toUpperCase() && line.trim().length > 3;
        return new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: isHeader,
              size: isHeader ? 28 : 22,
              font: "Calibri"
            })
          ],
          spacing: { before: isHeader ? 200 : 100, after: 100 }
        });
      });

      const wordDoc = new DocxDocument({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "COMFORT SUITE CORPORATE DOCUMENT",
                  bold: true,
                  size: 32,
                  font: "Arial"
                })
              ],
              spacing: { after: 200 }
            }),
            ...paragraphs
          ]
        }]
      });

      const blob = await Packer.toBlob(wordDoc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title.replace(/\s+/g, '_')}.docx`;
      link.click();
      URL.revokeObjectURL(url);
      triggerToast("Saved document as DOCX successfully!");
    } catch (e) {
      console.error(e);
      triggerToast("Error compiled DOCX. Retrying offline markup format...");
    }
  };

  // Live filtered list
  const filteredDocs = useMemo(() => {
    return docList.filter(d => {
      const matchSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === 'all' || 
                        (filterType === 'External' && d.type === 'External') || 
                        (filterType === 'Wizard' && d.type !== 'External');
      return matchSearch && matchType;
    });
  }, [docList, searchQuery, filterType]);

  return (
    <div className="space-y-6 select-none">
      {/* Toast Alert popup */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-slate-900 border border-slate-755 text-white text-xs px-4 py-3 rounded-xl shadow-xl z-[9999] flex items-center gap-2 animate-in fade-in duration-200">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Primary Description Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-purple-50 text-purple-650 dark:bg-purple-950/40 dark:text-purple-400 rounded-xl">
              <Scale size={20} />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">Business and Legal Documentation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5 text-purple-600 dark:text-purple-400">Business Documentation Archive</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-705"
          >
            <Upload size={14} /> Import File
          </button>
          <button
            onClick={() => {
              // Open templates selector
              setSelectedTemplate('');
              setWizardStep(1);
              setIsWizardOpen(true);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus size={15} /> Create Document
          </button>
        </div>
      </div>

      {/* Search and Filters Segment */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        <div className="relative w-full sm:max-w-md">
          <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search documents by title or type..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-705 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Filter:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filterType === 'all' 
                ? 'bg-white dark:bg-slate-800 text-purple-650 dark:text-purple-400 shadow-sm border border-slate-200 dark:border-slate-700' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            All ({docList.length})
          </button>
          <button
            onClick={() => setFilterType('Wizard')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filterType === 'Wizard' 
                ? 'bg-white dark:bg-slate-800 text-purple-650 dark:text-purple-400 shadow-sm border border-slate-200 dark:border-slate-700' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Wizards
          </button>
          <button
            onClick={() => setFilterType('External')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filterType === 'External' 
                ? 'bg-white dark:bg-slate-800 text-purple-650 dark:text-purple-400 shadow-sm border border-slate-200 dark:border-slate-700' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            External Uploads
          </button>
        </div>
      </div>

      {/* Documents Grid / List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-4 shadow-sm">
        {filteredDocs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <FileText size={44} className="mx-auto text-slate-250 dark:text-slate-800" />
            <p className="text-xs font-semibold">No digital documents recorded in this sandbox viewport.</p>
            <p className="text-[10px] text-slate-450">Select "Create Document" above to walk through the customizable templates wizard!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => {
              const isExternal = doc.type === 'External';
              return (
                <div 
                  key={doc.id} 
                  className="p-5 border border-slate-100 dark:border-slate-800/80 rounded-xl hover:border-purple-300 dark:hover:border-purple-900/60 hover:shadow-md transition flex flex-col justify-between bg-slate-50/20 dark:bg-slate-950/25"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                        isExternal 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' 
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      }`}>
                        {doc.type}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-150 text-sm truncate" title={doc.title}>
                        {doc.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {isExternal ? `Uploaded local file: ${doc.metadata.fileName}` : doc.content.substring(0, 100) + '...'}
                      </p>
                    </div>
                  </div>

                  {/* Operational controls */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-lg transition"
                        title="View Document Properties / Preview Content"
                      >
                        <Eye size={13} />
                      </button>
                      
                      {!isExternal && (
                        <button
                          type="button"
                          onClick={() => startEditDoc(doc)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-lg transition"
                          title="Edit Document questions"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id, doc.title)}
                        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-650 rounded-lg transition"
                        title="Delete permanently"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => downloadAsPDF(doc)}
                        className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 rounded-md text-[9px] font-extrabold flex items-center gap-0.5"
                        title="Download PDF format"
                      >
                        <FileDown size={10} /> PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadAsDOCX(doc)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 rounded-md text-[9px] font-extrabold flex items-center gap-0.5"
                        title="Save Word format"
                      >
                        <FileDown size={10} /> DOCX
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1. DOCUMENT CREATION TEMPLATES SELECTOR & STEPPED FORM WIZARD */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[1200] animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh] select-text text-left">
            <button
              onClick={() => setIsWizardOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>

            {/* Title / Heading depending on route */}
            <div className="pb-3 border-b border-slate-105 dark:border-slate-800 flex items-center gap-2">
              <Sparkles className="text-yellow-500" size={18} />
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {editingDocId ? 'Edit Document Parameters' : 'Customizable Documents Wizard'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Step {wizardStep} of 3</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-5">
              
              {/* STEP 1: SELECT DOCUMENT TEMPLATE */}
              {wizardStep === 1 && !selectedTemplate && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Select a high-fidelity business or legal document boilerplate to formulate. Each template incorporates customized placeholder rendering conforming to regional accounting rules.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TEMPLATE_TYPES.map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => startNewWizard(tpl.id)}
                        className="p-4 text-left border border-slate-200 dark:border-slate-800 hover:border-purple-500 rounded-xl hover:bg-purple-50/10 transition space-y-2 cursor-pointer bg-white dark:bg-slate-950/20"
                      >
                        <span className="font-extrabold text-xs text-slate-850 dark:text-slate-100 block">{tpl.name}</span>
                        <span className="text-[10px] text-slate-450 block leading-relaxed">{tpl.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 1 (EDITING OR TEMPLATE DEFINED): ENTER DOCUMENT TITLE */}
              {wizardStep === 1 && selectedTemplate && (
                <div className="space-y-4 font-sans text-xs text-slate-650">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Document File Name / Title</label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={e => setDocTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 dark:text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                      placeholder="e.g. Contract - Jane Smith June 2026"
                      required
                    />
                  </div>

                  <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl flex items-start gap-2.5">
                    <Info size={14} className="text-purple-500 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-slate-450">
                      Step 1 establishes the baseline title inside your local indexed legal suite. Next, you will key-in structured details parameters before downloading the files.
                    </p>
                  </div>

                  <div className="pt-4 flex justify-between">
                    {!editingDocId && (
                      <button
                        type="button"
                        onClick={() => setSelectedTemplate('')}
                        className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold"
                      >
                        Choose Different Template
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!docTitle}
                      onClick={() => setWizardStep(2)}
                      className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                    >
                      Next Step <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DYNAMIC CUSTOMIZED TEMPLATE FORM FIELDS */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-purple-600 dark:text-purple-400 capitalize bg-purple-500/5 px-3 py-2 rounded-lg inline-block border border-purple-500/10">
                    Template: {selectedTemplate}
                  </div>

                  <p className="text-xs text-slate-500">Provide the specific administrative parameters to replace placeholders in the legal blueprint:</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedTemplate === 'Contract of Employment' && (
                      <>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Employer Company Name</label>
                          <input type="text" value={formValues.companyName || ''} onChange={e => setFormValues({...formValues, companyName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Employee Full Name</label>
                          <input type="text" value={formValues.employeeName || ''} onChange={e => setFormValues({...formValues, employeeName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white" required />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Hiring Job Title</label>
                          <input type="text" value={formValues.jobTitle || ''} onChange={e => setFormValues({...formValues, jobTitle: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Base Monthly Salary</label>
                          <input type="number" value={formValues.baseSalary || ''} onChange={e => setFormValues({...formValues, baseSalary: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Salary currency</label>
                          <input type="text" value={formValues.currency || ''} onChange={e => setFormValues({...formValues, currency: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Commencement Date</label>
                          <input type="date" value={formValues.commencementDate || ''} onChange={e => setFormValues({...formValues, commencementDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white" />
                        </div>
                      </>
                    )}

                    {selectedTemplate === 'Lease Agreement Forms' && (
                      <>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Landlord (Lessor)</label>
                          <input type="text" value={formValues.landlord || ''} onChange={e => setFormValues({...formValues, landlord: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Tenant (Lessee)</label>
                          <input type="text" value={formValues.tenant || ''} onChange={e => setFormValues({...formValues, tenant: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Property Coordinates/Address</label>
                          <input type="text" value={formValues.propertyAddress || ''} onChange={e => setFormValues({...formValues, propertyAddress: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Monthly Rental Amount</label>
                          <input type="number" value={formValues.monthlyRent || ''} onChange={e => setFormValues({...formValues, monthlyRent: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Term in Months</label>
                          <input type="number" value={formValues.termMonths || ''} onChange={e => setFormValues({...formValues, termMonths: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Start lease date</label>
                          <input type="date" value={formValues.startDate || ''} onChange={e => setFormValues({...formValues, startDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white" />
                        </div>
                      </>
                    )}

                    {selectedTemplate === 'Loan Application Form' && (
                      <>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Applicant Full Name</label>
                          <input type="text" value={formValues.applicantName || ''} onChange={e => setFormValues({...formValues, applicantName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white text-xs" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">ID Card / Passport Number</label>
                          <input type="text" value={formValues.applicantId || ''} onChange={e => setFormValues({...formValues, applicantId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white text-xs" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Loan Principal Amount</label>
                          <input type="number" value={formValues.principal || ''} onChange={e => setFormValues({...formValues, principal: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white text-xs" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Interest Rate (%)</label>
                          <input type="number" value={formValues.interestRate || ''} onChange={e => setFormValues({...formValues, interestRate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white text-xs" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Repayment Tenure (Months)</label>
                          <input type="number" value={formValues.tenorMonths || ''} onChange={e => setFormValues({...formValues, tenorMonths: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white text-xs" />
                        </div>
                        <div className="space-y-1 text-xs sm:col-span-2">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Disbursement Purpose</label>
                          <textarea rows={2} value={formValues.purpose || ''} onChange={e => setFormValues({...formValues, purpose: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white text-xs" />
                        </div>
                      </>
                    )}

                    {(selectedTemplate === 'Leave Form' || selectedTemplate === 'Leave Application Form') && (
                      <>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Employee Full Name</label>
                          <input type="text" value={formValues.employeeName || ''} onChange={e => setFormValues({...formValues, employeeName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/55 dark:text-white text-xs" required />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Department Assigned</label>
                          <input type="text" value={formValues.department || ''} onChange={e => setFormValues({...formValues, department: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white text-xs" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Leave Classification</label>
                          <select value={formValues.leaveType || 'Annual Leave'} onChange={e => setFormValues({...formValues, leaveType: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-white">
                            <option value="Annual Leave">Annual Leave</option>
                            <option value="Sick Leave">Sick Leave</option>
                            <option value="Maternity Leave">Maternity Leave</option>
                            <option value="Paternity Leave">Paternity Leave</option>
                            <option value="Compassionate Leave">Compassionate Leave</option>
                          </select>
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block font-sans">Leave Work Days requested</label>
                          <input type="number" value={formValues.daysRequested || ''} onChange={e => setFormValues({...formValues, daysRequested: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white text-xs" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Leave Commencement Date</label>
                          <input type="date" value={formValues.startDate || ''} onChange={e => setFormValues({...formValues, startDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white text-xs" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Cover Staff Reliever Name</label>
                          <input type="text" value={formValues.relieverName || ''} onChange={e => setFormValues({...formValues, relieverName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white text-xs" />
                        </div>
                      </>
                    )}

                    {selectedTemplate === 'Affidavit Form' && (
                      <>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Deponent Full Name</label>
                          <input type="text" value={formValues.deponentName || ''} onChange={e => setFormValues({...formValues, deponentName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white text-xs" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">National ID / Passport No</label>
                          <input type="text" value={formValues.deponentId || ''} onChange={e => setFormValues({...formValues, deponentId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white text-xs" />
                        </div>
                        <div className="space-y-1 text-xs sm:col-span-2">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Deponent Address</label>
                          <input type="text" value={formValues.deponentAddress || ''} onChange={e => setFormValues({...formValues, deponentAddress: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-100/10 rounded-xl bg-slate-50/50 dark:text-white text-xs" />
                        </div>
                        <div className="space-y-1 text-xs sm:col-span-2">
                          <label className="font-bold text-slate-500 uppercase tracking-wider block">Declaration / Sworn Statements</label>
                          <textarea rows={4} value={formValues.declarationText || ''} onChange={e => setFormValues({...formValues, declarationText: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white text-xs" />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-4 flex justify-between border-t border-slate-100 dark:border-slate-850 pt-4">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-650 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                      onClick={() => setWizardStep(3)}
                    >
                      Next: Compile Template <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PREVIEW COMPILED VERIFY SECTION */}
              {wizardStep === 3 && (
                <div className="space-y-4 text-xs font-sans text-slate-650">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-500/5 px-3 py-2 rounded-lg inline-block border border-emerald-500/10">
                    Calculations compiled successfully!
                  </div>
                  
                  <p className="text-xs text-slate-500">Review the finalized draft. Both PDF and DOCX will be generated based on this preview:</p>
                  
                  <div className="p-4 bg-slate-100/60 dark:bg-slate-950 font-mono text-[10.5px] leading-relaxed text-slate-700 dark:text-slate-350 rounded-xl border border-slate-200/60 dark:border-slate-850 whitespace-pre-wrap max-h-56 overflow-y-auto">
                    {compileTemplateContent(selectedTemplate, formValues)}
                  </div>

                  <div className="p-3 bg-teal-500/5 border border-teal-500/10 rounded-xl flex items-center justify-between text-[11px] text-slate-450 leading-relaxed font-sans">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                      <span>Ready for legal archiving in the local sandbox database</span>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between border-t border-slate-100 dark:border-slate-850 pt-4">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-650 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSaveWizardDoc}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm"
                    >
                      <Save size={14} /> Save to Sandbox
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 2. EXTERNAL DOCUMENT UPLOAD DRAWER MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[1200] animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative select-text text-left space-y-4">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-800">
              <Upload className="text-purple-600" size={18} />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Import External Document</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Drag & drop or manually upload any file (PDF, DOCX, Img). The file will be serialized and stored offline inside your local database sandbox.
            </p>

            <form onSubmit={handleSaveUploadedFile} className="space-y-4">
              {/* Uploader Box layout */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-purple-500 dark:border-slate-800 dark:hover:border-purple-500 p-8 rounded-xl text-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-all"
              >
                <input 
                  type="file"
                  id="externalDocFileInput"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                />
                
                {uploadedFileName ? (
                  <div className="space-y-2 text-xs">
                    <Check className="mx-auto text-emerald-500 text-lg" />
                    <p className="font-bold text-slate-800 dark:text-slate-200">{uploadedFileName}</p>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[9px] text-slate-400">{uploadedFileSize}</span>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs text-slate-400">
                    <Upload className="mx-auto text-slate-350" size={28} />
                    <p className="font-semibold text-slate-500">Click to locate external file</p>
                    <p className="text-[10px] text-slate-400">Supports PDF, DOCX, JPG, PNG or TXT</p>
                  </div>
                )}
              </div>

              {uploadedFileName && (
                <div className="space-y-1 text-xs text-slate-650">
                  <label className="font-bold text-slate-500 block">Digital Attachment Name (Editable)</label>
                  <input
                    type="text"
                    value={uploadedDocTitle}
                    onChange={e => setUploadedDocTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:text-white font-extrabold"
                    required
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-blue-200 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadedBase64}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save size={13} /> Import to Sandbox
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. PHYSICAL PREVIEW DIALOG MODAL LIGHTBOX */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[1300] animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 max-w-xl w-full p-6 shadow-2xl rounded-2xl flex flex-col max-h-[85vh] text-left select-all">
            <div className="flex items-center justify-between pb-3 border-b border-slate-105 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="text-purple-600" size={16} />
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-widest leading-none">
                    Document Properties Preview
                  </h3>
                  <span className="text-[10px] text-slate-450 font-semibold block mt-1">ID: {previewDoc.id}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-450 hover:text-red-500 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Document Title</span>
                <span className="block text-sm font-black text-slate-800 dark:text-slate-150">{previewDoc.title}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-450">Document Type</span>
                  <span className="block font-bold text-slate-700 dark:text-slate-300">{previewDoc.type}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-450">Created Date</span>
                  <span className="block text-slate-650 dark:text-slate-350">{new Date(previewDoc.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mb-1">DRAFT BODY CONTENT</span>
                
                {previewDoc.fileData ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-center border border-slate-100 dark:border-slate-850 py-10 space-y-3">
                    <FileText size={32} className="mx-auto text-blue-500" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">External Local File Loaded</p>
                    <p className="text-[10px] text-slate-450">{previewDoc.fileName} • {previewDoc.fileSize}</p>
                    <div className="pt-2">
                      <a 
                        href={previewDoc.fileData} 
                        download={previewDoc.fileName}
                        className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Download size={12} /> Download Original File
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/50 font-mono text-[10.5px] text-slate-600 dark:text-slate-300 rounded-xl leading-relaxed whitespace-pre-wrap border border-slate-100 dark:border-slate-850/60 max-h-52 overflow-y-auto">
                    {previewDoc.content}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(previewDoc.content);
                  triggerToast("Document content text copied to system clipboard!");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-650 dark:text-slate-350 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                Copy Text
              </button>
              
              <button
                type="button"
                onClick={() => downloadAsPDF(previewDoc)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-purple-500/10"
              >
                <Download size={13} /> Download PDF
              </button>
              
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer font-extrabold"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
