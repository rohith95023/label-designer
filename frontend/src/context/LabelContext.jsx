import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../services/api';
import { getGuestId } from '../utils/auth';
import { useAuth } from './AuthContext';

const LabelContext = createContext();
export const useLabel = () => useContext(LabelContext);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getPx = (mm) => Math.round(mm * 3.7795275591); // mm → px at 96 dpi

export const LABEL_PRESETS = [
  { id: 'bottle',   name: 'Bottle Label',    w: 302, h: 454 },  // 80×120mm
  { id: 'vial',     name: 'Vial Wrap',       w: 208, h: 132 },  // 55×35mm
  { id: 'blister',  name: 'Blister Pack',    w: 416, h: 265 },  // 110×70mm
  { id: 'a5',       name: 'A5 Label',        w: 559, h: 794 },
  { id: 'a4',       name: 'A4 Sheet',        w: 794, h: 1123 },
  { id: 'strip',    name: 'Strip Pack',      w: 567, h: 189 },  // 150×50mm
  { id: 'sachet',   name: 'Sachet',          w: 265, h: 340 },  // 70×90mm
  { id: 'custom',   name: 'Custom …',        w: 600, h: 400 },
];

const DEFAULT_META = { fileId: null, fileName: null, labelSize: { w: 302, h: 454 }, bgColor: '#FFFFFF' };

export const DEFAULT_SETTINGS = {
  profileName: 'Pharma Designer',
  defaultSize: 'custom',
  gridEnabled: true,
  units: 'mm',
  defaultLanguage: 'en',
  autoTranslate: false,
  fdaValidation: true,
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const LabelProvider = ({ children }) => {
  const [templates, setTemplates]      = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [meta,     setMeta]    = useState(DEFAULT_META);
  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [zoomLevel, setZoomLevel]   = useState(1);
  const [history,   setHistory]     = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [savedStatus, setSavedStatus]   = useState('saved'); // 'saved'|'saving'|'unsaved'
  const [toast, setToast]               = useState(null);     // { msg, type }
  const [hydrated, setHydrated]         = useState(false);    // true after API restore
  const [settings, setSettings]         = useState(DEFAULT_SETTINGS);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [userFiles, setUserFiles]       = useState([]);

  const { user } = useAuth();
  const guestId = getGuestId();
  const effectiveId = user?.id || guestId;
  const debounceRef = useRef(null);

  // ── Toast helper ──
  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Hydrate from Backend (only when authenticated) ──
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        if (!user) {
          // Not authenticated — load public templates but skip user-specific data
          try {
            const systemTemplates = await api.getTemplates();
            setTemplates(systemTemplates);
          } catch (tempErr) {
            console.error('Failed to fetch templates', tempErr);
          }
          setHydrated(true);
          return;
        }

        // 1. Fetch Dashboard (Settings & Logs)
        try {
          const session = await api.getDashboard(effectiveId);
          if (session.dashboardPreferences) {
            setSettings(prev => ({ ...prev, ...session.dashboardPreferences }));
          }
          if (session.recentActivityLog) {
            setActivityLogs(Array.isArray(session.recentActivityLog) ? session.recentActivityLog : []);
          }
        } catch (dashErr) {
          console.error('Failed to fetch dashboard data', dashErr);
        }

        // 2. Fetch Templates (System)
        try {
          const systemTemplates = await api.getTemplates();
          setTemplates(systemTemplates);
        } catch (tempErr) {
          console.error('Failed to fetch templates', tempErr);
          showToast('Failed to load templates', 'error');
        }

        // 3. Fetch User Files
        try {
          const files = await api.getUserTemplates(effectiveId);
          setUserFiles(files);

          // 4. Last session restore (optional)
          if (files.length > 0) {
            const last = files.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0];
            setMeta(prev => ({ 
              ...prev,
              fileId: last.id, 
              fileName: last.name, 
              labelSize: last.labelSize || { w: 600, h: 400 },
              bgColor: last.bgColor || '#FFFFFF'
            }));
            setElements(last.elementsData || []);
          }
        } catch (fileErr) {
          console.error('Failed to fetch user files', fileErr);
        }

        setHydrated(true);
      } catch (err) {
        console.error('Failed to hydrate from backend', err);
        showToast('Offline mode: Using local defaults', 'warning');
        setHydrated(true);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user, effectiveId]);

  // ── Activity Log Sync ──
  const addActivityLog = useCallback(async (action, fileId, fileName) => {
    if (!user) return; // Skip if not authenticated
    const newLog = { id: uuidv4(), action, fileId, fileName, time: Date.now() };
    setActivityLogs(prev => {
      const next = [newLog, ...prev].slice(0, 100);
      // Sync to backend
      api.saveDashboard(effectiveId, { recentActivityLog: next }).catch(console.error);
      return next;
    });
  }, [user, effectiveId]);

  // ── Settings Sync ──
  const updateSettings = useCallback((updates) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      if (user) {
        api.saveDashboard(effectiveId, { dashboardPreferences: next }).catch(console.error);
      }
      return next;
    });
  }, [user, effectiveId]);

  // ── Debounced auto-save ──
  useEffect(() => {
    if (!meta.fileId || !hydrated) return;
    setSavedStatus('unsaved');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setSavedStatus('saving');
        const updated = await api.updateUserTemplate(meta.fileId, {
          name: meta.fileName,
          elementsData: elements,
          labelSize: meta.labelSize,
          bgColor: meta.bgColor
        });
        setUserFiles(prev => prev.map(f => f.id === updated.id ? updated : f));
        setSavedStatus('saved');
      } catch (err) {
        console.error('Auto-save failed', err);
        setSavedStatus('unsaved');
      }
    }, 60000);
  }, [elements, meta, hydrated]);

  // ── History ──
  const saveToHistory = useCallback((newEls) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      next.push([...newEls]);
      setHistoryIndex(next.length - 1);
      return next;
    });
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const pi = historyIndex - 1;
      setElements([...history[pi]]);
      setHistoryIndex(pi);
      setSelectedElementId(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const ni = historyIndex + 1;
      setElements([...history[ni]]);
      setHistoryIndex(ni);
      setSelectedElementId(null);
    }
  };

  // ── File Operations ──
  const newFile = () => {
    setMeta(DEFAULT_META);
    setActiveTemplate(null);
    setElements([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setSelectedElementId(null);
    setZoomLevel(1);
    setSavedStatus('unsaved');
  };

  const setFileName = async (name) => {
    const trimmed = name.trim();
    if (!meta.fileId) {
      // Create new template entry in backend
      try {
        setSavedStatus('saving');
        const newTemplate = await api.createUserTemplate(guestId, {
          name: trimmed,
          elementsData: elements,
          labelSize: meta.labelSize,
          bgColor: meta.bgColor
        });
        setMeta(m => ({ ...m, fileName: trimmed, fileId: newTemplate.id }));
        setUserFiles(prev => [...prev, newTemplate]);
        setSavedStatus('saved');
        addActivityLog(activeTemplate ? 'Started from template' : 'Created new label', newTemplate.id, trimmed);
      } catch (err) {
        showToast('Failed to initialize file in backend', 'error');
      }
    } else {
      setMeta(m => ({ ...m, fileName: trimmed }));
    }
  };

  const setLabelSize = (w, h) => setMeta(m => ({ ...m, labelSize: { w, h } }));

  const saveFile = async () => {
    if (!meta.fileId) {
        showToast('Please name your file first', 'warning');
        return;
    }
    try {
        setSavedStatus('saving');
        const updated = await api.updateUserTemplate(meta.fileId, {
            name: meta.fileName,
            elementsData: elements,
            labelSize: meta.labelSize,
            bgColor: meta.bgColor
        });
        setUserFiles(prev => prev.map(f => f.id === updated.id ? updated : f));
        setSavedStatus('saved');
        showToast('File saved ✓', 'success');
    } catch (err) {
        console.error('Manual save failed', err);
        showToast('Manual save failed', 'error');
    }
  };

  const saveFileAs = async (newName) => {
    try {
      setSavedStatus('saving');
      const newTemplate = await api.createUserTemplate(guestId, {
        name: newName,
        elementsData: elements,
        labelSize: meta.labelSize,
        bgColor: meta.bgColor
      });
      setMeta({ 
        fileId: newTemplate.id, 
        fileName: newName, 
        labelSize: meta.labelSize,
        bgColor: meta.bgColor 
      });
      setUserFiles(prev => [...prev, newTemplate]);
      setSavedStatus('saved');
      showToast('File copy saved ✓', 'success');
      addActivityLog('Saved as new file', newTemplate.id, newName);
    } catch (err) {
      console.error('Save as failed', err);
      showToast('Save as failed', 'error');
    }
  };

  const openFileById = async (id) => {
    try {
      setLoading(true);
      const data = await api.getUserTemplate(id);
      setMeta({ 
        fileId: data.id, 
        fileName: data.name, 
        labelSize: data.labelSize || { w: 600, h: 400 },
        bgColor: data.bgColor || '#FFFFFF'
      });
      setElements(data.elementsData || []);
      setHistory([data.elementsData || []]);
      setHistoryIndex(0);
      setSelectedElementId(null);
      setSavedStatus('saved');
      addActivityLog('Opened file', id, data.name);
    } catch (err) {
      showToast('Could not open file from backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteUserTemplate = async (id) => {
    try {
      const success = await api.deleteUserTemplate(id);
      if (success) {
        setUserFiles(prev => prev.filter(f => f.id !== id));
        showToast('Template deleted permanently', 'success');
        addActivityLog('Deleted template', id, 'Removed from repository');
        return true;
      }
      return false;
    } catch (err) {
      showToast('Failed to delete template', 'error');
      return false;
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ meta, elements }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meta.fileName || 'label'}.json`;
    a.click();
    addActivityLog('Exported JSON', meta.fileId, meta.fileName);
  };

  const openFileFromJSON = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.meta) {
        setMeta({ 
          fileId: null, // New file ID will be created when saved
          fileName: data.meta.fileName || 'Imported Label',
          labelSize: data.meta.labelSize || { w: 600, h: 400 },
          bgColor: data.meta.bgColor || '#FFFFFF'
        });
      }
      if (data.elements && Array.isArray(data.elements)) {
        setElements(data.elements);
        setHistory([data.elements]);
        setHistoryIndex(0);
      }
      setSelectedElementId(null);
      setSavedStatus('unsaved');
      showToast('File imported successfully ✓', 'success');
      addActivityLog('Imported JSON file', null, data.meta?.fileName || 'Imported Label');
    } catch (err) {
      console.error('Failed to parse JSON file', err);
      showToast('Invalid JSON file format', 'error');
    }
  };

  const getAllFiles = () => userFiles;

  const getTemplateHistory = async (id) => {
    try {
      // First try to fetch from user templates history
      let history = [];
      try {
        history = await api.getUserHistory(id);
      } catch (err) {
        // Fallback to system template history if user history fails
        history = await api.getHistory(id);
      }
      return history;
    } catch (err) {
      showToast('Failed to fetch version history', 'error');
      return [];
    }
  };

  const getTemplateById = async (id) => {
    try {
      // First check user templates
      try {
        return await api.getUserTemplate(id);
      } catch (err) {
        // Fallback to system templates
        return await api.getTemplate(id);
      }
    } catch (err) {
      showToast('Failed to fetch template details', 'error');
      return null;
    }
  };

  // ── Template Loader ──
  const loadTemplate = (template) => {
    const enriched = (template.elementsData || []).map((el, i) => ({ ...el, zIndex: el.zIndex || (i + 10) }));

    const MM_TO_PX = 3.7795275591;
    let w = 600, h = 400;

    if (template.labelSize) {
        w = template.labelSize.w;
        h = template.labelSize.h;
    } else if (template.size && template.size.toLowerCase().includes('x')) {
      const parts = template.size.toLowerCase().split('x');
      const val1 = parseFloat(parts[0]);
      const val2 = parseFloat(parts[1]);
      if (!isNaN(val1) && !isNaN(val2)) {
        w = Math.round(val1 * MM_TO_PX);
        h = Math.round(val2 * MM_TO_PX);
      }
    }

    setMeta({ fileId: null, fileName: null, labelSize: { w, h }, bgColor: template.bgColor || '#FFFFFF' });
    setActiveTemplate(template);
    setElements(enriched);
    setHistory([enriched]);
    setHistoryIndex(0);
    setSelectedElementId(null);
    setZoomLevel(1);
    setSavedStatus('unsaved');
  };

  // ── Element CRUD ──
  const addElement = (data) => {
    const maxZ = elements.reduce((mx, el) => Math.max(mx, el.zIndex || 0), 10);
    const el = { id: uuidv4(), x: 20, y: 20, zIndex: maxZ + 1, ...data };
    const next = [...elements, el];
    setElements(next);
    saveToHistory(next);
    setSelectedElementId(el.id);
  };

  const duplicateElement = (id) => {
    const src = elements.find(e => e.id === id);
    if (!src) return;
    const maxZ = elements.reduce((mx, el) => Math.max(mx, el.zIndex || 0), 10);
    const copy = { ...src, id: uuidv4(), x: src.x + 20, y: src.y + 20, zIndex: maxZ + 1 };
    const next = [...elements, copy];
    setElements(next);
    saveToHistory(next);
    setSelectedElementId(copy.id);
  };

  const updateElement = (id, updates) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const commitUpdate = () => {
    setElements(prev => { saveToHistory(prev); return prev; });
  };

  const deleteElement = (id) => {
    const next = elements.filter(e => e.id !== id);
    setElements(next);
    saveToHistory(next);
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const moveLayer = (id, dir) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    let z = el.zIndex || 10;
    const allZ = elements.map(e => e.zIndex || 10);
    if (dir === 'up')    z += 1;
    if (dir === 'down')  z = Math.max(1, z - 1);
    if (dir === 'front') z = Math.max(...allZ) + 1;
    if (dir === 'back')  z = Math.min(...allZ) - 1;
    const next = elements.map(e => e.id === id ? { ...e, zIndex: z } : e);
    setElements(next);
    saveToHistory(next);
  };

  // ── FDA Validation ──
  const validateLabel = () => {
    const errors = [];
    const has = (fn) => elements.some(fn);
    if (!has(e => e.type === 'barcode' || e.type === 'qrcode'))          errors.push('Missing Barcode / QR Code.');
    if (!has(e => (e.text || '').toLowerCase().includes('exp') || (e.text || '').toLowerCase().includes('expiry')))
                                                                          errors.push('Missing Expiry Date field.');
    if (!has(e => (e.fontSize || 0) > 18 || e.subtype === 'brand'))      errors.push('Missing prominent Brand Name.');
    if (!has(e => e.type === 'warnings'))                                 errors.push('Missing Safety / Rx Warning.');
    return { isValid: errors.length === 0, errors };
  };

  const value = {
    templates, userFiles,
    activeTemplate, setActiveTemplate,
    meta, setMeta,
    elements, setElements,
    selectedElementId, setSelectedElementId,
    zoomLevel, setZoomLevel,
    savedStatus, toast,
    historyIndex, historyLength: history.length,
    hydrated, loading,
    settings, updateSettings,
    activityLogs,
    // File ops
    newFile, setFileName, setLabelSize,
    saveFile, saveFileAs,
    openFileById, openFileFromJSON, deleteUserTemplate,
    exportJSON, getAllFiles,
    getTemplateHistory, getTemplateById,
    // Template
    loadTemplate,
    // Element ops
    addElement, duplicateElement, updateElement, commitUpdate,
    deleteElement, moveLayer,
    // History
    undo, redo,
    // Validation
    validateLabel,
    LABEL_PRESETS,
  };

  return <LabelContext.Provider value={value}>{children}</LabelContext.Provider>;
};

