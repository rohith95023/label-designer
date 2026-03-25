import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLabel } from '../context/LabelContext';
import { useTheme } from '../context/ThemeContext';
import { Rnd } from 'react-rnd';
import html2canvas from 'html2canvas';
import { basicShapes, allIcons } from '../data/shapesLibrary';
import { premiumIcons } from '../data/premiumIcons';
import { v4 as uuidv4 } from 'uuid';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import FileNameModal from '../components/modals/FileNameModal';
import LabelSizeModal from '../components/modals/LabelSizeModal';

export default function LabelEditor() {
  const { theme, toggleTheme } = useTheme();
  const {
    meta, setFileName, setLabelSize, newFile,
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
    reader.onload = (ev) => addElement({ type: 'image', src: ev.target.result, width: 100, height: 100 });
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
  const addTxt = () => addElement({ type: 'text', text: 'New Text', fontSize: 16, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#191C1E', width: 160, height: 28 });
  const addBar = () => addElement({ type: 'barcode', text: '123456789012', color: '#191c1e', width: 180, height: 80 });
  const addQR = () => addElement({ type: 'qrcode', text: 'https://example.com', color: '#191c1e', width: 80, height: 80 });
  const addIcon = (name) => addElement({ type: 'icon', iconName: name, width: 48, height: 48, color: '#191C1E' });

  const selectedElement = elements.find(e => e.id === selectedElementId);
  const { w: AW, h: AH } = meta.labelSize || { w: 600, h: 400 };

  // ── Artboard element clamp ───────────────────────────────────────────────────
  const clampPos = (x, y, elW, elH) => ({
    x: Math.min(Math.max(0, x), AW - elW),
    y: Math.min(Math.max(0, y), AH - elH),
  });

  const statusColor = savedStatus === 'saved' ? 'text-green-600' : savedStatus === 'saving' ? 'text-amber-500' : 'text-slate-400';
  const statusIcon = savedStatus === 'saved' ? 'check_circle' : savedStatus === 'saving' ? 'sync' : 'edit';
  const statusLabel = savedStatus === 'saved' ? 'Saved' : savedStatus === 'saving' ? 'Saving…' : 'Unsaved';

  return (
    <div className="font-body text-on-surface h-screen flex flex-col overflow-hidden bg-[#F1F3F6]">

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {modalStep === 'filename' && (
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
        />
      )}
      {modalStep === 'labelsize' && (
        <LabelSizeModal
          onConfirm={handleLabelSizeConfirm}
          onCancel={() => setModalStep('none')}
          onSkip={pendingFlow ? () => { setModalStep('none'); setPendingFlow(null); } : undefined}
          currentSize={meta.labelSize}
          isEditMode={!pendingFlow}
        />
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
      <header className="h-14 bg-[#F8FAFC] dark:bg-slate-900 border-b border-black/5 flex items-center justify-between px-6 shrink-0 z-40">
        {/* Left: File Menu + Title */}
        <div className="flex items-center gap-3">
          <Link to="/" className="text-lg font-extrabold tracking-tighter text-blue-900 shrink-0">Pharma Label Design</Link>
          <div className="w-[1px] h-5 bg-outline-variant/30 mx-1"></div>

          {/* File Dropdown */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowFileMenu(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
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
        <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 text-[15px] font-semibold">
          <Link to="/" className="text-slate-500 hover:text-slate-800 transition-colors">Dashboard</Link>
          <Link to="/assets" className="text-slate-500 hover:text-slate-800 transition-colors">Template Library</Link>
          <Link to="/editor" className="text-blue-700 font-bold border-b-2 border-blue-600 pb-1">Label Editor</Link>
          <Link to="/translation" className="text-slate-500 hover:text-slate-800 transition-colors">Translation</Link>
        </nav>

        {/* Right: Toolset */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all"
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
      <div className="h-10 bg-[#F8FAFC] dark:bg-slate-800 border-b border-black/5 flex items-center justify-between px-4 shrink-0 z-30">
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

        {selectedElementId && (
          <div className="flex items-center gap-1">
            <button onClick={() => duplicateElement(selectedElementId)} title="Duplicate (Ctrl+D)" className="p-1 rounded hover:bg-slate-100 text-primary transition-colors">
              <span className="material-symbols-outlined text-[15px]">content_copy</span>
            </button>
            <button onClick={() => deleteElement(selectedElementId)} title="Delete" className="p-1 rounded hover:bg-red-50 text-error transition-colors">
              <span className="material-symbols-outlined text-[15px]">delete</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Main 3-Column Area ─────────────────────────────────────────────── */}
      <main className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <aside className="w-64 bg-[#F8FAFC] dark:bg-slate-900 border-r border-black/5 flex flex-col overflow-hidden shrink-0">
          {/* Tab Headers */}
          <div className="flex border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
            {['elements', 'shapes', 'premium', 'layers'].map(t => (
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
                    { label: 'Text', icon: 'title', action: addTxt, payload: { type: 'text', text: 'New Text', fontSize: 16, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#191C1E', width: 160, height: 28 } },
                    { label: 'Barcode', icon: 'barcode', action: addBar, payload: { type: 'barcode', text: '123456789012', color: '#191c1e', width: 180, height: 80 } },
                    { label: 'QR Code', icon: 'qr_code_2', action: addQR, payload: { type: 'qrcode', text: 'https://example.com', color: '#191c1e', width: 80, height: 80 } },
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
                      className="flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm hover:border-primary/50 hover:bg-blue-50/60 hover:shadow-md transition-all group lg:active:cursor-grabbing">
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
                      { label: '+ Brand Name', icon: 'label', payload: { type: 'text', subtype: 'brand', text: 'BRAND NAME', fontSize: 22, fontFamily: 'Inter, sans-serif', fontWeight: '800', color: '#0a2540', width: 200, height: 32 } },
                      { label: 'Composition Block', icon: 'science', payload: { type: 'text', heading: 'Composition', text: 'Active Ingredient 250mg\nExcipients q.s.', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '400', color: '#191C1E', width: 220, height: 48 } },
                      { label: 'Mfg & Licensing', icon: 'factory', payload: { type: 'text', heading: 'Manufacturing', text: 'Mfg. by: \nLic. No.: ', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '400', color: '#191C1E', width: 220, height: 44 } },
                      { label: 'Batch & Expiry', icon: 'calendar_today', payload: { type: 'text', heading: 'Batch / Expiry', text: 'B.No: \nMfg: \nExp: ', fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: '700', color: '#191C1E', width: 160, height: 48 } },
                      { label: 'Schedule H Warning', icon: 'warning', payload: { type: 'warnings', heading: 'Warning', alertColor: '#ba1a1a', text: 'To be sold by retail on the prescription of a Registered Medical Practitioner only.', fontSize: 9, fontFamily: 'Inter, sans-serif', fontWeight: '600', color: '#191C1E', width: 220, height: 40 } },
                      { label: 'Dosage Instructions', icon: 'medication', payload: { type: 'text', heading: 'Dosage', text: 'As directed by physician.', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#191C1E', width: 200, height: 36 } },
                      { label: 'Storage Conditions', icon: 'ac_unit', payload: { type: 'text', heading: 'Storage', text: 'Store below 30°C. Keep dry.', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '400', color: '#191C1E', width: 200, height: 36 } },
                      { label: 'Net Contents', icon: 'inventory', payload: { type: 'text', heading: 'Net Content', text: '100 mL / 10 Tablets', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: '600', color: '#191C1E', width: 160, height: 28 } },
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
                        className="flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm hover:border-primary/50 hover:bg-blue-50/60 hover:shadow-md transition-all group lg:active:cursor-grabbing">
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

            {/* PREMIUM TAB */}
            {activeTab === 'premium' && (
              <div className="animate-fade-in flex flex-col gap-6">
                {Object.entries(premiumIcons).map(([cat, icons]) => (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-3 h-0.5 bg-blue-500 rounded-full"></div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700">{cat} ({icons.length})</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {icons.map((icon, i) => (
                        <button
                          key={i}
                          onClick={() => addElement({ type: 'premiumIcon', svg: icon.svg, name: icon.name, width: 60, height: 60 })}
                          title={icon.name}
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData('application/json', JSON.stringify({ type: 'premiumIcon', svg: icon.svg, name: icon.name, width: 60, height: 60 }));
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          className="flex flex-col items-center justify-center p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm hover:border-primary/50 hover:bg-blue-50/60 hover:shadow-md transition-all group lg:active:cursor-grabbing"
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
              <div className="animate-fade-in flex flex-col gap-1.5">
                {[...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)).map(el => {
                  const isSelected = selectedElementId === el.id;
                  return (
                    <div key={`layer-${el.id}`}
                      onClick={() => setSelectedElementId(el.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-[11px] cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-primary/50 text-primary font-bold' : 'bg-slate-50 border-transparent hover:border-slate-200 text-slate-600'}`}>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="material-symbols-outlined text-[13px]">
                          {el.type === 'image' ? 'image' : el.type === 'shape' ? 'category' : (el.type === 'icon' || el.type === 'premiumIcon') ? 'star' : el.type === 'barcode' ? 'barcode' : el.type === 'qrcode' ? 'qr_code_2' : 'match_case'}
                        </span>
                        <span className="truncate max-w-[100px]">{el.name || el.text || el.iconName || el.shapeType || 'Layer'}</span>
                      </div>
                      {isSelected && (
                        <div className="flex gap-0.5 shrink-0">
                          {['front', 'up', 'down', 'back'].map(d => (
                            <button key={d} onClick={e => { e.stopPropagation(); moveLayer(el.id, d); }}
                              className="p-0.5 rounded hover:bg-blue-100 text-primary">
                              <span className="material-symbols-outlined text-[12px]">
                                {d === 'front' ? 'flip_to_front' : d === 'up' ? 'keyboard_arrow_up' : d === 'down' ? 'keyboard_arrow_down' : 'flip_to_back'}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {elements.length === 0 && <p className="text-[10px] text-slate-400 text-center py-8">Canvas is empty.</p>}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER CANVAS */}
        <section
          className="flex-1 overflow-auto bg-[#E8EAF0] relative"
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

                const finalPos = clampPos(dropX - centerOffX, dropY - centerOffY, targetW, targetH);
                addElement({ ...payload, x: Math.round(finalPos.x), y: Math.round(finalPos.y) });
              }
            } catch (err) {
              console.error(err);
            }
          }}
        >
          {/* Artboard container — centered, scrollable */}
          <div className="flex items-center justify-center min-h-full p-12">
            <div
              ref={artboardRef}
              id="pharma-artboard"
              className="bg-white shadow-2xl relative pharma-artboard"
              style={{
                width: `${AW}px`,
                height: `${AH}px`,
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center top',
                marginBottom: `${(zoomLevel - 1) * AH}px`,
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Label Name watermark */}
              {!elements.length && (
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
                    enableResizing={{
                      top: isSelected, left: isSelected, bottom: isSelected, right: isSelected,
                      topLeft: isSelected, topRight: isSelected, bottomLeft: isSelected, bottomRight: isSelected,
                    }}
                    lockAspectRatio={['qrcode', 'icon', 'image'].includes(el.type)}
                    style={{ zIndex: el.zIndex || 10, position: 'absolute' }}
                    className={isSelected ? 'outline outline-2 outline-blue-500 outline-offset-0 ring-4 ring-blue-500/10' : ''}
                    onDragStop={(_, d) => {
                      const clamped = clampPos(d.x, d.y, elW, elH);
                      updateElement(el.id, clamped);
                      commitUpdate();
                    }}
                    onResizeStop={(_, __, ref, ___, pos) => {
                      const newW = parseInt(ref.style.width);
                      const newH = parseInt(ref.style.height);
                      const clamped = clampPos(pos.x, pos.y, newW, newH);
                      updateElement(el.id, { width: newW, height: newH, ...clamped });
                      commitUpdate();
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      if (selectedElementId === el.id && ['text', 'warnings', 'manufacturing', 'dosage', 'storage', 'subtext'].includes(el.type)) {
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
                      if (['text', 'warnings', 'manufacturing', 'dosage', 'storage', 'subtext'].includes(el.type)) {
                        e.stopPropagation();
                        setEditingElementId(el.id);
                      }
                    }}
                  >
                    <div className={`w-full h-full relative ${editingElementId === el.id ? '' : 'select-none'}`} style={{
                      backgroundColor: el.bgColor || 'transparent',
                      borderWidth: el.borderWidth ? `${el.borderWidth}px` : 0,
                      borderColor: el.borderColor || 'transparent',
                      borderStyle: 'solid',
                      borderRadius: el.type === 'shape' && el.shapeType === 'circle' ? '50%' : `${el.borderRadius || 0}px`,
                      fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
                      fontFamily: el.fontFamily || 'Inter, sans-serif',
                      fontWeight: el.fontWeight || '400',
                      fontStyle: el.fontStyle || 'normal',
                      textDecoration: el.textDecoration || 'none',
                      color: el.color || '#191c1e',
                      textAlign: el.align || 'left',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.25',
                      overflow: 'hidden',
                      padding: el.bgColor && el.bgColor !== 'transparent' && el.type !== 'shape' ? '4px 8px' : '0',
                    }}>
                      {el.heading && (
                        <span style={{ display: 'block', fontSize: '8px', fontWeight: '800', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', color: el.alertColor || '#717783', marginBottom: '2px', letterSpacing: '1.2px' }}>
                          {el.heading}
                        </span>
                      )}

                      {el.type === 'barcode' ? (
                        <div className="w-full h-full flex items-center justify-center pointer-events-none">
                          <Barcode
                            value={el.text || '123456789012'}
                            format="CODE128"
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
                        <img src={el.src} alt="Uploaded" className="w-full h-full object-contain pointer-events-none" />
                      ) : el.type === 'icon' ? (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                          <span className="material-symbols-outlined leading-[0]" style={{ fontSize: `${Math.min(elW, elH)}px`, color: el.color || '#191c1e' }}>{el.iconName}</span>
                        </div>
                      ) : el.type === 'premiumIcon' ? (
                        <div className="w-full h-full p-1 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: el.svg }} />
                      ) : editingElementId === el.id ? (
                        <textarea
                          autoFocus
                          className="w-full h-full bg-transparent outline-none resize-none border-none p-0 m-0"
                          value={el.text || ''}
                          onChange={e => updateElement(el.id, { text: e.target.value })}
                          onBlur={() => { setEditingElementId(null); commitUpdate(); }}
                          onFocus={e => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
                          style={{
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            fontWeight: 'inherit',
                            fontStyle: 'inherit',
                            textDecoration: 'inherit',
                            color: 'inherit',
                            textAlign: 'inherit',
                            lineHeight: 'inherit',
                            overflow: 'hidden',
                          }}
                        />
                      ) : (
                        <span className="block w-full h-full">{el.text}</span>
                      )}
                    </div>
                  </Rnd>
                );
              })}
            </div>
          </div>
        </section>

        {/* RIGHT PROPERTIES PANEL */}
        <aside className="w-80 bg-[#F8FAFC] dark:bg-slate-900 border-l border-black/5 flex flex-col overflow-y-auto shrink-0 custom-scrollbar">
          {selectedElement ? (
            <div className="animate-fade-in pb-16">

              {/* Position Block */}
              <div className="p-4 border-b border-black/5 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-blue-600">Position & Layers</span>
                  <div className="flex gap-1">
                    <button onClick={() => duplicateElement(selectedElement.id)} className="p-1 rounded text-primary hover:bg-blue-50" title="Duplicate"><span className="material-symbols-outlined text-[14px]">content_copy</span></button>
                    <button onClick={() => deleteElement(selectedElement.id)} className="p-1 rounded text-error hover:bg-red-50" title="Delete"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {['x', 'y'].map(axis => (
                    <div key={axis} className="bg-white border border-slate-200 rounded-lg p-1.5 flex items-center">
                      <span className="text-[9px] font-bold text-slate-400 w-4 pl-1">{axis.toUpperCase()}</span>
                      <input type="number" className="w-full text-[11px] font-mono outline-none text-right bg-transparent" value={Math.round(selectedElement[axis]) || 0} onChange={e => { updateElement(selectedElement.id, { [axis]: parseInt(e.target.value) }); commitUpdate(); }} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[['front', 'flip_to_front'], ['up', 'arrow_upward'], ['down', 'arrow_downward'], ['back', 'flip_to_back']].map(([d, icon]) => (
                    <button key={d} onClick={() => moveLayer(selectedElement.id, d)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex justify-center text-slate-500 transition-colors" title={d}>
                      <span className="material-symbols-outlined text-[13px]">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data / Content Block — for all text-bearing types */}
              {['text', 'warnings', 'barcode', 'qrcode', 'manufacturing', 'dosage', 'storage', 'subtext'].includes(selectedElement.type) && (
                <div className="p-4 border-b border-black/5">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2">
                    {['barcode', 'qrcode'].includes(selectedElement.type) ? 'Data String' : 'Text Content'}
                  </span>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 text-[12px] py-2 px-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none rounded-lg resize-none min-h-[56px]"
                    value={selectedElement.text || ''}
                    placeholder={selectedElement.type === 'qrcode' ? 'https://...' : selectedElement.type === 'barcode' ? '123456789012' : 'Enter text…'}
                    onChange={e => updateElement(selectedElement.id, { text: e.target.value })}
                    onBlur={commitUpdate}
                  />
                </div>
              )}

              {/* Typography — only for non-media types */}
              {!['image', 'barcode', 'qrcode', 'icon'].includes(selectedElement.type) && (
                <div className="p-4 border-b border-black/5">
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
                          <option value="Times New Roman, serif">Times New Roman</option>
                          <option value="Courier New, monospace">Courier</option>
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
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block flex justify-between">
                        <span>Size</span><span className="font-mono">{selectedElement.fontSize || 12}px</span>
                      </label>
                      <input type="range" min="6" max="144" className="w-full accent-blue-600"
                        value={selectedElement.fontSize || 12}
                        onChange={e => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                        onMouseUp={commitUpdate} />
                    </div>

                    <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                      {[
                        ['fontStyle', 'italic', 'format_italic', selectedElement.fontStyle === 'italic'],
                        ['textDecoration', 'underline', 'format_underlined', selectedElement.textDecoration === 'underline'],
                      ].map(([prop, val, icon, active]) => (
                        <button key={prop} onClick={() => { updateElement(selectedElement.id, { [prop]: active ? (prop === 'fontStyle' ? 'normal' : 'none') : val }); commitUpdate(); }}
                          className={`flex-1 p-1.5 rounded text-center transition-colors ${active ? 'bg-primary text-white' : 'hover:bg-slate-200 text-slate-500'}`}>
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
                <div className="p-4 border-b border-black/5 space-y-4">
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

                  {/* Text / Ink color (all non-shape) */}
                  <div>
                    <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 block">
                      {['shape'].includes(selectedElement.type) ? 'Fill Color' : 'Text / Ink Color'}
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
                  {!['shape', 'barcode', 'qrcode', 'icon'].includes(selectedElement.type) && (
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
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <span className="material-symbols-outlined text-[52px] text-slate-200 mb-3">touch_app</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click any element</p>
              <p className="text-[9px] text-slate-300 mt-1 max-w-[160px]">to unlock its properties</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
