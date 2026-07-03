import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Briefcase, Activity, CheckCircle, Clock, ChevronDown, ChevronUp, Save, BarChart2, Edit2, Share2, Copy, Trash2, DollarSign, Wallet, Search, Filter, Sparkles, Archive } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProjectItem, ProjectStatus, ProjectPriority, ProjectMode, ProjectPhase, AppData, CurrencyType, PersonalTransaction, BusinessTransaction } from '../types';
import { formatCurrency } from '../utils';

interface ProjectManagementSectionProps {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  currency: CurrencyType;
  showToast?: (message: string) => void;
}

export default function ProjectManagementSection({
  data,
  onUpdateData,
  currency,
  showToast
}: ProjectManagementSectionProps) {
  const projects = data.projects || [];
  
  const onAddProject = (p: Omit<ProjectItem, 'id' | 'createdAt'>) => {
    const newProject: ProjectItem = {
      ...p,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    onUpdateData({ ...data, projects: [newProject, ...projects] });
    if (showToast) showToast('Project created successfully');
  };

  const onUpdateProject = (p: ProjectItem) => {
    onUpdateData({
      ...data,
      projects: projects.map(proj => proj.id === p.id ? p : proj)
    });
    if (showToast) showToast('Project updated successfully');
  };

  const onDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      onUpdateData({
        ...data,
        projects: projects.filter(proj => proj.id !== id)
      });
      if (showToast) showToast('Project deleted');
    }
  };
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Planning');
  const [priority, setPriority] = useState<ProjectPriority>('Medium');
  const [totalBudgetRequired, setTotalBudgetRequired] = useState('');
  const [totalBudgetDisbursed, setTotalBudgetDisbursed] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [mode, setMode] = useState<ProjectMode>('Single project');
  const [estimatedIncome, setEstimatedIncome] = useState('');
  const [trackProject, setTrackProject] = useState(false);
  const [reflectInBusiness, setReflectInBusiness] = useState(false);
  const [reflectInPersonal, setReflectInPersonal] = useState(false);
  
  // Phases State
  const [phases, setPhases] = useState<Omit<ProjectPhase, 'id'>[]>([]);

  // Fund Modal State
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundProjectId, setFundProjectId] = useState<string | null>(null);
  const [fundSource, setFundSource] = useState<'personal' | 'business' | 'other'>('personal');
  const [fundAmount, setFundAmount] = useState('');
  const [fundDescription, setFundDescription] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'All'>('All');
  const [showArchived, setShowArchived] = useState(false);

  // Bulk Selection State
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // AI Analysis State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const filteredProjects = projects.filter(p => {
    if (showArchived && !p.isArchived) return false;
    if (!showArchived && p.isArchived) return false;
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && p.priority !== priorityFilter) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const activeProjectsForChart = projects.filter(p => !p.isArchived && p.totalBudgetRequired > 0);
  const chartData = activeProjectsForChart.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    'Required': p.totalBudgetRequired,
    'Disbursed': p.totalBudgetDisbursed || 0
  }));

  const timelineData = (() => {
    const activeNames = activeProjectsForChart.map(p => p.name.toLowerCase());
    
    const projectTxs = [
      ...(data.transactions || []).filter(t => t.type === 'expense' && t.customCategoryName === 'Project Funding' && activeNames.some(name => t.description.toLowerCase().includes(name))),
      ...(data.businessTransactions || []).filter(t => t.type === 'expense' && t.customCategoryName === 'Project Funding' && activeNames.some(name => t.description.toLowerCase().includes(name)))
    ];
    
    if (projectTxs.length === 0) return [];
    
    const grouped = projectTxs.reduce((acc, tx) => {
      acc[tx.date] = (acc[tx.date] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const sortedDates = Object.keys(grouped).sort();
    
    let cumulative = 0;
    return sortedDates.map(date => {
      cumulative += grouped[date];
      return {
        date,
        'Daily Spend': grouped[date],
        'Cumulative': cumulative
      };
    });
  })();

  const runAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/analyze-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: activeProjectsForChart })
      });
      const responseData = await res.json();
      if (responseData.error) throw new Error(responseData.error);
      setAiAnalysis(responseData.analysis);
    } catch (err: any) {
      if (showToast) showToast('AI Analysis failed: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleArchiveProject = (project: ProjectItem) => {
    onUpdateProject({ ...project, isArchived: true, status: 'Completed' });
  };

  const handleUnarchiveProject = (project: ProjectItem) => {
    onUpdateProject({ ...project, isArchived: false });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    if (!confirm(`Delete ${selectedIds.length} projects?`)) return;
    let updatedData = { ...data };
    updatedData.projects = projects.filter(p => !selectedIds.includes(p.id));
    onUpdateData(updatedData);
    setSelectedIds([]);
    setBulkMode(false);
    if (showToast) showToast('Projects deleted');
  };

  const handleBulkExport = () => {
    const selected = projects.filter(p => selectedIds.includes(p.id));
    const csv = 'Name,Status,Priority,Required,Disbursed\n' + 
      selected.map(p => `${p.name},${p.status},${p.priority || 'Medium'},${p.totalBudgetRequired},${p.totalBudgetDisbursed}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects_export.csv';
    a.click();
    URL.revokeObjectURL(url);
    setSelectedIds([]);
    setBulkMode(false);
  };

  const handleBulkStatus = (newStatus: ProjectStatus) => {
    let updatedData = { ...data };
    updatedData.projects = projects.map(p => 
      selectedIds.includes(p.id) ? { ...p, status: newStatus } : p
    );
    onUpdateData(updatedData);
    setSelectedIds([]);
    setBulkMode(false);
    if (showToast) showToast(`Projects updated to ${newStatus}`);
  };

  const handleAddPhase = () => {
    setPhases([...phases, { name: '', budgetRequired: 0, budgetDisbursed: 0, status: 'Planning' }]);
  };

  const updatePhase = (index: number, key: keyof ProjectPhase, value: any) => {
    const updatedPhases = [...phases];
    updatedPhases[index] = { ...updatedPhases[index], [key]: value };
    setPhases(updatedPhases);
  };

  const removePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setName('');
    setType('');
    setStatus('Planning');
    setPriority('Medium');
    setTotalBudgetRequired('');
    setTotalBudgetDisbursed('');
    setStartDate('');
    setTargetEndDate('');
    setMode('Single project');
    setEstimatedIncome('');
    setTrackProject(false);
    setReflectInBusiness(false);
    setReflectInPersonal(false);
    setPhases([]);
    setShowAddForm(false);
    setEditingProjectId(null);
  };

  const handleEditProject = (project: ProjectItem) => {
    setName(project.name);
    setType(project.type);
    setStatus(project.status);
    setPriority(project.priority || 'Medium');
    setTotalBudgetRequired(project.totalBudgetRequired ? project.totalBudgetRequired.toString() : '');
    setTotalBudgetDisbursed(project.totalBudgetDisbursed ? project.totalBudgetDisbursed.toString() : '');
    setStartDate(project.startDate || '');
    setTargetEndDate(project.targetEndDate || '');
    setMode(project.mode || 'Single project');
    setEstimatedIncome(project.estimatedIncome ? project.estimatedIncome.toString() : '');
    setTrackProject(project.trackProject || false);
    setReflectInBusiness(project.reflectInBusiness || false);
    setReflectInPersonal(project.reflectInPersonal || false);
    setPhases(project.phases || []);
    setEditingProjectId(project.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyProject = (project: ProjectItem) => {
    const copiedProject = {
      ...project,
      name: `${project.name} (Copy)`
    };
    onAddProject(copiedProject);
  };

  const handleShareProject = async (project: ProjectItem) => {
    const shareText = `Project: ${project.name}\nStatus: ${project.status}\nType: ${project.type}\nBudget Required: ${formatCurrency(project.totalBudgetRequired || 0, currency)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: project.name,
          text: shareText
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        if (showToast) showToast('Project details copied to clipboard');
      }
    } catch (err) {
      console.log('Error sharing', err);
    }
  };

  const handleOpenFundModal = (projectId: string) => {
    setFundProjectId(projectId);
    setFundSource('personal');
    setFundAmount('');
    setFundDescription('');
    setFundModalOpen(true);
  };

  const handleFundProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundProjectId || !fundAmount || isNaN(Number(fundAmount)) || Number(fundAmount) <= 0) return;
    
    const amountNum = Number(fundAmount);
    const project = projects.find(p => p.id === fundProjectId);
    if (!project) return;

    let updatedData = { ...data };

    if (fundSource === 'personal') {
      const newTx: PersonalTransaction = {
        id: `tx-${Date.now()}`,
        type: 'expense',
        amount: amountNum,
        date: new Date().toISOString().split('T')[0],
        category: 'other',
        description: `Funded project: ${project.name}`,
        createdAt: new Date().toISOString()
      };
      updatedData.transactions = [newTx, ...(updatedData.transactions || [])];
    } else if (fundSource === 'business') {
      const newTx: BusinessTransaction = {
        id: `tx-${Date.now()}`,
        type: 'expense',
        amount: amountNum,
        date: new Date().toISOString().split('T')[0],
        category: 'other',
        customCategoryName: 'Project Funding',
        description: `Funded project: ${project.name}`,
        createdAt: new Date().toISOString()
      };
      updatedData.businessTransactions = [newTx, ...(updatedData.businessTransactions || [])];
    }
    
    // Update project budget disbursed
    const updatedProjects = projects.map(p => {
      if (p.id === fundProjectId) {
        return {
          ...p,
          totalBudgetDisbursed: (p.totalBudgetDisbursed || 0) + amountNum
        };
      }
      return p;
    });

    updatedData.projects = updatedProjects;
    onUpdateData(updatedData);
    if (showToast) showToast(`Successfully funded project with ${formatCurrency(amountNum, currency)}`);
    setFundModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProjectId) {
      const projectToUpdate = projects.find(p => p.id === editingProjectId);
      if (projectToUpdate) {
        onUpdateProject({
          ...projectToUpdate,
          name,
          type: type || 'General',
          status,
          priority,
          totalBudgetRequired: Number(totalBudgetRequired) || 0,
          totalBudgetDisbursed: Number(totalBudgetDisbursed) || 0,
          startDate,
          targetEndDate,
          mode,
          estimatedIncome: Number(estimatedIncome) || 0,
          trackProject,
          reflectInBusiness,
          reflectInPersonal,
          phases: mode === 'Phased Project' ? phases.map(p => ({ ...p, id: (p as any).id || Date.now().toString() + Math.random() })) : []
        });
      }
    } else {
      onAddProject({
        name,
        type: type || 'General',
        status,
        priority,
        totalBudgetRequired: Number(totalBudgetRequired) || 0,
        totalBudgetDisbursed: Number(totalBudgetDisbursed) || 0,
        startDate,
        targetEndDate,
        mode,
        estimatedIncome: Number(estimatedIncome) || 0,
        trackProject,
        reflectInBusiness,
        reflectInPersonal,
        phases: mode === 'Phased Project' ? phases.map(p => ({ ...p, id: Date.now().toString() + Math.random() })) : []
      });
    }
    
    resetForm();
  };

  const statusColors = {
    'Planning': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'In Progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'On Hold': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };

  const priorityColors = {
    'High': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'Medium': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Low': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Briefcase className="text-indigo-400" size={24} />
            Project Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">Create, track, and manage all operational projects</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition duration-200 ${
            showAddForm 
              ? 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
          }`}
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? 'Cancel' : 'New Project'}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Website Development"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project Type</label>
                    <input
                      type="text"
                      value={type}
                      onChange={e => setType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Tech, Construction"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as ProjectStatus)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value as ProjectPriority)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target End Date</label>
                    <input
                      type="date"
                      value={targetEndDate}
                      onChange={e => setTargetEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Financials & Mode */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Budget Required</label>
                    <input
                      type="number"
                      value={totalBudgetRequired}
                      onChange={e => setTotalBudgetRequired(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Budget Disbursed</label>
                    <input
                      type="number"
                      value={totalBudgetDisbursed}
                      onChange={e => setTotalBudgetDisbursed(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estimated Income</label>
                    <input
                      type="number"
                      value={estimatedIncome}
                      onChange={e => setEstimatedIncome(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project Mode</label>
                    <select
                      value={mode}
                      onChange={e => setMode(e.target.value as ProjectMode)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Single project">Single project</option>
                      <option value="Phased Project">Phased Project</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={trackProject}
                      onChange={e => setTrackProject(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">Track Project Metrics</span>
                      <span className="text-[10px] text-slate-400">Show tracking matrix for this project</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={reflectInBusiness}
                      onChange={e => setReflectInBusiness(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">Reflect in Business</span>
                      <span className="text-[10px] text-slate-400">Count this project in Business dashboard</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={reflectInPersonal}
                      onChange={e => setReflectInPersonal(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">Reflect in Personal</span>
                      <span className="text-[10px] text-slate-400">Count this project in Personal dashboard</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Phased Project details */}
            {mode === 'Phased Project' && (
              <div className="mt-6 border-t border-slate-800 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Project Phases</h3>
                  <button
                    type="button"
                    onClick={handleAddPhase}
                    className="px-3 py-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Phase
                  </button>
                </div>
                
                {phases.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4 bg-slate-950 rounded-xl border border-dashed border-slate-800">
                    No phases added yet. Click 'Add Phase' to create one.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {phases.map((phase, idx) => (
                      <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row gap-4 relative">
                        <button
                          type="button"
                          onClick={() => removePhase(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition"
                        >
                          <X size={12} />
                        </button>
                        
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            placeholder="Phase Name"
                            value={phase.name}
                            onChange={e => updatePhase(idx, 'name', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 outline-none"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              placeholder="Budget Required"
                              value={phase.budgetRequired || ''}
                              onChange={e => updatePhase(idx, 'budgetRequired', Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 outline-none"
                            />
                            <input
                              type="number"
                              placeholder="Budget Disbursed"
                              value={phase.budgetDisbursed || ''}
                              onChange={e => updatePhase(idx, 'budgetDisbursed', Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-3">
                           <select
                            value={phase.status}
                            onChange={e => updatePhase(idx, 'status', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 outline-none"
                          >
                            <option value="Planning">Planning</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                          </select>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="date"
                              title="Start Date"
                              value={phase.startDate || ''}
                              onChange={e => updatePhase(idx, 'startDate', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                            />
                            <input
                              type="date"
                              title="Target End Date"
                              value={phase.endDate || ''}
                              onChange={e => updatePhase(idx, 'endDate', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 transition duration-200 flex items-center gap-2"
              >
                <Save size={16} /> Save Project
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Analytics & Search Section */}
      {!showAddForm && projects.length > 0 && (
        <div className="space-y-6 mb-6">
          {/* AI Analysis and Recharts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <BarChart2 size={16} className="text-indigo-400" /> 
                  Project Budgets Overview
                </h3>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#f1f5f9' }}
                      formatter={(value: number) => formatCurrency(value, currency)}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="Required" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Disbursed" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" /> 
                  AI Project Assessment
                </h3>
                <button
                  onClick={runAIAnalysis}
                  disabled={aiLoading || activeProjectsForChart.length === 0}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700"
                >
                  {aiLoading ? (
                    <><span className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> Analyzing...</>
                  ) : (
                    <>Run Analysis</>
                  )}
                </button>
              </div>
              
              <div className="flex-1 bg-slate-950 border border-slate-800/60 rounded-xl p-4 overflow-y-auto min-h-[120px]">
                {aiAnalysis ? (
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br/>') }} />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                    {activeProjectsForChart.length > 0 ? "Click 'Run Analysis' to get AI recommendations, tool suggestions, and estimated timelines for your active projects." : "No active projects to analyze."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Project Activity Timeline */}
          {timelineData.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Activity size={16} className="text-emerald-400" /> 
                  Project Activity Timeline
                </h3>
                <p className="text-xs text-slate-500">Cumulative funding velocity over time</p>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#f1f5f9' }}
                      formatter={(value: number) => formatCurrency(value, currency)}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="Cumulative" stroke="#10b981" strokeWidth={3} dot={{ fill: '#0f172a', stroke: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Daily Spend" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#0f172a', stroke: '#6366f1', strokeWidth: 2, r: 3 }} opacity={0.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-64 shrink-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {bulkMode && selectedIds.length > 0 && (
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-xs font-bold text-slate-300">{selectedIds.length} Selected</span>
                  <button onClick={handleBulkDelete} className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20" title="Bulk Delete">
                    <Trash2 size={14} />
                  </button>
                  <button onClick={handleBulkExport} className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20" title="Export Selection">
                    <Share2 size={14} />
                  </button>
                  <select 
                    onChange={e => {
                      if (e.target.value) handleBulkStatus(e.target.value as ProjectStatus);
                      e.target.value = '';
                    }}
                    className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Update Status...</option>
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              )}
              
              <button
                onClick={() => {
                  setBulkMode(!bulkMode);
                  if (bulkMode) setSelectedIds([]);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-2 ${
                  bulkMode 
                    ? 'bg-indigo-500 text-white border-indigo-500' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <CheckCircle size={14} />
                Bulk Select
              </button>

              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-2 ${
                  showArchived 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Archive size={14} />
                {showArchived ? 'Showing Archived' : 'Show Archived'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => {
          const isPhased = project.mode === 'Phased Project';
          const progress = project.totalBudgetRequired > 0 
            ? Math.min(100, Math.round((project.totalBudgetDisbursed / project.totalBudgetRequired) * 100))
            : 0;

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={project.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {bulkMode && (
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(project.id)}
                        onChange={() => toggleSelection(project.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                      />
                    )}
                    <h3 className="font-extrabold text-white text-lg">{project.name}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${statusColors[project.status]}`}>
                      {project.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${project.priority ? priorityColors[project.priority] : priorityColors['Medium']}`}>
                      {project.priority || 'Medium'} Priority
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><Briefcase size={12} /> {project.type}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {project.startDate || 'No Start'} - {project.targetEndDate || 'No End'}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleShareProject(project)}
                    className="p-2 text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-400 rounded-lg transition"
                    title="Share Project"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={() => handleCopyProject(project)}
                    className="p-2 text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-400 rounded-lg transition"
                    title="Duplicate Project"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handleEditProject(project)}
                    className="p-2 text-slate-500 hover:bg-amber-500/10 hover:text-amber-400 rounded-lg transition"
                    title="Edit Project"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteProject(project.id)}
                    className="p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition"
                    title="Delete Project"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Fund the project button & Archive buttons */}
              <div className="mb-4 space-y-2">
                {!project.isArchived && (
                  <button
                    onClick={() => handleOpenFundModal(project.id)}
                    className="w-full py-2 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <DollarSign size={14} /> Fund Project
                  </button>
                )}
                {project.status === 'Completed' && !project.isArchived && (
                  <button
                    onClick={() => handleArchiveProject(project)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Archive size={14} /> Archive Project
                  </button>
                )}
                {project.isArchived && (
                  <button
                    onClick={() => handleUnarchiveProject(project)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Archive size={14} /> Restore to Active
                  </button>
                )}
              </div>

              {/* Matrix if tracked */}
              {project.trackProject && (
                <div className="mb-6 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-3 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Activity size={14} /> Tracking Matrix
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Req. Budget</div>
                      <div className="text-sm font-bold text-slate-200">{formatCurrency(project.totalBudgetRequired, currency)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Disbursed</div>
                      <div className="text-sm font-bold text-teal-400">{formatCurrency(project.totalBudgetDisbursed, currency)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Est. Income</div>
                      <div className="text-sm font-bold text-emerald-400">{formatCurrency(project.estimatedIncome, currency)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Funded %</div>
                      <div className="text-sm font-bold text-white">{progress}%</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 rounded-full" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
              )}

              {/* Status Update Quick Select */}
              <div className="flex flex-wrap items-center gap-3 mb-4 text-xs font-semibold">
                <span className="text-slate-400">Quick Status:</span>
                {(['Planning', 'In Progress', 'Completed', 'On Hold'] as ProjectStatus[]).map(st => (
                  <button
                    key={st}
                    onClick={() => onUpdateProject({ ...project, status: st })}
                    className={`px-2 py-1 rounded border transition ${
                      project.status === st 
                        ? statusColors[st]
                        : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Phases */}
              {isPhased && project.phases && project.phases.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                    <BarChart2 size={14} className="text-slate-500" /> 
                    Project Phases
                  </h4>
                  <div className="space-y-2">
                    {project.phases.map(phase => (
                      <div key={phase.id} className="flex flex-wrap items-center justify-between p-2.5 bg-slate-950 border border-slate-800/60 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            phase.status === 'Completed' ? 'bg-emerald-500' :
                            phase.status === 'In Progress' ? 'bg-amber-500' :
                            phase.status === 'On Hold' ? 'bg-slate-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-xs font-semibold text-slate-200">{phase.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-3">
                          <span>{formatCurrency(phase.budgetDisbursed, currency)} / {formatCurrency(phase.budgetRequired, currency)}</span>
                          <span className="uppercase tracking-wider px-1.5 py-0.5 bg-slate-900 rounded">{phase.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {projects.length === 0 && !showAddForm && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Briefcase size={28} className="text-slate-500" />
            </div>
            <h3 className="text-slate-300 font-bold mb-2">No projects running</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm mb-6">Create a project to track budgets, phases, and resources all in one place.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition flex items-center gap-2"
            >
              <Plus size={16} /> New Project
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {fundModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setFundModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
                  <Wallet size={24} />
                </div>
                <h3 className="text-xl font-extrabold text-white">Fund Project</h3>
                <p className="text-xs text-slate-400 mt-1">Select the source of funds to increase the disbursed budget</p>
              </div>

              <form onSubmit={handleFundProject} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Funding Source</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFundSource('personal')}
                      className={`p-2 text-xs font-bold rounded-xl border transition ${
                        fundSource === 'personal' 
                          ? 'bg-teal-500/10 border-teal-500 text-teal-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Personal Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setFundSource('business')}
                      className={`p-2 text-xs font-bold rounded-xl border transition ${
                        fundSource === 'business' 
                          ? 'bg-green-500/10 border-green-500 text-green-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Business Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setFundSource('other')}
                      className={`p-2 text-xs font-bold rounded-xl border transition ${
                        fundSource === 'other' 
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Other Source
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Amount ({currency})</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={fundAmount}
                      onChange={e => setFundAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                {fundSource === 'other' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description (Other Source)</label>
                    <input
                      required
                      type="text"
                      value={fundDescription}
                      onChange={e => setFundDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Angel Investor, Loan..."
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 transition duration-200"
                  >
                    Confirm Funding
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
