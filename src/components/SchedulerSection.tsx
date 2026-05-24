import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, 
  Share2, Download, X, Link2, Check, CheckCircle2, FileText, 
  Sparkles, Clock, Copy, BookOpen, AlertCircle, Save, Info,
  Bold, Italic, Heading1, Heading2, Heading3, List, ListTodo, Quote, Smile
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { AppData, FinancialNote, ScheduleEvent, EventCategoryType } from '../types';

interface SchedulerSectionProps {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  currency: string;
}

export default function SchedulerSection({ data, onUpdateData, currency }: SchedulerSectionProps) {
  // Tabs within this workspace room
  const [activeTab, setActiveTab] = useState<'notes' | 'scheduler'>('notes');

  // Load safe lists
  const notesList = useMemo(() => data.notes || [], [data.notes]);
  const eventsList = useMemo(() => data.events || [], [data.events]);

  // Active Selected Note for Editor
  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    return notesList.length > 0 ? notesList[0].id : '';
  });
  
  const activeNote = useMemo(() => {
    return notesList.find(n => n.id === activeNoteId) || null;
  }, [notesList, activeNoteId]);

  // Note editor local drafting states to prevent lagging renders
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteFontFamily, setNoteFontFamily] = useState<string>('sans');
  const [noteFontSize, setNoteFontSize] = useState<string>('base');
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Elegant design dictionaries for text customizers to fulfill "professional note taking"
  const fontFamilies = useMemo(() => ({
    sans: { name: 'Sans-Serif (Default)', class: 'font-sans', style: '"Inter", system-ui, sans-serif' },
    serif: { name: 'Editorial Serif', class: 'font-serif', style: '"Playfair Display", Georgia, serif' },
    mono: { name: 'Technical Code', class: 'font-mono', style: '"JetBrains Mono", Fira Code, monospace' },
    handwritten: { name: 'Creative Note', class: 'font-sans tracking-wide italic leading-relaxed', style: '"Comic Sans MS", cursive, sans-serif' },
    modern: { name: 'Swiss Bold', class: 'font-sans tracking-tight font-medium', style: '"Space Grotesk", sans-serif' }
  }), []);

  const fontSizes = useMemo(() => ({
    xs: { name: 'Compact (11px)', class: 'text-[11px]', val: '11.5px' },
    base: { name: 'Regular (13px)', class: 'text-[13px]', val: '13.5px' },
    lg: { name: 'Comfortable (15px)', class: 'text-[15px]', val: '15.5px' },
    xl: { name: 'Cozy Focus (17px)', class: 'text-[17px]', val: '17.5px' },
    '2xl': { name: 'Headline (19px)', class: 'text-[19px]', val: '19.5px' }
  }), []);

  // Selection-aware text formatting insertions utility at target caret positioning index
  const insertTextAtCursor = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = before + (selectedText || after ? selectedText : '') + (after && !selectedText ? '' : after === before ? after : after);
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    
    setNoteContent(newContent);
    handleUpdateNoteContent(noteTitle, newContent);
    
    // Set focus and selection back
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + (selectedText ? selectedText.length : 0);
      textarea.setSelectionRange(newCursorPos, newCursorPos + (selectedText ? 0 : after.length));
    }, 50);
  };

  // Sync editor with active note select
  useEffect(() => {
    if (activeNote) {
      setNoteTitle(activeNote.title);
      setNoteContent(activeNote.content);
      setNoteFontFamily(activeNote.fontFamily || 'sans');
      setNoteFontSize(activeNote.fontSize || 'base');
    } else {
      setNoteTitle('');
      setNoteContent('');
      setNoteFontFamily('sans');
      setNoteFontSize('base');
    }
  }, [activeNoteId, activeNote]);

  // Calendar States
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Shared payload specification carrying optional attached memo notes texts directly
  interface SharedPayload {
    title: string;
    date: string;
    time: string;
    category: EventCategoryType;
    description: string;
    linkedNoteId?: string;
    linkedNoteTitle?: string;
    linkedNoteContent?: string;
  }

  // Share Modal / Overlay Info states
  const [importedEvent, setImportedEvent] = useState<SharedPayload | null>(null);
  const [clipboardCopied, setClipboardCopied] = useState(false);
  const [sharedLinkText, setSharedLinkText] = useState('');

  // Form states for creating calendar event
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('12:00');
  const [eventCategory, setEventCategory] = useState<EventCategoryType>('General Reminder');
  const [eventDesc, setEventDesc] = useState('');
  const [eventLinkedNoteId, setEventLinkedNoteId] = useState('');

  // Premium interactive notification banner state
  const [localFeedback, setLocalFeedback] = useState<{
    msg: string;
    type: 'success' | 'info';
  } | null>(null);

  const triggerFeedback = (msg: string, type: 'success' | 'info' = 'success') => {
    setLocalFeedback({ msg, type });
    setTimeout(() => setLocalFeedback(null), 3500);
  };

  // URL Deep Link parser for incoming Shared Schedules on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedData = params.get('share_event');
      if (sharedData) {
        // Decode base64 safely
        const decodedString = decodeURIComponent(escape(atob(sharedData)));
        const parsedEvent: SharedPayload = JSON.parse(decodedString);
        if (parsedEvent && parsedEvent.title && parsedEvent.category) {
          setImportedEvent(parsedEvent);
          // Clean URL parameter so it doesn't trigger on future refreshes
          const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.pushState({ path: newUrl }, '', newUrl);
        }
      }
    } catch (e) {
      console.warn('[Social Share Link Parser] Could not deserialize parameters:', e);
    }
  }, []);

  // Update AppData helper
  const handleUpdateNotesAndEvents = (updatedNotes: FinancialNote[], updatedEvents: ScheduleEvent[]) => {
    onUpdateData({
      ...data,
      notes: updatedNotes,
      events: updatedEvents
    });
  };

  // --- Financial Notetaker Actions ---
  const handleCreateNote = () => {
    setActiveNoteId('');
    setNoteTitle('');
    setNoteContent('');
    setNoteFontFamily('sans');
    setNoteFontSize('base');
    setEditorMode('edit');
    triggerFeedback('Note taker ready for a fresh memo!', 'success');
  };

  const handleUpdateNoteContent = (
    updatedTitle: string, 
    updatedContent: string, 
    updatedFontFamily?: string, 
    updatedFontSize?: string
  ) => {
    if (!activeNoteId) return;
    const ff = updatedFontFamily !== undefined ? updatedFontFamily : noteFontFamily;
    const fs = updatedFontSize !== undefined ? updatedFontSize : noteFontSize;
    const newNotes = notesList.map(n => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          title: updatedTitle,
          content: updatedContent,
          fontFamily: ff,
          fontSize: fs,
          updatedAt: new Date().toISOString()
        };
      }
      return n;
    });
    handleUpdateNotesAndEvents(newNotes, eventsList);
  };

  const handleExplicitSave = () => {
    const titleToSave = noteTitle.trim() || 'Untitled Memo';
    const contentToSave = noteContent.trim() || '';

    if (!activeNoteId) {
      // Create a brand new note inside Local Storage database sandbox
      const newNoteId = 'note-' + Date.now();
      const newNote: FinancialNote = {
        id: newNoteId,
        title: titleToSave,
        content: contentToSave,
        fontFamily: noteFontFamily,
        fontSize: noteFontSize,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        color: getRandomNoteColor()
      };
      const newNotes = [newNote, ...notesList];
      handleUpdateNotesAndEvents(newNotes, eventsList);
      
      // Make the note taker ready for next new note immediately (clear heading and inputs)
      setNoteTitle('');
      setNoteContent('');
      setNoteFontFamily('sans');
      setNoteFontSize('base');
      setActiveNoteId('');
      setEditorMode('edit');
      triggerFeedback('Memo saved securely to local storage sandbox!', 'success');
    } else {
      // Save changes to existing note
      const newNotes = notesList.map(n => {
        if (n.id === activeNoteId) {
          return {
            ...n,
            title: titleToSave,
            content: contentToSave,
            fontFamily: noteFontFamily,
            fontSize: noteFontSize,
            updatedAt: new Date().toISOString()
          };
        }
        return n;
      });
      handleUpdateNotesAndEvents(newNotes, eventsList);
      
      // Clear inputs to make note taker ready to take new notes
      setNoteTitle('');
      setNoteContent('');
      setNoteFontFamily('sans');
      setNoteFontSize('base');
      setActiveNoteId('');
      setEditorMode('edit');
      triggerFeedback('Memo saved securely to local storage sandbox!', 'success');
    }
  };

  const handleDeleteNote = (id: string) => {
    const freshNotes = notesList.filter(n => n.id !== id);
    // Unlink note from scheduled events
    const freshEvents = eventsList.map(ev => {
      if (ev.linkedNoteId === id) {
        return { ...ev, linkedNoteId: undefined };
      }
      return ev;
    });
    
    handleUpdateNotesAndEvents(freshNotes, freshEvents);
    if (activeNoteId === id) {
      setActiveNoteId(freshNotes.length > 0 ? freshNotes[0].id : '');
    }
    triggerFeedback('Memo draft permanently deleted', 'info');
  };

  const getRandomNoteColor = () => {
    const colors = [
      'bg-teal-500/5 dark:bg-teal-500/10 border-teal-500/20',
      'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20',
      'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/20',
      'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20',
      'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // --- File Exporter Compilations ---
  const exportAsTxt = (note: FinancialNote) => {
    try {
      const blob = new Blob([`${note.title}\n======================\nLast Edited: ${new Date(note.updatedAt).toLocaleDateString()}\n\n${note.content}`], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${note.title.toLowerCase().replace(/\s+/g, '_')}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      triggerFeedback('Plain Text exported successfully!');
    } catch (err) {
      console.error(err);
      triggerFeedback('Failed to compile txt', 'info');
    }
  };

  const exportAsPdf = (note: FinancialNote) => {
    try {
      const doc = new jsPDF();
      
      // Theme colors matching comfort branding
      doc.setFillColor(13, 148, 136); // Teal header band
      doc.rect(0, 0, 210, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('COMFORT FINANCIAL NOTE', 14, 22);
      
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`File Ref: ${note.id}`, 14, 45);
      doc.text(`Last Modified: ${new Date(note.updatedAt).toLocaleString()}`, 14, 50);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 54, 196, 54);
      
      // Memo Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text(note.title, 14, 65);
      
      // Render body lines
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      
      const splitText = doc.splitTextToSize(note.content, 180);
      let yCoord = 75;
      
      splitText.forEach((line: string) => {
        if (yCoord > 275) {
          doc.addPage();
          yCoord = 20;
        }
        doc.text(line, 14, yCoord);
        yCoord += 6.5;
      });
      
      // Footer watermark
      doc.setFont('helvetica', 'oblique');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('Comfort Budgeting Suite — Saved Securely in Local Client Sandbox', 14, 287);
      
      doc.save(`${note.title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
      triggerFeedback('PDF Report generated and downloaded!');
    } catch (err) {
      console.error('[PDF Export Error]', err);
      triggerFeedback('Failed to assemble PDF', 'info');
    }
  };

  const exportAsDocx = async (note: FinancialNote) => {
    try {
      const paragraphs = [
        new Paragraph({
          text: 'Comfort Budgeting System',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: note.title,
          heading: HeadingLevel.TITLE,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Last Synchronized: ', bold: true }),
            new TextRun({ text: new Date(note.updatedAt).toLocaleString() }),
          ],
        }),
        new Paragraph({ text: '' }), // Spacer
      ];

      // Add actual lines
      note.content.split('\n').forEach(line => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 24, // 12pt
              })
            ],
            spacing: { after: 120 }
          })
        );
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${note.title.toLowerCase().replace(/\s+/g, '_')}.docx`;
      link.click();
      URL.revokeObjectURL(url);
      triggerFeedback('Word document compiled!');
    } catch (err) {
      console.error('[DOCX Compilation Error]', err);
      triggerFeedback('Word document compilation failed', 'info');
    }
  };

  const handleShareWithSystemSheet = async (note: FinancialNote) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: note.content,
          url: window.location.origin
        });
        triggerFeedback('Shared successfully via system sheet!');
      } catch (err) {
        console.log('[System share dismissed]', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
        triggerFeedback('Copied memo raw markdown text to clipboard!');
      } catch (err) {
        triggerFeedback('Could not copy memo details', 'info');
      }
    }
  };

  // --- Calendar Math & Helpers ---
  const calendarMonths = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Create dates array
    const blanks = Array(firstDayIndex).fill(null);
    const days = Array.from({ length: totalDays }, (_, i) => {
      const dateNum = i + 1;
      const formattedMonth = String(month + 1).padStart(2, '0');
      const formattedDay = String(dateNum).padStart(2, '0');
      return `${year}-${formattedMonth}-${formattedDay}`;
    });

    return [...blanks, ...days];
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const selectedDateEvents = useMemo(() => {
    return eventsList.filter(ev => ev.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [eventsList, selectedDate]);

  // --- Scheduler Event Handlers ---
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !selectedDate) {
      triggerFeedback('Please provide a title & date.', 'info');
      return;
    }

    const newEvent: ScheduleEvent = {
      id: 'event-' + Date.now(),
      title: eventTitle,
      date: selectedDate,
      time: eventTime,
      category: eventCategory,
      description: eventDesc,
      linkedNoteId: eventLinkedNoteId || undefined,
      createdAt: new Date().toISOString()
    };

    const freshEvents = [...eventsList, newEvent];
    handleUpdateNotesAndEvents(notesList, freshEvents);
    setShowEventModal(false);
    
    // Reset Form
    setEventTitle('');
    setEventTime('12:00');
    setEventCategory('General Reminder');
    setEventDesc('');
    setEventLinkedNoteId('');
    
    triggerFeedback('Calendar entry scheduled!');
  };

  const handleDeleteEvent = (id: string) => {
    const freshEvents = eventsList.filter(ev => ev.id !== id);
    handleUpdateNotesAndEvents(notesList, freshEvents);
    triggerFeedback('Calendar entry removed', 'info');
  };

  // --- Event Deep Linking Serialization ---
  const handleShareEventDetails = (ev: ScheduleEvent) => {
    try {
      // Find the associated budget note if linked
      const linkedNote = ev.linkedNoteId ? notesList.find(n => n.id === ev.linkedNoteId) : undefined;

      // Pack entire event details + associated note metadata into the base64 URL container
      const payload: SharedPayload = {
        title: ev.title,
        date: ev.date,
        time: ev.time,
        category: ev.category,
        description: ev.description,
        linkedNoteId: ev.linkedNoteId,
        linkedNoteTitle: linkedNote ? linkedNote.title : undefined,
        linkedNoteContent: linkedNote ? linkedNote.content : undefined
      };

      const base64String = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const shareUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?share_event=${base64String}`;
      
      setSharedLinkText(shareUrl);
      
      if (navigator.share) {
        navigator.share({
          title: `Schedule: ${ev.title}`,
          text: `Join event on Comfort Budgeting ${ev.date} at ${ev.time}`,
          url: shareUrl
        }).catch(() => {});
      } else {
        // Copy to clipboard fallback
        navigator.clipboard.writeText(shareUrl).then(() => {
          setClipboardCopied(true);
          setTimeout(() => setClipboardCopied(false), 2500);
          triggerFeedback('Deep link with budget notes copied!');
        });
      }
    } catch (err) {
      console.error(err);
      triggerFeedback('Could not compile share link', 'info');
    }
  };

  const handleAcceptImportedEvent = () => {
    if (!importedEvent) return;
    
    let finalNoteId = importedEvent.linkedNoteId;
    let updatedNotes = [...notesList];

    // If the imported event contains a linked note that doesn't exist locally, create it
    if (importedEvent.linkedNoteTitle && importedEvent.linkedNoteContent) {
      // Avoid duplicate notes by checking if we already have this exact named note
      const existingNote = notesList.find(n => n.title === importedEvent.linkedNoteTitle && n.content === importedEvent.linkedNoteContent);
      if (!existingNote) {
        const newNoteId = 'note-imported-' + Date.now();
        const newNote: FinancialNote = {
          id: newNoteId,
          title: importedEvent.linkedNoteTitle,
          content: importedEvent.linkedNoteContent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          color: 'bg-emerald-50 dark:bg-emerald-950/20' // Highlight color indicating imported
        };
        updatedNotes = [newNote, ...notesList];
        finalNoteId = newNoteId;
      } else {
        finalNoteId = existingNote.id;
      }
    }

    const newEvent: ScheduleEvent = {
      id: 'imported-' + Date.now(),
      title: importedEvent.title,
      date: importedEvent.date,
      time: importedEvent.time,
      category: importedEvent.category,
      description: importedEvent.description,
      linkedNoteId: finalNoteId,
      createdAt: new Date().toISOString()
    };
    
    // Save to database
    handleUpdateNotesAndEvents(updatedNotes, [...eventsList, newEvent]);
    setSelectedDate(newEvent.date);
    setCurrentDate(new Date(newEvent.date));
    setImportedEvent(null);
    triggerFeedback('Shared event and attached notes saved to your local calendar!');
  };

  // Simple clean render markdown function (transforms basic tags safely without npm parse crashes)
  const renderMarkdownText = (text: string) => {
    if (!text) return <p className="text-slate-400 italic">No note details yet. Write away!</p>;
    
    return text.split('\n').map((line, idx) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-lg font-black text-slate-900 dark:text-slate-100 mt-4 mb-2 border-b pb-1 border-slate-100 dark:border-slate-800">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-md font-bold text-slate-800 dark:text-slate-200 mt-3 mb-1.5">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-bold text-slate-700 dark:text-slate-350 mt-2 mb-1">{line.slice(4)}</h3>;
      }

      // Checklist points
      if (line.startsWith('- [ ] ')) {
        return (
          <div key={idx} className="flex items-center gap-2 ml-4 my-1">
            <input type="checkbox" disabled checked={false} className="rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 w-3 h-3 cursor-not-allowed" />
            <span className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">{line.slice(6)}</span>
          </div>
        );
      }
      if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
        return (
          <div key={idx} className="flex items-center gap-2 ml-4 my-1">
            <input type="checkbox" disabled checked={true} className="rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 w-3 h-3 cursor-not-allowed" />
            <span className="text-xs text-slate-450 dark:text-slate-500 line-through leading-relaxed">{line.slice(6)}</span>
          </div>
        );
      }

      // List points
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-650 dark:text-slate-350 my-1 leading-relaxed">
            {line.slice(2)}
          </li>
        );
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="pl-3 border-l-4 border-teal-500/50 dark:border-teal-700/50 italic text-xs text-slate-500 dark:text-slate-400 my-2 leading-relaxed">
            {line.slice(2)}
          </blockquote>
        );
      }

      // Line break spacer
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      
      // Handle simple formatting tags like **bold** & *italic* via Regex matching
      let formattedLine = line;
      // Bold replace
      formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic replace
      formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');

      return (
        <p 
          key={idx} 
          className="text-xs text-slate-650 dark:text-slate-350 my-1 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  // Category tags colors
  const categoryStyles: Record<EventCategoryType, { bg: string; text: string; dot: string }> = {
    'Meeting': { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-400', dot: 'bg-teal-500' },
    'Consultation': { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500' },
    'Study Seminar': { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
    'General Reminder': { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner indicating offline capability and sandbox storage status */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-gradient-to-r from-teal-500/10 to-teal-500/5 dark:from-teal-950/30 dark:to-teal-950/10 border border-teal-500/15 rounded-xl gap-3 text-center sm:text-left select-none shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Offline Sandbox Active: <span className="font-bold text-teal-600 dark:text-teal-400">Notes & calendar events saved automatically.</span>
          </p>
        </div>
        <div className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 py-1 px-2.5 rounded-lg font-mono flex items-center gap-1.5">
          <CheckCircle2 size={11} className="text-emerald-500" />
          <span>Local Device Only</span>
        </div>
      </div>

      {/* Unified Tab Pill Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-5 py-3 text-xs font-bold transition duration-200 border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'notes'
              ? 'border-teal-500 text-teal-650 dark:text-teal-400 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
          }`}
        >
          <FileText size={14} />
          <span>Financial Memo Notetaker ({notesList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('scheduler')}
          className={`px-5 py-3 text-xs font-bold transition duration-200 border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'scheduler'
              ? 'border-teal-500 text-teal-650 dark:text-teal-400 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
          }`}
        >
          <CalendarIcon size={14} />
          <span>Scheduler & Calendar ({eventsList.length})</span>
        </button>
      </div>

      {/* Toast Feedback notifications within Section */}
      {localFeedback && (
        <div className={`p-3 rounded-xl border flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200 text-xs font-semibold ${
          localFeedback.type === 'success' 
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400'
            : 'bg-teal-50/70 border-teal-200 text-teal-800 dark:bg-teal-900/20 dark:border-teal-850 dark:text-teal-400'
        }`}>
          <Sparkles size={13} className="shrink-0" />
          <span>{localFeedback.msg}</span>
        </div>
      )}

      {/* LANDING MODAL FOR INCOMING SHARED SOCIAL EVENT */}
      {importedEvent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
            
            {/* Header portion */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400 shrink-0">
                  <CalendarIcon size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest block">Shared Schedule Dispatch</span>
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg leading-tight">Schedule Details & Notes</h4>
                </div>
              </div>
              <button 
                onClick={() => setImportedEvent(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick alert bar confirming no account is required */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-400 select-none">
              <Info size={14} className="shrink-0" />
              <span>You are viewing this schedule details instantly. <strong>No login or account registration is required to read.</strong></span>
            </div>

            {/* Content Segment */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Left Column: Event Metadata */}
              <div className="md:col-span-5 space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-2xl space-y-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Event Title</span>
                    <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug">{importedEvent.title}</h5>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Category:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${categoryStyles[importedEvent.category]?.bg} ${categoryStyles[importedEvent.category]?.text}`}>
                        {importedEvent.category}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Date:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{importedEvent.date}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Time:</span>
                      <span className="font-mono font-bold text-slate-705 dark:text-slate-300">{importedEvent.time}</span>
                    </div>
                  </div>
                </div>

                {importedEvent.description && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-2xl space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Description / Agenda</span>
                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-sans whitespace-pre-line">
                      {importedEvent.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Linked Notes (If present) */}
              <div className="md:col-span-7 space-y-2 flex flex-col h-full">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Linked Meeting Notes & Minutes</span>
                
                {importedEvent.linkedNoteTitle || importedEvent.linkedNoteContent ? (
                  <div className="flex-1 min-h-[180px] md:max-h-[280px] overflow-y-auto p-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950/60 dark:to-slate-950/20 border border-slate-150 dark:border-slate-800/80 rounded-2xl shadow-inner scrollbar-thin">
                    <div className="pb-2 border-b border-slate-200 dark:border-slate-800 mb-3">
                      <h6 className="font-extrabold text-[#0D9488] dark:text-[#2DD4BF] text-xs">
                        {importedEvent.linkedNoteTitle || 'Untitled Budget Memo'}
                      </h6>
                      <span className="text-[9px] text-slate-400 font-medium">Read-Only Preview</span>
                    </div>
                    
                    <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 markdown-preview text-xs">
                      {renderMarkdownText(importedEvent.linkedNoteContent || '')}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-h-[180px] flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10 text-center text-slate-400 space-y-1">
                    <FileText size={24} className="text-slate-300 shrink-0" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No budget notes attached</p>
                    <p className="text-[10px] text-slate-450 max-w-[180px]">This scheduled event has no additional budget or meeting notes attached to it.</p>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom buttons actions footer */}
            <div className="flex items-center gap-2.5 justify-end pt-3 border-t border-slate-100 dark:border-slate-850">
              <button
                onClick={() => setImportedEvent(null)}
                className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-500 hover:text-slate-850 dark:hover:text-slate-200 font-extrabold transition rounded-xl cursor-pointer"
              >
                Close View
              </button>
              <button
                onClick={handleAcceptImportedEvent}
                className="px-5 py-2.5 text-xs bg-teal-600 hover:bg-teal-700 text-white font-extrabold transition rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Check size={14} />
                <span>Save to My Local Calendar</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB A: FINANCIAL NOTETAKER MODULE */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Notes Sidebar Selector */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#0D9488] uppercase tracking-wider">
                Memos Archive
              </span>
              <button
                onClick={handleCreateNote}
                className="py-1 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus size={13} />
                <span>New Memo</span>
              </button>
            </div>

            {notesList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <BookOpen className="mx-auto text-slate-300" size={28} />
                <p className="text-xs font-semibold">No financial memos stored</p>
                <p className="text-[10px] text-slate-400 px-4">Click "New Memo" to log details or budgets locally!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {notesList.map((note) => {
                  const isActive = note.id === activeNoteId;
                  const wordCount = note.content ? note.content.split(/\s+/).filter(Boolean).length : 0;
                  return (
                    <div
                      key={note.id}
                      onClick={() => setActiveNoteId(note.id)}
                      className={`p-3 rounded-xl border transition-all duration-200 text-left cursor-pointer group flex justify-between items-start gap-3 select-none ${
                        isActive
                          ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 shadow-sm'
                          : 'border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block truncate leading-tight">
                          {note.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{wordCount} words</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition"
                        title="Delete Note Draft"
                      >
                        <Trash2 size={13.5} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Note Editor Canvas */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 flex flex-col min-h-[460px]">
            {activeNote || activeNoteId === '' ? (
              <>
                {/* Editor Header Navigation / Exports panel */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1 flex-1 min-w-0">
                    <input
                      type="text"
                      className="text-base font-black text-slate-800 dark:text-white bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-teal-500 focus:outline-none w-full py-0.5 font-sans"
                      value={noteTitle}
                      onChange={(e) => {
                        setNoteTitle(e.target.value);
                        handleUpdateNoteContent(e.target.value, noteContent);
                      }}
                      placeholder="Write the notes herding"
                    />
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <Clock size={10} />
                      <span>
                        {activeNote 
                          ? `Last Updated: ${new Date(activeNote.updatedAt).toLocaleString()}` 
                          : 'New Unsaved Budget Memo'}
                      </span>
                    </div>
                  </div>

                  {/* Mode switch & Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    
                    {/* Explicit Save to Sandbox Button */}
                    <button
                      onClick={handleExplicitSave}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                      title="Save Note to local storage sandbox"
                    >
                      <Save size={12} />
                      <span>Save to Sandbox</span>
                    </button>

                    {/* Write/Edit vs Read/Preview Toggle - clearly labeled inline */}
                    <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/40 dark:border-slate-800">
                      <button
                        onClick={() => setEditorMode('edit')}
                        className={`text-[10px] font-extrabold py-1 px-2.5 rounded transition flex items-center gap-1 cursor-pointer ${
                          editorMode === 'edit'
                            ? 'bg-white dark:bg-slate-950 text-teal-650 dark:text-teal-400 shadow-sm font-black'
                            : 'text-slate-400 hover:text-slate-650'
                        }`}
                      >
                        Write
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateNoteContent(noteTitle, noteContent);
                          setEditorMode('preview');
                        }}
                        className={`text-[10px] font-extrabold py-1 px-2.5 rounded transition flex items-center gap-1 cursor-pointer ${
                          editorMode === 'preview'
                            ? 'bg-white dark:bg-slate-950 text-teal-650 dark:text-teal-400 shadow-sm font-black'
                            : 'text-slate-400 hover:text-slate-650'
                        }`}
                      >
                        Read
                      </button>
                    </div>

                    {/* Sharing Option */}
                    <button
                      onClick={() => handleShareWithSystemSheet(activeNote || {
                        id: 'draft',
                        title: noteTitle || 'Write the notes herding',
                        content: noteContent || 'Write your notes here.......',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        color: ''
                      })}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-350 border border-slate-200/50 dark:border-slate-800 rounded-xl transition cursor-pointer"
                      title="Share Note raw text"
                    >
                      <Share2 size={13} />
                    </button>

                    {/* Export Formats Droplist */}
                    <div className="relative group/export">
                      <button className="py-2 px-3 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-450 border border-teal-500/10 rounded-xl text-xs font-extrabold flex items-center gap-1 hover:bg-teal-100 transition cursor-pointer">
                        <Download size={12} />
                        <span>Export</span>
                      </button>
                      
                      {/* Floating dropdown overlay */}
                      <div className="absolute right-0 top-full mt-1.5 w-42 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl hidden group-hover/export:block z-[40] overflow-hidden font-sans select-none">
                        <button
                          onClick={() => exportAsTxt(activeNote || {
                            id: 'draft',
                            title: noteTitle || 'Write the notes herding',
                            content: noteContent || 'Write your notes here.......',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            color: ''
                          })}
                          className="w-full text-left p-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 border-b border-slate-150 dark:border-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <FileText size={12} className="text-slate-400" />
                          <span>Plain Text (.txt)</span>
                        </button>
                        <button
                          onClick={() => exportAsDocx(activeNote || {
                            id: 'draft',
                            title: noteTitle || 'Write the notes herding',
                            content: noteContent || 'Write your notes here.......',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            color: ''
                          })}
                          className="w-full text-left p-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 border-b border-slate-150 dark:border-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <FileText size={12} className="text-blue-500" />
                          <span>Word Document</span>
                        </button>
                        <button
                          onClick={() => exportAsPdf(activeNote || {
                            id: 'draft',
                            title: noteTitle || 'Write the notes herding',
                            content: noteContent || 'Write your notes here.......',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            color: ''
                          })}
                          className="w-full text-left p-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2 cursor-pointer"
                        >
                          <FileText size={12} className="text-rose-500" />
                          <span>PDF Document</span>
                        </button>
                      </div>
                    </div>

                    {/* Delete Current Note */}
                    {activeNote ? (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${activeNote.title}" permanently?`)) {
                            handleDeleteNote(activeNote.id);
                          }
                        }}
                        className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-955 rounded-xl transition cursor-pointer"
                        title="Delete Memo Draft"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setNoteTitle('');
                          setNoteContent('');
                          triggerFeedback('Draft cleared', 'info');
                        }}
                        className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/10 text-slate-400 border border-slate-205 dark:border-slate-800 rounded-xl transition cursor-pointer"
                        title="Clear Draft"
                      >
                        <X size={13} />
                      </button>
                    )}

                  </div>
                </div>

                {/* Editor Content Body */}
                <div className="flex-1 flex flex-col min-h-[340px] space-y-3">
                  {editorMode === 'edit' && (
                    <div className="w-full flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-slate-800 rounded-xl select-none">
                      {/* Left Side: Rich-text Formatting Actions */}
                      <div className="flex flex-wrap items-center gap-1">
                        
                        {/* Bold button */}
                        <button
                          type="button"
                          onClick={() => insertTextAtCursor('**', '**')}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-350 transition-colors cursor-pointer"
                          title="Bold text"
                        >
                          <Bold size={14} />
                        </button>

                        {/* Italic button */}
                        <button
                          type="button"
                          onClick={() => insertTextAtCursor('*', '*')}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-350 transition-colors cursor-pointer"
                          title="Italic text"
                        >
                          <Italic size={14} />
                        </button>

                        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

                        {/* Headings */}
                        <button
                          type="button"
                          onClick={() => insertTextAtCursor('# ', '')}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-350 font-black text-xs transition-colors flex items-center gap-0.5 cursor-pointer"
                          title="Header 1 (#)"
                        >
                          <Heading1 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => insertTextAtCursor('## ', '')}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-350 font-bold text-xs transition-colors flex items-center gap-0.5 cursor-pointer"
                          title="Header 2 (##)"
                        >
                          <Heading2 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => insertTextAtCursor('### ', '')}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-350 font-semibold text-xs transition-colors flex items-center gap-0.5 cursor-pointer"
                          title="Header 3 (###)"
                        >
                          <Heading3 size={14} />
                        </button>

                        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

                        {/* Lists */}
                        <button
                          type="button"
                          onClick={() => insertTextAtCursor('- ', '')}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-350 transition-colors cursor-pointer"
                          title="Unordered list"
                        >
                          <List size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => insertTextAtCursor('- [ ] ', '')}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-350 transition-colors cursor-pointer"
                          title="Checklist point"
                        >
                          <ListTodo size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => insertTextAtCursor('> ', '')}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-350 transition-colors cursor-pointer"
                          title="Block quote"
                        >
                          <Quote size={13} />
                        </button>

                        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

                        {/* Quick Emoji Picker dropdown bar */}
                        <div className="relative group/emojis inline-block">
                          <button
                            type="button"
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-350 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Insert Emoji"
                          >
                            <Smile size={14} />
                          </button>
                          <div className="absolute left-0 bottom-full mb-2 w-56 p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl hidden group-hover/emojis:grid grid-cols-6 gap-1 z-[50] overflow-hidden select-none animate-in fade-in duration-200">
                            {['😀', '🚀', '💡', '📅', '📊', '💰', '✅', '❌', '🔥', '🎉', '🌟', '👍', '❤️', '👀', '📌', '📣', '🛡️', '⚙️'].map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => insertTextAtCursor(emoji, '')}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm rounded transition-all active:scale-90 cursor-pointer text-center"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Professional Business/Scheduling Icons picker */}
                        <div className="relative group/icons inline-block">
                          <button
                            type="button"
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-teal-600 dark:text-teal-400 transition-colors font-extrabold text-[10px] tracking-wide flex items-center gap-0.5 cursor-pointer"
                            title="Insert Professional Notation Icons"
                          >
                            <span>💵 Icons</span>
                          </button>
                          <div className="absolute left-0 bottom-full mb-2 w-56 p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl hidden group-hover/icons:grid grid-cols-6 gap-1 z-[50] overflow-hidden select-none animate-in fade-in duration-200">
                            {['💵', '📈', '📉', '💼', '🏦', '✍️', '🎯', '⏳', '📢', '🔑', '🧾', '📋', '🔔', '🔒', '💡', '💭', '🤝'].map(iconItem => (
                              <button
                                key={iconItem}
                                type="button"
                                onClick={() => insertTextAtCursor(iconItem, '')}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm rounded transition-all active:scale-90 cursor-pointer text-center"
                              >
                                {iconItem}
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Right Side: Font Family & Font Size Customizers */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase hidden sm:inline">Font:</span>
                          <select
                            value={noteFontFamily}
                            onChange={(e) => {
                              setNoteFontFamily(e.target.value);
                              handleUpdateNoteContent(noteTitle, noteContent, e.target.value, noteFontSize);
                              triggerFeedback(`Font changed to ${(fontFamilies as any)[e.target.value]?.name}`, 'info');
                            }}
                            className="text-[10px] py-1 px-1.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 outline-none font-bold cursor-pointer font-sans"
                          >
                            {Object.entries(fontFamilies).map(([key, item]) => (
                              <option key={key} value={key}>
                                {(item as any).name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Font Size selector */}
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase hidden sm:inline">Size:</span>
                          <select
                            value={noteFontSize}
                            onChange={(e) => {
                              setNoteFontSize(e.target.value);
                              handleUpdateNoteContent(noteTitle, noteContent, noteFontFamily, e.target.value);
                              triggerFeedback(`Font size set to ${(fontSizes as any)[e.target.value]?.name}`, 'info');
                            }}
                            className="text-[10px] py-1 px-1.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 outline-none font-bold cursor-pointer font-sans"
                          >
                            {Object.entries(fontSizes).map(([key, item]) => (
                              <option key={key} value={key}>
                                {(item as any).name}
                              </option>
                            ))}
                          </select>
                        </div>

                      </div>
                    </div>
                  )}

                  {editorMode === 'edit' ? (
                    <textarea
                      ref={textareaRef}
                      className="w-full flex-1 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/80 p-4.5 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-950 resize-none min-h-[300px]"
                      style={{
                        fontFamily: fontFamilies[noteFontFamily as keyof typeof fontFamilies]?.style || 'inherit',
                        fontSize: fontSizes[noteFontSize as keyof typeof fontSizes]?.val || '13.5px'
                      }}
                      value={noteContent}
                      onChange={(e) => {
                        setNoteContent(e.target.value);
                        handleUpdateNoteContent(noteTitle, e.target.value);
                      }}
                      placeholder="Write your notes here......."
                    />
                  ) : (
                    <div 
                      className="w-full flex-1 bg-slate-50/20 dark:bg-slate-950/10 border border-slate-150 dark:border-slate-800 p-4.5 rounded-xl min-h-[300px] overflow-y-auto max-h-[400px] text-left leading-relaxed description"
                      style={{
                        fontFamily: fontFamilies[noteFontFamily as keyof typeof fontFamilies]?.style || 'inherit',
                        fontSize: fontSizes[noteFontSize as keyof typeof fontSizes]?.val || '13.5px'
                      }}
                    >
                      {renderMarkdownText(noteContent)}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono font-sans select-none border-t border-slate-100 dark:border-slate-800 pt-2 shrink-0">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-500 animate-pulse" />
                    Draft synced locally
                  </span>
                  <span>{noteContent ? noteContent.length : 0} characters</span>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3.5">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl text-slate-300">
                  <FileText size={40} />
                </div>
                <div className="space-y-1">
                  <h5 className="font-extrabold text-slate-700 dark:text-slate-200 text-sm">No Active Note Selected</h5>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Pick an existing note draft memo from the archive listing on the left, or create a brand new draft document.
                  </p>
                </div>
                <button
                  onClick={handleCreateNote}
                  className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1 px-4 text-center mt-2 shadow-sm"
                >
                  <Plus size={14} />
                  <span>Create First Draft</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB B: INTEGRATED SCHEDULER & CALENDAR */}
      {activeTab === 'scheduler' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Calendar Controller Grid Box (Col Span 8) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
            
            {/* Calendar Header selector controls */}
            <div className="flex items-center justify-between pb-2">
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 dark:text-white text-base tracking-tight font-sans">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">Click on any date slot below to add or view scheduled tasks</p>
              </div>
              
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl p-1 select-none">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="text-[9px] font-extrabold uppercase px-2.5 py-1 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-600 dark:text-slate-300 transition tracking-wide cursor-pointer"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Calendar Days Matrix layout */}
            <div className="space-y-1.5">
              {/* Day Headers (Sun-Sat) */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest py-1 border-b border-slate-100 dark:border-slate-800 font-sans">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {calendarMonths.map((dateStr, idx) => {
                  if (!dateStr) {
                    return <div key={'blank-' + idx} className="aspect-square bg-slate-50/20 dark:bg-slate-900/10 rounded-xl" />;
                  }

                  const dayNum = parseInt(dateStr.split('-')[2], 10);
                  const isSelected = dateStr === selectedDate;
                  const isTodayStr = dateStr === new Date().toISOString().split('T')[0];
                  
                  // Filter events falling on this date
                  const dayEvents = eventsList.filter(ev => ev.date === dateStr);
                  
                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`aspect-square p-1.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none relative group ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500/10 dark:bg-teal-500/15 text-slate-900 dark:text-white ring-1 ring-teal-500/20 shadow'
                          : isTodayStr
                          ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20'
                          : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${
                          isTodayStr ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-650 dark:text-slate-300'
                        } ${isSelected ? 'font-black text-teal-650 dark:text-teal-400' : ''}`}>
                          {dayNum}
                        </span>
                        {isTodayStr && (
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        )}
                      </div>

                      {/* Display Event dots indicators */}
                      {dayEvents.length > 0 && (
                        <div className="flex items-center justify-center gap-1 flex-wrap pt-1 min-h-[8px]">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <span 
                              key={ev.id} 
                              className={`w-1.5 h-1.5 rounded-full ${categoryStyles[ev.category]?.dot}`}
                              title={`${ev.time} - ${ev.title}`}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[7px] font-black leading-none text-slate-400">+{dayEvents.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Date Schedule details card (Col Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Selected Date Header Display */}
            <div className="bg-white dark:bg-slate-900 border border-slate-205/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Date Slot</span>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-white font-mono">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <button
                  onClick={() => setShowEventModal(true)}
                  className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-sm shadow-teal-500/10"
                  title="Add Calendar Task"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Event listings */}
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-1.5 flex flex-col items-center">
                  <Clock className="text-slate-300" size={24} />
                  <span className="text-xs font-bold">Free Calendar Slot</span>
                  <p className="text-[10px] text-slate-400 px-4">No events scheduled. Tap the plus icon on top right to slot in a consultation or audit memo!</p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                  {selectedDateEvents.map((ev) => {
                    const linkedNote = notesList.find(n => n.id === ev.linkedNoteId);
                    return (
                      <div 
                        key={ev.id}
                        className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl space-y-2.5 transition group select-none relative"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1 flex-1 min-w-0">
                            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 block leading-tight">
                              {ev.title}
                            </span>
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                              <Clock size={9.5} />
                              <span>{ev.time}</span>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide shrink-0 ${categoryStyles[ev.category]?.bg} ${categoryStyles[ev.category]?.text}`}>
                            {ev.category}
                          </span>
                        </div>

                        {ev.description && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans block text-left">
                            {ev.description}
                          </p>
                        )}

                        {/* Linked Note display */}
                        {linkedNote && (
                          <div className="flex items-center gap-2 p-2 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/10 rounded-lg text-[10px] select-none">
                            <FileText size={11} className="text-teal-600 dark:text-teal-400 shrink-0" />
                            <span 
                              onClick={() => {
                                setActiveNoteId(linkedNote.id);
                                setActiveTab('notes');
                              }}
                              className="font-bold text-teal-700 dark:text-teal-400 underline cursor-pointer truncate flex-1 block"
                              title="Click to view full report"
                            >
                              Memo: {linkedNote.title}
                            </span>
                          </div>
                        )}

                        {/* Utility operations (Delete, Share deep link) */}
                        <div className="flex justify-end gap-1 border-t border-slate-200/50 dark:border-slate-800/50 pt-2 shrink-0">
                          <button
                            onClick={() => handleShareEventDetails(ev)}
                            className="p-1 text-slate-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded transition"
                            title="Share deep link event"
                          >
                            <Share2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition"
                            title="Delete Calendar Event"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX FOR ADDING EVENT */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl select-none text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 rounded-lg">
                  <CalendarIcon size={16} />
                </div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                  Schedule Event ({selectedDate})
                </h4>
              </div>

              <button
                onClick={() => setShowEventModal(false)}
                className="text-slate-400 hover:text-slate-650"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Event Title</label>
                <input
                  type="text"
                  className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                  value={eventTitle}
                  onChange={(e) => setEventEventName(e.target.value)}
                  placeholder="Budget Audit consultation, Client invoice run, etc..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Timing Slot</label>
                  <input
                    type="time"
                    className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Category type</label>
                  <select
                    className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as EventCategoryType)}
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Study Seminar">Study Seminar</option>
                    <option value="General Reminder">General Reminder</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Link existing Memo (Optional)</label>
                <select
                  className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                  value={eventLinkedNoteId}
                  onChange={(e) => setEventLinkedNoteId(e.target.value)}
                >
                  <option value="">-- No linked memo --</option>
                  {notesList.map((note) => (
                    <option key={note.id} value={note.id}>{note.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Details & Agenda</label>
                <textarea
                  className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none h-18 font-sans"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Memo action plans or brief meeting descriptors"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 font-bold rounded-xl transition cursor-pointer text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition cursor-pointer shadow-sm shadow-teal-500/10"
                >
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Quick fix helper to avoid typescript form issue in onChange callbacks
  function setEventEventName(val: string) {
    setEventTitle(val);
  }
}
