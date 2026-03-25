import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { generatedTemplates } from '../data/mockTemplates';

const LabelContext = createContext();
export const useLabel = () => useContext(LabelContext);

const LABEL_INDEX_KEY = 'plabel_index';
const fileKey = (id) => `plabel_file_${id}`;

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

const DEFAULT_META = { fileId: null, fileName: null, labelSize: { w: 600, h: 400 } };

// ─── LocalStorage I/O ─────────────────────────────────────────────────────────
const getIndex = () => {
  try {
    return JSON.parse(localStorage.getItem(LABEL_INDEX_KEY) || '[]');
  } catch {
    return [];
  }
};

const setIndex = (idx) => {
  try { localStorage.setItem(LABEL_INDEX_KEY, JSON.stringify(idx)); } catch {}
};

const readFile = (id) => {
  try {
    const raw = localStorage.getItem(fileKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Schema validation
    if (!parsed.meta || !Array.isArray(parsed.elements)) throw new Error('Invalid schema');
    return parsed;
  } catch {
    return 'CORRUPTED';
  }
};

const writeFile = (id, meta, elements, activeTemplate) => {
  try {
    localStorage.setItem(fileKey(id), JSON.stringify({ 
      meta, 
      elements, 
      activeTemplate, 
      savedAt: Date.now() 
    }));
  } catch {}
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const LabelProvider = ({ children }) => {
  const [templates]            = useState(generatedTemplates);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [meta,     setMeta]    = useState(DEFAULT_META);
  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [zoomLevel, setZoomLevel]   = useState(1);
  const [history,   setHistory]     = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [savedStatus, setSavedStatus]   = useState('saved'); // 'saved'|'saving'|'unsaved'
  const [toast, setToast]               = useState(null);     // { msg, type }
  const [hydrated, setHydrated]         = useState(false);    // true after localStorage restore

  const debounceRef = useRef(null);

  // ── Toast helper ──
  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Hydrate from last session ──
  useEffect(() => {
    const idx = getIndex();
    if (!idx.length) { setHydrated(true); return; }
    const last = idx[idx.length - 1];
    const data = readFile(last.fileId);
    if (!data || data === 'CORRUPTED') { setHydrated(true); return; }
    setMeta(data.meta);
    setElements(data.elements);
    setActiveTemplate(data.activeTemplate || null);
    setHistory([data.elements]);
    setHistoryIndex(0);
    setSavedStatus('saved');
    setHydrated(true);
  }, []);

  // ── Debounced auto-save ──
  useEffect(() => {
    if (!meta.fileId) return;
    setSavedStatus('unsaved');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSavedStatus('saving');
      writeFile(meta.fileId, meta, elements, activeTemplate);
      // Update index
      const idx = getIndex().filter(f => f.fileId !== meta.fileId);
      idx.push({ fileId: meta.fileId, fileName: meta.fileName, updatedAt: Date.now() });
      setIndex(idx);
      setSavedStatus('saved');
    }, 800);
  }, [elements, meta, activeTemplate]);

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
    const id = uuidv4();
    const newMeta = { fileId: id, fileName: null, labelSize: { w: 600, h: 400 } };
    setMeta(newMeta);
    setActiveTemplate(null);
    setElements([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setSelectedElementId(null);
    setZoomLevel(1);
    setSavedStatus('unsaved');
  };

  const setFileName = (name) => {
    const trimmed = name.trim();
    setMeta(m => ({ 
      ...m, 
      fileName: trimmed,
      fileId: m.fileId || uuidv4() 
    }));
  };

  const setLabelSize = (w, h) => setMeta(m => ({ ...m, labelSize: { w, h } }));

  const saveFile = () => {
    if (!meta.fileId) return;
    setSavedStatus('saving');
    writeFile(meta.fileId, meta, elements, activeTemplate);
    const idx = getIndex().filter(f => f.fileId !== meta.fileId);
    idx.push({ fileId: meta.fileId, fileName: meta.fileName, updatedAt: Date.now() });
    setIndex(idx);
    setSavedStatus('saved');
    showToast('File saved ✓', 'success');
  };

  const saveFileAs = (newName) => {
    const newId = uuidv4();
    const newMeta = { ...meta, fileId: newId, fileName: newName.trim() };
    writeFile(newId, newMeta, elements, activeTemplate);
    const idx = getIndex();
    idx.push({ fileId: newId, fileName: newMeta.fileName, updatedAt: Date.now() });
    setIndex(idx);
    setMeta(newMeta);
    setSavedStatus('saved');
    showToast(`Saved as "${newName}" ✓`, 'success');
  };

  const openFileById = (id) => {
    const data = readFile(id);
    if (!data) { showToast('File not found.', 'error'); return; }
    if (data === 'CORRUPTED') { showToast('File is corrupted or invalid.', 'error'); return; }
    setMeta(data.meta);
    setElements(data.elements);
    setHistory([data.elements]);
    setHistoryIndex(0);
    setSelectedElementId(null);
    setSavedStatus('saved');
  };

  const openFileFromJSON = (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.meta || !Array.isArray(data.elements)) throw new Error('Invalid schema');
      setMeta(data.meta);
      setElements(data.elements);
      setHistory([data.elements]);
      setHistoryIndex(0);
      setSavedStatus('saved');
    } catch {
      showToast('Could not open file — corrupted or invalid format.', 'error');
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ meta, elements }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meta.fileName || 'label'}.json`;
    a.click();
  };

  const getAllFiles = () => getIndex();

  // ── Template Loader ──
  const loadTemplate = (template) => {
    // Generates a new fileId for this template session
    const id = uuidv4();
    const enriched = (template.elements || []).map((el, i) => ({ ...el, zIndex: el.zIndex || (i + 10) }));

    const MM_TO_PX = 3.7795275591;
    let w = 600, h = 400;

    if (template.size && template.size.toLowerCase().includes('x')) {
      const parts = template.size.toLowerCase().split('x');
      const val1 = parseFloat(parts[0]);
      const val2 = parseFloat(parts[1]);
      if (!isNaN(val1) && !isNaN(val2)) {
        // We use the orientation that makes sense (Pharma labels are usually wide)
        // But we follow the data provided.
        w = Math.round(val1 * MM_TO_PX);
        h = Math.round(val2 * MM_TO_PX);
        
        // Swap if it's too skinny (tall vial labels are rare, we try to optimize for landscape)
        if (w < h && template.category !== 'Syrups') {
           // simple flip logic if we wanted, but let's stick to the data
        }
      }
    }

    setMeta({ fileId: id, fileName: null, labelSize: { w, h } });
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
    // Snapshot current elements into history (called on drag/resize stop)
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
    const allZ = elements.map(e => e.zIndex || 0);
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
    templates,
    activeTemplate, setActiveTemplate,
    meta, setMeta,
    elements, setElements,
    selectedElementId, setSelectedElementId,
    zoomLevel, setZoomLevel,
    savedStatus, toast,
    historyIndex, historyLength: history.length,
    hydrated,
    // File ops
    newFile, setFileName, setLabelSize,
    saveFile, saveFileAs,
    openFileById, openFileFromJSON,
    exportJSON, getAllFiles,
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
