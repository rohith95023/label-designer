import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useLabel } from '../context/LabelContext';
import { useTheme } from '../context/ThemeContext';
import { Rnd } from 'react-rnd';
import html2canvas from 'html2canvas';
import { basicShapes, allIcons } from '../data/shapesLibrary';
import { v4 as uuidv4 } from 'uuid';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import FileNameModal from '../components/modals/FileNameModal';
import LabelSizeModal from '../components/modals/LabelSizeModal';
import { IconsIcons } from '../data/premiumIcons';
import { WORDART_CATEGORIES, WORDART_STYLES } from '../data/wordArtPresets';
import PreviewModal from '../components/modals/PreviewModal';

function TableSetupModal({ onConfirm, onCancel }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(2);
  const [template, setTemplate] = useState('blank');
  const [colHeaders, setColHeaders] = useState(['Column 1', 'Column 2']);

  const updateColCount = (n) => {
    setCols(n);
    setColHeaders(prev => {
      const next = [...prev];
      while (next.length < n) next.push(`Column ${next.length + 1}`);
      return next.slice(0, n);
    });
  };

  const handleConfirm = () => {
    if (template === 'composition') {
      onConfirm({ rows, cols: 2, template, colHeaders: ['Ingredient', 'Amount'] });
    } else if (template === 'usage') {
      onConfirm({ rows, cols: 2, template, colHeaders: ['Age Group', 'Dosage'] });
    } else if (template === 'nutrition') {
      onConfirm({ rows, cols: 2, template, colHeaders: ['Nutrient', 'Per 100g'] });
    } else {
      onConfirm({ rows, cols, template, colHeaders: colHeaders.slice(0, cols) });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="glass-card bg-white dark:bg-slate-800 rounded-2xl shadow-float w-[500px] max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">table_chart</span>
            <h3 className="font-bold text-slate-800 dark:text-white">Insert Data Table</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined text-xl">close</span></button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Table Template</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'blank', label: 'Blank Grid', icon: 'grid_on' },
                { id: 'composition', label: 'Ingredients', icon: 'science' },
                { id: 'usage', label: 'Dosage Guide', icon: 'medication' },
                { id: 'nutrition', label: 'Nutrition Facts', icon: 'restaurant' },
              ].map(t => (
                <button key={t.id} onClick={() => setTemplate(t.id)} className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${template === t.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300'}`}>
                  <span className="material-symbols-outlined text-lg opacity-70">{t.icon}</span>
                  <span className="text-xs font-bold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-widest flex justify-between text-slate-500 mb-2"><span>Data Rows</span><span className="text-blue-600 font-mono">{rows}</span></label>
              <div className="flex items-center gap-2">
                <input type="range" min="1" max="50" className="flex-1 accent-blue-600" value={rows} onChange={e => setRows(Number(e.target.value))} />
                <input type="number" min="1" max="100" className="w-12 bg-white border border-slate-200 rounded px-1 py-0.5 text-[11px] font-mono outline-none focus:border-blue-400" value={rows} onChange={e => setRows(Math.max(1, Number(e.target.value)))} />
              </div>
            </div>
            <div className={`flex-1 transition-opacity ${template !== 'blank' ? 'opacity-30 pointer-events-none' : ''}`}>
              <label className="text-[10px] font-bold uppercase tracking-widest flex justify-between text-slate-500 mb-2"><span>Columns</span><span className="text-blue-600 font-mono">{cols}</span></label>
              <div className="flex items-center gap-2">
                <input type="range" min="1" max="12" className="flex-1 accent-blue-600" value={cols} onChange={e => updateColCount(Number(e.target.value))} />
                <input type="number" min="1" max="20" className="w-12 bg-white border border-slate-200 rounded px-1 py-0.5 text-[11px] font-mono outline-none focus:border-blue-400" value={cols} onChange={e => updateColCount(Math.max(1, Number(e.target.value)))} />
              </div>
            </div>
          </div>

          {/* Manual Column Header Names — only for blank template */}
          {template === 'blank' && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">Column Names</label>
              <div className="flex flex-col gap-2">
                {Array.from({ length: cols }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-1.5 shrink-0 w-14 text-center">Col {i + 1}</span>
                    <input
                      type="text"
                      className="flex-1 bg-slate-50 border border-slate-200 dark:bg-slate-700 dark:border-white/10 text-[12px] px-3 py-1.5 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-all"
                      value={colHeaders[i] || ''}
                      placeholder={`Column ${i + 1} name…`}
                      onChange={e => {
                        const next = [...colHeaders];
                        next[i] = e.target.value;
                        setColHeaders(next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
          <button onClick={onCancel} className="px-5 py-2 text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleConfirm} className="px-6 py-2 text-xs font-bold text-white btn-gradient rounded-xl shadow-sm hover:shadow active:scale-95 transition-all">Insert Table</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function LabelEditor() {
  const { theme, toggleTheme } = useTheme();
  const {
    meta, setMeta, setFileName, setLabelSize, newFile,
    elements, setElements, selectedElementId, setSelectedElementId,
    addElement, duplicateElement, updateElement, commitUpdate,
    deleteElement, moveLayer,
    zoomLevel, setZoomLevel,
    undo, redo, historyIndex, historyLength,
    savedStatus, toast,
    validateLabel,
    saveFile, saveFileAs, openFileById, openFileFromJSON, exportJSON, getAllFiles,
    hydrated,
  } = useLabel();

  const artboardRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('elements');
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [validationResult, setValidationResult] = useState({ isValid: true, errors: [] });

  // Modal flow: 'none' | 'filename' | 'labelsize'
  const [modalStep, setModalStep] = useState('none');
  const [pendingFlow, setPendingFlow] = useState(null); // 'new' | 'template'
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [editingElementId, setEditingElementId] = useState(null);
  const [editingCell, setEditingCell] = useState(null); // { r, c }
  const [showTableModal, setShowTableModal] = useState(false);
  const [showWordArtModal, setShowWordArtModal] = useState(false);
  const [wordArtTab, setWordArtTab] = useState('Premium');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentLines, setCurrentLines] = useState([]); // [[{x,y},...], ...]
  const [penColor, setPenColor] = useState('#191C1E');
  const [penWidth, setPenWidth] = useState(3);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [eraserPos, setEraserPos] = useState(null); // {x, y} for visual brush
  const [selectedLayers, setSelectedLayers] = useState([]); // Array of IDs for bulk editing
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [bulkSuffix, setBulkSuffix] = useState('');
  const originalTexts = useRef({}); // Tracks base text during bulk suffix editing

  // Show FileNameModal only AFTER hydration is complete and no saved file exists
  useEffect(() => {
    if (!hydrated) return;     // Wait for localStorage restore
    if (!meta.fileName) {
      setPendingFlow('initial'); // Forced entry
      setModalStep('filename');
    }
  }, [hydrated]);

  // Close file menu on outside click
  useEffect(() => {
    const close = () => setShowFileMenu(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toLowerCase();
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault();
        saveFile();
        return;
      }

      if (isInput) return; // For other shortcuts, respect focus

      if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && key === 'y') { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'z') { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && key === 'd' && selectedElementId) { e.preventDefault(); duplicateElement(selectedElementId); }
      if ((e.ctrlKey || e.metaKey) && key === 'p') {
        setSelectedElementId(null);
        // window.print(); handles correctly by browser
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedElementId) deleteElement(selectedElementId); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedElementId, saveFile, undo, redo, duplicateElement, deleteElement]);

  // ── Auto-expand text elements if content overflows ──────────────────────────
  useEffect(() => {
    let hasUpdates = false;
    const newElements = elements.map(el => {
      if (!['text', 'warnings', 'manufacturing', 'dosage', 'storage', 'subtext'].includes(el.type)) return el;

      const dom = document.querySelector(`[data-id="${el.id}"]`);
      if (dom && editingElementId !== el.id) {
        const prevH = dom.style.height;
        dom.style.height = 'auto'; // allow shrink to measure intrinsic height
        const sh = dom.scrollHeight;
        dom.style.height = prevH; // revert

        const targetH = Math.max(22, sh);
        if (Math.abs(targetH - (el.height || 0)) > 2) {
          hasUpdates = true;
          return { ...el, height: targetH };
        }
      }
      return el;
    });

    if (hasUpdates) {
      setElements(newElements);
    }
  }, [elements, zoomLevel, editingElementId]);

  // ── Modal Handlers ──────────────────────────────────────────────────────────
  const handleFileNameConfirm = (name) => {
    // If it's a dedicated "New File" flow, we reset only AFTER we have a name
    if (pendingFlow === 'new') {
      newFile();
    }
    setFileName(name);
    setModalStep('labelsize');
  };

  const handleLabelSizeConfirm = (newW, newH) => {
    const oldW = meta.labelSize?.w || 0;
    const oldH = meta.labelSize?.h || 0;

    // Auto-scaling logic "Arranged Perfectly"
    if (elements.length > 0 && oldW > 0 && oldH > 0 && newW > 0 && newH > 0) {
      const sX = newW / oldW;
      const sY = newH / oldH;
      const sMin = Math.min(sX, sY);

      const scaled = elements.map(el => {
        const up = {
          ...el,
          x: Math.round(el.x * sX),
          y: Math.round(el.y * sY),
          width: Math.round((el.width || 120) * sX),
          height: Math.round((el.height || 40) * sY),
        };
        // Scale fonts if present
        if (el.fontSize) {
          up.fontSize = Math.max(8, Math.round(el.fontSize * sMin)); // Min font 8px
        }
        return up;
      });

      setElements(scaled);
      setTimeout(() => commitUpdate(), 100);
    }

    setLabelSize(newW, newH);
    setModalStep('none');
    setPendingFlow(null);
  };

  const triggerNewFile = () => {
    setPendingFlow('new');
    setModalStep('filename');
    setShowFileMenu(false);
  };

  // ── Export ──────────────────────────────────────────────────────────────────
  const captureArtboard = async () => {
    const prev = selectedElementId;
    setSelectedElementId(null);
    await new Promise(r => setTimeout(r, 120));
    const canvas = await html2canvas(artboardRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
    if (prev) setSelectedElementId(prev);
    return canvas;
  };

  const handleExportPNG = async () => {
    const canvas = await captureArtboard();
    const a = document.createElement('a');
    a.download = `${meta.fileName || 'label'}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    setShowFileMenu(false);
  };

  const handleExportPDF = async () => {
    const canvas = await captureArtboard();
    const { jsPDF } = await import('jspdf');
    const { w, h } = meta.labelSize;
    const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'px', format: [w, h] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
    pdf.save(`${meta.fileName || 'label'}.pdf`);
    setShowFileMenu(false);
  };

  const handlePrint = async () => {
    const canvas = await captureArtboard();
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Print – ${meta.fileName || 'Label'}</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff;} img{max-width:100%;}</style>
      </head><body><img src="${canvas.toDataURL()}" /><script>window.onload=()=>{window.print();window.close();}<\/script></body></html>
    `);
    win.document.close();
    setShowFileMenu(false);
  };

  // ── Image Upload ─────────────────────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const max = 150;
        let w = img.width;
        let h = img.height;
        if (w > h) { h = (h / w) * max; w = max; }
        else { w = (w / h) * max; h = max; }
        addElement({ type: 'image', src: ev.target.result, width: Math.round(w), height: Math.round(h), imageFit: 'contain' });
        e.target.value = ''; // Reset for re-uploading same file
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleJSONOpen = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      openFileFromJSON(ev.target.result);
      setModalStep('none');
      setPendingFlow(null);
    };
    reader.readAsText(file);
    setShowFileMenu(false);
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const handleValidate = () => {
    const res = validateLabel();
    setValidationResult(res);
    setShowValidation(true);
    setTimeout(() => setShowValidation(false), 5000);
  };

  // ── Add Element helpers ──────────────────────────────────────────────────────
  const addTxt = () => addElement({ type: 'text', text: 'New Text', fontSize: 16, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#191C1E', width: 160, height: 22 });
  const addBar = () => addElement({ type: 'barcode', text: '123456789012', color: '#191c1e', width: 180, height: 80 });
  const addQR = () => addElement({ type: 'qrcode', text: 'https://example.com', color: '#191c1e', width: 80, height: 80 });
  const addIcon = (name) => addElement({ type: 'icon', iconName: name, width: 48, height: 48, color: '#191C1E' });
  const addTable = () => addElement({ type: 'table', text: 'Ingredient|Amount\nVitamin C|500mg\nZinc|15mg', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#191c1e', width: 200, height: 70, borderColor: '#94a3b8', borderWidth: 1, align: 'left' });

  const selectedElement = elements.find(e => e.id === selectedElementId);
  const AW = meta.labelSize?.w || 302;
  const AH = meta.labelSize?.h || 454;

  // ── Artboard element clamp ───────────────────────────────────────────────────
  // Strictly enforce bounds based on rotated bounding box
  const clampPos = (x, y, elW, elH, rot = 0) => {
    const rad = rot * Math.PI / 180;
    const absCos = Math.abs(Math.cos(rad));
    const absSin = Math.abs(Math.sin(rad));
    const W = elW * absCos + elH * absSin;
    const H = elW * absSin + elH * absCos;

    const minX = W / 2 - elW / 2;
    const maxX = AW - (W / 2 + elW / 2);
    const minY = H / 2 - elH / 2;
    const maxY = AH - (H / 2 + elH / 2);

    return {
      x: Math.min(Math.max(minX, x), Math.max(minX, maxX)),
      y: Math.min(Math.max(minY, y), Math.max(minY, maxY)),
    };
  };

  const statusColor = savedStatus === 'saved' ? 'text-green-600' : savedStatus === 'saving' ? 'text-amber-500' : 'text-slate-400';
  const statusIcon = savedStatus === 'saved' ? 'check_circle' : savedStatus === 'saving' ? 'sync' : 'edit';
  const statusLabel = savedStatus === 'saved' ? 'Saved' : savedStatus === 'saving' ? 'Saving…' : 'Unsaved';

  return (
    <div className="font-body text-on-surface h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 dark:bg-slate-950 transition-colors">

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {modalStep === 'filename' && createPortal(
        <FileNameModal
          onConfirm={handleFileNameConfirm}
          onCancel={() => {
            if (pendingFlow === 'new') {
              setModalStep('none');
              setPendingFlow(null);
            } else {
              navigate('/');
            }
          }}
          onOpen={() => jsonInputRef.current?.click()}
          recentFiles={getAllFiles()}
          onSelectRecent={(id) => { openFileById(id); setModalStep('none'); }}
        />,
        document.body
      )}
      {modalStep === 'labelsize' && createPortal(
        <LabelSizeModal
          onConfirm={handleLabelSizeConfirm}
          onCancel={() => setModalStep('none')}
          onSkip={pendingFlow ? () => { setModalStep('none'); setPendingFlow(null); } : undefined}
          currentSize={meta.labelSize}
          isEditMode={!pendingFlow}
        />,
        document.body
      )}
      {showTableModal && createPortal(
        <TableSetupModal
          onCancel={() => setShowTableModal(false)}
          onConfirm={(config) => {
            const { rows, cols, template, colHeaders } = config;
            let text = '';
            let actualCols = cols;
            if (template === 'composition') { text = 'Ingredient|Amount\n' + Array(rows).fill('|').join('\n'); actualCols = 2; }
            else if (template === 'usage') { text = 'Age Group|Dosage\n' + Array(rows).fill('|').join('\n'); actualCols = 2; }
            else if (template === 'nutrition') { text = 'Nutrient|Per 100g\n' + Array(rows).fill('|').join('\n'); actualCols = 2; }
            else {
              const headers = colHeaders || Array.from({ length: cols }, (_, i) => `Column ${i + 1}`);
              text = headers.join('|') + '\n' + Array(rows).fill(Array(cols).fill('').join('|')).join('\n');
            }

            addElement({ type: 'table', text, fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#191c1e', width: actualCols * 100, height: (rows + 1) * 25, borderColor: '#94a3b8', borderWidth: 1, align: 'left' });
            setShowTableModal(false);
          }}
        />,
        document.body
      )}

      {/* WordArt Modal */}
      {showWordArtModal && createPortal(
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fade-in p-6">
          <div className="glass-card bg-white dark:bg-slate-800 rounded-3xl shadow-glow w-[700px] h-[75vh] flex flex-col overflow-hidden">
             <div className="p-6 border-b border-white/20 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                      <span className="material-symbols-outlined">abc</span>
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">WordArt Gallery</h3>
                      <p className="text-[11px] text-slate-500">Stylized branding typography</p>
                   </div>
                </div>
                <button onClick={() => setShowWordArtModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 transition-colors"><span className="material-symbols-outlined text-xl">close</span></button>
             </div>
             
             <div className="flex border-b border-white/20 dark:border-white/10 bg-[#F8FAFC] dark:bg-slate-900 px-4 pt-2 shrink-0">
                {WORDART_CATEGORIES.map(t => (
                  <button key={t} onClick={() => setWordArtTab(t)}
                    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${wordArtTab === t ? 'text-primary border-primary bg-white dark:bg-slate-800' : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-200'}`}
                  >{t}</button>
                ))}
             </div>

             <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto bg-slate-50/30 dark:bg-transparent custom-scrollbar flex-1">
                {(WORDART_STYLES[wordArtTab] || []).map((art, idx) => (
                  <button key={idx} onClick={() => {
                    addElement({ type: 'text', text: art.name, ...art.style, width: 220, height: 40, fontFamily: 'Outfit, sans-serif' });
                    setShowWordArtModal(false);
                    commitUpdate();
                  }} className="flex flex-col items-center justify-center p-8 border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-slate-900/50 hover:border-blue-500 hover:shadow-2xl transition-all group active:scale-95 overflow-hidden min-h-[140px]">
                     <span style={art.style} className="mb-3 block text-center leading-normal break-words w-full">{art.name}</span>
                     <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">Apply Style</span>
                  </button>
                ))}
             </div>
          </div>
        </div>,
        document.body
      )}
      {/* Bulk Delete Dialog */}
      {showBulkDeleteModal && createPortal(
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-white dark:bg-slate-800 rounded-2xl shadow-float w-[360px] p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <span className="material-symbols-outlined text-xl">delete_sweep</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Delete {selectedLayers.length} Layers?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => setShowBulkDeleteModal(false)} 
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setElements(prev => prev.filter(el => !selectedLayers.includes(el.id)));
                  setSelectedLayers([]);
                  setSelectedElementId(null);
                  setShowBulkDeleteModal(false);
                  commitUpdate();
                }} 
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Save As Dialog */}
      {showSaveAs && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[380px] p-6 flex flex-col gap-4 animate-fade-in">
            <h2 className="text-sm font-bold text-slate-800">Save As New File</h2>
            <input
              autoFocus
              type="text"
              value={saveAsName}
              onChange={e => setSaveAsName(e.target.value)}
              placeholder="New file name…"
              className="border border-outline-variant/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowSaveAs(false)} className="flex-1 py-2 rounded-xl border text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button disabled={saveAsName.trim().length < 3} onClick={() => { saveFileAs(saveAsName); setShowSaveAs(false); }} className="flex-1 py-2 rounded-xl btn-gradient text-white text-sm font-bold disabled:opacity-40">Save Copy</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ─────────────────────────────────────────────────── */}
      <PreviewModal 
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        elements={elements}
        meta={meta}
        title={`Preview: ${meta.fileName || 'Untitled Label'}`}
      />

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 transition-all ${toast.type === 'error' ? 'bg-error text-white' : 'bg-slate-800 text-white'}`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}

      {/* ── Validation Overlay ──────────────────────────────────────────────── */}
      {showValidation && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 ${validationResult.isValid ? 'bg-green-600 text-white' : 'bg-red-50 text-red-800 border fill-red border-red-200'} px-6 py-4 rounded-xl shadow-lg flex flex-col items-center gap-2 min-w-[300px] animate-fade-in`}>
          <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm">
            <span className="material-symbols-outlined">{validationResult.isValid ? 'verified' : 'warning'}</span>
            {validationResult.isValid ? 'Validation Passed' : 'Compliance Issues'}
          </div>
          {!validationResult.isValid && (
            <ul className="text-xs space-y-1 mt-2 list-disc list-inside bg-red-500/10 p-3 rounded-lg w-full">
              {validationResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* ── Top Nav ─────────────────────────────────────────────────────────── */}
      <header className="h-14 glass border-b border-white/20 dark:border-white/10 flex items-center justify-between px-6 shrink-0 z-40">
        {/* Left: File Menu + Title */}
        <div className="flex items-center gap-3">
          <Link to="/" className="text-lg font-extrabold tracking-tighter text-blue-900 dark:text-blue-200 shrink-0">Pharma Label Design</Link>
          <div className="w-[1px] h-5 bg-outline-variant/30 mx-1"></div>

          {/* File Dropdown */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowFileMenu(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">folder_open</span>
              File
              <span className="material-symbols-outlined text-[14px]">{showFileMenu ? 'expand_less' : 'expand_more'}</span>
            </button>
            {showFileMenu && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-outline-variant/20 overflow-hidden z-50 animate-fade-in">
                {[
                  { label: 'New File', icon: 'add_circle', action: triggerNewFile },
                  { label: 'Open File (.json)', icon: 'folder_open', action: () => jsonInputRef.current?.click() },
                  null,
                  { label: 'Save', icon: 'save', action: () => { saveFile(); setShowFileMenu(false); }, shortcut: 'Ctrl+S' },
                  { label: 'Save as File (.json)', icon: 'download', action: () => { exportJSON(); setShowFileMenu(false); } },
                  null,
                  { label: 'Open from PC', icon: 'file_open', action: () => { jsonInputRef.current?.click(); } },
                  null,
                  { label: 'Export PNG', icon: 'image', action: handleExportPNG },
                  { label: 'Export PDF', icon: 'picture_as_pdf', action: handleExportPDF },
                  { label: 'Print', icon: 'print', action: handlePrint },
                ].map((item, i) => item === null
                  ? <div key={`sep-${i}`} className="h-[1px] bg-outline-variant/15 my-0.5" />
                  : (
                    <button key={item.label} onClick={item.action} className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[15px] text-slate-500">{item.icon}</span>
                        {item.label}
                      </span>
                      {item.shortcut && <span className="text-[9px] font-mono text-slate-400">{item.shortcut}</span>}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <div className="w-[1px] h-5 bg-outline-variant/30 mx-1"></div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{meta.fileName || 'Untitled Label'}</span>
            <span className={`flex items-center gap-1 text-[10px] font-bold ${statusColor}`}>
              <span className={`material-symbols-outlined text-[13px] ${savedStatus === 'saving' ? 'animate-spin' : ''}`}>{statusIcon}</span>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Center: Nav links */}
        <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 text-[13px] font-semibold">
          <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">Dashboard</Link>
          <Link to="/assets" className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">Template Library</Link>
          <Link to="/editor" className="text-blue-700 dark:text-blue-400 font-bold border-b-2 border-blue-600 pb-1">Label Editor</Link>
          <Link to="/translation" className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">Translation</Link>
        </nav>

        {/* Right: Toolset */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button onClick={handleValidate} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest bg-slate-100 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">fact_check</span> Validate
          </button>
          <button onClick={handleExportPDF} className="px-3 py-1.5 btn-gradient text-white rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span> PDF
          </button>
        </div>
      </header>

      {/* ── Secondary Toolbar (Undo/Redo/Zoom) ──────────────────────────────── */}
      <div className="h-10 glass border-b border-white/20 dark:border-white/10 flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)" className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[16px]">undo</span>
          </button>
          <button onClick={redo} disabled={historyIndex >= historyLength - 1} title="Redo (Ctrl+Y)" className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[16px]">redo</span>
          </button>

          <div className="w-[1px] h-4 bg-outline-variant/20 mx-1"></div>

          <button onClick={() => setZoomLevel(z => Math.max(0.2, +(z - 0.25).toFixed(2)))} className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[16px]">zoom_out</span>
          </button>
          <button onClick={() => setZoomLevel(1)} className="text-[11px] font-mono font-bold text-slate-600 w-12 text-center hover:bg-slate-100 rounded px-1 py-0.5">
            {Math.round(zoomLevel * 100)}%
          </button>
          <button onClick={() => setZoomLevel(z => Math.min(4, +(z + 0.25).toFixed(2)))} className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[16px]">zoom_in</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalStep('labelsize')}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium text-slate-500 hover:bg-slate-100 hover:text-primary transition-colors"
            title="Edit label size"
          >
            <span className="material-symbols-outlined text-[14px]">aspect_ratio</span>
            <span className="font-mono">{AW}×{AH}px</span>
            <span className="material-symbols-outlined text-[12px]">edit</span>
          </button>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <button 
            onClick={() => setShowWordArtModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-700 border border-blue-200 dark:border-white/10 rounded-full shadow-sm hover:shadow-md hover:border-blue-400 transition-all text-blue-700 dark:text-blue-300 font-bold text-[10px] uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-[16px]">abc</span> WordArt
          </button>
          <div className="w-[1px] h-3 bg-slate-200 mx-1"></div>
          <button 
            onClick={() => setIsDrawingMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1 border rounded-full shadow-sm hover:shadow-md transition-all font-bold text-[10px] uppercase tracking-widest ${isDrawingMode ? 'btn-gradient shadow-glow' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-blue-400'}`}
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span> Writing
          </button>

          <div className="w-[1px] h-3 bg-slate-200 mx-1"></div>

          <button 
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-500/20 rounded-full shadow-sm hover:shadow-md hover:border-emerald-400 transition-all text-emerald-700 dark:text-emerald-300 font-bold text-[10px] uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span> Preview
          </button>
        </div>

        <div className="flex-1" />
      </div>

      {/* ── Main 3-Column Area ─────────────────────────────────────────────── */}
      <main className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <aside className="w-64 glass border-r border-white/20 dark:border-white/10 flex flex-col overflow-hidden shrink-0">
          {/* Tab Headers */}
          <div className="flex border-b border-white/20 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
            {['elements', 'shapes', 'Icons', 'layers'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex-1 py-3 transition-colors ${activeTab === t ? 'text-primary border-b-2 border-primary bg-blue-50/50' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-700'}`}
              >{t}</button>
            ))}
          </div>

          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">

            {/* ELEMENTS TAB */}
            {activeTab === 'elements' && (
              <div className="animate-fade-in flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Text', icon: 'title', action: addTxt, payload: { type: 'text', name: 'Text Box', text: 'New Text', fontSize: 16, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#191C1E', width: 160, height: 28 } },
                    { label: 'Table', icon: 'table_chart', action: () => setShowTableModal(true) },
                    { label: 'Barcode', icon: 'barcode', action: addBar, payload: { type: 'barcode', name: 'Barcode', text: '123456789012', color: '#191c1e', width: 180, height: 80 } },
                    { label: 'QR Code', icon: 'qr_code_2', action: addQR, payload: { type: 'qrcode', name: 'QR Code', text: 'https://example.com', color: '#191c1e', width: 80, height: 80 } },
                    { label: 'Upload Logo', icon: 'imagesmode', action: () => fileInputRef.current?.click() },
                  ].map(item => (
                    <button key={item.label} onClick={item.action}
                      draggable={!!item.payload}
                      onDragStart={e => {
                        if (item.payload) {
                          e.dataTransfer.setData('application/json', JSON.stringify(item.payload));
                          e.dataTransfer.effectAllowed = 'copy';
                        }
                      }}
                      className="flex flex-col items-center p-3 glass-card group hover:-translate-y-1 transition-all duration-300 hover:border-primary/50 hover:bg-blue-50/60 hover:shadow-md transition-all group lg:active:cursor-grabbing">
                      <span className="material-symbols-outlined text-slate-500 group-hover:text-primary mb-1 text-xl">{item.icon}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-primary">{item.label}</span>
                    </button>
                  ))}
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  <input ref={jsonInputRef} type="file" className="hidden" accept=".json" onChange={handleJSONOpen} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-0.5 bg-primary rounded-full"></div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Medical Fields</p>
                  </div>
                  <div className="space-y-1">
                    {[
                      { label: 'Rx Symbol', icon: 'medical_services', payload: { type: 'text', name: 'Rx Symbol', text: 'Rx', fontSize: 32, fontFamily: 'serif', fontWeight: '900', color: '#ba1a1a', width: 60, height: 48 } },
                      { label: 'Prominent Generic', icon: 'text_fields', payload: { type: 'text', name: 'Generic Name', text: 'GENERIC NAME IP\n(Brand Name)', fontSize: 18, fontFamily: 'Inter, sans-serif', fontWeight: '900', color: '#191C1E', width: 240, height: 72, align: 'center' } },
                      { label: 'Schedule H Warning', icon: 'warning', payload: { type: 'text', name: 'Schedule H', heading: 'SCHEDULE H DRUG - WARNING', text: 'To be sold by retail on the prescription of a Registered Medical Practitioner only.', fontSize: 8, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#ba1a1a', bgColor: '#fff1f0', borderColor: '#ffccc7', borderWidth: 1, borderRadius: 4, width: 260, height: 54 } },
                      { label: 'Schedule G Warning', icon: 'g_translate', payload: { type: 'text', name: 'Schedule G', heading: 'SCHEDULE G DRUG - CAUTION', text: 'It is dangerous to take this preparation except under medical supervision.', fontSize: 8, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#ba1a1a', bgColor: '#fff1f0', borderColor: '#ffccc7', borderWidth: 1, borderRadius: 4, width: 260, height: 54 } },
                      { label: 'Schedule X Warning', icon: 'dangerous', payload: { type: 'text', name: 'Schedule X', heading: 'SCHEDULE X DRUG - WARNING', text: 'It is dangerous to take this preparation except under medical supervision. To be sold by retail on the prescription of a Registered Medical Practitioner only.', fontSize: 8, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#ba1a1a', bgColor: '#fff1f0', borderColor: '#ffccc7', borderWidth: 1, borderRadius: 4, width: 260, height: 60 } },
                      { label: 'Composition', icon: 'science', payload: { type: 'text', name: 'Composition', heading: 'Composition', text: 'Each 5ml contains:\nActive Ingredient IP 250mg\nExcipients q.s.\nColor: Tartrazine', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '400', color: '#191C1E', width: 240, height: 74 } },
                      { label: 'Batch / Mfg / Exp / MRP', icon: 'calendar_today', payload: { type: 'text', name: 'Batch Info', heading: 'Batch Information', text: 'B.No: \nMfg.Date: \nExp.Date: \nM.R.P. ₹: \n(Incl. of all taxes)', fontSize: 10, fontFamily: 'Roboto Mono, monospace', fontWeight: '700', color: '#191C1E', width: 200, height: 90 } },
                      { label: 'Storage & Stability', icon: 'device_thermostat', payload: { type: 'text', name: 'Storage', heading: 'Storage', text: 'Store below 25°C. Protected from light and moisture. Do not freeze.', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#191C1E', width: 240, height: 44 } },
                      { label: 'Child Safety Warning', icon: 'child_care', payload: { type: 'text', name: 'Child Safety', text: 'KEEP OUT OF REACH OF CHILDREN', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: '900', color: '#191C1E', width: 240, height: 24, align: 'center' } },
                      { label: 'Precautions/Warnings', icon: 'report_problem', payload: { type: 'text', name: 'Precautions', heading: 'Precautions', text: 'If symptoms persist, consult your doctor. Keep the container tightly closed.', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '400', color: '#191C1E', width: 240, height: 48 } },
                      { label: 'Special Warnings', icon: 'info', payload: { type: 'text', name: 'Special Warnings', heading: 'Special Warnings', text: 'Pregnancy & Lactation: Consult your physician before use.', fontSize: 9, fontFamily: 'Inter, sans-serif', fontWeight: '600', color: '#191C1E', width: 240, height: 44 } },
                      { label: 'Sterility Warning', icon: 'clean_hands', payload: { type: 'text', name: 'Sterility', heading: 'Sterility', text: 'STRICTLY FOR INJECTABLES - Check for clarity before use.', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#ba1a1a', width: 240, height: 44 } },
                      { label: 'Shake Well (Susp.)', icon: 'shake', payload: { type: 'text', name: 'Shake Well', text: 'SHAKE WELL BEFORE USE', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: '900', color: '#191C1E', width: 240, height: 24, align: 'center' } },
                      { label: 'Mfg & Licensing', icon: 'factory', payload: { type: 'text', name: 'Mfg Details', heading: 'Manufacturing', text: 'Mfg. Lic No: \nBatch No: \nMarketed by:', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '400', color: '#191C1E', width: 240, height: 60 } },
                      { label: 'Dosage Instructions', icon: 'medication', payload: { type: 'text', name: 'Dosage', heading: 'Dosage', text: 'As directed by the Physician.', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#191C1E', width: 220, height: 36 } },
                      { label: 'Net Contents', icon: 'inventory', payload: { type: 'text', name: 'Net Contents', heading: 'Net Content', text: '100 mL / 10 Tablets', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: '600', color: '#191C1E', width: 180, height: 32 } },
                    ].map(item => (
                      <div key={item.label}
                        onClick={() => addElement(item.payload)}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('application/json', JSON.stringify(item.payload));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer border border-slate-200 dark:border-white/10 hover:border-primary/40 hover:text-primary hover:bg-blue-50/50 shadow-sm transition-all group lg:active:cursor-grabbing">
                        <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-primary shrink-0">{item.icon}</span>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SHAPES TAB */}
            {activeTab === 'shapes' && (
              <div className="animate-fade-in flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-0.5 bg-primary rounded-full"></div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Geometry</p>
                  </div>
                  <div className="grid gap-2 grid-cols-2">
                    {basicShapes.map(s => (
                      <button key={s.id} onClick={() => addElement(s.payload)}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('application/json', JSON.stringify(s.payload));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className="flex flex-col items-center p-3 glass-card group hover:-translate-y-1 transition-all duration-300 hover:border-primary/50 hover:bg-blue-50/60 hover:shadow-md transition-all group lg:active:cursor-grabbing">
                        <span className="material-symbols-outlined text-slate-500 group-hover:text-primary mb-1 text-xl">{s.render}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-primary">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-0.5 bg-primary rounded-full"></div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Icons & Symbols ({allIcons.length})</p>
                  </div>
                  <div className="grid gap-1 grid-cols-5">
                    {allIcons.map((icon, i) => (
                      <button key={i} onClick={() => addIcon(icon)} title={icon}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('application/json', JSON.stringify({ type: 'icon', iconName: icon, width: 48, height: 48, color: '#191C1E' }));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className="flex items-center justify-center p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-primary text-slate-400 transition-all aspect-square lg:active:cursor-grabbing">
                        <span className="material-symbols-outlined text-lg">{icon}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Icons TAB */}
            {activeTab === 'Icons' && (
              <div className="animate-fade-in flex flex-col gap-6">
                {Object.entries(IconsIcons).map(([cat, icons]) => (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-3 h-0.5 bg-blue-500 rounded-full"></div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700">{cat} ({icons.length})</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {icons.map((icon, i) => (
                        <button
                          key={i}
                          onClick={() => addElement({ type: 'IconsIcon', svg: icon.svg, name: icon.name, width: 60, height: 60 })}
                          title={icon.name}
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData('application/json', JSON.stringify({ type: 'IconsIcon', svg: icon.svg, name: icon.name, width: 60, height: 60 }));
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          className="flex flex-col items-center justify-center p-2.5 glass-card group hover:-translate-y-1 transition-all duration-300 hover:border-primary/50 hover:bg-blue-50/60 hover:shadow-md transition-all group lg:active:cursor-grabbing"
                        >
                          <div className="w-8 h-8 mb-1.5 flex items-center justify-center transition-transform group-hover:scale-110" dangerouslySetInnerHTML={{ __html: icon.svg }} />
                          <span className="text-[9px] font-bold uppercase text-slate-400 group-hover:text-primary truncate w-full text-center leading-tight">{icon.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LAYERS TAB */}
            {activeTab === 'layers' && (
              <div className="animate-fade-in flex flex-col gap-1.5 h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={elements.length > 0 && selectedLayers.length === elements.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedLayers(elements.map(el => el.id));
                        else setSelectedLayers([]);
                      }}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer shrink-0"
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Select All ({elements.length})</span>
                  </div>
                  {selectedLayers.length > 0 && (
                    <button 
                      onClick={() => setSelectedLayers([])}
                      className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-500 hover:text-red-500 transition-colors font-bold"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1 overflow-y-auto max-h-[600px] custom-scrollbar pr-1">
                  {[...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)).map(el => {
                    const isSelected = selectedElementId === el.id;
                    const isBulkSelected = selectedLayers.includes(el.id);
                    return (
                      <div key={`layer-${el.id}`}
                        onClick={() => setSelectedElementId(el.id)}
                        className={`group flex items-center justify-between p-2 rounded-lg border text-[11px] cursor-pointer transition-all ${isSelected ? 'bg-blue-50/80 border-primary/50 text-primary font-bold shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'}`}>
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="checkbox" 
                            checked={isBulkSelected}
                            onChange={(e) => {
                              setSelectedLayers(prev => 
                                prev.includes(el.id) ? prev.filter(id => id !== el.id) : [...prev, el.id]
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer shrink-0"
                          />
                          <span className="material-symbols-outlined text-[13px] opacity-70 shrink-0">
                            {el.type === 'image' ? 'image' : el.type === 'shape' ? 'category' : (el.type === 'icon' || el.type === 'IconsIcon') ? 'star' : el.type === 'barcode' ? 'barcode' : el.type === 'qrcode' ? 'qr_code_2' : 'match_case'}
                          </span>
                          <span className="font-bold leading-tight break-words pr-1">
                            {el.name || el.heading || (el.text ? el.text.replace(/\n/g, ' ').slice(0, 30) + (el.text.length > 30 ? '...' : '') : el.type.toUpperCase())}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              updateElement(el.id, { locked: !el.locked }); 
                              commitUpdate();
                            }}
                            className={`p-1 rounded-md transition-all ${el.locked ? 'text-primary scale-110' : 'text-slate-300 hover:text-slate-600'}`}
                            title={el.locked ? "Unlock Layer" : "Lock Layer"}
                          >
                            <span className="material-symbols-outlined text-[15px]">{el.locked ? 'lock' : 'lock_open'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {elements.length === 0 && <p className="text-[10px] text-slate-400 text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">Canvas is empty.</p>}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER CANVAS */}
        <section
          className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 relative custom-scrollbar"
          style={{ backgroundImage: 'radial-gradient(circle, #b0b8c8 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          onClick={() => {
            setSelectedElementId(null);
            if (editingElementId) {
              setEditingElementId(null);
              commitUpdate();
            }
          }}
          onDragOver={e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={e => {
            e.preventDefault();
            try {
              const data = e.dataTransfer.getData('application/json');
              if (data) {
                const payload = JSON.parse(data);
                const rect = artboardRef.current.getBoundingClientRect();
                const dropX = (e.clientX - rect.left) / zoomLevel;
                const dropY = (e.clientY - rect.top) / zoomLevel;

                const targetW = payload.width || 120;
                const targetH = payload.height || 40;
                const centerOffX = targetW / 2;
                const centerOffY = targetH / 2;

                const finalPos = clampPos(dropX - centerOffX, dropY - centerOffY, targetW, targetH, payload.rotation || 0);
                addElement({ ...payload, x: Math.round(finalPos.x), y: Math.round(finalPos.y) });
              }
            } catch (err) {
              console.error(err);
            }
          }}
        >
          {/* Sticky Drawing Toolbar */}
          {isDrawingMode && (
            <div className="sticky top-4 left-0 right-0 z-[1005] flex justify-center pointer-events-none px-4">
              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
                 <div className="flex gap-2 px-3 border-r border-slate-200 dark:border-white/10 items-center">
                    <button onClick={() => setIsEraserMode(false)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${!isEraserMode ? 'btn-gradient shadow-sm text-white shadow-lg shadow-primary/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                       <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button onClick={() => setIsEraserMode(true)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isEraserMode ? 'btn-gradient shadow-sm text-white shadow-lg shadow-primary/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                       <span className="material-symbols-outlined text-lg">ink_eraser</span>
                    </button>
                 </div>
                 <div className="flex gap-2 px-3 border-r border-slate-200 dark:border-white/10">
                    {['#191C1E', '#BA1A1A', '#1D4ED8', '#15803D'].map(c => (
                      <button key={c} onClick={() => { setPenColor(c); setIsEraserMode(false); }} className={`w-6 h-6 rounded-full ring-2 transition-all ${(!isEraserMode && penColor === c) ? 'ring-primary ring-offset-2 scale-110' : 'ring-transparent opacity-80 hover:opacity-100'}`} style={{backgroundColor: c}} />
                    ))}
                 </div>
                 <div className="flex items-center gap-3 px-3 border-r border-slate-200 dark:border-white/10">
                    <span className="material-symbols-outlined text-slate-400 text-sm">{isEraserMode ? 'circle' : 'line_weight'}</span>
                    <input type="range" min="1" max="15" value={penWidth} onChange={e => setPenWidth(e.target.value)} className="w-20 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg accent-primary" title={isEraserMode ? "Eraser Size" : "Pen Size"} />
                 </div>
                 <div className="flex items-center gap-2 pr-1">
                    <button onClick={() => setCurrentLines(currentLines.slice(0, -1))} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all" title="Undo Last Stroke">
                       <span className="material-symbols-outlined text-lg">undo</span>
                    </button>
                    <button onClick={() => setCurrentLines([])} className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-tight text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">Clear Canvas</button>
                    <button onClick={() => {
                      if (currentLines.length > 0) {
                        // Group strokes by style to minimize elements but keep visual integrity
                        const groups = {};
                        currentLines.forEach(stroke => {
                          if (stroke.points.length < 2) return;
                          const key = `${stroke.color}-${stroke.width}`;
                          if (!groups[key]) groups[key] = { color: stroke.color, width: stroke.width, strokes: [] };
                          groups[key].strokes.push(stroke.points);
                        });

                        Object.values(groups).forEach(group => {
                          const flattened = group.strokes.flat();
                          if (flattened.length === 0) return;

                          const minX = Math.min(...flattened.map(p => p.x)) - 2;
                          const maxX = Math.max(...flattened.map(p => p.x)) + 2;
                          const minY = Math.min(...flattened.map(p => p.y)) - 2;
                          const maxY = Math.max(...flattened.map(p => p.y)) + 2;
                          const w = Math.max(10, maxX - minX);
                          const h = Math.max(10, maxY - minY);
                          
                          const pData = group.strokes.map(points => 
                            `M ${points.map(p => `${p.x - minX},${p.y - minY}`).join(' L ')}`
                          ).join(' ');

                          addElement({ 
                            type: 'path', 
                            pathData: pData, 
                            x: minX, 
                            y: minY, 
                            width: w, 
                            height: h, 
                            color: group.color, 
                            penWidth: group.width 
                          });
                        });
                      }
                      setIsDrawingMode(false);
                      setCurrentLines([]);
                      setEraserPos(null);
                      commitUpdate();
                    }} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest btn-gradient shadow-sm text-white rounded-xl shadow-xl shadow-primary/20 hover:bg-blue-700 hover:shadow-2xl transition-all active:scale-95">Finish ✓</button>
                 </div>
              </div>
            </div>
          )}
          {/* Artboard container — centered, scrollable */}
          <div className="flex items-center justify-center min-h-full p-12">
            <div
              ref={artboardRef}
              id="pharma-artboard"
              className="shadow-2xl shadow-slate-300/50 dark:shadow-black/50 ring-1 ring-white/50 dark:ring-white/10 relative pharma-artboard border border-black/15 dark:border-white/10"
              style={{
                width: `${AW}px`,
                height: `${AH}px`,
                backgroundColor: meta.bgColor || '#ffffff',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center top',
                marginBottom: `${(zoomLevel - 1) * AH}px`,
              }}
              onClick={e => {
                // If we click the artboard itself (not an element), deselect
                if (e.target.id === 'pharma-artboard') {
                  setSelectedElementId(null);
                  if (editingElementId) {
                    setEditingElementId(null);
                    commitUpdate();
                  }
                }
              }}
            >
              {/* ── DRWAING OVERLAY ────────────────────────────────────────────── */}
              {isDrawingMode && (
                <div 
                  className={`absolute inset-0 z-[1000] bg-transparent ${isEraserMode ? 'cursor-[url("https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/ink_eraser/default/24px.svg"),_auto]' : 'cursor-crosshair'}`}
                  onMouseDown={e => {
                    const rect = artboardRef.current.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / zoomLevel;
                    const y = (e.clientY - rect.top) / zoomLevel;
                    if (!isEraserMode) {
                      setCurrentLines([...currentLines, { points: [{ x, y }], color: penColor, width: penWidth }]);
                    } else {
                      const radius = parseFloat(penWidth) * 2.5;
                      const next = [];
                      currentLines.forEach(stroke => {
                         let chunk = [];
                         stroke.points.forEach(p => {
                            if (Math.hypot(p.x - x, p.y - y) > radius) { chunk.push(p); }
                            else { if (chunk.length > 1) { next.push({ ...stroke, points: chunk }); } chunk = []; }
                         });
                         if (chunk.length > 1) next.push({ ...stroke, points: chunk });
                      });
                      setCurrentLines(next);
                    }
                  }}
                  onMouseMove={e => {
                    const rect = artboardRef.current.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / zoomLevel;
                    const y = (e.clientY - rect.top) / zoomLevel;
                    
                    if (isEraserMode) setEraserPos({ x, y });
                    else if (eraserPos) setEraserPos(null);

                    if (e.buttons !== 1) return;
                    
                    if (isEraserMode) {
                      const radius = parseFloat(penWidth) * 2.5;
                      const next = [];
                      currentLines.forEach(stroke => {
                         let chunk = [];
                         stroke.points.forEach(p => {
                            if (Math.hypot(p.x - x, p.y - y) > radius) { chunk.push(p); }
                            else { if (chunk.length > 1) { next.push({ ...stroke, points: chunk }); } chunk = []; }
                         });
                         if (chunk.length > 1) next.push({ ...stroke, points: chunk });
                      });
                      setCurrentLines(next);
                    } else if (currentLines.length > 0) {
                      const lastStroke = currentLines[currentLines.length - 1];
                      const nextPoints = [...lastStroke.points, { x, y }];
                      const nextStroke = { ...lastStroke, points: nextPoints };
                      const newLines = [...currentLines.slice(0, -1), nextStroke];
                      setCurrentLines(newLines);
                    }
                  }}
                  onMouseLeave={() => setEraserPos(null)}
                >
                  <svg className="absolute inset-0 pointer-events-none w-full h-full">
                    {currentLines.map((stroke, i) => (
                      <path key={i} 
                        d={`M ${stroke.points.map(p => `${p.x},${p.y}`).join(' L ')}`} 
                        stroke={stroke.color} strokeWidth={stroke.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    ))}
                    {isEraserMode && eraserPos && (
                       <circle cx={eraserPos.x} cy={eraserPos.y} r={parseFloat(penWidth) * 2.5} fill="rgba(37, 99, 235, 0.15)" stroke="#2563eb" strokeWidth="1" strokeDasharray="2 2" />
                    )}
                  </svg>
                </div>
              )}

              {/* Label Name watermark */}
              {!elements.length && !isDrawingMode && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none gap-2">
                  <span className="material-symbols-outlined text-[48px] text-slate-200">edit_square</span>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Start adding elements</p>
                </div>
              )}

              {elements.map(el => {
                const isSelected = selectedElementId === el.id;
                const elW = el.width || 120;
                const elH = el.height || 40;

                return (
                  <Rnd
                    key={el.id}
                    size={{ width: elW, height: elH }}
                    position={{ x: el.x, y: el.y }}
                    bounds="parent"
                    disableDragging={el.locked}
                    enableResizing={el.locked ? false : {
                      top: isSelected, left: isSelected, bottom: isSelected, right: isSelected,
                      topLeft: isSelected, topRight: isSelected, bottomLeft: isSelected, bottomRight: isSelected,
                    }}
                    lockAspectRatio={['qrcode', 'icon', 'image'].includes(el.type)}
                    minWidth={4}
                    minHeight={4}
                    style={{
                      zIndex: isSelected ? 9999 : (el.zIndex || 10),
                      position: 'absolute'
                    }}
                    onDragStop={(_, d) => {
                      const clamped = clampPos(d.x, d.y, elW, elH, el.rotation);
                      updateElement(el.id, clamped);
                      commitUpdate();
                    }}
                    onResizeStop={(_, __, ref, ___, pos) => {
                      const newW = parseInt(ref.style.width);
                      const newH = parseInt(ref.style.height);
                      const clamped = clampPos(pos.x, pos.y, newW, newH, el.rotation);
                      updateElement(el.id, { width: newW, height: newH, ...clamped });
                      commitUpdate();
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      if (!el.locked && selectedElementId === el.id && ['text', 'warnings', 'manufacturing', 'dosage', 'storage', 'subtext', 'shape', 'table'].includes(el.type)) {
                        setEditingElementId(el.id);
                      } else {
                        setSelectedElementId(el.id);
                        if (editingElementId && editingElementId !== el.id) {
                          setEditingElementId(null);
                          commitUpdate();
                        }
                      }
                    }}
                    onDoubleClick={e => {
                      if (!el.locked && ['text', 'warnings', 'manufacturing', 'dosage', 'storage', 'subtext', 'shape', 'table'].includes(el.type)) {
                        e.stopPropagation();
                        setEditingElementId(el.id);
                      } else if (!el.locked && ['barcode', 'qrcode'].includes(el.type)) {
                        e.stopPropagation();
                        // No prompt here anymore, handled in properties or toolbar
                      }
                    }}
                  >
                    {isSelected && (
                      <div className={`absolute left-0 bg-white dark:bg-slate-800 shadow-xl min-w-max px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 flex items-center gap-1 z-[9999] pointer-events-auto transform transition-all origin-top-left ${
                        (el.y * zoomLevel > AH * zoomLevel - 60 || (el.rotation > 110 && el.rotation < 250)) 
                        ? '-top-[56px]' 
                        : 'top-[calc(100%+8px)]'
                      }`}
                        style={{ transform: `scale(${1 / zoomLevel})` }}
                        onMouseDown={e => e.stopPropagation()}
                       >

                        {el.locked ? (
                          <div className="flex items-center gap-2 px-3 py-1 text-blue-600 font-bold text-[10px] uppercase tracking-wider animate-pulse">
                            <span className="material-symbols-outlined text-[16px]">lock</span> Layer Locked
                          </div>
                        ) : (
                          <>
                            {/* Table Specific Controls */}
                            {el.type === 'table' && (
                              <div className="flex gap-1 shrink-0 px-2 border-r border-slate-200 dark:border-white/10">
                                <button onClick={e => {
                                  e.stopPropagation();
                                  const lines = (el.text || '').split('\n');
                                  const colCount = lines[0].split('|').length;
                                  lines.push(Array(colCount).fill('').join('|'));
                                  updateElement(el.id, { text: lines.join('\n'), height: (el.height || 0) + 25 });
                                  commitUpdate();
                                }} className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center gap-1 transition-all" title="Add Row">
                                  <span className="material-symbols-outlined text-[14px]">add</span> Row
                                </button>
                                <button onClick={e => {
                                  e.stopPropagation();
                                  const lines = (el.text || '').split('\n');
                                  const next = lines.map(l => l + '|');
                                  updateElement(el.id, { text: next.join('\n'), width: (el.width || 0) + 50 });
                                  commitUpdate();
                                }} className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center gap-1 transition-all" title="Add Column">
                                  <span className="material-symbols-outlined text-[14px]">add</span> Column
                                </button>
                              </div>
                            )}

                            {/* Barcode Data Editor */}
                            {el.type === 'barcode' && (
                              <div className="flex items-center gap-1.5 px-2 border-r border-slate-200 dark:border-white/10">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Data:</span>
                                <input
                                  type="text"
                                  className="w-24 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-mono outline-none focus:border-blue-400"
                                  value={el.text || ''}
                                  onChange={e => { updateElement(el.id, { text: e.target.value }); }}
                                  onBlur={commitUpdate}
                                />
                              </div>
                            )}

                            <div className="flex gap-0.5 shrink-0 pl-1.5">
                              <button onClick={e => { e.stopPropagation(); duplicateElement(el.id); }}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-blue-600 transition-colors" title="Duplicate">
                                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                              </button>
                              <button onClick={e => { e.stopPropagation(); deleteElement(el.id); }}
                                className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center justify-center transition-colors" title="Delete">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    <div
                      data-id={el.id}
                      className={`w-full h-full relative text-content-wrapper overflow-visible ${editingElementId === el.id ? '' : 'select-none'} ${isSelected ? 'outline outline-2 outline-blue-500 outline-offset-0 ring-4 ring-blue-500/10' : ''}`}
                      style={{
                        transform: `rotate(${el.rotation || 0}deg)`,
                        transformOrigin: '50% 50%',
                        opacity: el.opacity !== undefined ? el.opacity : 1,
                      }}
                    >
                        <div className="w-full h-full relative" style={{
                          boxSizing: 'border-box',
                          backgroundColor: (el.type === 'shape' && el.shapeType === 'line') ? 'transparent' : (el.bgColor || 'transparent'),
                          ...( (el.type === 'shape' && el.shapeType === 'line') 
                            ? { 
                                borderTop: `${el.height || 4}px ${el.borderStyle || 'solid'} ${el.bgColor || '#191c1e'}` 
                              } 
                            : { 
                                border: `${el.borderWidth || 0}px ${el.borderStyle || 'solid'} ${el.borderColor || 'transparent'}`,
                              }
                          ),
                          borderRadius: el.type === 'shape' && el.shapeType === 'circle' ? '50%' : `${el.borderRadius || 0}px`,
                          fontSize: `${el.fontSize || 16}px`,
                          fontFamily: el.fontFamily || 'Inter, sans-serif',
                        fontWeight: el.fontWeight || '400',
                        fontStyle: el.fontStyle || 'normal',
                        textDecoration: el.textDecoration || 'none',
                        color: (editingElementId === el.id && (el.backgroundImage || el.WebkitBackgroundClip || el.color === 'transparent' || el.color === 'white' || el.WebkitTextFillColor === 'transparent')) ? '#2563eb' : (el.color || '#191c1e'),
                        backgroundImage: editingElementId === el.id ? 'none' : (el.backgroundImage || undefined),
                        WebkitBackgroundClip: editingElementId === el.id ? 'initial' : (el.WebkitBackgroundClip || undefined),
                        WebkitTextFillColor: editingElementId === el.id ? 'initial' : (el.WebkitTextFillColor || undefined),
                        textShadow: (editingElementId === el.id && (el.backgroundImage || el.WebkitBackgroundClip || el.color === 'transparent' || el.color === 'white' || el.WebkitTextFillColor === 'transparent')) ? 'none' : (el.textShadow || 'none'),
                        WebkitTextStroke: el.WebkitTextStroke || undefined,
                        textAlign: el.align || 'left',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        lineHeight: el.lineHeight || '1.25',
                        letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                        overflow: el.type === 'table' ? 'hidden' : 'visible',
                        padding: (el.bgColor && el.bgColor !== 'transparent' && el.type !== 'shape') ? '4px 8px' : '0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: el.type === 'shape' ? 'center' : 'flex-start',
                        alignItems: el.type === 'shape' ? (el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start') : 'stretch',
                      }}>
                        {el.type === 'path' && (
                          <svg className="w-full h-full" viewBox={`0 0 ${el.width} ${el.height}`} preserveAspectRatio="none">
                            <path d={el.pathData} stroke={el.color || '#191C1E'} strokeWidth={el.penWidth || 3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {el.heading && (
                          <span style={{ display: 'block', fontSize: '8px', fontWeight: '800', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', color: el.alertColor || '#717783', marginBottom: '2px', letterSpacing: '1.2px' }}>
                            {el.heading}
                          </span>
                        )}

                        {el.type === 'barcode' ? (
                          <div className="w-full h-full flex items-center justify-center pointer-events-none">
                            <Barcode
                              value={el.text || '123456789012'}
                              format={el.barcodeFormat || 'CODE128'}
                              lineColor={el.color || '#191c1e'}
                              background="transparent"
                              width={1.2}
                              height={Math.max(20, elH - 32)}
                              margin={0}
                              fontSize={12}
                              displayValue={true}
                            />
                          </div>
                        ) : el.type === 'qrcode' ? (
                          <div className="w-full h-full">
                            <QRCodeSVG
                              value={el.text || 'https://pharma-precision.com/scan'}
                              fgColor={el.color || '#191c1e'}
                              bgColor="transparent"
                              style={{ width: '100%', height: '100%', display: 'block' }}
                              level="M"
                            />
                          </div>
                        ) : el.type === 'image' ? (
                          <img src={el.src} alt="Uploaded" className="w-full h-full pointer-events-none" style={{ objectFit: el.imageFit || 'contain' }} />
                        ) : el.type === 'icon' ? (
                          <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            <span className="material-symbols-outlined leading-[0]" style={{ fontSize: `${Math.min(elW, elH)}px`, color: el.color || '#191c1e' }}>{el.iconName}</span>
                          </div>
                        ) : el.type === 'IconsIcon' ? (
                          <div className="w-full h-full p-1 flex items-center justify-center pointer-events-none" dangerouslySetInnerHTML={{ __html: el.svg }} />
                        ) : el.type === 'table' ? (
                          <table className="w-full h-full table-fixed" style={{ borderCollapse: 'collapse' }}>
                            <tbody>
                              {(el.text || '').split('\n').map((row, i) => (
                                <tr key={i} style={{ backgroundColor: el.tableStriped && i > 0 && i % 2 === 0 ? 'rgba(0,0,0,0.04)' : undefined }}>
                                  {row.split('|').map((cell, j) => (
                                    <td key={j}
                                      onClick={(e) => {
                                        if (isSelected) {
                                          e.stopPropagation();
                                          setEditingCell({ r: i, c: j });
                                        }
                                      }}
                                      className={`p-0 px-1 break-words relative transition-colors ${editingCell?.r === i && editingCell?.c === j ? 'p-0 ring-2 ring-blue-500 z-10' : 'hover:bg-blue-50/50'}`}
                                      style={{
                                        borderColor: el.color || '#94a3b8',
                                        borderWidth: el.borderWidth ? `${el.borderWidth}px` : '1px',
                                        borderStyle: el.borderStyle || 'solid',
                                        verticalAlign: 'top',
                                        fontSize: `${el.fontSize || 10}px`,
                                        fontFamily: el.fontFamily || 'inherit',
                                        ...(i === 0 && el.tableHeader !== false && { fontWeight: 'bold', backgroundColor: el.color ? el.color + '18' : 'rgba(0,0,0,0.05)' })
                                      }}>
                                      {editingCell?.r === i && editingCell?.c === j ? (
                                        <textarea
                                          autoFocus
                                          className="w-full h-full bg-white dark:bg-slate-700 outline-none border-none p-1 text-inherit font-inherit resize-none block m-0"
                                          value={cell}
                                          onChange={e => {
                                            const lines = (el.text || '').split('\n');
                                            const cells = lines[i].split('|');
                                            cells[j] = e.target.value.replace(/\|/g, ''); // prevent nested separators
                                            lines[i] = cells.join('|');
                                            updateElement(el.id, { text: lines.join('\n') });
                                          }}
                                          onBlur={() => { setEditingCell(null); commitUpdate(); }}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) { setEditingCell(null); commitUpdate(); }
                                            if (e.key === 'Tab') {
                                              e.preventDefault();
                                              const maxCols = row.split('|').length;
                                              const lines = (el.text || '').split('\n');
                                              if (j < maxCols - 1) setEditingCell({ r: i, c: j + 1 });
                                              else if (i < lines.length - 1) setEditingCell({ r: i + 1, c: 0 });
                                              else setEditingCell(null);
                                              commitUpdate();
                                            }
                                          }}
                                        />
                                      ) : (
                                        cell || <span className="text-slate-300 italic opacity-50">Empty</span>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : editingElementId === el.id ? (
                          <textarea
                            autoFocus
                            className="flex-1 w-full bg-transparent outline-none resize-none border-none p-0 m-0 overflow-y-auto custom-scrollbar"
                            value={el.text || ''}
                            onChange={e => {
                              updateElement(el.id, { text: e.target.value });
                              // Precise height adjustment
                              const target = e.target;
                              target.style.height = '0px';
                              const sh = target.scrollHeight;
                              target.style.height = '100%';
                              // Add balance for heading if present
                              const headingBuffer = el.heading ? 18 : 0;
                              const newHeight = Math.max(22, sh + headingBuffer);
                              if (el.type !== 'shape' && Math.abs(newHeight - (el.height || 0)) > 2) {
                                updateElement(el.id, { height: newHeight });
                              }
                            }}
                            onBlur={() => { setEditingElementId(null); commitUpdate(); }}
                            onFocus={e => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
                            style={{
                              fontFamily: 'inherit',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              fontStyle: 'inherit',
                              textDecoration: 'inherit',
                              color: 'inherit',
                              lineHeight: 'inherit',
                              overflowY: 'auto',
                              height: 'auto',
                              width: '100%',
                              textAlign: el.align || 'inherit',
                            }}
                          />
                        ) : (
                          <span className="block w-full" style={{
                            wordBreak: 'break-word',
                            textAlign: el.align || (el.type === 'shape' ? 'center' : 'left'),
                          }}>{el.text}</span>
                        )}
                      </div>
                       {isSelected && !el.locked && (
                         <>
                           <button
                             onMouseDown={e => {
                               e.stopPropagation();
                               e.preventDefault();
                               const elNode = document.querySelector(`[data-id="${el.id}"]`);
                               if (!elNode) return;
                               const rect = elNode.getBoundingClientRect();
                               const centerX = rect.left + rect.width / 2;
                               const centerY = rect.top + rect.height / 2;

                               const handleMove = (moveEvent) => {
                                 const dx = moveEvent.clientX - centerX;
                                 const dy = moveEvent.clientY - centerY;
                                 let angle = Math.atan2(dy, dx) * 180 / Math.PI;
                                 angle = (angle + 90 + 360) % 360;

                                 const rot = Math.round(angle);
                                 const w = el.width || 120;
                                 const h = el.height || 22;
                                 // Check if this rotation would leave boundaries
                                 const clamped = clampPos(el.x, el.y, w, h, rot);
                                 if (clamped.x !== el.x || clamped.y !== el.y) {
                                   return; // Stop rotating if edge is hit
                                 }
                                 updateElement(el.id, { rotation: rot });
                               };
                               const handleUp = () => {
                                 document.removeEventListener('mousemove', handleMove);
                                 document.removeEventListener('mouseup', handleUp);
                                 commitUpdate();
                               };
                               document.addEventListener('mousemove', handleMove);
                               document.addEventListener('mouseup', handleUp);
                             }}
                             className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-slate-50 text-blue-600 z-[60] cursor-grab active:cursor-grabbing"
                             title="Drag to rotate"
                           >
                           <span className="material-symbols-outlined text-[18px]">rotate_right</span>
                         </button>
                         </>
                       )}
                     </div>
                   </Rnd>
                );
              })}
            </div>
          </div>
        </section>

        {/* RIGHT PROPERTIES PANEL */}
        <aside className="w-80 glass border-l border-white/20 dark:border-white/10 flex flex-col overflow-y-auto shrink-0 custom-scrollbar">
          {selectedLayers.length > 1 ? (
            <div className="animate-fade-in p-4 space-y-6">
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-3 rounded-xl mb-4 border border-blue-500/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px]">group</span>
                    Bulk Selection
                  </span>
                  <span className="text-[9px] text-blue-600/70 dark:text-blue-400/70 font-bold">{selectedLayers.length} Layers Selected</span>
                </div>
                <button 
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="p-2 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 rounded-lg transition-all border border-red-100"
                  title="Delete Selected"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                </button>
              </div>

              {/* Bulk Typography */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary block">Typography & Appearance</span>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Font Family</label>
                    <select className="w-full bg-slate-50 border border-slate-200 text-[11px] py-1.5 px-1.5 rounded-lg outline-none cursor-pointer"
                      onChange={e => {
                        selectedLayers.forEach(id => updateElement(id, { fontFamily: e.target.value }));
                        commitUpdate();
                      }}>
                      <option value="">Select Font...</option>
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Poppins, sans-serif">Poppins</option>
                      <option value="Outfit, sans-serif">Outfit</option>
                      <option value="Lato, sans-serif">Lato</option>
                      <option value="Open Sans, sans-serif">Open Sans</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Weight</label>
                      <select className="w-full bg-slate-50 border border-slate-200 text-[11px] py-1.5 px-1.5 rounded-lg outline-none cursor-pointer"
                        onChange={e => {
                          selectedLayers.forEach(id => updateElement(id, { fontWeight: e.target.value }));
                          commitUpdate();
                        }}>
                        <option value="">Select...</option>
                        <option value="800">Extra Bold</option>
                        <option value="700">Bold</option>
                        <option value="600">Semibold</option>
                        <option value="500">Medium</option>
                        <option value="400">Regular</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Color</label>
                      <div className="flex gap-2 h-8">
                        <div className="w-full h-full rounded-lg border border-slate-200 relative overflow-hidden backdrop-blur-sm">
                          <input type="color" className="absolute -inset-4 w-20 h-20 cursor-pointer"
                            onChange={e => {
                              selectedLayers.forEach(id => updateElement(id, { color: e.target.value }));
                              commitUpdate();
                            }} />
                          <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none flex items-center justify-center">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">colorize</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Font Size</label>
                    <input type="range" min="6" max="72" className="w-full accent-blue-600"
                      onChange={e => {
                        selectedLayers.forEach(id => updateElement(id, { fontSize: parseInt(e.target.value) }));
                        commitUpdate();
                      }} />
                  </div>

                  <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    {['left', 'center', 'right'].map(a => (
                      <button key={a} onClick={() => { 
                          selectedLayers.forEach(id => updateElement(id, { align: a }));
                          commitUpdate(); 
                        }}
                        className="flex-1 p-1.5 rounded text-center transition-colors hover:bg-slate-200 text-slate-500">
                        <span className="material-symbols-outlined text-[14px]">format_align_{a}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bulk Content — Suffix */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary block">Batch Content Action</span>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">Append Suffix to Elements</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-white/10 text-[11px] py-2.5 pl-3 pr-10 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all font-medium"
                      placeholder="e.g. (Verified)"
                      value={bulkSuffix}
                      onFocus={() => {
                        // Capture baseline text before appending
                        const baseline = {};
                        selectedLayers.forEach(id => {
                          const el = elements.find(e => e.id === id);
                          if (el && el.text) baseline[id] = el.text;
                        });
                        originalTexts.current = baseline;
                      }}
                      onChange={e => {
                        const sfx = e.target.value;
                        setBulkSuffix(sfx);
                        selectedLayers.forEach(id => {
                          const base = originalTexts.current[id];
                          if (base !== undefined) {
                            updateElement(id, { text: base + sfx });
                          }
                        });
                      }}
                      onBlur={() => {
                        commitUpdate();
                        setBulkSuffix(''); // Reset for next use
                      }}
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-[18px]">post_add</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 italic font-medium">Tip: This appends text to all currently selected layers.</p>
                </div>
              </div>
            </div>
          ) : selectedElement ? (
            <div className="animate-fade-in pb-16 relative">
              {/* Sticky Global Lock Toggle for the Layer */}
              <div className="sticky top-0 z-[20] shadow-sm flex items-center justify-between bg-primary-container px-4 py-2 border-b border-white/20 dark:border-white/10 rounded-b-xl mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px]">{selectedElement.locked ? 'lock' : 'lock_open'}</span>
                  {selectedElement.locked ? 'Layer Secured' : 'Unsecured Layer'}
                </span>
                <button 
                   onClick={() => { 
                     updateElement(selectedElement.id, { locked: !selectedElement.locked }); 
                     commitUpdate(); 
                   }} 
                   className={`h-7 px-3 rounded-xl border text-[10px] font-extrabold uppercase transition-all flex items-center gap-2 shadow-sm ${selectedElement.locked ? 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                 >
                   <span className="material-symbols-outlined text-[15px]">{selectedElement.locked ? 'lock_open' : 'lock'}</span>
                   <span>{selectedElement.locked ? 'Unlock' : 'Lock'}</span>
                </button>
              </div>

              {/* Protected Property Sections */}
              <div className={selectedElement.locked ? 'pointer-events-none opacity-50 grayscale-[50%]' : ''}>

              {/* Position Block */}
              <div className="p-4 border-b border-white/20 dark:border-white/10 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-blue-600">Position & Size</span>
                  <button onClick={() => deleteElement(selectedElement.id)} className="h-6 px-2 bg-red-50 hover:bg-red-100 text-red-600 text-[9px] font-bold uppercase rounded border border-red-200 transition-all flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    <span className="uppercase">Delete</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {['x', 'y'].map(axis => (
                    <div key={axis} className="bg-white border border-slate-200 rounded-lg p-1.5 flex items-center">
                      <span className="text-[9px] font-bold text-slate-400 w-4 pl-1">{axis.toUpperCase()}</span>
                      <input type="number" className="w-full text-[11px] font-mono outline-none text-right bg-transparent" value={Math.round(selectedElement[axis]) || 0} onChange={e => { updateElement(selectedElement.id, { [axis]: parseInt(e.target.value) }); commitUpdate(); }} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[['width', 'W'], ['height', 'H']].map(([dim, label]) => (
                    <div key={dim} className="bg-white border border-slate-200 rounded-lg p-1.5 flex items-center">
                      <span className="text-[9px] font-bold text-slate-400 w-4 pl-1">{label}</span>
                      <input type="number" className="w-full text-[11px] font-mono outline-none text-right bg-transparent"
                        value={Math.round(selectedElement[dim]) || 0}
                        onChange={e => { updateElement(selectedElement.id, { [dim]: Math.max(1, parseInt(e.target.value) || 1) }); commitUpdate(); }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Data / Content Block — for all text-bearing types */}
              {['text', 'warnings', 'barcode', 'qrcode', 'manufacturing', 'dosage', 'storage', 'subtext', 'table'].includes(selectedElement.type) && (
                <div className="p-4 border-b border-white/20 dark:border-white/10">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2">
                    {['barcode', 'qrcode'].includes(selectedElement.type) ? 'Data String' : (selectedElement.type === 'table' ? 'Table Data' : 'Text Content')}
                  </span>

                  {selectedElement.heading !== undefined && (
                    <div className="mb-4">
                      <label className="text-[9px] font-extrabold uppercase text-primary mb-1.5 block tracking-wider">Field Heading</label>
                      <input
                        type="text"
                        className="w-full bg-blue-50/50 border border-blue-100 text-[11px] font-bold py-2 px-2.5 focus:border-primary outline-none rounded-lg transition-all"
                        value={selectedElement.heading || ''}
                        onChange={e => updateElement(selectedElement.id, { heading: e.target.value })}
                        onBlur={commitUpdate}
                        placeholder="Enter heading..."
                      />
                    </div>
                  )}

                   {selectedElement.type === 'table' ? (
                    <div className="space-y-1.5">
                      <div className="max-h-[320px] overflow-y-auto overflow-x-hidden custom-scrollbar border border-slate-200/50 rounded-xl bg-slate-50/30 p-2 space-y-1">
                        {(selectedElement.text || '').split('\n').map((row, i) => (
                          <div key={i} className="flex gap-1 group">
                            <div className="w-4 h-7 flex items-center justify-center text-[9px] font-bold text-slate-300 select-none">{i + 1}</div>
                            {row.split('|').map((cell, j) => (
                              <input
                                key={j}
                                className="flex-1 min-w-0 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] px-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                value={cell}
                                onChange={e => {
                                  const lines = (selectedElement.text || '').split('\n');
                                  const cells = lines[i].split('|');
                                  cells[j] = e.target.value.replace(/\|/g, '');
                                  lines[i] = cells.join('|');
                                  updateElement(selectedElement.id, { text: lines.join('\n') });
                                }}
                                onBlur={commitUpdate}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const lines = (selectedElement.text || '').split('\n');
                            const colCount = lines[0].split('|').length;
                            lines.push(Array(colCount).fill('').join('|'));
                            updateElement(selectedElement.id, { text: lines.join('\n'), height: (selectedElement.height || 0) + 25 });
                            commitUpdate();
                          }}
                          className="flex-1 h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span> Add Row
                        </button>
                        <button 
                          onClick={() => {
                            const lines = (selectedElement.text || '').split('\n');
                            const next = lines.map(l => l + '|');
                            updateElement(selectedElement.id, { text: next.join('\n'), width: (selectedElement.width || 0) + 100 });
                            commitUpdate();
                          }}
                          className="flex-1 h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">view_column</span> Add Column
                        </button>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 text-[12px] py-2 px-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none rounded-lg resize-none"
                      style={{ minHeight: '80px', height: 'auto' }}
                      value={selectedElement.text || ''}
                      placeholder={selectedElement.type === 'qrcode' ? 'https://...' : selectedElement.type === 'barcode' ? '123456789012' : 'Enter text…'}
                      onChange={e => {
                        updateElement(selectedElement.id, { text: e.target.value });
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onBlur={commitUpdate}
                    />
                  )}
                </div>
              )}

              {/* Typography — only for non-media types */}
              {!['image', 'barcode', 'qrcode', 'icon', 'IconsIcon'].includes(selectedElement.type) && (
                <div className="p-4 border-b border-white/20 dark:border-white/10">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-3">Typography</span>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Font</label>
                        <select className="w-full bg-slate-50 border border-slate-200 text-[11px] py-1.5 px-1.5 rounded-lg outline-none cursor-pointer"
                          value={selectedElement.fontFamily || 'Inter, sans-serif'}
                          onChange={e => { updateElement(selectedElement.id, { fontFamily: e.target.value }); commitUpdate(); }}>
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="Roboto, sans-serif">Roboto</option>
                          <option value="Poppins, sans-serif">Poppins</option>
                          <option value="Outfit, sans-serif">Outfit</option>
                          <option value="Lato, sans-serif">Lato</option>
                          <option value="Open Sans, sans-serif">Open Sans</option>
                          <option value="Nunito, sans-serif">Nunito</option>
                          <option value="Raleway, sans-serif">Raleway</option>
                          <option value="Montserrat, sans-serif">Montserrat</option>
                          <option value="Source Sans Pro, sans-serif">Source Sans Pro</option>
                          <option value="DM Sans, sans-serif">DM Sans</option>
                          <option value="Noto Sans, sans-serif">Noto Sans</option>
                          <option value="Ubuntu, sans-serif">Ubuntu</option>
                          <option value="Josefin Sans, sans-serif">Josefin Sans</option>
                          <option value="Barlow, sans-serif">Barlow</option>
                          <option value="Mulish, sans-serif">Mulish</option>
                          <option value="Quicksand, sans-serif">Quicksand</option>
                          <option value="Exo 2, sans-serif">Exo 2</option>
                          <option value="Playfair Display, serif">Playfair Display</option>
                          <option value="Merriweather, serif">Merriweather</option>
                          <option value="Lora, serif">Lora</option>
                          <option value="EB Garamond, serif">EB Garamond</option>
                          <option value="Times New Roman, serif">Times New Roman</option>
                          <option value="Georgia, serif">Georgia</option>
                          <option value="PT Serif, serif">PT Serif</option>
                          <option value="Libre Baskerville, serif">Libre Baskerville</option>
                          <option value="Courier Prime, monospace">Courier Prime</option>
                          <option value="Courier New, monospace">Courier New</option>
                          <option value="Space Mono, monospace">Space Mono</option>
                          <option value="IBM Plex Mono, monospace">IBM Plex Mono</option>
                          <option value="Fira Code, monospace">Fira Code</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Weight</label>
                        <select className="w-full bg-slate-50 border border-slate-200 text-[11px] py-1.5 px-1.5 rounded-lg outline-none cursor-pointer"
                          value={selectedElement.fontWeight || '400'}
                          onChange={e => { updateElement(selectedElement.id, { fontWeight: e.target.value }); commitUpdate(); }}>
                          <option value="800">Extra Bold</option>
                          <option value="700">Bold</option>
                          <option value="600">Semibold</option>
                          <option value="500">Medium</option>
                          <option value="400">Regular</option>
                          <option value="300">Light</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block flex justify-between">
                        <span>Size</span><span className="font-mono">{selectedElement.fontSize || 12}px</span>
                      </label>
                      <input type="range" min="6" max={Math.max(12, Math.min(
                        Math.floor((selectedElement.width || AW) / (Math.max(1, ...(selectedElement.text || 'text').split(/[\s\n]+/).map(w => w.length)) * 0.7)),
                        Math.floor(Math.sqrt(((selectedElement.width || AW) * Math.max(10, AH - (selectedElement.y || 0) - 10)) / (Math.max(1, (selectedElement.text || 'text').length) * 0.7 * parseFloat(selectedElement.lineHeight || 1.25))))
                      )) || 144} className="w-full accent-blue-600"
                        value={selectedElement.fontSize || 12}
                        onChange={e => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                        onMouseUp={commitUpdate} />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 flex justify-between"><span>Line Height</span><span className="font-mono">{selectedElement.lineHeight || '1.25'}</span></label>
                        <input type="range" min="1" max="3" step="0.05" className="w-full accent-blue-600"
                          value={parseFloat(selectedElement.lineHeight) || 1.25}
                          onChange={e => updateElement(selectedElement.id, { lineHeight: parseFloat(e.target.value) })}
                          onMouseUp={commitUpdate} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 flex justify-between"><span>Spacing</span><span className="font-mono">{selectedElement.letterSpacing || 0}px</span></label>
                        <input type="range" min="-2" max="20" step="0.5" className="w-full accent-blue-600"
                          value={selectedElement.letterSpacing || 0}
                          onChange={e => updateElement(selectedElement.id, { letterSpacing: parseFloat(e.target.value) })}
                          onMouseUp={commitUpdate} />
                      </div>
                    </div>

                    <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                      {[
                        ['fontStyle', 'italic', 'format_italic', selectedElement.fontStyle === 'italic'],
                        ['textDecoration', 'underline', 'format_underlined', selectedElement.textDecoration === 'underline'],
                      ].map(([prop, val, icon, active]) => (
                        <button key={prop} onClick={() => { updateElement(selectedElement.id, { [prop]: active ? (prop === 'fontStyle' ? 'normal' : 'none') : val }); commitUpdate(); }}
                          className={`flex-1 p-1.5 rounded text-center transition-colors ${active ? 'btn-gradient shadow-sm text-white' : 'hover:bg-slate-200 text-slate-500'}`}>
                          <span className="material-symbols-outlined text-[14px]">{icon}</span>
                        </button>
                      ))}
                      <div className="w-[1px] bg-slate-200 mx-0.5"></div>
                      {['left', 'center', 'right'].map(a => (
                        <button key={a} onClick={() => { updateElement(selectedElement.id, { align: a }); commitUpdate(); }}
                          className={`flex-1 p-1.5 rounded text-center transition-colors ${selectedElement.align === a ? 'bg-blue-100 text-primary' : 'hover:bg-slate-200 text-slate-500'}`}>
                          <span className="material-symbols-outlined text-[14px]">format_align_{a}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance — Fill, Color, Stroke */}
              {selectedElement.type !== 'image' && (
                <div className="p-4 border-b border-white/20 dark:border-white/10 space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block">Appearance</span>

                  {/* Icon size slider */}
                  {selectedElement.type === 'icon' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 flex justify-between">
                        <span>Icon Size</span><span className="font-mono">{selectedElement.fontSize || 48}px</span>
                      </label>
                      <input type="range" min="12" max="400" className="w-full accent-blue-600"
                        value={selectedElement.fontSize || 48}
                        onChange={e => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                        onMouseUp={commitUpdate} />
                    </div>
                  )}

                  {/* Barcode Options */}
                  {selectedElement.type === 'barcode' && (
                    <div>
                      <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 block">Barcode Format</label>
                      <select className="w-full bg-slate-50 border border-slate-200 text-[11px] py-1.5 px-1.5 rounded-lg outline-none cursor-pointer"
                        value={selectedElement.barcodeFormat || 'CODE128'}
                        onChange={e => { updateElement(selectedElement.id, { barcodeFormat: e.target.value }); commitUpdate(); }}>
                        <option value="CODE128">CODE 128 (default)</option>
                        <option value="EAN13">EAN-13</option>
                        <option value="EAN8">EAN-8</option>
                        <option value="UPC">UPC-A</option>
                        <option value="ITF14">ITF-14</option>
                        <option value="CODE39">CODE 39</option>
                        <option value="MSI">MSI</option>
                      </select>
                    </div>
                  )}

                  {/* Image Fit Mode */}
                  {selectedElement.type === 'image' && (
                    <div>
                      <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 block">Image Fit</label>
                      <div className="grid grid-cols-3 gap-1">
                        {['contain', 'cover', 'fill'].map(fit => (
                          <button key={fit} onClick={() => { updateElement(selectedElement.id, { imageFit: fit }); commitUpdate(); }}
                            className={`p-1.5 rounded-lg border text-[9px] font-bold capitalize transition-colors ${(selectedElement.imageFit || 'contain') === fit ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                            {fit}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Table options */}
                  {selectedElement.type === 'table' && (
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input type="checkbox" className="accent-blue-600 w-3.5 h-3.5"
                          checked={selectedElement.tableHeader !== false}
                          onChange={e => { updateElement(selectedElement.id, { tableHeader: e.target.checked }); commitUpdate(); }} />
                        <span className="text-[9px] font-bold text-slate-500">Header Row</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input type="checkbox" className="accent-blue-600 w-3.5 h-3.5"
                          checked={!!selectedElement.tableStriped}
                          onChange={e => { updateElement(selectedElement.id, { tableStriped: e.target.checked }); commitUpdate(); }} />
                        <span className="text-[9px] font-bold text-slate-500">Striped Rows</span>
                      </label>
                    </div>
                  )}

                  {/* Text / Ink color */}
                  <div>
                    <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 block">
                      {selectedElement.type === 'shape' ? 'Fill Color' : selectedElement.type === 'table' ? 'Border / Text Color' : 'Text / Ink Color'}
                    </label>
                    <div className="flex gap-2 h-8">
                      <div className="w-8 h-full rounded-lg shrink-0 border border-slate-200 relative overflow-hidden">
                        <input type="color" className="absolute -inset-4 w-20 h-20 cursor-pointer"
                          value={selectedElement.type === 'shape' ? (selectedElement.bgColor || '#f1f5f9') : (selectedElement.color || '#191C1E')}
                          onChange={e => updateElement(selectedElement.id, selectedElement.type === 'shape' ? { bgColor: e.target.value } : { color: e.target.value })}
                          onBlur={commitUpdate} />
                      </div>
                      <input type="text" className="flex-1 text-[10px] font-mono uppercase px-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none"
                        value={selectedElement.type === 'shape' ? (selectedElement.bgColor || '#f1f5f9') : (selectedElement.color || '#191C1E')}
                        onChange={e => updateElement(selectedElement.id, selectedElement.type === 'shape' ? { bgColor: e.target.value } : { color: e.target.value })}
                        onBlur={commitUpdate} />
                    </div>
                  </div>

                  {/* Background (non-shape, non-barcode) */}
                  {!['shape', 'barcode', 'qrcode', 'icon', 'IconsIcon'].includes(selectedElement.type) && (
                    <div>
                      <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 flex justify-between">
                        <span>Background</span>
                        <button onClick={() => { updateElement(selectedElement.id, { bgColor: 'transparent' }); commitUpdate(); }} className="text-error hover:underline text-[8px]">Clear</button>
                      </label>
                      <div className="flex gap-2 h-8">
                        <div className="w-8 h-full rounded-lg shrink-0 border border-slate-200 relative overflow-hidden bg-slate-200"
                          style={{ background: 'repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%) 50% / 8px 8px' }}>
                          <input type="color" className="absolute -inset-4 w-20 h-20 cursor-pointer opacity-0"
                            onChange={e => { updateElement(selectedElement.id, { bgColor: e.target.value }); commitUpdate(); }} />
                          {selectedElement.bgColor && selectedElement.bgColor !== 'transparent' && (
                            <div className="absolute inset-0" style={{ backgroundColor: selectedElement.bgColor }}>
                              <input type="color" className="absolute -inset-4 w-20 h-20 cursor-pointer opacity-0"
                                value={selectedElement.bgColor}
                                onChange={e => updateElement(selectedElement.id, { bgColor: e.target.value })}
                                onBlur={commitUpdate} />
                            </div>
                          )}
                        </div>
                        <input type="text" className="flex-1 text-[10px] font-mono uppercase px-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none"
                          value={selectedElement.bgColor || 'transparent'}
                          onChange={e => updateElement(selectedElement.id, { bgColor: e.target.value })}
                          onBlur={commitUpdate} />
                      </div>
                    </div>
                  )}

                  {/* Stroke */}
                  <div className="pt-1">
                    <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 flex justify-between">
                      <span>Stroke / Border</span>
                      <button onClick={() => { updateElement(selectedElement.id, { borderWidth: 0, borderColor: 'transparent' }); commitUpdate(); }} className="text-error hover:underline text-[8px]">Clear</button>
                    </label>
                    <div className="flex gap-2 items-center">
                      <input type="range" min="0" max="20" className="flex-1 accent-blue-600"
                        value={selectedElement.borderWidth || 0}
                        onChange={e => updateElement(selectedElement.id, { borderWidth: parseInt(e.target.value) })}
                        onMouseUp={commitUpdate} />
                      <div className="flex gap-1 h-7">
                        <div className="w-7 h-full rounded-lg shrink-0 border border-slate-200 relative overflow-hidden">
                          <input type="color" className="absolute -inset-4 w-20 h-20 cursor-pointer"
                            value={selectedElement.borderColor || '#475569'}
                            onChange={e => updateElement(selectedElement.id, { borderColor: e.target.value })}
                            onBlur={commitUpdate} />
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg flex-1 flex items-center justify-center font-mono text-[9px] text-slate-400 px-2">
                          {selectedElement.borderWidth || 0}px
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Border Radius for rectangles */}
                  {selectedElement.type === 'shape' && selectedElement.shapeType === 'rectangle' && (
                    <div>
                      <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 flex justify-between">
                        <span>Corner Radius</span><span className="font-mono">{selectedElement.borderRadius || 0}px</span>
                      </label>
                      <input type="range" min="0" max="60" className="w-full accent-blue-600"
                        value={selectedElement.borderRadius || 0}
                        onChange={e => updateElement(selectedElement.id, { borderRadius: parseInt(e.target.value) })}
                        onMouseUp={commitUpdate} />
                    </div>
                  )}

                  {/* Line style for line shapes */}
                  {selectedElement.type === 'shape' && selectedElement.shapeType === 'line' && (
                    <div>
                      <label className="text-[8px] font-bold uppercase text-slate-400 mb-2 block">Line Style</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: 'Solid', value: 'solid', preview: 'border-solid' },
                          { label: 'Dashed', value: 'dashed', preview: 'border-dashed' },
                          { label: 'Dotted', value: 'dotted', preview: 'border-dotted' },
                          { label: 'Double', value: 'double', preview: 'border-double' },
                        ].map(({ label, value, preview }) => (
                          <button
                            key={value}
                            onClick={() => { updateElement(selectedElement.id, { borderStyle: value }); commitUpdate(); }}
                            className={`p-2 rounded-lg border text-[9px] font-bold flex flex-col items-center gap-1 transition-colors ${(selectedElement.borderStyle || 'solid') === value
                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                              }`}
                          >
                            <div className={`w-full h-0 border-t-2 ${preview}`} style={{ borderColor: selectedElement.bgColor || '#191c1e' }} />
                            {label}
                          </button>
                        ))}
                      </div>
                      {/* Line weight */}
                      <label className="text-[8px] font-bold uppercase text-slate-400 mt-2 mb-1 flex justify-between">
                        <span>Thickness</span><span className="font-mono">{selectedElement.height || 4}px</span>
                      </label>
                      <input type="range" min="1" max="40" className="w-full accent-blue-600"
                        value={selectedElement.height || 4}
                        onChange={e => updateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                        onMouseUp={commitUpdate} />
                    </div>
                  )}

                  {/* Opacity */}
                  <div>
                    <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 flex justify-between">
                      <span>Opacity</span><span className="font-mono">{Math.round((selectedElement.opacity !== undefined ? selectedElement.opacity : 1) * 100)}%</span>
                    </label>
                    <input type="range" min="0" max="1" step="0.01" className="w-full accent-blue-600"
                      value={selectedElement.opacity !== undefined ? selectedElement.opacity : 1}
                      onChange={e => updateElement(selectedElement.id, { opacity: parseFloat(e.target.value) })}
                      onMouseUp={commitUpdate} />
                  </div>

                  {/* Rotation Slider */}
                  <div>
                    <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 flex justify-between">
                      <span>Rotation</span><span className="font-mono">{selectedElement.rotation || 0}°</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <input type="range" min="0" max="360" step="1" className="flex-1 accent-blue-600"
                        value={selectedElement.rotation || 0}
                        onChange={e => {
                          const rot = parseInt(e.target.value);
                          const w = selectedElement.width || 120;
                          const h = selectedElement.height || 22;
                          const clamped = clampPos(selectedElement.x, selectedElement.y, w, h, rot);
                          updateElement(selectedElement.id, { rotation: rot, ...clamped });
                        }}
                        onMouseUp={commitUpdate} />
                      <button onClick={() => { updateElement(selectedElement.id, { rotation: 0 }); commitUpdate(); }} className="p-1 px-2 bg-slate-100 rounded text-[9px] font-bold text-slate-500">Reset</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
            <div className="p-6 animate-fade-in space-y-8">
              <div className="flex flex-col items-center text-center px-4">
                <div className="w-16 h-16 bg-blue-100/50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                  <span className="material-symbols-outlined text-[32px] text-blue-600 dark:text-blue-400">settings_overscan</span>
                </div>
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Label Settings</h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-tight">Configure global properties for the entire label surface</p>
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                  <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">palette</span>
                    Label Background
                  </label>
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl border-2 border-slate-100 relative overflow-hidden ring-4 ring-slate-50 shadow-inner">
                      <input type="color" className="absolute -inset-6 w-24 h-24 cursor-pointer"
                        value={meta.bgColor || '#ffffff'}
                        onChange={e => setMeta({ ...meta, bgColor: e.target.value })}
                        onBlur={commitUpdate} />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <input type="text" className="w-full text-[11px] font-mono uppercase px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-all font-bold"
                        value={meta.bgColor || '#FFFFFF'}
                        onChange={e => setMeta({ ...meta, bgColor: e.target.value })}
                        onBlur={commitUpdate} />
                      <div className="flex gap-1.5">
                        {['#FFFFFF', '#F8FAFC', '#F1F5F9', '#FFF7ED', '#F0FDF4'].map(c => (
                          <button key={c} onClick={() => { 
                            const newM = { ...meta, bgColor: c };
                            setMeta(newM); 
                            commitUpdate(elements, newM); 
                          }} 
                            className={`w-6 h-6 rounded-full border border-black/10 ring-2 ${meta.bgColor === c ? 'ring-blue-500 ring-offset-2' : 'ring-transparent'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-100/30 rounded-2xl border border-dashed border-slate-300 text-center">
                   <span className="material-symbols-outlined text-[24px] text-slate-400 mb-1">touch_app</span>
                   <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Select an element</p>
                   <p className="text-[9px] text-slate-500 dark:text-slate-500">to edit specific properties</p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
