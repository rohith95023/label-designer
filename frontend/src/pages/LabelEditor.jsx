import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import BarcodeUnified from '../components/common/BarcodeUnified';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useLabel } from '../context/LabelContext';
import { useTheme } from '../context/ThemeContext';
import { Rnd } from 'react-rnd';
import html2canvas from 'html2canvas';
import { basicShapes, allIcons } from '../data/shapesLibrary';
import { v4 as uuidv4 } from 'uuid';
import FileNameModal from '../components/modals/FileNameModal';
import LabelSizeModal from '../components/modals/LabelSizeModal';
import { IconsIcons } from '../data/premiumIcons';
import { WORDART_CATEGORIES, WORDART_STYLES } from '../data/wordArtPresets';
import PreviewModal from '../components/modals/PreviewModal';
import { calcAutoFitFontSize } from '../utils/autoFitFont';
import Ruler from '../components/ui/Ruler';
import SmartGuides from '../components/ui/SmartGuides';
import GridOverlay from '../components/ui/GridOverlay';
import { calculateAlignmentGuides } from '../utils/alignment';
import { UNITS, toPx, fromPx, PX_PER_UNIT, getTickIntervals } from '../utils/units';
import { resolveElementData, SAMPLE_TRIAL_DATA } from '../utils/dynamicData';
import { resolveUrl } from '../utils/url';

function resolvePlaceholders(text, placeholderValues) {
  if (!text) return '';
  let result = text;
  Object.keys(placeholderValues).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, placeholderValues[key]);
  });
  return result;
}

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
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-[540px] max-h-[90vh] flex flex-col rounded-[24px] shadow-3xl shadow-blue-900/10 relative overflow-hidden border border-white/50 dark:border-white/10">
        
        {/* Subtle Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></div>

        <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 shadow-inner flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
              <span className="material-symbols-outlined text-[24px]">table_view</span>
            </div>
            <div>
              <h3 className="font-extrabold text-[18px] text-slate-800 dark:text-white leading-tight">Insert Data Table</h3>
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Choose a preset or customize grid dimensions</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-7 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
          
          <section>
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
              <span className="material-symbols-outlined text-[14px] text-indigo-500">grid_guides</span> Table Template
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'blank', label: 'Blank Grid', desc: 'Custom layout', icon: 'grid_on' },
                { id: 'composition', label: 'Ingredients', desc: 'Qty & Names', icon: 'science' },
                { id: 'usage', label: 'Dosage Guide', desc: 'Ages & Amounts', icon: 'medication' },
                { id: 'nutrition', label: 'Nutrition Facts', desc: 'Standard facts', icon: 'restaurant' },
              ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setTemplate(t.id)} 
                  className={`relative flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all overflow-hidden group ${
                    template === t.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 focus:outline-none' 
                    : 'border-slate-100 hover:border-slate-300 dark:border-white/5 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${template === t.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-white group-hover:text-blue-500 group-hover:shadow-sm'}`}>
                    <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                  </div>
                  <div>
                    <div className={`text-[13px] font-extrabold leading-none mb-1.5 ${template === t.id ? 'text-blue-800 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>{t.label}</div>
                    <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-slate-50/70 dark:bg-slate-800/30 rounded-[20px] p-5 border border-slate-100 dark:border-slate-800/50 flex gap-6">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-widest flex justify-between items-center text-slate-500 dark:text-slate-400 mb-3">
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">table_rows</span> Rows</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono text-[11px] bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-md leading-none">{rows}</span>
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min="1" max="50" className="flex-1 accent-blue-600" value={rows} onChange={e => setRows(Number(e.target.value))} />
                <input type="number" min="1" max="100" className="w-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-sm font-mono font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-center dark:text-white" value={rows} onChange={e => setRows(Math.max(1, Number(e.target.value)))} />
              </div>
            </div>
            
            {/* Divider */}
            <div className="w-[1px] bg-slate-200 dark:bg-slate-700 h-10 self-end mb-2"></div>

            <div className={`flex-1 transition-opacity duration-300 ${template !== 'blank' ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
              <label className="text-[10px] font-bold uppercase tracking-widest flex justify-between items-center text-slate-500 dark:text-slate-400 mb-3">
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">view_column</span> Columns</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono text-[11px] bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-md leading-none">{cols}</span>
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min="1" max="12" className="flex-1 accent-blue-600" value={cols} onChange={e => updateColCount(Number(e.target.value))} />
                <input type="number" min="1" max="20" className="w-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-sm font-mono font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-center dark:text-white" value={cols} onChange={e => updateColCount(Math.max(1, Number(e.target.value)))} />
              </div>
            </div>
          </section>

          {template === 'blank' && (
            <section className="animate-fade-in pb-2">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
                <span className="material-symbols-outlined text-[14px]">title</span> Column Headers
              </label>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: cols }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5 relative">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 absolute left-3.5 top-2.5 pointer-events-none">Col {i + 1}</span>
                    <input
                      type="text"
                      className="w-full bg-slate-50 hover:bg-white border-2 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white px-3.5 pt-7 pb-2.5 rounded-xl outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder-slate-300 dark:placeholder-slate-600"
                      value={colHeaders[i] || ''}
                      placeholder={`Enter name...`}
                      onChange={e => {
                        const next = [...colHeaders];
                        next[i] = e.target.value;
                        setColHeaders(next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        <div className="px-7 py-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-900/50">
          <button onClick={onCancel} className="px-6 py-2.5 text-[13px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm">Cancel</button>
          <button onClick={handleConfirm} className="px-7 py-2.5 text-[13px] font-bold text-white btn-gradient rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span> Insert Table
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AssetUploadModal({ onConfirm, onCancel, labelId }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('LOGO');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!name || !file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('type', type);
      formData.append('file', file);
      // Only link if labelId is a valid UUID (ignore tpl- placeholders)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(labelId);
      if (labelId && isUUID) {
        formData.append('labelId', labelId);
      }
      await api.uploadObject(formData);
      onConfirm();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-[420px] rounded-[24px] shadow-3xl border border-white/50 dark:border-white/10 overflow-hidden">
        <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
           <h3 className="font-extrabold text-[16px] text-slate-800 dark:text-white uppercase tracking-tight">Upload New Asset</h3>
           <button onClick={onCancel} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 transition-colors">
             <span className="material-symbols-outlined text-[20px]">close</span>
           </button>
        </div>
        <div className="p-7 flex flex-col gap-5">
           <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asset Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-blue-500 dark:text-white" placeholder="e.g. Pfizer Logo" />
           </div>
           <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Object Type</label>
              <div className="relative">
                <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-blue-500 appearance-none dark:text-white">
                   <option value="LOGO">LOGO / IMAGE</option>
                   <option value="ICON">UI ICON</option>
                   <option value="QR_SPEC">QR CODE SPEC</option>
                   <option value="BARCODE_SPEC">BARCODE SPEC</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
              </div>
           </div>
           <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Source File</label>
              <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-slate-300">cloud_upload</span>
                <input type="file" onChange={e => setFile(e.target.files[0])} className="text-[12px] font-bold text-slate-500 file:hidden" id="asset-upload-input" />
                <label htmlFor="asset-upload-input" className="cursor-pointer text-[11px] font-black text-blue-600 uppercase hover:underline">
                  {file ? file.name : 'Choose file or drag here'}
                </label>
              </div>
           </div>
        </div>
        <div className="px-7 py-5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
           <button onClick={onCancel} className="px-5 py-2.5 text-[13px] font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
           <button 
             onClick={handleUpload} 
             disabled={loading || !name || !file} 
             className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
           >
              {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> : <span className="material-symbols-outlined text-[18px]">cloud_upload</span>}
              {loading ? 'Uploading...' : 'Confirm Upload'}
           </button>
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
    elements, setElements, selectedIds, setSelectedIds,
    addElement, duplicateElement, updateElement, commitUpdate,
    deleteElement, moveLayer, alignElements,
    zoomLevel, setZoomLevel,
    undo, redo, historyIndex, historyLength,
    settings, updateSettings,
    savedStatus, toast, hydrated,
    validateLabel,
    saveFile, saveFileAs, openFileById, openFileFromJSON, exportJSON, getAllFiles,
    setUnit,
    labelStocks,
    toggleOrientation, saveAsTemplate, templates,
    loadTemplate,
  } = useLabel();

  const artboardRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);
  const navigate = useNavigate();
  const artboardContainerRef = useRef(null);
  const AW = meta.labelSize.w;
  const AH = meta.labelSize.h;

  // ── Keyboard & Mouse Events ────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Zoom
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoomLevel(z => Math.min(4, +(z + 0.1).toFixed(2)));
        }
        if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          setZoomLevel(z => Math.max(0.1, +(z - 0.1).toFixed(2)));
        }
        if (e.key === '0') {
          e.preventDefault();
          setZoomLevel(1);
        }
      }
      
      // Delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0 && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
           selectedIds.forEach(id => deleteElement(id));
           setSelectedIds([]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteElement, setSelectedIds, setZoomLevel]);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 0.9;
      setZoomLevel(z => Math.max(0.1, Math.min(4, +(z * factor).toFixed(2))));
    }
  }, [setZoomLevel]);

  const handleFitToScreen = useCallback(() => {
    if (!artboardContainerRef.current) return;
    const container = artboardContainerRef.current;
    const padding = 120; // Margin to see rulers and indicators
    const availableW = container.clientWidth - padding;
    const availableH = container.clientHeight - padding;
    const zoomW = availableW / AW;
    const zoomH = availableH / AH;
    setZoomLevel(Math.min(zoomW, zoomH, 2.0));
  }, [AW, AH, setZoomLevel]);

  const [activeTab, setActiveTab] = useState('elements');
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showEditorViewSettings, setShowEditorViewSettings] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [bulkSuffix, setBulkSuffix] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const originalTexts = useRef({}); // Tracks base text during bulk suffix editing
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [artboardCursor, setArtboardCursor] = useState({ x: null, y: null });
  const [activeAlignmentGuides, setActiveAlignmentGuides] = useState([]);
  const [shapeDrawingTool, setShapeDrawingTool] = useState(null); // 'rectangle' | 'circle' | 'line'
  const [drawingStart, setDrawingStart] = useState(null);
  const [drawingCurrent, setDrawingCurrent] = useState(null);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [expandedObjectsGroups, setExpandedObjectsGroups] = useState({});
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGuides, setSnapToGuides] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [manualGuidelines, setManualGuidelines] = useState([]); // [{ orientation, pos }]
  const [gridSize, setGridSize] = useState(10);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [navWidth, setNavWidth] = useState(200);
  const [panelWidth, setPanelWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(300);
  const [sidebarSearch, setSidebarSearch] = useState('');

  // --- Placeholder & Object Logic ---
  const [placeholders, setPlaceholders] = useState([]);
  const [placeholdersLoading, setPlaceholdersLoading] = useState(false);
  const [objects, setObjects] = useState([]);
  const [objectsLoading, setObjectsLoading] = useState(false);

  useEffect(() => {
    const fetchAssets = async () => {
      setPlaceholdersLoading(true);
      setObjectsLoading(true);
      try {
        const [phData, objData] = await Promise.all([
          api.getPlaceholders(),
          api.getObjects()
        ]);
        setPlaceholders(phData);
        setObjects(objData);
      } catch (err) {
        console.error("Failed to fetch assets:", err);
      } finally {
        setPlaceholdersLoading(false);
        setObjectsLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const refreshObjects = async () => {
    setObjectsLoading(true);
    try {
      const objData = await api.getObjects();
      setObjects(objData);
    } catch (err) {
      console.error("Failed to refresh objects:", err);
    } finally {
      setObjectsLoading(false);
    }
  };

  const addPlaceholder = (ph) => {
    addElement({
      type: 'text',
      text: `{{${ph.mappingKey}}}`,
      name: ph.name,
      placeholderKey: ph.mappingKey,
      fontSize: 14,
      fontFamily: 'Inter, sans-serif',
      fontWeight: '600',
      color: '#2563eb', // Blue for placeholders by default
      width: 140,
      height: 24,
      isPlaceholder: true
    });
  };

  // ── Export ──────────────────────────────────────────────────────────────────
  const captureArtboard = useCallback(async () => {
    const prevSelection = selectedIds;
    const prevGrid = showGrid;
    setSelectedIds([]);
    setShowGrid(false);
    
    // Temporarily force overflow hidden to clip elements outside label area for export
    const originalOverflow = artboardRef.current.style.overflow;
    artboardRef.current.style.overflow = 'hidden';
    
    await new Promise(r => setTimeout(r, 150));
    const canvas = await html2canvas(artboardRef.current, { 
      scale: 3, 
      useCORS: true, 
      backgroundColor: '#ffffff',
      logging: false 
    });
    
    // Restore state
    artboardRef.current.style.overflow = originalOverflow;
    if (prevSelection.length > 0) setSelectedIds(prevSelection);
    setShowGrid(prevGrid);
    return canvas;
  }, [selectedIds, setSelectedIds, showGrid, setShowGrid]);

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

  const handlePrint = useCallback(async () => {
    const canvas = await captureArtboard();
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Print – ${meta.fileName || 'Label'}</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff;} img{max-width:100%;}</style>
      </head><body><img src="${canvas.toDataURL()}" /><script>window.onload=()=>{window.print();window.close();}<\/script></body></html>
    `);
    win.document.close();
    setShowFileMenu(false);
  }, [captureArtboard, meta.fileName]);

  const addObject = (obj) => {
    if (obj.type === 'LOGO') {
      addElement({
        type: 'image',
        src: obj.fileUrl,
        name: obj.name,
        width: 120,
        height: 120,
        imageFit: 'contain'
      });
    } else if (obj.type === 'ICON') {
      addElement({
        type: 'icon',
        iconName: obj.name.toLowerCase().replace(/\s+/g, '_'), // Heuristic for material symbols
        name: obj.name,
        width: 48,
        height: 48,
        color: '#191C1E'
      });
    } else if (obj.type === 'QR_SPEC') {
      addElement({
        type: 'qrcode',
        text: 'SPEC_QR_DATA', // Ideally this would come from the spec
        name: obj.name,
        width: 80,
        height: 80,
        color: '#191C1E'
      });
    } else if (obj.type === 'BARCODE_SPEC') {
      addElement({
        type: 'barcode',
        text: 'SPEC_BAR_DATA',
        name: obj.name,
        width: 180,
        height: 80,
        color: '#191C1E'
      });
    }
  };

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
    const close = () => { 
      setShowFileMenu(false); 
      setShowExportMenu(false); 
      setShowViewMenu(false);
      setShowEditorViewSettings(false);
      setShowToolsMenu(false);
    };
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
      if ((e.ctrlKey || e.metaKey) && key === 'd' && selectedIds.length > 0) { e.preventDefault(); duplicateElement(selectedIds[0]); }
      if ((e.ctrlKey || e.metaKey) && key === 'p') {
        e.preventDefault();
        setSelectedIds([]);
        handlePrint();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIds, saveFile, undo, redo, duplicateElement, deleteElement, setSelectedIds, handlePrint]);

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
        };

        // Maintain aspect ratio for all elements to prevent "disturbed" / distorted shapes
        // Use sMin for dimensions while using sX/sY for relative positioning
        if (el.width)  up.width  = Math.max(2, Math.round(el.width * sMin));
        if (el.height) up.height = Math.max(2, Math.round(el.height * sMin));

        // Scale fonts if present
        if (el.fontSize) {
          up.fontSize = Math.max(4, Math.round(el.fontSize * sMin)); // Absolute min 4px
        }

        // Proportional border/stroke scaling for shapes
        if (el.type === 'shape') {
           if (el.borderWidth)  up.borderWidth = Math.max(1, Math.round(el.borderWidth * sMin));
           if (el.borderRadius) up.borderRadius = Math.round(el.borderRadius * sMin);
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

  const selectedElement = elements.find(e => e.id === selectedIds[0]);

  // ── Artboard element clamp ───────────────────────────────────────────────────
  // Strictly enforce bounds based on rotated bounding box
  const clampPos = (x, y, elW, elH, rot = 0) => {
    // Restriction removed per user request to allow movement across entire canvas.
    // Coordinates are now unconstrained.
    return { x, y };
  };

  const statusColor = savedStatus === 'saved' ? 'text-green-600' : savedStatus === 'saving' ? 'text-amber-500' : 'text-slate-400';
  const statusIcon = savedStatus === 'saved' ? 'check_circle' : savedStatus === 'saving' ? 'sync' : 'edit';
  const statusLabel = savedStatus === 'saved' ? 'Saved' : savedStatus === 'saving' ? 'Saving…' : 'Unsaved';

  return (
    <div className="font-body text-on-surface h-screen flex flex-col overflow-hidden bg-background transition-colors">

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

      {showAssetModal && (
        <AssetUploadModal 
          onConfirm={() => { setShowAssetModal(false); refreshObjects(); }} 
          onCancel={() => setShowAssetModal(false)}
          labelId={meta.fileId}
        />
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
          <div className="glass-card bg-white dark:bg-slate-800 rounded-2xl shadow-float w-[360px] p-6 flex flex-col gap-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <span className="material-symbols-outlined text-xl">delete_sweep</span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">Delete {selectedIds.length} Elements?</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setShowBulkDeleteModal(false)} 
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const remaining = elements.filter(el => !selectedIds.includes(el.id));
                  setElements(remaining);
                  setSelectedIds([]);
                  setShowBulkDeleteModal(false);
                  commitUpdate(remaining);
                }} 
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-[11px] font-black uppercase tracking-wider hover:bg-red-700 shadow-sm transition-all"
              >
                Delete All
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

      {/* ── Premium Top Nav ──────────────────────────────────────────────────── */}
      <motion.header 
        className="h-16 glass-header flex items-center justify-between px-6 shrink-0 z-[2000]"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Left: File Menu + Title */}
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-extrabold tracking-tighter text-gradient shrink-0">Pharma Label Design</Link>
          <div className="w-[1px] h-6 bg-outline-variant/30 mx-1"></div>

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
              <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-outline-variant/20 overflow-hidden z-[2100] animate-fade-in">
                {[
                  { label: 'New File', icon: 'add_circle', action: triggerNewFile },
                  { label: 'Open File (.json)', icon: 'folder_open', action: () => jsonInputRef.current?.click() },
                  null,
                  { label: 'Save', icon: 'save', action: () => { saveFile(); setShowFileMenu(false); }, shortcut: 'Ctrl+S' },
                  { label: 'Save as File (.json)', icon: 'download', action: () => { exportJSON(); setShowFileMenu(false); } }
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
            <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight truncate max-w-[200px]">{meta.fileName || 'Untitled Label'}</span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${savedStatus === 'saved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'} text-[10px] font-black uppercase tracking-wider shadow-sm`}>
              <span className={`material-symbols-outlined text-[14px] ${savedStatus === 'saving' ? 'animate-spin' : ''}`}>{statusIcon}</span>
              {statusLabel}
            </div>
          </div>
        </div>

        {/* Center: Nav links */}
        <nav className="hidden xl:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 bg-slate-100/80 dark:bg-white/5 p-1 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm">
          <Link to="/" className="px-5 py-1.5 rounded-lg text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/90 dark:hover:bg-white/10 transition-all">Dashboard</Link>
          <Link to="/assets" className="px-5 py-1.5 rounded-lg text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/90 dark:hover:bg-white/10 transition-all">Templates</Link>
          <Link to="/editor" className="px-5 py-1.5 rounded-lg text-[12px] font-bold bg-white dark:bg-white/15 text-primary shadow-sm border border-slate-200/50 dark:border-white/10 forced-active">Label Editor</Link>
          <Link to="/translation" className="px-5 py-1.5 rounded-lg text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/90 dark:hover:bg-white/10 transition-all">Translation</Link>
        </nav>

        {/* Right: Toolset */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); setShowFileMenu(false); }}
              className="h-9 px-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-[0.05em] shadow-sm flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Export
              <span className="material-symbols-outlined text-[18px]">{showExportMenu ? 'arrow_drop_up' : 'arrow_drop_down'}</span>
            </button>

            {showExportMenu && (
              <div className="absolute top-10 right-0 w-44 bg-white border border-outline-variant/30 shadow-lg rounded-xl py-1.5 z-[9999] animate-fade-in origin-top-right">
                {[
                  { label: 'Export PNG', icon: 'image', action: () => { handleExportPNG(); setShowExportMenu(false); } },
                  { label: 'Export PDF', icon: 'picture_as_pdf', action: () => { handleExportPDF(); setShowExportMenu(false); } },
                  { label: 'Save as Template', icon: 'auto_awesome_motion', action: () => {
                    const name = prompt('Enter a name for this template:', meta.fileName || 'New Template');
                    if (name) saveAsTemplate(name);
                    setShowExportMenu(false);
                  } },
                   null,
                  { label: 'Print Label', icon: 'print', action: () => { handlePrint(); setShowExportMenu(false); } }
                ].map((item, i) => item === null ? (
                  <div key={`sep-${i}`} className="h-[1px] bg-slate-100 my-1" />
                ) : (
                  <button key={item.label} onClick={item.action} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors text-left tracking-tight">
                    <span className="material-symbols-outlined text-[18px] text-slate-500">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* ── Premium Secondary Toolbar ────────────────────────────────────────── */}
      <motion.div 
        className="h-14 glass-header border-b border-white/20 dark:border-white/10 flex items-center px-4 gap-4 shrink-0 relative z-[100] shadow-sm select-none"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Column 1: Precision Controls (Left) */}
        <div className="flex-1 flex items-center justify-start">
          <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-white/5 p-1 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm h-10">
            <motion.button 
              onClick={undo} 
              disabled={historyIndex <= 0} 
              title="Undo (Ctrl+Z)" 
              className="w-8 h-8 rounded-lg hover:bg-white dark:hover:bg-white/10 disabled:opacity-20 text-slate-600 dark:text-slate-400 transition-all flex items-center justify-center shadow-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
            </motion.button>
            <motion.button 
              onClick={redo} 
              disabled={historyIndex >= historyLength - 1} 
              title="Redo (Ctrl+Y)" 
              className="w-8 h-8 rounded-lg hover:bg-white dark:hover:bg-white/10 disabled:opacity-20 text-slate-600 dark:text-slate-400 transition-all flex items-center justify-center shadow-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
            </motion.button>

            <div className="w-[1px] h-4 bg-slate-300 dark:bg-white/10 mx-1"></div>

            <button onClick={() => setZoomLevel(z => Math.max(0.1, +(z - 0.1).toFixed(2)))} className="w-8 h-8 rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-500 flex items-center justify-center transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <button 
              onClick={handleFitToScreen}
              className="text-[10px] font-black font-mono text-slate-700 dark:text-slate-200 min-w-12 text-center select-none py-1.5 hover:bg-white/10 rounded-md transition-colors"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button onClick={() => setZoomLevel(z => Math.min(4, +(z + 0.1).toFixed(2)))} className="w-8 h-8 rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-500 flex items-center justify-center transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
          </div>
        </div>

        {/* Column 2: Workspace Options (Center) */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-4">
            {/* Quick Alignment Toolbar */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-white/5 p-1 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                {[
                  { id: 'left', icon: 'align_horizontal_left', title: 'Align Left' },
                  { id: 'centerH', icon: 'align_horizontal_center', title: 'Align Center Horizontal' },
                  { id: 'right', icon: 'align_horizontal_right', title: 'Align Right' },
                  { id: 'sep1', type: 'sep' },
                  { id: 'top', icon: 'align_vertical_top', title: 'Align Top' },
                  { id: 'centerV', icon: 'align_vertical_center', title: 'Align Center Vertical' },
                  { id: 'bottom', icon: 'align_vertical_bottom', title: 'Align Bottom' },
                ].map((btn) => btn.type === 'sep' ? (
                  <div key={btn.id} className="w-[1px] h-5 bg-slate-200 dark:bg-white/10 mx-1" />
                ) : (
                  <button
                    key={btn.id}
                    onClick={() => alignElements(btn.id)}
                    className="w-8 h-8 rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-500 hover:text-primary transition-all flex items-center justify-center"
                    title={btn.title}
                  >
                    <span className="material-symbols-outlined text-[18px]">{btn.icon}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-1 hidden md:block"></div>

            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowEditorViewSettings(!showEditorViewSettings); }}
                className={`h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.05em] transition-all flex items-center gap-2 border shadow-sm ${showEditorViewSettings ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-slate-100/80 dark:bg-white/5 border-slate-200/50 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-primary/40'}`}
              >
                <span className="material-symbols-outlined text-[18px]">grid_guides</span>
                View Options
                <span className="material-symbols-outlined text-[16px]">{showEditorViewSettings ? 'expand_less' : 'expand_more'}</span>
              </button>

              {showEditorViewSettings && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-11 left-1/2 -translate-x-1/2 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl p-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="px-3 py-2 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Environment & Snapping</p>
                  </div>
                  
                  {[
                    { id: 'guides', label: 'Smart Guidelines', desc: 'Alignment & distance lines', icon: 'grid_guides', active: showGuidelines, toggle: () => setShowGuidelines(!showGuidelines) },
                    { id: 'grid', label: 'Visual Grid', desc: 'Static document grid', icon: 'grid_4x4', active: showGrid, toggle: () => setShowGrid(!showGrid) },
                    { id: 'magnet', label: 'Snap to Objects', desc: 'Magnetic positioning', active: snapToGuides, toggle: () => setSnapToGuides(!snapToGuides), isSVG: true },
                    { id: 'snapGrid', label: 'Snap to Grid', desc: 'Lock to grid lines', icon: 'grid_guides', active: snapToGrid, toggle: () => setSnapToGrid(!snapToGrid) },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={(e) => { e.stopPropagation(); item.toggle(); }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${item.active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400 dark:bg-white/5'}`}>
                          {item.isSVG ? (
                             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10v4a7 7 0 0 0 14 0v-4" /><path d="M15 10V5a3 3 0 0 0-6 0v5" /><path d="M12 2v3" /></svg>
                          ) : (
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                          )}
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className={`text-[12px] font-bold ${item.active ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{item.label}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{item.desc}</span>
                        </div>
                      </div>
                      <div className={`w-9 h-5 rounded-full relative transition-all duration-300 border shadow-inner ${item.active ? 'bg-primary border-primary shadow-indigo-600/20' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                         <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-md transition-all duration-300 ${item.active ? 'right-1' : 'left-1'}`} />
                      </div>
                    </button>
                  ))}

                  <div className="px-3 py-3">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Grid Density</span>
                       <span className="text-[10px] font-bold text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md">{gridSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      step="5" 
                      value={gridSize} 
                      onChange={(e) => setGridSize(Number(e.target.value))} 
                      className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg accent-primary" 
                    />
                  </div>

                  <div className="h-[1px] bg-slate-100 dark:bg-white/5 my-2 mx-2" />
                  
                  <div className="px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Display Units</p>
                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl gap-1">
                      {[UNITS.MM, UNITS.CM, UNITS.IN, UNITS.PX].map(u => (
                        <button
                          key={u}
                          onClick={(e) => { e.stopPropagation(); setUnit(u); }}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${meta.unit === u ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-[1px] bg-slate-100 dark:bg-white/5 my-2 mx-2" />
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); setManualGuidelines([]); setShowEditorViewSettings(false); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-100/50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                    </div>
                    <span className="text-[12px] font-bold">Purge Manual Guides</span>
                  </button>
                </div>
              )}
            </div>

            <div className="w-[1px] h-4 bg-outline-variant/20 mx-1"></div>

            {/* Consolidated Tools & Modes Dropdown */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowToolsMenu(!showToolsMenu); }}
                className={`h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.05em] transition-all flex items-center gap-2 border shadow-sm ${showToolsMenu ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 text-indigo-700' : 'bg-slate-100/80 dark:bg-white/5 border-slate-200/50 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-indigo-400'}`}
              >
                <span className="material-symbols-outlined text-[18px]">build</span>
                Editor Tools
                <span className="material-symbols-outlined text-[16px]">{showToolsMenu ? 'expand_less' : 'expand_more'}</span>
              </button>

              {showToolsMenu && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-11 left-1/2 -translate-x-1/2 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl p-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="px-3 py-2 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Content & Interaction</p>
                  </div>
                  
                  <button onClick={() => { setShowWordArtModal(true); setShowToolsMenu(false); }} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"><span className="material-symbols-outlined text-[24px]">abc</span></div>
                    <div className="flex flex-col items-start gap-0.5"><span className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">WordArt</span><span className="text-[10px] text-slate-400 font-medium">Add stylized decorative text</span></div>
                  </button>

                  <button onClick={() => { setIsDrawingMode(!isDrawingMode); setShowToolsMenu(false); }} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${isDrawingMode ? 'bg-indigo-50 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${isDrawingMode ? 'bg-indigo-600 text-white shadow-glow' : 'bg-slate-100 text-slate-400'}`}><span className="material-symbols-outlined text-[24px]">edit_note</span></div>
                    <div className="flex flex-col items-start gap-0.5"><span className={`text-[13px] font-bold uppercase tracking-tight ${isDrawingMode ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>Freehand</span><span className="text-[10px] text-slate-400 font-medium text-left">Draw or write on the label</span></div>
                  </button>

                  <div className="h-[1px] bg-slate-100 dark:bg-white/5 my-2 mx-2" />

                  <button onClick={() => { handleValidate(); setShowToolsMenu(false); }} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"><span className="material-symbols-outlined text-[24px]">fact_check</span></div>
                    <div className="flex flex-col items-start gap-0.5"><span className="text-[13px] font-bold text-indigo-700 uppercase tracking-tight">Validate</span><span className="text-[10px] text-slate-400 font-medium">Check for compliance errors</span></div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Design Review (Right) */}
        <div className="flex-1 flex items-center justify-end gap-2 pr-1">
          {/* Label Size Info */}
          <div className="flex bg-slate-100/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-xl p-0.5 shadow-sm">
            <button
              onClick={() => setModalStep('labelsize')}
              className="flex items-center gap-2 h-9 px-3 rounded-lg text-[10px] font-black text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-white/50 transition-all"
              title="Edit label dimensions"
            >
              <span className="material-symbols-outlined text-[16px]">aspect_ratio</span>
              <span className="font-mono tracking-tight hidden lg:block">
                {Math.round(AW / 3.7795275591)}×{Math.round(AH / 3.7795275591)}mm
              </span>
            </button>
            <div className="w-[1px] h-4 bg-slate-200 self-center mx-0.5" />
            <button
              onClick={toggleOrientation}
              className="flex items-center gap-2 h-9 px-3 rounded-lg text-[10px] font-black text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
              title="Toggle Portrait/Landscape"
            >
              <span className="material-symbols-outlined text-[16px]">screen_rotation</span>
            </button>
          </div>

          {/* Live Review Group */}
          <div className="flex items-center gap-1.5 px-1.5 py-1 bg-slate-100/50 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm h-10">
            <button 
              onClick={() => setPreviewMode(!previewMode)} 
              title={previewMode ? "Show Raw Placeholders" : "Show Live Trial Data"}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all h-8 ${previewMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-white/10 text-slate-500 shadow-sm border border-slate-200 dark:border-white/10'}`}
            >
              <span className="material-symbols-outlined text-[16px]">{previewMode ? 'database' : 'toll'}</span>
              {previewMode ? 'Live Data' : 'Tokens'}
            </button>
            <div className="w-[1px] h-3 bg-slate-300 dark:bg-white/10"></div>
            <button 
              onClick={() => setShowPreviewModal(true)} 
              title="Print Preview"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 hover:bg-white dark:hover:bg-white/10 transition-all h-8"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              Preview
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Premium Main 3-Column Area ──────────────────────────────────────────── */}
      <motion.main 
        className="flex flex-1 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >

        <motion.aside 
          className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 flex flex-col overflow-hidden shrink-0 relative z-[998] shadow-sm"
          initial={false}
          animate={{ width: navCollapsed ? 56 : navWidth }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
        >
          {/* Resizer Handle for Nav Rail */}
          {!navCollapsed && (
             <div 
               className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/30 active:bg-blue-500 z-50 transition-colors"
               onMouseDown={(e) => {
                 const startX = e.clientX;
                 const startW = navWidth;
                 const handleMove = (em) => {
                   const diff = em.clientX - startX;
                   setNavWidth(Math.max(160, Math.min(320, startW + diff)));
                 };
                 const handleUp = () => {
                   document.removeEventListener('mousemove', handleMove);
                   document.removeEventListener('mouseup', handleUp);
                 };
                 document.addEventListener('mousemove', handleMove);
                 document.addEventListener('mouseup', handleUp);
               }}
             />
          )}
          {/* Header & Search */}
          {!navCollapsed && (
             <div className="p-4 space-y-4 border-b border-slate-200 dark:border-white/5 shrink-0 bg-slate-50/30 dark:bg-transparent">
                <div className="flex items-center justify-between">
                   <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Workspace</h2>
                </div>
                <div className="relative group">
                   <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-[16px] text-slate-500 group-focus-within:text-blue-500 transition-colors">search</span>
                   <input 
                     type="text" 
                     placeholder="Search..." 
                     value={sidebarSearch}
                     onChange={e => setSidebarSearch(e.target.value)}
                     className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 text-[11px] font-medium text-slate-700 dark:text-slate-300 pl-9 pr-3 py-1.5 rounded-md outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                   />
                </div>
             </div>
          )}

          {/* Navigation & Groups */}
          <div className="flex-1 overflow-y-auto custom-scrollbar-thin flex flex-col py-2 px-2 gap-1 select-none">
            {[
              { 
                group: 'Nodes', 
                items: [
                  { id: 'elements', icon: 'add_circle', label: 'Elements' },
                  { id: 'shapes', icon: 'category', label: 'Shapes' },
                  { id: 'Icons', icon: 'medical_services', label: 'Icons' },
                ] 
              },
              { 
                group: 'Assets', 
                items: [
                  { id: 'Objects', icon: 'image', label: 'Objects' },
                  { id: 'templates', icon: 'auto_awesome_motion', label: 'Templates' },
                  { id: 'stocks', icon: 'inventory', label: 'Label Stocks' },
                  { id: 'Variables', icon: 'database', label: 'Variables' },
                ] 
              },
              { 
                group: 'Layers', 
                items: [
                  { id: 'layers', icon: 'layers', label: 'Element Tree', badge: elements.length },
                ] 
              },
              { 
                group: 'Collaboration', 
                items: [
                  { id: 'notes', icon: 'description', label: 'Label Notes' },
                ] 
              }
            ].map((section, idx) => {
              const filteredItems = section.items.filter(it => it.label.toLowerCase().includes(sidebarSearch.toLowerCase()));
              if (filteredItems.length === 0 && sidebarSearch) return null;

              return (
                <div key={idx} className="flex flex-col mb-4">
                   {!navCollapsed && (
                      <div className="px-3 mb-1.5 flex items-center gap-2">
                         <span className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-600 whitespace-nowrap">{section.group}</span>
                         <div className="h-[1px] w-full bg-slate-200 dark:bg-white/5" />
                      </div>
                   )}
                   <div className="flex flex-col gap-0.5">
                      {filteredItems.map(t => (
                        <motion.button 
                          key={t.id} 
                          onClick={() => { setActiveTab(t.id); if (panelCollapsed) setPanelCollapsed(false); }}
                          className={`group flex items-center gap-3 transition-all relative ${navCollapsed ? 'w-10 h-10 justify-center rounded-lg mx-auto' : 'w-full px-3 py-2 rounded-md'} ${activeTab === t.id ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-slate-200'}`}
                          whileTap={{ scale: 0.98 }}
                          title={navCollapsed ? t.label : ''}
                        >
                           {activeTab === t.id && (
                              <motion.div 
                                layoutId="sidebarActiveLine"
                                className="absolute left-0 top-1 bottom-1 w-[2px] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] rounded-full"
                              />
                           )}
                           <span className={`material-symbols-outlined text-[18px] transition-transform ${activeTab === t.id ? 'scale-110' : 'group-hover:scale-105'}`}>{t.icon}</span>
                           {!navCollapsed && (
                              <div className="flex items-center justify-between flex-1 min-w-0">
                                 <span className="text-[11px] font-bold tracking-tight truncate">{t.label}</span>
                                 {t.badge > 0 && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 opacity-50`}>{t.badge}</span>}
                              </div>
                           )}
                        </motion.button>
                      ))}
                   </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Controls */}
          <div className="p-3 border-t border-slate-200 dark:border-white/5 flex flex-col gap-1 shrink-0 bg-slate-50/50 dark:bg-transparent">
             <button onClick={() => setNavCollapsed(!navCollapsed)} className="flex items-center gap-3 text-slate-600 hover:text-slate-400 p-2 transition-all group" title={navCollapsed ? "Expand Rail" : "Collapse Rail"}>
                <span className="material-symbols-outlined text-[18px] transition-transform duration-500" style={{ transform: navCollapsed ? 'rotate(180deg)' : 'none' }}>side_navigation</span>
                {!navCollapsed && <span className="text-[9px] uppercase tracking-widest font-black">Collapse Rail</span>}
             </button>
             <button onClick={() => setPanelCollapsed(!panelCollapsed)} className="flex items-center gap-3 text-slate-600 hover:text-slate-400 p-2 transition-all group" title={panelCollapsed ? "Show Asset Panel" : "Hide Asset Panel"}>
                <span className="material-symbols-outlined text-[18px]">{panelCollapsed ? 'dock_to_right' : 'dock_to_left'}</span>
                {!navCollapsed && <span className="text-[9px] uppercase tracking-widest font-black">{panelCollapsed ? 'Open Panel' : 'Close Panel'}</span>}
             </button>
          </div>
        </motion.aside>

        {/* Content Area for Asset Managers */}
        <div 
          className={`transition-all duration-300 overflow-hidden shrink-0 border-r border-slate-200 dark:border-white/5 flex flex-col bg-white dark:bg-slate-900/50 relative`}
          style={{ width: panelCollapsed ? 0 : panelWidth }}
        >
           {/* Resizer Handle for Asset Panel */}
           {!panelCollapsed && (
              <div 
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/30 active:bg-blue-500 z-50 transition-colors"
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startW = panelWidth;
                  const handleMove = (em) => {
                    const diff = em.clientX - startX;
                    setPanelWidth(Math.max(220, Math.min(480, startW + diff)));
                  };
                  const handleUp = () => {
                    document.removeEventListener('mousemove', handleMove);
                    document.removeEventListener('mouseup', handleUp);
                  };
                  document.addEventListener('mousemove', handleMove);
                  document.addEventListener('mouseup', handleUp);
                }}
              />
           )}
           {/* Tiny internal panel toggle when rail is collapsed but panel is open */}
           {navCollapsed && !panelCollapsed && (
              <button onClick={() => setPanelCollapsed(true)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 z-50">
                 <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
           )}
           {!panelCollapsed && (
             <div className="flex-1 overflow-y-auto custom-scrollbar-thin p-6 animate-fade-in">

            {/* LABEL STOCKS TAB */}
            {activeTab === 'stocks' && (
              <div className="animate-fade-in flex flex-col gap-6">
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Pharma Inventory</span>
                    <button onClick={() => navigate('/masters/label-stocks')} className="text-[9px] font-black text-blue-600 hover:underline">Manage</button>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">Select Physical Media</p>
                </div>

                <div className="flex flex-col gap-3">
                  {labelStocks.filter(s => s.status === 'ACTIVE').map(stock => {
                    const isSelected = meta.labelStockId === stock.id;
                    const isLowStock = stock.quantityOnHand <= stock.reorderLevel;

                    return (
                      <motion.button
                        key={stock.id}
                        onClick={() => setLabelStock(stock.id)}
                        className={`group relative flex flex-col p-4 rounded-2xl border-2 text-left transition-all ${
                          isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                          : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-white/10 hover:border-blue-500/50'
                        }`}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                            <span className="material-symbols-outlined text-[18px]">{isSelected ? 'check_circle' : 'inventory'}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                              {stock.breadth}×{stock.height}mm
                            </span>
                            {isLowStock && (
                              <span className="flex items-center gap-1 text-[8px] font-black text-red-500 animate-pulse mt-0.5">
                                <span className="material-symbols-outlined text-[10px]">warning</span> LOW STOCK
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-[12px] font-black uppercase tracking-tight truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                          {stock.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1 opacity-70">
                          <span className="text-[9px] font-bold uppercase tracking-widest">{stock.materialType || 'Paper'}</span>
                          <div className="w-1 h-1 rounded-full bg-current opacity-30"></div>
                          <code className="text-[9px] font-mono">{stock.stockId}</code>
                        </div>
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black uppercase opacity-60">Supplier</span>
                              <span className="text-[10px] font-bold truncate">{stock.supplier || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black uppercase opacity-60">Available</span>
                              <span className="text-[10px] font-bold">{stock.quantityOnHand} {stock.unitOfMeasure}</span>
                            </div>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VARIABLES / PLACEHOLDERS TAB */}
            {activeTab === 'Variables' && (
              <div className="animate-fade-in flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Available Variables</h4>
                  <button onClick={() => navigate('/masters/placeholders')} className="text-[9px] font-bold text-blue-600 hover:underline">Manage</button>
                </div>
                {placeholdersLoading ? (
                  <div className="py-10 flex flex-col items-center opacity-30">
                    <div className="um-spinner w-4 h-4 mb-2" />
                    <span className="text-[10px]">Loading...</span>
                  </div>
                ) : placeholders.length === 0 ? (
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                    <p className="text-[10px] text-slate-500">No placeholders found.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {placeholders.map(ph => {
                      const payload = {
                        type: 'text',
                        text: `{{${ph.mappingKey}}}`,
                        name: ph.name,
                        placeholderKey: ph.mappingKey,
                        fontSize: 14,
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: '600',
                        color: '#2563eb',
                        width: 140,
                        height: 24,
                        isPlaceholder: true
                      };
                      return (
                        <button
                          key={ph.id}
                          onClick={() => addPlaceholder(ph)}
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData('application/json', JSON.stringify(payload));
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg hover:border-blue-500 hover:shadow-sm hover:translate-x-1 transition-all group text-left cursor-grab active:cursor-grabbing shadow-sm"
                        >
                          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[14px]">database</span>
                          </div>
                          <div className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 truncate tracking-tight">{ph.name}</span>
                            <code className="text-[8px] text-blue-500 font-mono font-bold">{`{{${ph.mappingKey}}}`}</code>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Objects' && (
              <div className="animate-fade-in flex flex-col gap-4">
                <div className="px-1 flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[15px]">inventory_2</span>
                      Object Library
                    </h3>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setShowAssetModal(true)}
                      className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors shadow-sm border border-blue-100/50 dark:border-blue-900/40"
                      title="Upload New Asset"
                    >
                      <span className="material-symbols-outlined text-[18px]">upload</span>
                    </button>
                    <button 
                      onClick={() => saveFile()} 
                      className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:emerald-400 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors shadow-sm border border-emerald-100/50 dark:border-emerald-900/40"
                      title="Save All Changes"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                    </button>
                  </div>
                </div>
                <p className="px-1 text-[9px] text-slate-500 font-bold leading-tight -mt-4 mb-2">Pre-configured managed assets for clinical labels</p>

                {objectsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Assets...</span>
                  </div>
                ) : objects.length === 0 ? (
                  <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center border border-slate-200 dark:border-white/10">
                       <span className="material-symbols-outlined text-[20px] text-slate-300">image_not_supported</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                       <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight">No Objects Found</p>
                       <p className="text-[9px] text-slate-400 font-bold">Configure assets in settings</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {Object.entries(
                      objects.reduce((acc, obj) => {
                        const labelTitle = obj.label ? obj.label.name : "Global Workspace Assets";
                        if (!acc[labelTitle]) acc[labelTitle] = [];
                        acc[labelTitle].push(obj);
                        return acc;
                      }, {})
                    ).map(([groupName, groupObjects]) => (
                      <div key={groupName} className="flex flex-col gap-1.5">
                        <button 
                          onClick={() => setExpandedObjectsGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 group transition-all"
                        >
                          <div className="flex items-center gap-2">
                             <span className="material-symbols-outlined text-[16px] text-blue-500 group-hover:rotate-12 transition-transform">folder_open</span>
                             <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight truncate max-w-[140px]">{groupName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-500">{groupObjects.length}</span>
                            <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-300 ${expandedObjectsGroups[groupName] ? 'rotate-180' : ''}`}>expand_more</span>
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {expandedObjectsGroups[groupName] && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-2 gap-3 p-1.5 pt-2">
                                {groupObjects.map(obj => {
                                  const payload = {
                                    type: obj.type === 'LOGO' ? 'image' : obj.type === 'ICON' ? 'icon' : obj.type === 'QR_SPEC' ? 'qrcode' : 'barcode',
                                    src: obj.fileUrl,
                                    name: obj.name,
                                    width: obj.type === 'LOGO' ? 120 : (obj.type === 'ICON' ? 48 : (obj.type === 'QR_SPEC' ? 80 : 180)),
                                    height: obj.type === 'LOGO' ? 120 : (obj.type === 'ICON' ? 48 : 80),
                                    imageFit: 'contain'
                                  };
                                  return (
                                    <motion.button
                                      key={obj.id}
                                      whileHover={{ scale: 1.02, translateY: -2 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => addObject(obj)}
                                      draggable
                                      onDragStart={e => {
                                        e.dataTransfer.setData('application/json', JSON.stringify(payload));
                                        e.dataTransfer.effectAllowed = 'copy';
                                      }}
                                      className="group relative flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all cursor-grab active:cursor-grabbing shadow-sm"
                                    >
                                      <div className="w-full aspect-square rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-white/5 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-colors">
                                        {obj.type === 'LOGO' ? (
                                          <img src={resolveUrl(obj.fileUrl)} alt={obj.name} className="w-3/4 h-3/4 object-contain shadow-sm rounded-sm" />
                                        ) : obj.type === 'ICON' ? (
                                          <span className="material-symbols-outlined text-[32px] text-blue-600/70">{obj.name.toLowerCase().replace(/\s+/g, '_')}</span>
                                        ) : (
                                          <span className="material-symbols-outlined text-[32px] text-indigo-600/70">{obj.type === 'QR_SPEC' ? 'qr_code_2' : 'barcode_scanner'}</span>
                                        )}
                                      </div>
                                      <span className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-400 truncate w-full text-center px-1 group-hover:text-blue-600 transition-colors">{obj.name}</span>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TEMPLATES TAB */}
            {activeTab === 'templates' && (
              <div className="animate-fade-in flex flex-col gap-4">
                <div className="flex flex-col gap-1 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Library</span>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">Industry Presets</p>
                </div>
                <div className="grid gap-4">
                  {templates.map(tpl => (
                    <motion.div 
                      key={tpl.id}
                      onClick={() => {
                        if (confirm('Discard current design and load this template?')) {
                          loadTemplate(tpl);
                        }
                      }}
                      className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all duration-300"
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="aspect-[1.5/1] bg-slate-50 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center p-4">
                        {tpl.imageUrl ? (
                          <img src={resolveUrl(tpl.imageUrl)} alt={tpl.name} className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <span className="material-symbols-outlined text-[48px] text-slate-200 flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined">description</span>
                            <span className="text-[10px] font-bold">No Preview</span>
                          </span>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                           <span className="text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-white/10 px-4 py-2 rounded-full border border-white/20">Load Template</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-white/10">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">{tpl.name}</span>
                          <div className="flex items-center justify-between mt-1">
                             <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">{tpl.category || 'Standard'}</span>
                             <span className="text-[8px] font-bold text-slate-300 uppercase">{tpl.size || 'Custom'}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

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
                    <motion.button 
                      key={item.label} 
                      onClick={item.action}
                      draggable={!!item.payload}
                      onDragStart={e => {
                        if (item.payload) {
                          e.dataTransfer.setData('application/json', JSON.stringify(item.payload));
                          e.dataTransfer.effectAllowed = 'copy';
                        }
                      }}
                      className="flex flex-col items-center p-4 glass-card group cursor-grab active:cursor-grabbing"
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <span className="material-symbols-outlined text-slate-500 group-hover:text-primary mb-2 text-2xl transition-colors">{item.icon}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-primary transition-colors">{item.label}</span>
                    </motion.button>
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
                      <motion.div 
                        key={item.label}
                        onClick={() => addElement(item.payload)}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('application/json', JSON.stringify(item.payload));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer border border-slate-200 dark:border-white/10 shadow-sm transition-all group lg:active:cursor-grabbing"
                        whileHover={{ x: 4, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary shrink-0 transition-colors">{item.icon}</span>
                        {item.label}
                      </motion.div>
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
                      <motion.button 
                        key={s.id} 
                        onClick={() => {
                          if (shapeDrawingTool === s.payload.shapeType) {
                            setShapeDrawingTool(null);
                          } else {
                            setShapeDrawingTool(s.payload.shapeType);
                            setSelectedIds([]);
                            setIsDrawingMode(false);
                          }
                        }}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('application/json', JSON.stringify(s.payload));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all group lg:active:cursor-grabbing ${
                          shapeDrawingTool === s.payload.shapeType 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                          : 'glass-card border-transparent hover:border-slate-200'
                        }`}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <span className={`material-symbols-outlined text-2xl transition-colors mb-2 ${
                           shapeDrawingTool === s.payload.shapeType ? 'text-white' : 'text-slate-500 group-hover:text-primary'
                        }`}>{s.render}</span>
                        <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
                           shapeDrawingTool === s.payload.shapeType ? 'text-white' : 'text-slate-600 group-hover:text-primary'
                        }`}>{s.name}</span>
                        <div className={`mt-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                          shapeDrawingTool === s.payload.shapeType ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                        }`}>
                          {shapeDrawingTool === s.payload.shapeType ? 'Active' : 'Draw'}
                        </div>
                      </motion.button>
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
                      <motion.button 
                        key={i} 
                        onClick={() => addIcon(icon)} 
                        title={icon}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('application/json', JSON.stringify({ type: 'icon', iconName: icon, width: 48, height: 48, color: '#191C1E' }));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className="flex items-center justify-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 hover:text-primary text-slate-400 transition-all aspect-square cursor-grab active:cursor-grabbing"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <span className="material-symbols-outlined text-xl">{icon}</span>
                      </motion.button>
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
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">{cat} ({icons.length})</p>
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
            {activeTab === 'layers' && (() => {
              const layersToDisplay = [...elements].filter(el => {
                const elW = el.width || 120;
                const elH = el.height || 40;
                return (el.x + elW > 0 && el.x < AW && el.y + elH > 0 && el.y < AH);
              }).sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

              return (
                <div className="animate-fade-in flex flex-col gap-1.5 h-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={layersToDisplay.length > 0 && layersToDisplay.every(l => selectedIds.includes(l.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSelection = Array.from(new Set([...selectedIds, ...layersToDisplay.map(l => l.id)]));
                            setSelectedIds(newSelection);
                          } else {
                            const idsToRemove = layersToDisplay.map(l => l.id);
                            setSelectedIds(selectedIds.filter(id => !idsToRemove.includes(id)));
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer shrink-0"
                      />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">On-Label Layers ({layersToDisplay.length})</span>
                    </div>
                      {selectedIds.length > 0 && (
                        <button 
                          onClick={() => setShowBulkDeleteModal(true)}
                          className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500 hover:text-red-500 transition-colors font-bold"
                        >
                          Delete Selected
                        </button>
                      )}
                  </div>

                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[600px] custom-scrollbar pr-1">
                    {layersToDisplay.map(el => {
                      const isSelected = selectedIds.includes(el.id);
                      return (
                        <motion.div 
                          key={`layer-${el.id}`}
                          onClick={(e) => {
                            if (e.shiftKey) {
                              setSelectedIds(prev => prev.includes(el.id) ? prev.filter(id => id !== el.id) : [...prev, el.id]);
                            } else {
                              setSelectedIds([el.id]);
                            }
                          }}
                          className={`group flex items-center justify-between p-3 rounded-xl border text-[11px] cursor-pointer transition-all ${isSelected ? 'bg-blue-50/80 border-primary/50 text-primary font-bold shadow-sm' : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-white/5 hover:border-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'}`}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={(e) => {
                                setSelectedIds(prev => 
                                  prev.includes(el.id) ? prev.filter(id => id !== el.id) : [...prev, el.id]
                                );
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer shrink-0"
                            />
                            <span className="material-symbols-outlined text-[13px] opacity-70 shrink-0">
                              {el.type === 'image' ? 'image' : el.type === 'shape' ? 'category' : (el.type === 'icon' || el.type === 'IconsIcon') ? 'star' : el.type === 'barcode' ? 'barcode' : el.type === 'qrcode' ? 'qr_code_2' : 'match_case'}
                            </span>
                            <span className="font-bold leading-tight truncate pr-1">
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
                        </motion.div>
                      );
                    })}
                  </div>
                  {layersToDisplay.length === 0 && <p className="text-[10px] text-slate-400 text-center py-12 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-white/10">No elements on label.</p>}
                </div>
              );
            })()}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="animate-fade-in flex flex-col h-full px-4 overflow-hidden">
                <div className="flex items-center justify-between mb-4 mt-2">
                   <div className="flex flex-col">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary leading-tight">Label Notes</h4>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1 opacity-70">Project Metadata</p>
                   </div>
                   <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-800/50">
                      <span className="material-symbols-outlined text-[12px] animate-pulse">sync</span>
                      Auto-saving
                   </div>
                </div>

                <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm focus-within:shadow-xl focus-within:shadow-blue-500/5 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                   <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">edit_note</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Internal Remarks / SOPs</span>
                   </div>
                   <textarea
                     value={meta.notes || ''}
                     onChange={(e) => {
                        setMeta(prev => ({ ...prev, notes: e.target.value }));
                     }}
                     onBlur={commitUpdate}
                     placeholder="Type label specific instructions, change logs, or validation requirements here..."
                     className="w-full flex-1 p-4 text-[13px] bg-transparent outline-none resize-none font-medium text-slate-700 dark:text-slate-300 leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-600 custom-scrollbar"
                   />
                </div>
                
              </div>
            )}
            </div>
          )}
        </div>

        {/* ── Premium Center Canvas ────────────────────────────────────────────── */}
        <motion.section
          className="flex-1 overflow-auto editor-canvas relative custom-scrollbar"
          ref={artboardContainerRef}
          onWheel={handleWheel}
          onClick={() => {
            setSelectedIds([]);
            if (editingElementId) {
              setEditingElementId(null);
              commitUpdate();
            }
          }}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 30 }}
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

          {/* Sticky Tool Indicator for Shape Drawing */}
          {shapeDrawingTool && (
            <div className="sticky top-4 left-0 right-0 z-[1005] flex justify-center pointer-events-none px-4">
               <div className="flex items-center gap-3 bg-blue-600 p-2.5 rounded-2xl shadow-2xl border border-blue-400 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-xl">
                      {shapeDrawingTool === 'rectangle' ? 'crop_square' : shapeDrawingTool === 'circle' ? 'radio_button_unchecked' : 'horizontal_rule'}
                    </span>
                  </div>
                  <div className="flex flex-col pr-2">
                    <span className="text-white text-[11px] font-black uppercase tracking-widest leading-none">Drafting: {shapeDrawingTool}</span>
                    <span className="text-blue-100 text-[10px] font-bold mt-0.5">Click and drag on canvas to draw</span>
                  </div>
                  <button 
                    onClick={() => setShapeDrawingTool(null)} 
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
               </div>
            </div>
          )}
          {/* ── Premium Artboard Container ──────────────────────────────────────── */}
          <div className="flex items-center justify-center min-h-full p-12">
            <motion.div
              ref={artboardRef}
              id="pharma-artboard"
              className="label-shadow relative pharma-artboard border border-outline-variant/30 rounded-lg cursor-crosshair"
              onMouseMove={e => {
                const rect = artboardRef.current.getBoundingClientRect();
                setArtboardCursor({
                  x: (e.clientX - rect.left) / zoomLevel,
                  y: (e.clientY - rect.top) / zoomLevel
                });
              }}
              onMouseLeave={() => setArtboardCursor({ x: null, y: null })}
              style={{
                width: `${AW}px`,
                height: `${AH}px`,
                backgroundColor: meta.bgColor || '#ffffff',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center top',
                marginBottom: `${(zoomLevel - 1) * AH}px`,
                overflow: 'visible',
              }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 30 }}
              onClick={e => {
                // If we click the artboard itself (not an element), deselect
                if (e.target.id === 'pharma-artboard') {
                  setSelectedIds([]);
                  if (editingElementId) {
                    setEditingElementId(null);
                    commitUpdate();
                  }
                }
              }}
            >
              {/* ── Dimension & Coordinate Indicator - Positioned above the Ruler ── */}
              <div 
                className="absolute top-[-75px] right-0 flex items-center gap-3 pointer-events-none z-50 animate-fade-in"
                style={{ transform: `scale(${1/zoomLevel})`, transformOrigin: 'right bottom' }}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 glass bg-white/90 dark:bg-slate-900/90 rounded-xl border border-primary/20 shadow-lg">
                  <span className="material-symbols-outlined text-[14px] text-primary">aspect_ratio</span>
                  <span className="text-[10px] font-black font-mono text-slate-800 dark:text-slate-200">
                    {fromPx(AW, meta.unit).toFixed(1)} × {fromPx(AH, meta.unit).toFixed(1)} {meta.unit}
                  </span>
                </div>
                {artboardCursor.x !== null && (
                  <div className="flex items-center gap-2 px-3 py-1.5 glass bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 border border-blue-400/30">
                    <span className="material-symbols-outlined text-[14px]">near_me</span>
                    <span className="text-[10px] font-black font-mono">
                      {fromPx(artboardCursor.x, meta.unit).toFixed(1)}, {fromPx(artboardCursor.y, meta.unit).toFixed(1)} {meta.unit}
                    </span>
                  </div>
                )}
              </div>
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

              {/* Rulers */}
              {!isDrawingMode && (
                <>
                  <Ruler 
                    orientation="horizontal" 
                    length={AW} 
                    zoomLevel={zoomLevel} 
                    unit={meta.unit}
                    cursorPos={artboardCursor.x} 
                    selection={selectedElement ? { start: selectedElement.x, end: selectedElement.x + (selectedElement.width || 0) } : null}
                    isDark={theme === 'dark'}
                    onAddGuide={(pos) => setManualGuidelines(prev => [...prev, { orientation: 'vertical', pos }])}
                  />
                  <Ruler 
                    orientation="vertical" 
                    length={AH} 
                    zoomLevel={zoomLevel} 
                    unit={meta.unit}
                    cursorPos={artboardCursor.y} 
                    selection={selectedElement ? { start: selectedElement.y, end: selectedElement.y + (selectedElement.height || 0) } : null}
                    isDark={theme === 'dark'}
                    onAddGuide={(pos) => setManualGuidelines(prev => [...prev, { orientation: 'horizontal', pos }])}
                  />
                  {/* Corner Box where rulers meet */}
                  <div 
                    className="absolute top-[-32px] left-[-32px] w-8 h-8 z-10"
                    style={{ 
                      backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 1)' : 'rgba(241, 245, 249, 1)',
                      borderRight: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                      borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span className="material-symbols-outlined text-[10px] text-primary/50">straighten</span>
                  </div>
                </>
              )}

              {/* Grid Overlay */}
               <GridOverlay 
                 width={AW} 
                 height={AH} 
                 visible={showGrid} 
                 artboardBgColor={meta.bgColor || '#ffffff'} 
                 spacing={gridSize} 
               />

               {/* Smart Guidelines Layer */}
               {showGuidelines && (
                 <SmartGuides 
                   activeGuides={[
                     ...activeAlignmentGuides,
                     ...manualGuidelines.map(g => ({ ...g, type: 'manual' }))
                   ]} 
                   zoomLevel={zoomLevel} 
                   isDark={theme === 'dark'}
                   onRemoveManualCenter={(pos, orientation) => {
                     setManualGuidelines(prev => prev.filter(g => g.pos !== pos || g.orientation !== orientation));
                   }}
                 />
               )}

              {/* Label Name watermark */}
              {!elements.length && !isDrawingMode && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none gap-2">
                  <span className="material-symbols-outlined text-[48px] text-slate-200">edit_square</span>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Start adding elements</p>
                </div>
              )}

              {/* ── SHAPE DRAWING OVERLAY ────────────────────────────────────── */}
              {shapeDrawingTool && (
                <div 
                  className="absolute inset-0 z-[100] bg-transparent cursor-crosshair"
                  onMouseDown={e => {
                    const rect = artboardRef.current.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / zoomLevel;
                    const y = (e.clientY - rect.top) / zoomLevel;
                    setDrawingStart({ x, y });
                    setDrawingCurrent({ x, y });
                  }}
                  onMouseMove={e => {
                    if (!drawingStart) return;
                    const rect = artboardRef.current.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / zoomLevel;
                    const y = (e.clientY - rect.top) / zoomLevel;
                    setDrawingCurrent({ x, y });
                  }}
                  onMouseUp={() => {
                    if (!drawingStart || !drawingCurrent) {
                      setDrawingStart(null);
                      setDrawingCurrent(null);
                      return;
                    }

                    const x1 = drawingStart.x;
                    const y1 = drawingStart.y;
                    const x2 = drawingCurrent.x;
                    const y2 = drawingCurrent.y;

                    const width = Math.abs(x2 - x1);
                    const height = Math.abs(y2 - y1);
                    const left = Math.min(x1, x2);
                    const top = Math.min(y1, y2);

                    if (width > 2 || height > 2) {
                      if (shapeDrawingTool === 'line') {
                        const dist = Math.hypot(x2 - x1, y2 - y1);
                        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                        addElement({
                          type: 'shape',
                          shapeType: 'line',
                          x: x1,
                          y: y1,
                          width: Math.round(dist),
                          height: 4,
                          rotation: Math.round(angle),
                          bgColor: '#191c1e',
                          borderColor: 'transparent',
                          borderWidth: 0,
                          borderRadius: 0
                        });
                      } else {
                        addElement({
                          type: 'shape',
                          shapeType: shapeDrawingTool,
                          x: Math.round(left),
                          y: Math.round(top),
                          width: Math.round(width),
                          height: Math.round(height),
                          bgColor: '#f1f5f9',
                          borderColor: '#94a3b8',
                          borderWidth: 2,
                          borderRadius: shapeDrawingTool === 'circle' ? 50 : 0
                        });
                      }
                    }

                    setDrawingStart(null);
                    setDrawingCurrent(null);
                    setShapeDrawingTool(null);
                  }}
                >
                  <svg className="absolute inset-0 pointer-events-none w-full h-full">
                    {drawingStart && drawingCurrent && (() => {
                      const x1 = drawingStart.x;
                      const y1 = drawingStart.y;
                      const x2 = drawingCurrent.x;
                      const y2 = drawingCurrent.y;
                      const width = Math.abs(x2 - x1);
                      const height = Math.abs(y2 - y1);
                      const left = Math.min(x1, x2);
                      const top = Math.min(y1, y2);

                      if (shapeDrawingTool === 'line') {
                        return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />;
                      } else if (shapeDrawingTool === 'rectangle') {
                        return <rect x={left} y={top} width={width} height={height} fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />;
                      } else if (shapeDrawingTool === 'circle') {
                        return <ellipse cx={left + width/2} cy={top + height/2} rx={width/2} ry={height/2} fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />;
                      }
                      return null;
                    })()}
                  </svg>
                </div>
              )}

              {[...elements]
                .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                .map(el => previewMode ? resolveElementData(el, SAMPLE_TRIAL_DATA) : el)
                .filter(el => !el.hidden)
                .map(el => {
                const isSelected = selectedIds.includes(el.id);
                const elW = el.width || 120;
                const elH = el.height || 40;

                return (
                  <Rnd
                    key={el.id}
                    size={{ width: elW, height: elH }}
                    position={{ x: el.x, y: el.y }}
                    bounds={undefined}
                    disableDragging={el.locked}
                    enableResizing={el.locked ? false : {
                      top: isSelected, left: isSelected, bottom: isSelected, right: isSelected,
                      topLeft: isSelected, topRight: isSelected, bottomLeft: isSelected, bottomRight: isSelected,
                    }}
                    grid={[snapToGrid ? gridSize : 1, snapToGrid ? gridSize : 1]}
                    lockAspectRatio={el.lockAspectRatio !== false && ['qrcode', 'icon', 'image'].includes(el.type)}
                    minWidth={4}
                    minHeight={4}
                    style={{
                      zIndex: isSelected ? 9999 : (el.zIndex || 10),
                      position: 'absolute'
                    }}
                    onDrag={(_, d) => {
                      const { snappedPos, activeGuides } = calculateAlignmentGuides(
                        { ...el, x: d.x, y: d.y },
                        elements,
                        AW,
                        AH,
                        { snapToGrid, gridSize, snapToGuides }
                      );

                      setActiveAlignmentGuides(activeGuides);
                      
                      // Magnetic Snapping Effect
                      updateElement(el.id, { x: snappedPos.x, y: snappedPos.y });
                    }}
                    onDragStop={(_, d) => {
                      setActiveAlignmentGuides([]); // Hide guides on stop
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
                      if (!el.locked && selectedIds.includes(el.id) && ['text', 'warnings', 'manufacturing', 'dosage', 'storage', 'subtext', 'shape', 'table'].includes(el.type)) {
                        setEditingElementId(el.id);
                      } else {
                        if (e.shiftKey) {
                          setSelectedIds(prev => prev.includes(el.id) ? prev.filter(id => id !== el.id) : [...prev, el.id]);
                        } else {
                          setSelectedIds([el.id]);
                        }
                        if (editingElementId && editingElementId !== el.id) {
                          setEditingElementId(null);
                          commitUpdate();
                        }
                      }
                    }}
                    onDoubleTap={e => {
                      if (!el.locked && ['barcode', 'qrcode'].includes(el.type)) {
                        e.stopPropagation();
                      }
                    }}
                  >
                    {/* Boundary Alert Overlay */}
                    {(() => {
                      const isOutOfBounds = (el.x < -1 || el.y < -1 || el.x + (el.width || 0) > AW + 1 || el.y + (el.height || 0) > AH + 1);
                      if (!isOutOfBounds) return null;
                      return (
                        <div className="absolute inset-[-4px] border-2 border-red-500 border-dashed rounded-lg pointer-events-none z-0">
                          <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                            EXCEEDS PRINTABLE AREA
                          </div>
                        </div>
                      );
                    })()}
                    {isSelected && (
                      <div className={`absolute left-0 bg-white dark:bg-slate-800 shadow-xl min-w-max px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 flex items-center gap-1 z-[500] pointer-events-auto transform transition-all origin-top-left ${
                        (el.y * zoomLevel > AH * zoomLevel - 60 || (el.rotation > 110 && el.rotation < 250)) 
                        ? '-top-[56px]' 
                        : 'top-[calc(100%+8px)]'
                      }`}
                        style={{ transform: `scale(${1 / zoomLevel}) rotate(${- (el.rotation || 0)}deg)` }}
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
                                  lines.push(Array(colCount).fill('').join('\n'));
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
                                  className="w-24 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 text-[11px] font-mono outline-none focus:border-blue-400"
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
                          // Auto-fit font size for non-editing text to fit within element bounds
                          fontSize: (() => {
                            const isEditing = editingElementId === el.id;
                            const isTextType = !['barcode','qrcode','image','icon','IconsIcon','shape','path','table'].includes(el.type);
                            if (!isEditing && isTextType && el.text) {
                              return `${calcAutoFitFontSize(el.text, el.width || 120, el.height || 40, el.fontSize || 16)}px`;
                            }
                            return `${el.fontSize || 16}px`;
                          })(),
                          fontFamily: el.fontFamily || 'Inter, sans-serif',
                        fontWeight: el.fontWeight || '400',
                        fontStyle: el.fontStyle || 'normal',
                        textDecoration: el.textDecoration || 'none',
                        color: (() => {
                          if (editingElementId === el.id) return '#2563eb';
                          // Dark Mode visibility fix: Force white for dark elements outside the label area
                          if (theme === 'dark' && (el.x < 0 || el.y < 0 || el.x + (el.width || 120) > AW || el.y + (el.height || 40) > AH)) {
                            if (el.color === '#191c1e' || !el.color || el.color === '#191C1E') return '#ffffff';
                          }
                          return (el.color || '#191c1e');
                        })(),
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
                            <path d={el.pathData} 
                                  stroke={(() => {
                                    if (theme === 'dark' && (el.x < 0 || el.y < 0 || el.x + (el.width || 120) > AW || el.y + (el.height || 40) > AH)) {
                                      if (el.color === '#191c1e' || !el.color || el.color === '#191C1E') return '#ffffff';
                                    }
                                    return el.color || '#191c1e';
                                  })()} 
                                  strokeWidth={el.penWidth || 3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {(el.heading !== undefined || isSelected) && isSelected ? (
                          <input
                            type="text"
                            value={el.heading ?? ''}
                            onClick={e => e.stopPropagation()}
                            onMouseDown={e => e.stopPropagation()}
                            onChange={e => updateElement(el.id, { heading: e.target.value })}
                            onBlur={commitUpdate}
                            placeholder="Add heading..."
                            style={{
                              display: 'block',
                              fontSize: '8px',
                              fontWeight: '800',
                              fontFamily: 'Inter, sans-serif',
                              textTransform: 'uppercase',
                              color: el.alertColor || '#717783',
                              marginBottom: '2px',
                              letterSpacing: '1.2px',
                              background: 'transparent',
                              border: 'none',
                              outline: '1px dashed #93c5fd',
                              outlineOffset: '1px',
                              borderRadius: '2px',
                              width: '100%',
                              cursor: 'text',
                              padding: '0',
                            }}
                          />
                        ) : el.heading ? (
                          <span style={{ display: 'block', fontSize: '8px', fontWeight: '800', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', color: el.alertColor || '#717783', marginBottom: '2px', letterSpacing: '1.2px' }}>
                            {el.heading}
                          </span>
                        ) : null}

                        {el.type === 'barcode' ? (
                          <div className="w-full flex-1 min-h-0 flex items-center justify-center pointer-events-none px-2">
                            <BarcodeUnified
                              value={el.text || '123456789012'}
                              format={el.barcodeFormat || 'code128'}
                              color={el.color || '#191c1e'}
                              width={elW}
                              height={elH}
                            />
                          </div>
                        ) : el.type === 'qrcode' ? (
                          <div className="w-full flex-1 min-h-0 p-1">
                            <BarcodeUnified
                              value={el.text || 'https://pharma-precision.com/scan'}
                              format="qrcode"
                              color={el.color || '#191c1e'}
                              width={elW}
                              height={elH}
                            />
                          </div>
                        ) : el.type === 'image' ? (
                          <img src={resolveUrl(el.src)} alt="Uploaded" className="w-full flex-1 min-h-0 pointer-events-none" style={{ objectFit: el.imageFit || 'contain' }} />
                        ) : el.type === 'icon' ? (
                          <div className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden">
                            <span className="material-symbols-outlined leading-[0]" style={{ 
                               fontSize: `${Math.min(elW, elH)}px`, 
                               color: (() => {
                                 if (theme === 'dark' && (el.x < 0 || el.y < 0 || el.x + (el.width || 120) > AW || el.y + (el.height || 40) > AH)) {
                                   if (el.color === '#191c1e' || !el.color || el.color === '#191C1E') return '#ffffff';
                                 }
                                 return el.color || '#191c1e';
                               })() 
                            }}>{el.iconName}</span>
                          </div>
                        ) : el.type === 'IconsIcon' ? (
                          <div className="w-full flex-1 min-h-0 p-1 flex items-center justify-center pointer-events-none" style={{
                            color: (() => {
                              if (theme === 'dark' && (el.x < 0 || el.y < 0 || el.x + (el.width || 120) > AW || el.y + (el.height || 40) > AH)) {
                                if (el.color === '#191c1e' || !el.color || el.color === '#191C1E') return '#ffffff';
                              }
                              return el.color || '#191c1e';
                            })()
                          }} dangerouslySetInnerHTML={{ __html: el.svg }} />
                        ) : el.type === 'table' ? (
                          <table className="w-full flex-1 min-h-0 table-fixed" style={{ borderCollapse: 'collapse' }}>
                            <tbody>
                              {(el.text || '').split('\n').filter(r => r.trim()).map((row, i) => (
                                <tr key={i}>
                                  {row.split('|').map((cell, j) => (
                                    <td 
                                      key={j} 
                                      onClick={() => { if (!el.locked) setEditingCell({ r: i, c: j }); }}
                                      style={{
                                        border: `${el.borderWidth || 1}px solid ${el.borderColor || '#94a3b8'}`,
                                        padding: '4px 6px',
                                        wordBreak: 'break-word',
                                        textAlign: el.align || 'left',
                                        color: el.color || 'inherit',
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
                        ) : el.renderAsBarcode ? (
                          <div className="w-full h-full flex items-center justify-center pointer-events-none overflow-hidden p-1">
                            <BarcodeUnified
                              value={el.resolvedText || el.text || ''}
                              format={el.barcodeFormat || 'code128'}
                              color={el.color || '#191c1e'}
                              width={elW}
                              height={elH - (el.heading ? 12 : 0)}
                            />
                          </div>
                        ) : (
                          <span className="block w-full" style={{
                            wordBreak: 'break-word',
                            textAlign: el.align || (el.type === 'shape' ? 'center' : 'left'),
                          }}>
                            {el.resolvedText || el.text}
                          </span>
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
            </motion.div>
          </div>
        </motion.section>

        {/* ── Premium Right Properties Panel ────────────────────────────────────── */}
        <motion.aside 
          className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shrink-0 relative shadow-sm"
          initial={false}
          animate={{ 
            width: rightSidebarCollapsed ? 48 : rightWidth,
            x: 0, 
            opacity: 1 
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Resizer Handle for Right Side */}
          {!rightSidebarCollapsed && (
             <div 
               className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/30 active:bg-blue-500 z-50 transition-colors"
               onMouseDown={(e) => {
                 const startX = e.clientX;
                 const startW = rightWidth;
                 const handleMove = (em) => {
                   const diff = startX - em.clientX; // Swapped for right side
                   setRightWidth(Math.max(240, Math.min(520, startW + diff)));
                 };
                 const handleUp = () => {
                   document.removeEventListener('mousemove', handleMove);
                   document.removeEventListener('mouseup', handleUp);
                 };
                 document.addEventListener('mousemove', handleMove);
                 document.addEventListener('mouseup', handleUp);
               }}
             />
          )}
          {/* Toggle Button for Right Sidebar */}
          <button 
             onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
             className="absolute top-1/2 -translate-y-1/2 left-0 w-5 h-20 bg-white/40 dark:bg-black/20 hover:bg-primary transition-all flex items-center justify-center text-slate-400 hover:text-white rounded-r-xl border border-l-0 border-white/10 shadow-sm z-50 group"
          >
             <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:scale-125">
                {rightSidebarCollapsed ? 'chevron_left' : 'chevron_right'}
             </span>
          </button>

          {!rightSidebarCollapsed && (
            <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
              {selectedIds.length > 1 ? (
            <div className="animate-fade-in p-4 space-y-6">
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-3 rounded-xl mb-4 border border-blue-500/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px]">group</span>
                    Bulk Selection
                  </span>
                  <span className="text-[9px] text-blue-600/70 dark:text-blue-400/70 font-bold">{selectedIds.length} Elements Selected</span>
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
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Quick Font Update</label>
                    <select className="w-full bg-slate-50 border border-slate-200 text-[11px] py-1.5 px-1.5 rounded-lg outline-none cursor-pointer font-bold"
                      onChange={e => {
                        selectedIds.forEach(id => updateElement(id, { fontFamily: e.target.value }));
                        commitUpdate();
                      }}>
                      <option value="">Select Font...</option>
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Poppins, sans-serif">Poppins</option>
                      <option value="Outfit, sans-serif">Outfit</option>
                      <option value="Nunito, sans-serif">Nunito</option>
                      <option value="Courier New, monospace">Courier Mono</option>
                    </select>
                  </div>

                  <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    {['left', 'center', 'right'].map(a => (
                      <button key={a} onClick={() => { 
                          selectedIds.forEach(id => updateElement(id, { align: a }));
                          commitUpdate(); 
                        }}
                        className="flex-1 p-2 rounded-lg text-center transition-all hover:bg-white hover:shadow-sm text-slate-500 hover:text-primary">
                        <span className="material-symbols-outlined text-[18px]">format_align_{a}</span>
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
                        const baseline = {};
                        selectedIds.forEach(id => {
                          const el = elements.find(e => e.id === id);
                          if (el && el.text) baseline[id] = el.text;
                        });
                        originalTexts.current = baseline;
                      }}
                      onChange={e => {
                        const sfx = e.target.value;
                        setBulkSuffix(sfx);
                        selectedIds.forEach(id => {
                          const base = originalTexts.current[id];
                          if (base !== undefined) {
                            updateElement(id, { text: base + sfx });
                          }
                        });
                      }}
                      onBlur={() => {
                        commitUpdate();
                        setBulkSuffix('');
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

              {/* ── Premium Position Block ────────────────────────────────────────── */}
              <motion.div 
                className="p-5 border-b border-white/20 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary dark:text-blue-400">Position & Size</span>
                  <motion.button 
                    onClick={() => deleteElement(selectedElement.id)} 
                    className="h-7 px-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase rounded-lg border border-red-200 dark:border-red-800/50 transition-all flex items-center gap-1.5"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    <span className="uppercase">Delete</span>
                  </motion.button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {['x', 'y'].map(axis => (
                    <div key={axis} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-1.5 flex items-center">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 w-8 pl-1">{axis.toUpperCase()} ({meta.unit})</span>
                      <input 
                        type="number" 
                        step="0.1"
                        className="w-full text-[11px] font-mono outline-none text-right bg-transparent dark:text-white" 
                        value={Number(fromPx(selectedElement[axis] || 0, meta.unit).toFixed(2))} 
                        onChange={e => { 
                          const val = parseFloat(e.target.value) || 0;
                          updateElement(selectedElement.id, { [axis]: toPx(val, meta.unit) }); 
                        }} 
                        onBlur={commitUpdate}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[['width', 'W'], ['height', 'H']].map(([dim, label]) => (
                    <div key={dim} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-1.5 flex items-center">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 w-8 pl-1">{label} ({meta.unit})</span>
                      <input 
                        type="number" 
                        step="0.1"
                        className="w-full text-[11px] font-mono outline-none text-right bg-transparent dark:text-white"
                        value={Number(fromPx(selectedElement[dim] || 0, meta.unit).toFixed(2))}
                        onChange={e => { 
                          const val = parseFloat(e.target.value) || 0;
                          updateElement(selectedElement.id, { [dim]: Math.max(0.1, toPx(val, meta.unit)) }); 
                        }} 
                        onBlur={commitUpdate}
                      />
                    </div>
                  ))}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-1.5 flex items-center mt-2 col-span-2">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 w-12 pl-1">ROTATE</span>
                    <input 
                      type="number" 
                      className="w-full text-[11px] font-mono outline-none text-right bg-transparent dark:text-white"
                      value={selectedElement.rotation || 0}
                      onChange={e => { updateElement(selectedElement.id, { rotation: parseInt(e.target.value) || 0 }); }} 
                      onBlur={commitUpdate}
                    />
                    <span className="text-[10px] text-slate-300 font-bold pr-2">°</span>
                  </div>
                </div>
              </motion.div>

              {/* Data / Content Block — for all text-bearing types */}
              {['text', 'warnings', 'barcode', 'qrcode', 'manufacturing', 'dosage', 'storage', 'subtext', 'table'].includes(selectedElement.type) && (
                <div className="p-4 border-b border-white/20 dark:border-white/10">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2">
                    {['barcode', 'qrcode'].includes(selectedElement.type) ? 'Data String' : (selectedElement.type === 'table' ? 'Table Data' : 'Text Content')}
                  </span>

                  {!['barcode', 'qrcode', 'table'].includes(selectedElement.type) && (
                    <div className="mb-4">
                      <label className="text-[9px] font-extrabold uppercase text-primary dark:text-blue-400 mb-1.5 block tracking-wider">Field Heading</label>
                      <input
                        type="text"
                        className="w-full bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-[11px] font-bold py-2 px-2.5 dark:text-white focus:border-primary outline-none rounded-lg transition-all"
                        value={selectedElement.heading ?? ''}
                        onChange={e => updateElement(selectedElement.id, { heading: e.target.value })}
                        onBlur={commitUpdate}
                        placeholder="Enter heading (e.g. Composition)..."
                      />
                    </div>
                  )}

                   {selectedElement.type === 'table' ? (
                    <div className="space-y-1.5">
                      <div className="max-h-[320px] overflow-y-auto overflow-x-hidden custom-scrollbar border border-slate-200/50 dark:border-slate-700 rounded-xl bg-slate-50/30 dark:bg-slate-900/30 p-2 space-y-1">
                        {(selectedElement.text || '').split('\n').map((row, i) => (
                          <div key={i} className="flex gap-1 group">
                            <div className="w-4 h-7 flex items-center justify-center text-[9px] font-bold text-slate-300 select-none">{i + 1}</div>
                            {row.split('|').map((cell, j) => (
                              <input
                                key={j}
                                className="flex-1 min-w-0 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] px-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all dark:text-white"
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
                          className="flex-1 h-8 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-lg border border-blue-200 dark:border-blue-800/50 transition-colors flex items-center justify-center gap-1.5"
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
                          className="flex-1 h-8 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-lg border border-blue-200 dark:border-blue-800/50 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">view_column</span> Add Column
                        </button>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[12px] py-2 px-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none rounded-lg resize-none dark:text-white"
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

              {/* ── Premium Typography Section ──────────────────────────────────────── */}
              {!['image', 'barcode', 'qrcode', 'icon', 'IconsIcon'].includes(selectedElement.type) && (
                <motion.div 
                  className="p-5 border-b border-white/20 dark:border-white/10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-4">Typography</span>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Font</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] py-1.5 px-1.5 rounded-lg outline-none cursor-pointer dark:text-slate-200"
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
                        <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] py-1.5 px-1.5 rounded-lg outline-none cursor-pointer dark:text-slate-200"
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
                        <span>Size</span><span className="font-mono dark:text-slate-200">{selectedElement.fontSize || 12}px</span>
                      </label>
                      <input type="range" min="6" max="256" className="w-full accent-blue-600"
                        value={selectedElement.fontSize || 12}
                        onChange={e => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                        onMouseUp={commitUpdate} />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block flex justify-between"><span>Line Height</span><span className="font-mono dark:text-slate-200">{selectedElement.lineHeight || '1.25'}</span></label>
                        <input type="range" min="1" max="3" step="0.05" className="w-full accent-blue-600"
                          value={parseFloat(selectedElement.lineHeight) || 1.25}
                          onChange={e => updateElement(selectedElement.id, { lineHeight: parseFloat(e.target.value) })}
                          onMouseUp={commitUpdate} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block flex justify-between"><span>Spacing</span><span className="font-mono dark:text-slate-200">{selectedElement.letterSpacing || 0}px</span></label>
                        <input type="range" min="-2" max="20" step="0.5" className="w-full accent-blue-600"
                          value={selectedElement.letterSpacing || 0}
                          onChange={e => updateElement(selectedElement.id, { letterSpacing: parseFloat(e.target.value) })}
                          onMouseUp={commitUpdate} />
                      </div>
                    </div>

                    <div className="flex gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {[
                        ['fontStyle', 'italic', 'format_italic', selectedElement.fontStyle === 'italic'],
                        ['textDecoration', 'underline', 'format_underlined', selectedElement.textDecoration === 'underline'],
                      ].map(([prop, val, icon, active]) => (
                        <button key={prop} onClick={() => { updateElement(selectedElement.id, { [prop]: active ? (prop === 'fontStyle' ? 'normal' : 'none') : val }); commitUpdate(); }}
                          className={`flex-1 p-1.5 rounded text-center transition-colors ${active ? 'btn-gradient shadow-sm text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                          <span className="material-symbols-outlined text-[14px]">{icon}</span>
                        </button>
                      ))}
                      <div className="w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
                      {['left', 'center', 'right'].map(a => (
                        <button key={a} onClick={() => { updateElement(selectedElement.id, { align: a }); commitUpdate(); }}
                          className={`flex-1 p-1.5 rounded text-center transition-colors ${selectedElement.align === a ? 'bg-blue-100 dark:bg-blue-900/50 text-primary dark:text-blue-300' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                          <span className="material-symbols-outlined text-[14px]">format_align_{a}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Premium Appearance Section ──────────────────────────────────────── */}
              {selectedElement.type !== 'image' && (
                <motion.div 
                  className="p-5 border-b border-white/20 dark:border-white/10 space-y-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block">Appearance</span>

                  {/* Icon size slider */}
                  {selectedElement.type === 'icon' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 flex justify-between">
                        <span>Icon Size</span><span className="font-mono dark:text-slate-200">{selectedElement.fontSize || 48}px</span>
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
                      <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] py-1.5 px-1.5 rounded-lg outline-none cursor-pointer dark:text-slate-200"
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

                  {/* ── Dynamic Data & Rules Section ────────────────────────────────── */}
                  {(selectedElement.isPlaceholder || (selectedElement.text && selectedElement.text.includes('{{'))) && (
                    <div className="space-y-4 pt-1">
                      <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-400/20">
                         <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">database</span>
                         <span className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-100 tracking-tighter">Dynamic Configuration</span>
                      </div>

                      {/* Render as Barcode Toggle */}
                      <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-white/20 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Render as Barcode</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateElement(selectedElement.id, { renderAsBarcode: !selectedElement.renderAsBarcode }); commitUpdate(); }}
                            className={`w-10 h-5 rounded-full relative transition-all duration-300 border ${selectedElement.renderAsBarcode ? 'bg-blue-600 border-blue-700' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}
                          >
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${selectedElement.renderAsBarcode ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>

                        {selectedElement.renderAsBarcode && (
                          <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                            <label className="text-[8px] font-bold uppercase text-slate-400 mb-1 block italic">Barcode Format</label>
                            <select 
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] py-1.5 px-2 rounded-lg outline-none cursor-pointer dark:text-slate-200 font-medium"
                              value={selectedElement.barcodeFormat || 'code128'}
                              onChange={e => { updateElement(selectedElement.id, { barcodeFormat: e.target.value }); commitUpdate(); }}
                            >
                              <option value="code128">CODE 128 (Standard)</option>
                              <option value="code39">CODE 39 (Standard)</option>
                              <option value="qrcode">QR Code (2D)</option>
                              <option value="datamatrix">Data Matrix (2D)</option>
                              <option value="pdf417">PDF417 (2D)</option>
                              <option value="ean13">EAN-13 (Retail)</option>
                              <option value="upc">UPC-A (Retail)</option>
                              <option value="itf14">ITF-14 (Case Code)</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Fallback & Wrap */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] font-bold uppercase text-slate-400 dark:text-slate-300 mb-1 block italic">Fallback Text</label>
                          <input type="text" className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-[11px] py-1.5 px-2 rounded-lg outline-none dark:text-white"
                            placeholder="If data null..."
                            value={selectedElement.fallbackValue || ''}
                            onChange={e => updateElement(selectedElement.id, { fallbackValue: e.target.value })}
                            onBlur={commitUpdate} />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold uppercase text-slate-400 dark:text-slate-300 mb-1 block italic">Text Case</label>
                          <select className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-[11px] py-1.5 px-1.5 rounded-lg outline-none dark:text-slate-100"
                            value={selectedElement.formatting?.textCase || 'none'}
                            onChange={e => { updateElement(selectedElement.id, { formatting: { ...selectedElement.formatting, textCase: e.target.value } }); commitUpdate(); }}>
                            <option value="none">Original</option>
                            <option value="uppercase">UPPERCASE</option>
                            <option value="lowercase">lowercase</option>
                            <option value="titlecase">Title Case</option>
                          </select>
                        </div>
                      </div>

                      {/* Date / Number Formatting */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] font-bold uppercase text-slate-400 mb-1 block">Value Type</label>
                          <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] py-1.5 px-1.5 rounded-lg outline-none dark:text-slate-200"
                            value={selectedElement.formatting?.type || 'text'}
                            onChange={e => { updateElement(selectedElement.id, { formatting: { ...selectedElement.formatting, type: e.target.value } }); commitUpdate(); }}>
                            <option value="text">General Text</option>
                            <option value="date">Clinical Date</option>
                            <option value="number">Numeric Val</option>
                          </select>
                        </div>
                        {selectedElement.formatting?.type === 'date' && (
                          <div>
                            <label className="text-[8px] font-bold uppercase text-slate-400 mb-1 block">Date Format</label>
                            <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] py-1.5 px-1.5 rounded-lg outline-none dark:text-slate-200"
                              value={selectedElement.formatting?.dateFormat || 'DD-MMM-YYYY'}
                              onChange={e => { updateElement(selectedElement.id, { formatting: { ...selectedElement.formatting, dateFormat: e.target.value } }); commitUpdate(); }}>
                              <option value="MM/YY">MM/YY (Short)</option>
                              <option value="DD-MMM-YYYY">DD-MMM-YYYY</option>
                              <option value="YYYY-MM-DD">ISO (YYYY-MM-DD)</option>
                            </select>
                          </div>
                        )}
                        {selectedElement.formatting?.type === 'number' && (
                          <div>
                            <label className="text-[8px] font-bold uppercase text-slate-400 mb-1 block">Decimals</label>
                            <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] py-1.5 px-1.5 rounded-lg outline-none dark:text-slate-200"
                              value={selectedElement.formatting?.precision || '0'}
                              onChange={e => { updateElement(selectedElement.id, { formatting: { ...selectedElement.formatting, precision: e.target.value } }); commitUpdate(); }}>
                              <option value="0">Whole (0)</option>
                              <option value="1">1 Decimal</option>
                              <option value="2">2 Decimals</option>
                              <option value="3">3 Decimals</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Prefix / Suffix */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] font-bold uppercase text-slate-400 mb-1 block">Prefix</label>
                          <input type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] py-1.5 px-2 rounded-lg outline-none font-mono dark:text-white"
                            placeholder="Ex: 'ID:'"
                            value={selectedElement.prefix || ''}
                            onChange={e => updateElement(selectedElement.id, { prefix: e.target.value })}
                            onBlur={commitUpdate} />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold uppercase text-slate-400 mb-1 block">Suffix</label>
                          <input type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] py-1.5 px-2 rounded-lg outline-none font-mono dark:text-white"
                            placeholder="Ex: '/mg'"
                            value={selectedElement.suffix || ''}
                            onChange={e => updateElement(selectedElement.id, { suffix: e.target.value })}
                            onBlur={commitUpdate} />
                        </div>
                      </div>

                      {/* Advanced Conditional Logic */}
                      <div className="bg-slate-100/50 dark:bg-slate-900/50 p-3 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 mt-2">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">rule</span> Display Logic
                          </label>
                          <button 
                            onClick={() => {
                              const rules = selectedElement.displayRules || [];
                              updateElement(selectedElement.id, { 
                                displayRules: [...rules, { field: 'BATCH_NO', operator: 'not_empty', value: '' }],
                                rulesLogic: selectedElement.rulesLogic || 'AND'
                              });
                              commitUpdate();
                            }}
                            className="text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            + Add Rule
                          </button>
                        </div>

                        {selectedElement.displayRules && selectedElement.displayRules.length > 1 && (
                          <div className="flex gap-2 mb-3 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-white/5">
                            {['AND', 'OR'].map(l => (
                              <button key={l} onClick={() => { updateElement(selectedElement.id, { rulesLogic: l }); commitUpdate(); }}
                                className={`flex-1 text-[9px] font-black py-1 rounded ${selectedElement.rulesLogic === l ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                {l}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2">
                          {(selectedElement.displayRules || []).map((rule, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl p-2.5 relative group">
                              <div className="grid grid-cols-1 gap-2">
                                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] p-1.5 rounded-lg outline-none dark:text-slate-200"
                                  value={rule.field}
                                  onChange={e => {
                                    const rules = [...selectedElement.displayRules];
                                    rules[idx].field = e.target.value;
                                    updateElement(selectedElement.id, { displayRules: rules });
                                    commitUpdate();
                                  }}>
                                  {Object.keys(SAMPLE_TRIAL_DATA).map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                                <div className="grid grid-cols-2 gap-2">
                                  <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] p-1.5 rounded-lg outline-none dark:text-slate-200"
                                    value={rule.operator}
                                    onChange={e => {
                                      const rules = [...selectedElement.displayRules];
                                      rules[idx].operator = e.target.value;
                                      updateElement(selectedElement.id, { displayRules: rules });
                                      commitUpdate();
                                    }}>
                                    <option value="equals">Equals</option>
                                    <option value="not_equals">Not Equals</option>
                                    <option value="not_empty">IS NOT EMPTY</option>
                                    <option value="is_empty">IS EMPTY</option>
                                    <option value="contains">Contains</option>
                                  </select>
                                  {!['not_empty', 'is_empty'].includes(rule.operator) && (
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] p-1.5 rounded-lg outline-none dark:text-white"
                                      placeholder="Value..."
                                      value={rule.value}
                                      onChange={e => {
                                        const rules = [...selectedElement.displayRules];
                                        rules[idx].value = e.target.value;
                                        updateElement(selectedElement.id, { displayRules: rules });
                                        commitUpdate();
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  const rules = selectedElement.displayRules.filter((_, i) => i !== idx);
                                  updateElement(selectedElement.id, { displayRules: rules });
                                  commitUpdate();
                                }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-red-200 dark:border-red-800"
                              >
                                <span className="material-symbols-outlined text-[12px]">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Fit Mode */}
                  {selectedElement.type === 'image' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 block">Resizing Behavior</label>
                        <button onClick={() => { updateElement(selectedElement.id, { lockAspectRatio: selectedElement.lockAspectRatio === false }); commitUpdate(); }}
                          className={`w-full py-2 px-3 rounded-xl border text-[10px] font-bold uppercase flex items-center justify-between transition-all ${selectedElement.lockAspectRatio !== false ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
                          <span className="flex items-center gap-2">
                             <span className="material-symbols-outlined text-[16px]">{selectedElement.lockAspectRatio !== false ? 'lock' : 'lock_open'}</span>
                             {selectedElement.lockAspectRatio !== false ? 'Aspect Ratio Locked' : 'Freeform Resizing'}
                          </span>
                          <div className={`w-6 h-3 rounded-full relative transition-all duration-300 border ${selectedElement.lockAspectRatio !== false ? 'bg-blue-500 border-blue-600' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                             <div className={`absolute top-0.5 w-1.5 h-1.5 rounded-full bg-white transition-all duration-300 ${selectedElement.lockAspectRatio !== false ? 'right-0.5' : 'left-0.5'}`} />
                          </div>
                        </button>
                      </div>
                      <div>
                        <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 block">Image Fit</label>
                        <div className="grid grid-cols-3 gap-1">
                          {['contain', 'cover', 'fill'].map(fit => (
                            <button key={fit} onClick={() => { updateElement(selectedElement.id, { imageFit: fit }); commitUpdate(); }}
                              className={`p-1.5 rounded-lg border text-[9px] font-bold capitalize transition-colors ${(selectedElement.imageFit || 'contain') === fit ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                              {fit}
                            </button>
                          ))}
                        </div>
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
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Header Row</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input type="checkbox" className="accent-blue-600 w-3.5 h-3.5"
                          checked={!!selectedElement.tableStriped}
                          onChange={e => { updateElement(selectedElement.id, { tableStriped: e.target.checked }); commitUpdate(); }} />
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Striped Rows</span>
                      </label>
                    </div>
                  )}

                  {/* Text / Ink color */}
                  <div>
                    <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 block">
                      {selectedElement.type === 'shape' ? 'Fill Color' : selectedElement.type === 'table' ? 'Border / Text Color' : 'Text / Ink Color'}
                    </label>
                    <div className="flex gap-2 h-8">
                      <div className="w-8 h-full rounded-lg shrink-0 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                        <input type="color" className="absolute -inset-4 w-20 h-20 cursor-pointer"
                          value={selectedElement.type === 'shape' ? (selectedElement.bgColor || '#f1f5f9') : (selectedElement.color || '#191C1E')}
                          onChange={e => updateElement(selectedElement.id, selectedElement.type === 'shape' ? { bgColor: e.target.value } : { color: e.target.value })}
                          onBlur={commitUpdate} />
                      </div>
                      <input type="text" className="flex-1 text-[10px] font-mono uppercase px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary outline-none dark:text-white"
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
                        <div className="w-8 h-full rounded-lg shrink-0 border border-slate-200 dark:border-slate-700 relative overflow-hidden bg-slate-200 dark:bg-slate-700"
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
                        <input type="text" className="flex-1 text-[10px] font-mono uppercase px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary outline-none dark:text-white"
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
                        <div className="w-7 h-full rounded-lg shrink-0 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                          <input type="color" className="absolute -inset-4 w-20 h-20 cursor-pointer"
                            value={selectedElement.borderColor || '#475569'}
                            onChange={e => updateElement(selectedElement.id, { borderColor: e.target.value })}
                            onBlur={commitUpdate} />
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex-1 flex items-center justify-center font-mono text-[9px] text-slate-400 px-2">
                          {selectedElement.borderWidth || 0}px
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Border Radius for rectangles */}
                  {selectedElement.type === 'shape' && selectedElement.shapeType === 'rectangle' && (
                    <div>
                      <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 flex justify-between">
                        <span>Corner Radius</span><span className="font-mono dark:text-slate-200">{selectedElement.borderRadius || 0}px</span>
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
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                          >
                            <div className={`w-full h-0 border-t-2 ${preview}`} style={{ borderColor: selectedElement.bgColor || '#191c1e' }} />
                            {label}
                          </button>
                        ))}
                      </div>
                      {/* Line weight */}
                      <label className="text-[8px] font-bold uppercase text-slate-400 mt-2 mb-1 flex justify-between">
                        <span>Thickness</span><span className="font-mono dark:text-slate-200">{selectedElement.height || 4}px</span>
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
                      <span>Opacity</span><span className="font-mono dark:text-slate-200">{Math.round((selectedElement.opacity !== undefined ? selectedElement.opacity : 1) * 100)}%</span>
                    </label>
                    <input type="range" min="0" max="1" step="0.01" className="w-full accent-blue-600"
                      value={selectedElement.opacity !== undefined ? selectedElement.opacity : 1}
                      onChange={e => updateElement(selectedElement.id, { opacity: parseFloat(e.target.value) })}
                      onMouseUp={commitUpdate} />
                  </div>

                  {/* Rotation Slider */}
                  <div>
                    <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 flex justify-between">
                      <span>Rotation</span><span className="font-mono dark:text-slate-200">{selectedElement.rotation || 0}°</span>
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
                </motion.div>
              )}
            </div>
          </div>
        ) : (
            <motion.div 
              className="p-6 animate-fade-in space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex flex-col items-center text-center px-4">
                <motion.div 
                  className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <span className="material-symbols-outlined text-[32px] text-blue-600 dark:text-blue-400">settings_overscan</span>
                </motion.div>
                <h3 className="text-[13px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Label Settings</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-tight">Configure global properties for the entire label surface</p>
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

                <div className="p-5 bg-slate-100 dark:bg-slate-700/40 rounded-2xl border border-slate-200 dark:border-white/10 text-center flex flex-col items-center gap-2">
                   <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center border border-slate-200 dark:border-white/10">
                     <span className="material-symbols-outlined text-[22px] text-blue-500 dark:text-blue-400">touch_app</span>
                   </div>
                   <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Select an element</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.aside>
      </motion.main>
    </div>
  );
}
