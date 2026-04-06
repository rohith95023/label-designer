import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import BarcodeUnified from '../components/common/BarcodeUnified';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import GlobalHeader from '../components/common/GlobalHeader';
import GlobalSecondaryToolbar from '../components/common/GlobalSecondaryToolbar';
import { useLabel } from '../context/LabelContext';
import { useAuth } from '../context/AuthContext';
import { Rnd } from 'react-rnd';
import html2canvas from 'html2canvas';
import { basicShapes, allIcons } from '../data/shapesLibrary';
import { v4 as uuidv4 } from 'uuid';
import FileNameModal from '../components/modals/FileNameModal';
import LabelSizeModal from '../components/modals/LabelSizeModal';
import { IconsIcons } from '../data/premiumIcons';
import { WORDART_CATEGORIES, WORDART_STYLES } from '../data/wordArtPresets';
import PreviewModal from '../components/modals/PreviewModal';
import TemplateConflictModal from '../components/modals/TemplateConflictModal';
import { calcAutoFitFontSize } from '../utils/autoFitFont';
import Ruler from '../components/ui/Ruler';
import SmartGuides from '../components/ui/SmartGuides';
import GridOverlay from '../components/ui/GridOverlay';
import { calculateAlignmentGuides } from '../utils/alignment';
import { UNITS, toPx, fromPx, PX_PER_UNIT, getTickIntervals } from '../utils/units';
import { resolveElementData, SAMPLE_TRIAL_DATA } from '../utils/dynamicData';
import { resolveUrl } from '../utils/url';
import RichTextEditor from '../components/common/RichTextEditor';
import FormattingToolbar from '../components/common/FormattingToolbar';

const ICON_RAIL_ITEMS = [
  { id: 'elements', label: 'Basics', icon: 'category' },
  { id: 'text', label: 'WordArt', icon: 'title' },
  { id: 'templates', label: 'Library', icon: 'temp_preferences_custom' },
  { id: 'shapes', label: 'Shapes', icon: 'interests' },
  { id: 'Icons', label: 'Symbols', icon: 'emoji_symbols' },
  { id: 'Variables', label: 'Data', icon: 'database' },
  { id: 'Objects', label: 'Assets', icon: 'image' },
  { id: 'stocks', label: 'Stocks', icon: 'inventory_2' },
  { id: 'layers', label: 'Layers', icon: 'layers' },
  { id: 'notes', label: 'Notes', icon: 'sticky_note_2' },
];

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
      <div className="bg-white w-full max-w-[540px] max-h-[90vh] flex flex-col rounded-[24px] shadow-3xl shadow-blue-900/10 relative overflow-hidden border border-white/50">

        {/* Subtle Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--color-primary)] via-indigo-500 to-purple-600"></div>

        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[var(--color-primary)]/5 to-indigo-50 shadow-inner flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-primary)]/10">
              <span className="material-symbols-outlined text-[24px]">table_view</span>
            </div>
            <div>
              <h3 className="font-extrabold text-[18px] text-slate-800 leading-tight">Insert Data Table</h3>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">Choose a preset or customize grid dimensions</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-7 flex flex-col gap-8 overflow-y-auto custom-scrollbar">

          <section>
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">
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
                  className={`relative flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all overflow-hidden group ${template === t.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 focus:outline-none'
                      : 'border-slate-100 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${template === t.id ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[var(--color-primary)] group-hover:shadow-sm'}`}>
                    <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                  </div>
                  <div>
                    <div className={`text-[13px] font-extrabold leading-none mb-1.5 ${template === t.id ? 'text-[var(--color-primary)]' : 'text-slate-700'}`}>{t.label}</div>
                    <div className="text-[10px] font-semibold text-slate-500">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-slate-50/70 rounded-[20px] p-5 border border-slate-100 flex gap-6">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-widest flex justify-between items-center text-slate-500 mb-3">
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">table_rows</span> Rows</span>
                <span className="text-[var(--color-primary)] font-mono text-[11px] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-md leading-none">{rows}</span>
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min="1" max="50" className="flex-1 accent-[var(--color-primary)]" value={rows} onChange={e => setRows(Number(e.target.value))} />
                <input type="number" min="1" max="100" className="w-14 bg-white border border-slate-200 rounded-xl px-2 py-1 text-sm font-mono font-bold outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-center" value={rows} onChange={e => setRows(Math.max(1, Number(e.target.value)))} />
              </div>
            </div>

            {/* Divider */}
            <div className="w-[1px] bg-slate-200 h-10 self-end mb-2"></div>

            <div className={`flex-1 transition-opacity duration-300 ${template !== 'blank' ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
              <label className="text-[10px] font-bold uppercase tracking-widest flex justify-between items-center text-slate-500 mb-3">
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">view_column</span> Columns</span>
                <span className="text-[var(--color-primary)] font-mono text-[11px] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-md leading-none">{cols}</span>
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min="1" max="12" className="flex-1 accent-[var(--color-primary)]" value={cols} onChange={e => updateColCount(Number(e.target.value))} />
                <input type="number" min="1" max="20" className="w-14 bg-white border border-slate-200 rounded-xl px-2 py-1 text-sm font-mono font-bold outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-center" value={cols} onChange={e => updateColCount(Math.max(1, Number(e.target.value)))} />
              </div>
            </div>
          </section>

          {template === 'blank' && (
            <section className="animate-fade-in pb-2">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                <span className="material-symbols-outlined text-[14px]">title</span> Column Headers
              </label>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: cols }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5 relative">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 absolute left-3.5 top-2.5 pointer-events-none">Col {i + 1}</span>
                    <input
                      type="text"
                      className="w-full bg-slate-50 hover:bg-white border-2 border-slate-100 text-sm font-semibold text-slate-800 px-3.5 pt-7 pb-2.5 rounded-xl outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all placeholder-slate-300"
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

        <div className="px-7 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/30">
          <button onClick={onCancel} className="px-6 py-2.5 text-[13px] font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all shadow-sm">Cancel</button>
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
      <div className="bg-white w-full max-w-[420px] rounded-[24px] shadow-3xl border border-white/50 overflow-hidden">
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-[16px] text-slate-800 uppercase tracking-tight">Upload New Asset</h3>
          <button onClick={onCancel} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-7 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asset Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[var(--color-primary)]" placeholder="e.g. Pfizer Logo" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Object Type</label>
            <div className="relative">
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[var(--color-primary)] appearance-none">
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
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[32px] text-slate-300">cloud_upload</span>
              <input type="file" onChange={e => setFile(e.target.files[0])} className="text-[12px] font-bold text-slate-500 file:hidden" id="asset-upload-input" />
              <label htmlFor="asset-upload-input" className="cursor-pointer text-[11px] font-black text-[var(--color-primary)] uppercase hover:underline">
                {file ? file.name : 'Choose file or drag here'}
              </label>
            </div>
          </div>
        </div>
        <div className="px-7 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 text-[13px] font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
          <button
            onClick={handleUpload}
            disabled={loading || !name || !file}
            className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-[var(--color-primary)]/20"
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
  const {
    meta, setMeta, setFileName, initNewFile, setLabelSize, newFile,
    elements, setElements, selectedIds, setSelectedIds,
    addElement, duplicateElement, updateElement, commitUpdate,
    deleteElement, moveLayer, alignElements,
    zoomLevel, setZoomLevel,
    undo, redo, historyIndex, historyLength,
    settings, updateSettings,
    savedStatus, toast, showToast, hydrated,
    validateLabel,
    saveFile, saveFileAs, finalizeFile, openFileById, openFileFromJSON, exportJSON, getAllFiles,
    setUnit,
    setLabelStock,
    labelStocks,
    toggleOrientation, saveAsTemplate, templates,
    loadTemplate,
  } = useLabel();

  const [showTemplateConflictModal, setShowTemplateConflictModal] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);

  const artboardRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);
  const richTextEditorRef = useRef(null);
  const navigate = useNavigate();
  const artboardContainerRef = useRef(null);
  const hydratedRef = useRef(false);
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
        const isEditing = document.activeElement && (
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) ||
          document.activeElement.isContentEditable
        );
        if (selectedIds.length > 0 && !isEditing) {
          setShowBulkDeleteModal(true);
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
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [modalType, setModalType] = useState('version'); // 'version' | 'finalize'
  const [saveAsName, setSaveAsName] = useState('');
  const [editingElementId, setEditingElementId] = useState(null);
  const [formatActiveStates, setFormatActiveStates] = useState({});
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
  const [rightWidth, setRightWidth] = useState(300);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  // ── Canva-style Sidebar State ──
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [lockedIcon, setLockedIcon] = useState(null);
  const activeTab = lockedIcon || hoveredIcon;

  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // 1. Check if click is inside sidebar
      const isSidebar = sidebarRef.current && sidebarRef.current.contains(event.target);
      
      // 2. Check if click is inside the label/artboard
      const isArtboard = artboardRef.current && artboardRef.current.contains(event.target);
      
      // 3. Check if click is inside a modal/portal (usually has Z-index > 1000)
      const isModal = event.target.closest('.fixed.z-\\[3000\\]') || event.target.closest('.fixed.z-\\[9999\\]');

      if (!isSidebar && !isArtboard && !isModal) {
        setLockedIcon(null);
        setHoveredIcon(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedIds]); // Added selectedIds dependency to be safe

  // --- Placeholder & Object Logic ---
  const { user: currentUser, accessToken } = useAuth();
  const [placeholders, setPlaceholders] = useState([]);
  const [placeholdersLoading, setPlaceholdersLoading] = useState(false);
  const [objects, setObjects] = useState([]);
  const [objectsLoading, setObjectsLoading] = useState(false);

  useEffect(() => {
    // Only fetch if we have a token (avoid race during refresh)
    if (!accessToken) return;

    const fetchAssets = async () => {
      setPlaceholdersLoading(true);
      setObjectsLoading(true);
      try {
        const [phData, objData] = await Promise.all([
          api.getPlaceholders(),
          api.getObjectsByStatus('ACTIVE')
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
  }, [accessToken]);

  const refreshObjects = async () => {
    setObjectsLoading(true);
    try {
      const objData = await api.getObjectsByStatus('ACTIVE');
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
      color: 'var(--color-primary)', // Blue for placeholders by default
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
    const commonProps = {
      sourceObjectId: obj.id,
      isManaged: true,
      managedType: obj.type,
      managedVersion: obj.version
    };

    if (obj.type === 'LOGO') {
      addElement({
        ...commonProps,
        type: 'image',
        src: obj.fileUrl,
        name: obj.name,
        width: 120,
        height: 120,
        imageFit: 'contain'
      });
    } else if (obj.type === 'ICON') {
      addElement({
        ...commonProps,
        type: 'icon',
        iconName: obj.name.toLowerCase().replace(/\s+/g, '_'),
        name: obj.name,
        width: 48,
        height: 48,
        color: '#191C1E'
      });
    } else if (obj.type === 'QR_SPEC') {
      addElement({
        ...commonProps,
        type: 'qrcode',
        text: 'SPEC_QR_DATA',
        name: obj.name,
        width: 80,
        height: 80,
        color: '#191C1E'
      });
    } else if (obj.type === 'BARCODE_SPEC') {
      addElement({
        ...commonProps,
        type: 'barcode',
        text: 'SPEC_BAR_DATA',
        name: obj.name,
        width: 180,
        height: 80,
        color: '#191C1E'
      });
    }
  };

  // Modal Flow Management: Auto-dismiss when file context is established
  useEffect(() => {
    if (!hydrated) return;
    
    // CASE 1: Initial hydration prompt (only if strictly empty)
    if (!meta.fileName && modalStep === 'none' && !hydratedRef.current) {
      setPendingFlow('initial'); 
      setModalStep('filename');
    }
    
    // Mark as initially processed so it doesn't pop up again even if name is cleared
    if (!hydratedRef.current) {
      hydratedRef.current = true;
    }

    // CASE 2: Auto-dismiss if identity is established while modal is blocking
    // This allows sidebar template selection to "answer" the initial prompt
    if (meta.fileName && modalStep === 'filename' && pendingFlow === 'initial') {
      setModalStep('none');
      setPendingFlow(null);
    }
  }, [hydrated, meta.fileName, modalStep, pendingFlow]);

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
      const isInput = document.activeElement && (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) ||
        document.activeElement.isContentEditable
      );

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
  const handleFileNameConfirm = async (name) => {
    const trimmed = name.trim().toLowerCase();
    const allFiles = getAllFiles();
    const exists = allFiles.find(f => f.name.toLowerCase() === trimmed);

    if (exists) {
      if (pendingFlow === 'new' || !meta.fileId || exists.id !== meta.fileId) {
        showToast(`A label named "${name.trim()}" already exists. Please choose a different name.`, 'error');
        return;
      }
    }

    if (pendingFlow === 'new') {
      const success = await initNewFile(name);
      if (!success) return; // Stop if creation failed
    } else {
      setFileName(name);
    }
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
        if (el.width) up.width = Math.max(2, Math.round(el.width * sMin));
        if (el.height) up.height = Math.max(2, Math.round(el.height * sMin));

        // Scale fonts if present
        if (el.fontSize) {
          up.fontSize = Math.max(4, Math.round(el.fontSize * sMin)); // Absolute min 4px
        }

        // Proportional border/stroke scaling for shapes
        if (el.type === 'shape') {
          if (el.borderWidth) up.borderWidth = Math.max(1, Math.round(el.borderWidth * sMin));
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
    const W = meta.labelSize.w;
    const H = meta.labelSize.h;
    
    // Boundary check for Pharma Designer
    let cx = x;
    let cy = y;

    // Basic containment for unrotated elements
    if (rot === 0) {
      if (cx < 0) cx = 0;
      if (cy < 0) cy = 0;
      if (cx + elW > W) cx = Math.max(0, W - elW);
      if (cy + elH > H) cy = Math.max(0, H - elH);
    } else {
      // For rotated elements, we use a simpler conservative box check
      // or just keep original x/y if it's within a safe margin
      if (cx < -elW/2) cx = -elW/2;
      if (cy < -elH/2) cy = -elH/2;
      if (cx > W) cx = W - elW/2;
      if (cy > H) cy = H - elH/2;
    }

    return { x: cx, y: cy };
  };

  const statusColor = savedStatus === 'saved' ? 'text-green-600' : savedStatus === 'saving' ? 'text-amber-500' : 'text-slate-400';
  const statusIcon = savedStatus === 'saved' ? 'check_circle' : savedStatus === 'saving' ? 'sync' : 'edit';
  const statusLabel = savedStatus === 'saved' ? 'Saved' : savedStatus === 'saving' ? 'Saving…' : 'Unsaved';

  if (!hydrated || (meta.fileId && !elements.length && !meta.fileName)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl animate-pulse">pill</span>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-black text-primary-dark tracking-tight">Initializing Workspace</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Securing clinical assets and loading designer...</p>
        </div>
      </div>
    );
  }

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

      {showVersionModal && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowVersionModal(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className={`p-8 text-white ${modalType === 'finalize' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 text-white">
                <span className="material-symbols-outlined text-2xl">{modalType === 'finalize' ? 'lock_person' : 'published_with_changes'}</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">{modalType === 'finalize' ? 'Final Sign-off' : 'Audit Trail Requirement'}</h3>
              <p className="text-sm text-white/60 font-medium mt-1">
                {modalType === 'finalize' 
                  ? 'Prepare clinical master for production locking' 
                  : `Commit new version v${(parseFloat(meta.versionNo || '1.0') + 1).toFixed(1)}`}
              </p>
            </div>
            <div className="p-8">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                {modalType === 'finalize' ? 'Production Release Notes' : 'Reason for modification'} (Mandatory)
              </label>
              <textarea 
                autoFocus
                id="version-comment-box"
                className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-semibold text-slate-800 focus:border-[var(--color-primary)] focus:bg-white transition-all outline-none resize-none placeholder:text-slate-300"
                placeholder={modalType === 'finalize' ? 'Document the final validated state of this clinical asset...' : 'Summarize the adjustments made to fields, layout, or content...'}
              />
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button onClick={() => setShowVersionModal(false)} className="px-6 py-3 rounded-2xl text-[12px] font-bold text-slate-500 hover:bg-slate-100 transition-all border border-slate-100">Cancel</button>
                <button 
                  onClick={() => {
                    const comment = document.getElementById('version-comment-box')?.value;
                    if (!comment?.trim()) {
                      showToast('Audit comment required for compliance', 'error');
                      return;
                    }
                    if (modalType === 'finalize') {
                      finalizeFile(comment.trim());
                    } else {
                      saveFile(comment.trim());
                    }
                    setShowVersionModal(false);
                  }}
                  className={`px-6 py-3 rounded-2xl text-[12px] font-bold text-white shadow-xl transition-all active:scale-95 ${
                    modalType === 'finalize' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  }`}
                >
                  {modalType === 'finalize' ? 'Finalize & Lock' : 'Commit Version'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>,
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

      {/* Bulk Delete Dialog */}
      {showBulkDeleteModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-[360px] p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <span className="material-symbols-outlined text-xl">delete_sweep</span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Delete {selectedIds.length} Elements?</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-all"
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[380px] p-6 flex flex-col gap-4 animate-fade-in">
            <h2 className="text-sm font-bold text-slate-800">Save As New File</h2>
            <input
              autoFocus
              type="text"
              value={saveAsName}
              onChange={e => setSaveAsName(e.target.value)}
              placeholder="New file name…"
              className="border border-outline-variant/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowSaveAs(false)} className="flex-1 py-2 rounded-xl border text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button 
                disabled={saveAsName.trim().length < 3} 
                onClick={() => { 
                  const trimmed = saveAsName.trim().toLowerCase();
                  if (getAllFiles().some(f => f.name.toLowerCase() === trimmed)) {
                    showToast(`A label named "${saveAsName.trim()}" already exists.`, 'error');
                    return;
                  }
                  saveFileAs(saveAsName); 
                  setShowSaveAs(false); 
                }} 
                className="flex-1 py-2 rounded-xl btn-gradient text-white text-sm font-bold disabled:opacity-40"
              >
                Save Copy
              </button>
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

      <TemplateConflictModal
        isOpen={showTemplateConflictModal}
        onClose={() => { setShowTemplateConflictModal(false); setPendingTemplate(null); }}
        onClearAndLoad={() => {
          if (pendingTemplate) loadTemplate(pendingTemplate);
          setShowTemplateConflictModal(false);
          setPendingTemplate(null);
        }}
        onCreateNew={async () => {
          if (pendingTemplate) {
            await newFile(); // Wait for state to reset
            loadTemplate(pendingTemplate);
          }
          setShowTemplateConflictModal(false);
          setPendingTemplate(null);
        }}
        canvasName={meta.fileName || 'Untitled Label'}
        title="How would you like to load this template?"
      />

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[999999] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 transition-all ${toast.type === 'error' ? 'bg-error text-white' : 'bg-slate-800 text-white'}`}>
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

      {/* ── Global Dual-Header System (Primary) ────────────────────────── */}
      <GlobalHeader
        activePage="editor"
        leftContent={
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowFileMenu(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white hover:bg-white/10 active:bg-white/20 transition-all border border-white/5"
            >
              <span className="material-symbols-outlined text-[18px]">folder_open</span>
              File
              <span className="material-symbols-outlined text-[14px] opacity-40">{showFileMenu ? 'expand_less' : 'expand_more'}</span>
            </button>
            <AnimatePresence>
              {showFileMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-[calc(100%+8px)] left-0 w-60 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden z-[2100]"
                >
                  <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 py-1">Document Actions</p>
                  </div>
                  <div className="p-1.5">
                    {[
                      { label: 'New Design', icon: 'add_circle', action: triggerNewFile, shortcut: 'Alt+N' },
                      { label: 'Open File', icon: 'folder_open', action: () => jsonInputRef.current?.click(), shortcut: 'Ctrl+O' },
                      { type: 'sep' },
                      { label: 'Save Changes', icon: 'published_with_changes', action: () => { setShowVersionModal(true); setModalType('version'); setShowFileMenu(false); }, shortcut: 'Ctrl+S' },
                      { label: 'Duplicate File', icon: 'content_copy', action: () => { setShowSaveAs(true); setShowFileMenu(false); } },
                      { label: 'Export JSON', icon: 'download', action: () => { exportJSON(); setShowFileMenu(false); } }
                    ].map((item, i) => item.type === 'sep'
                      ? <div key={`sep-${i}`} className="h-[1px] bg-slate-100 my-1 mx-2" />
                      : (
                        <button key={item.label} onClick={item.action} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[var(--color-primary-dark)] transition-all group">
                          <span className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-[var(--color-primary-dark)] transition-colors">{item.icon}</span>
                            {item.label}
                          </span>
                          {item.shortcut && <span className="text-[9px] font-mono text-slate-400 opacity-40">{item.shortcut}</span>}
                        </button>
                      )
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
        centerContent={
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-bold text-white tracking-tight leading-none truncate max-w-[250px]">{meta.fileName || 'Untitled Label'}</span>
              <div 
                className="flex items-center bg-white/10 rounded-md border border-white/20 px-1.5 py-0.5 shadow-sm group cursor-pointer hover:bg-white/20 transition-all" 
                onClick={() => { setModalType('version'); setShowVersionModal(true); }}
              >
                <span className="text-white text-[10px] font-black uppercase tracking-widest leading-none">v{meta.versionNo || '1.0'}</span>
              </div>
            </div>
            <div className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5 transition-colors ${savedStatus === 'saved' ? 'text-emerald-400/80' : 'text-amber-400/80'}`}>
              {savedStatus === 'saving' ? (
                <span className="material-symbols-outlined text-[11px] animate-spin">sync</span>
              ) : (
                <span className="material-symbols-outlined text-[11px]">{statusIcon}</span>
              )}
              {savedStatus === 'saved' ? 'Synced Draft' : statusLabel}
            </div>
          </div>
        }
        rightContent={
          <div className="flex items-center gap-2">
             <button 
              onClick={() => { setModalType('version'); setShowVersionModal(true); }}
              className="h-8 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
             >
               <span className="material-symbols-outlined text-[16px]">publish</span>
               Save Version
             </button>
             
             <button 
              onClick={() => { setModalType('finalize'); setShowVersionModal(true); }}
              className="h-8 px-4 border border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95"
             >
               <span className="material-symbols-outlined text-[16px]">lock_person</span>
               Finalize
             </button>

             <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

             <button
              onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
              className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/10"
             >
               <span className="material-symbols-outlined text-[18px]">download</span>
             </button>

             <AnimatePresence>
               {showExportMenu && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10, scale: 0.95 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: 10, scale: 0.95 }}
                   className="absolute top-[calc(100%+8px)] right-16 w-60 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden z-[2100]"
                 >
                  <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 py-1">Export Options</p>
                  </div>
                    <div className="p-1.5">
                      {[
                        { label: 'Download PNG', icon: 'image', action: handleExportPNG, desc: 'High resolution image' },
                        { label: 'Download PDF', icon: 'picture_as_pdf', action: handleExportPDF, desc: 'Professional vector PDF' },
                        { label: 'Save as Template', icon: 'auto_awesome_motion', action: () => {
                          const name = prompt('Enter a name for this template:', meta.fileName || 'New Template');
                          if (name) saveAsTemplate(name);
                          setShowExportMenu(false);
                        }},
                        { type: 'sep' },
                        { label: 'Send to Printer', icon: 'print', action: () => { handlePrint(); setShowExportMenu(false); } }
                      ].map((item, i) => item.type === 'sep' ? (
                        <div key={`sep-${i}`} className="h-[1px] bg-slate-100 my-1 mx-2" />
                      ) : (
                        <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[var(--color-primary-dark)] transition-all group">
                          <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-[var(--color-primary-dark)] transition-colors">{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          }
        />

      {/* ── Global Secondary Toolbar (Contextual Actions) ──────────────────── */}
      <GlobalSecondaryToolbar>
        {/* Precision Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-white/30 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
          <motion.button
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
            className="w-8 h-8 rounded-lg hover:bg-white active:scale-95 disabled:opacity-30 text-[var(--color-primary-dark)] transition-all flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
          >
            <span className="material-symbols-outlined text-[20px]">undo</span>
          </motion.button>
          <motion.button
            onClick={redo}
            disabled={historyIndex >= historyLength - 1}
            title="Redo (Ctrl+Y)"
            className="w-8 h-8 rounded-lg hover:bg-white active:scale-95 disabled:opacity-30 text-[var(--color-primary-dark)] transition-all flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
          >
            <span className="material-symbols-outlined text-[20px]">redo</span>
          </motion.button>

          <div className="w-[1px] h-4 bg-[var(--color-primary-dark)]/20 mx-1"></div>

          <button 
            onClick={() => setZoomLevel(z => Math.max(0.1, +(z - 0.1).toFixed(2)))} 
            className="w-8 h-8 rounded-lg hover:bg-white text-[var(--color-primary-dark)]/70 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">zoom_out</span>
          </button>
          <button
            onClick={handleFitToScreen}
            className="text-[11px] font-black font-mono text-[var(--color-primary-dark)] min-w-[50px] text-center select-none py-1 hover:bg-white/40 rounded-lg transition-colors border border-transparent hover:border-[var(--color-primary-dark)]/10"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button 
            onClick={() => setZoomLevel(z => Math.min(4, +(z + 0.1).toFixed(2)))} 
            className="w-8 h-8 rounded-lg hover:bg-white text-[var(--color-primary-dark)]/70 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">zoom_in</span>
          </button>
        </div>

        {/* Contextual Alignment Tools */}
        <AnimatePresence mode="wait">
          {selectedIds.length > 0 ? (
            <motion.div 
              key="alignment"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-1.5 p-1 bg-white/30 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm"
            >
              {[
                { id: 'left', icon: 'align_horizontal_left', title: 'Align Left' },
                { id: 'centerH', icon: 'align_horizontal_center', title: 'Align Center Horizontal' },
                { id: 'right', icon: 'align_horizontal_right', title: 'Align Right' },
                { type: 'sep' },
                { id: 'top', icon: 'align_vertical_top', title: 'Align Top' },
                { id: 'centerV', icon: 'align_vertical_center', title: 'Align Center Vertical' },
                { id: 'bottom', icon: 'align_vertical_bottom', title: 'Align Bottom' },
              ].map((btn, i) => btn.type === 'sep' ? (
                <div key={`sep-${i}`} className="w-[1px] h-4 bg-[var(--color-primary-dark)]/20 mx-1" />
              ) : (
                <button
                  key={btn.id}
                  onClick={() => alignElements(btn.id)}
                  className="w-8 h-8 rounded-lg hover:bg-white text-[var(--color-primary-dark)]/70 hover:text-[var(--color-primary-dark)] flex items-center justify-center transition-all"
                  title={btn.title}
                >
                  <span className="material-symbols-outlined text-[18px]">{btn.icon}</span>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 px-3 py-1 bg-white/10 rounded-lg border border-white/20"
            >
              <span className="material-symbols-outlined text-[16px] text-[var(--color-primary-dark)]/40">info</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-dark)]/50">Select elements to align</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex justify-center h-full items-center">
          <AnimatePresence>
            {editingElementId && elements.find(el => el.id === editingElementId) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <FormattingToolbar 
                  activeStates={{
                    ...formatActiveStates,
                    justifyLeft: formatActiveStates.justifyLeft || elements.find(el => el.id === editingElementId)?.align === 'left' || (!formatActiveStates.justifyCenter && !formatActiveStates.justifyRight && elements.find(el => el.id === editingElementId)?.align === undefined),
                    justifyCenter: formatActiveStates.justifyCenter || elements.find(el => el.id === editingElementId)?.align === 'center',
                    justifyRight: formatActiveStates.justifyRight || elements.find(el => el.id === editingElementId)?.align === 'right',
                    italic: formatActiveStates.italic || elements.find(el => el.id === editingElementId)?.fontStyle === 'italic',
                    underline: formatActiveStates.underline || elements.find(el => el.id === editingElementId)?.textDecoration === 'underline',
                    bold: formatActiveStates.bold || ['bold', '600', '700', '800', '900'].includes(String(elements.find(el => el.id === editingElementId)?.fontWeight)),
                  }}
                  onCommand={(cmd, val, savedRange) => {
                    const alignMaps = { justifyLeft: 'left', justifyCenter: 'center', justifyRight: 'right' };
                    const styleMaps = { 
                      bold: { prop: 'fontWeight', activeVal: 'bold', inactiveVal: '400', isActive: ['bold', '600', '700', '800', '900'].includes(String(elements.find(el => el.id === editingElementId)?.fontWeight)) },
                      italic: { prop: 'fontStyle', activeVal: 'italic', inactiveVal: 'normal', isActive: elements.find(el => el.id === editingElementId)?.fontStyle === 'italic' },
                      underline: { prop: 'textDecoration', activeVal: 'underline', inactiveVal: 'none', isActive: elements.find(el => el.id === editingElementId)?.textDecoration === 'underline' }
                    };

                    if (alignMaps[cmd]) {
                      updateElement(editingElementId, { align: alignMaps[cmd] });
                      commitUpdate();
                    } else if (styleMaps[cmd]) {
                      const map = styleMaps[cmd];
                      updateElement(editingElementId, { [map.prop]: map.isActive ? map.inactiveVal : map.activeVal });
                      commitUpdate();
                    } else if (cmd === 'foreColor') {
                      updateElement(editingElementId, { color: val });
                      commitUpdate();
                    } else if (richTextEditorRef.current) {
                      richTextEditorRef.current.format(cmd, val, savedRange);
                    }
                  }} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Design Review Controls (Right) */}
        <div className="flex items-center gap-3">
          {/* Label Size Info */}
          <div className="flex bg-white/30 border border-white/40 rounded-xl p-0.5 shadow-sm backdrop-blur-sm">
            <button
              onClick={() => setModalStep('labelsize')}
              className="flex items-center gap-2 h-8 px-3 rounded-lg text-[10px] font-black text-[var(--color-primary-dark)]/60 hover:text-[var(--color-primary-dark)] hover:bg-white/50 transition-all"
              title="Edit label dimensions"
            >
              <span className="material-symbols-outlined text-[16px]">aspect_ratio</span>
              <span className="font-mono tracking-tight hidden lg:block">
                {Math.round(AW / 3.7795275591)}×{Math.round(AH / 3.7795275591)}mm
              </span>
            </button>
            <div className="w-[1px] h-4 bg-[var(--color-primary-dark)]/10 self-center mx-0.5" />
            <button
              onClick={toggleOrientation}
              className="flex items-center gap-2 h-8 px-3 rounded-lg text-[10px] font-black text-[var(--color-primary-dark)]/60 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all"
              title="Toggle Portrait/Landscape"
            >
              <span className="material-symbols-outlined text-[16px]">screen_rotation</span>
            </button>
          </div>

          <div className="w-[1px] h-4 bg-[var(--color-primary-dark)]/10"></div>

          {/* Live Review Group */}
          <div className="flex items-center gap-1 p-1 bg-white/30 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm h-10">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              title={previewMode ? "Show Raw Placeholders" : "Show Live Trial Data"}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all h-8 ${previewMode ? 'bg-[var(--color-primary-dark)] text-white shadow-md' : 'bg-white text-slate-500 shadow-sm border border-slate-100'}`}
            >
              <span className="material-symbols-outlined text-[16px]">{previewMode ? 'database' : 'toll'}</span>
              {previewMode ? 'Live' : 'Tokens'}
            </button>
            <button
              onClick={() => setShowPreviewModal(true)}
              title="Print Preview"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-[var(--color-primary-dark)]/60 hover:bg-white/60 transition-all h-8"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              Preview
            </button>
          </div>
        </div>

        {/* View Settings */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowEditorViewSettings(!showEditorViewSettings); }}
            className={`h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm ${
              showEditorViewSettings 
                ? 'bg-[var(--color-primary-dark)] border-[var(--color-primary-dark)] text-white' 
                : 'bg-white/40 border-white/60 text-[var(--color-primary-dark)] hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">visibility_off</span>
            View
            <span className="material-symbols-outlined text-[16px] opacity-60">{showEditorViewSettings ? 'expand_less' : 'expand_more'}</span>
          </button>

          <AnimatePresence>
            {showEditorViewSettings && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-[calc(100%+8px)] right-0 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-2 z-[9999]"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Editor Environment</p>
                </div>

                {[
                  { id: 'guides', label: 'Smart Guidelines', desc: 'Alignment markers', icon: 'grid_guides', active: showGuidelines, toggle: () => setShowGuidelines(!showGuidelines) },
                  { id: 'grid', label: 'Document Grid', desc: 'Visual background grid', icon: 'grid_4x4', active: showGrid, toggle: () => setShowGrid(!showGrid) },
                  { id: 'magnet', label: 'Object Snapping', desc: 'Magnetic positioning', icon: 'magic_button', active: snapToGuides, toggle: () => setSnapToGuides(!snapToGuides) },
                  { id: 'snapGrid', label: 'Grid Snapping', desc: 'Lock to grid lines', icon: 'grid_view', active: snapToGrid, toggle: () => setSnapToGrid(!snapToGrid) },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={item.toggle}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${item.active ? 'bg-[var(--color-primary-dark)] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className={`text-[12px] font-bold ${item.active ? 'text-slate-900' : 'text-slate-500'}`}>{item.label}</span>
                      <span className="text-[9px] font-medium text-slate-400 leading-none mt-0.5">{item.desc}</span>
                    </div>
                    {item.active && <span className="material-symbols-outlined ml-auto text-emerald-500 text-[18px]">check_circle</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlobalSecondaryToolbar>



      {/* ── Premium Main 3-Column Area ──────────────────────────────────────────── */}
      <motion.main
        className="flex flex-1 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >

        {/* ── Canva-style Sidebar System ────────────────────────────────────────── */}
          <div 
          ref={sidebarRef} 
          className="flex h-full relative z-[999] bg-[#F1F5F9] border-r border-slate-200" 
          onMouseLeave={() => setHoveredIcon(null)}
        >
          {/* 1. Icon Rail (Fixed width: 72px) */}
          <aside className="w-[72px] h-full bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-1 flex-shrink-0 overflow-y-auto scrollbar-hide select-none transition-all duration-300 shadow-[2px_0_15px_rgba(0,0,0,0.02)]">
            {ICON_RAIL_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const isLocked = lockedIcon === item.id;
              return (
                <button
                  key={item.id}
                  onMouseEnter={() => setHoveredIcon(item.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLockedIcon(isLocked ? null : item.id);
                  }}
                  className={`group relative w-full flex flex-col items-center py-3 px-1 transition-all duration-300 ${
                    isActive ? 'text-[var(--color-primary-dark)]' : 'text-[var(--color-primary-dark)]/40 hover:text-[var(--color-primary-dark)]'
                  }`}
                  title={item.label}
                >
                  {/* Lock Indicator (Espresso Bar) */}
                  {isLocked && (
                    <motion.div
                      layoutId="railIndicator"
                      className="absolute left-0 top-2 bottom-2 w-[4px] bg-[var(--color-primary-dark)] rounded-r-[4px] shadow-[0_0_15px_rgba(56,36,13,0.4)]"
                    />
                  )}
                  
                  {/* Active/Hover Background */}
                  {isActive && (
                    <div className="absolute inset-x-2 inset-y-1 bg-[var(--color-primary-dark)]/5 rounded-2xl border border-[var(--color-primary-dark)]/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] -z-10" />
                  )}

                  <span className={`material-symbols-outlined text-[26px] mb-1.5 transition-all duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-105 opacity-60 group-hover:opacity-100'}`}>
                    {item.icon}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-center leading-none opacity-60">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </aside>

          {/* 2. Expandable Content Panel (Width: 320px) */}
          <AnimatePresence mode="wait">
            {activeTab && (
              <motion.div
                key={activeTab}
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -12, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="w-[320px] bg-[#F1F5F9] border-r border-slate-200 flex flex-col overflow-hidden shadow-2xl h-full"
              >
                {/* Panel Header */}
                <div className="p-6 border-b border-[var(--color-primary-dark)]/5 flex items-center justify-between shrink-0 bg-[var(--color-background)]/80 backdrop-blur-md">
                  <div className="flex flex-col">
                    <h2 className="text-[13px] font-black uppercase tracking-[0.3em] text-[var(--color-primary-dark)] leading-tight">
                      {ICON_RAIL_ITEMS.find(it => it.id === activeTab)?.label}
                    </h2>
                    <p className="text-[9px] font-black text-[var(--color-primary-dark)]/40 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                       <span className="w-1 h-1 rounded-full bg-[var(--color-primary)]" />
                       Engineering Dashboard
                    </p>
                  </div>
                  <button 
                    onClick={() => { setLockedIcon(null); setHoveredIcon(null); }}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-[var(--color-primary-dark)]/30 hover:bg-[var(--color-primary-dark)]/5 hover:text-[var(--color-primary-dark)] transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                {/* Search (Optional local filter) */}
                <div className="px-6 py-5 border-b border-[var(--color-primary-dark)]/5 shrink-0">
                   <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-[var(--color-primary-dark)]/20 group-focus-within:text-[var(--color-primary)] transition-colors">search</span>
                    <input
                      type="text"
                      placeholder={`Search ${activeTab.toUpperCase()} inventory...`}
                      value={sidebarSearch}
                      onChange={e => setSidebarSearch(e.target.value)}
                      className="w-full bg-[var(--color-primary-light)]/10 border border-transparent text-[11px] font-black text-[var(--color-primary-dark)] pl-10 pr-3 py-3 rounded-[16px] outline-none focus:border-[var(--color-primary)]/20 focus:bg-white focus:shadow-xl focus:shadow-[var(--color-primary-dark)]/5 transition-all placeholder:text-[var(--color-primary-dark)]/30 placeholder:uppercase placeholder:text-[9px] placeholder:tracking-widest"
                    />
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar-thin p-5">
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* ELEMENTS */}
                      {activeTab === 'elements' && (
                        <div className="flex flex-col gap-5">
                          <div className="grid grid-cols-2 gap-3">
                            {[
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
                                className="flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl group hover:border-[var(--color-primary)]/50/50 hover:bg-white hover:shadow-sm transition-all cursor-grab active:cursor-grabbing"
                                whileHover={{ y: -4, scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <span className="material-symbols-outlined text-slate-500 group-hover:text-[var(--color-primary)] mb-2 text-2xl transition-colors">{item.icon}</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-slate-900 transition-colors">{item.label}</span>
                              </motion.button>
                            ))}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-3 h-0.5 bg-[var(--color-primary)]/50 rounded-full"></div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pharma Fields</p>
                            </div>
                            <div className="space-y-1.5">
                              {[
                                { label: 'Rx Symbol', icon: 'medical_services', payload: { type: 'text', name: 'Rx Symbol', text: 'Rx', fontSize: 32, fontFamily: 'serif', fontWeight: '900', color: '#ba1a1a', width: 60, height: 48 } },
                                { label: 'Generic Name', icon: 'text_fields', payload: { type: 'text', name: 'Generic Name', text: 'GENERIC NAME IP\n(Brand Name)', fontSize: 18, fontFamily: 'Inter, sans-serif', fontWeight: '900', color: '#191C1E', width: 240, height: 72, align: 'center' } },
                                { label: 'Schedule H Warning', icon: 'warning', payload: { type: 'text', name: 'Schedule H', heading: 'SCHEDULE H DRUG - WARNING', text: 'To be sold by retail on the prescription of a Registered Medical Practitioner only.', fontSize: 8, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#ba1a1a', bgColor: '#fff1f0', borderColor: '#ffccc7', borderWidth: 1, borderRadius: 4, width: 260, height: 54 } },
                                { label: 'Composition', icon: 'science', payload: { type: 'text', name: 'Composition', heading: 'Composition', text: 'Each 5ml contains:\nActive Ingredient IP 250mg\nExcipients q.s.\nColor: Tartrazine', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '400', color: '#191C1E', width: 240, height: 74 } },
                                { label: 'Batch / Mfg / Exp / MRP', icon: 'calendar_today', payload: { type: 'text', name: 'Batch Info', heading: 'Batch Information', text: 'B.No: \nMfg.Date: \nExp.Date: \nM.R.P. ₹: \n(Incl. of all taxes)', fontSize: 10, fontFamily: 'Roboto Mono, monospace', fontWeight: '700', color: '#191C1E', width: 200, height: 90 } },
                                { label: 'Storage & Stability', icon: 'device_thermostat', payload: { type: 'text', name: 'Storage', heading: 'Storage', text: 'Store below 25°C. Protected from light and moisture. Do not freeze.', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#191C1E', width: 240, height: 44 } },
                                { label: 'Child Safety Warning', icon: 'child_care', payload: { type: 'text', name: 'Child Safety', text: 'KEEP OUT OF REACH OF CHILDREN', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: '900', color: '#191C1E', width: 240, height: 24, align: 'center' } },
                                { label: 'Shake Well (Susp.)', icon: 'shake', payload: { type: 'text', name: 'Shake Well', text: 'SHAKE WELL BEFORE USE', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: '900', color: '#191C1E', width: 240, height: 24, align: 'center' } },
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
                                  className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-700 cursor-pointer border border-slate-200 hover:border-[var(--color-primary)]/50/50 hover:bg-white hover:shadow-sm transition-all group lg:active:cursor-grabbing"
                                  whileHover={{ x: 4 }}
                                >
                                  <span className="material-symbols-outlined text-[18px] text-slate-500 group-hover:text-blue-400 shrink-0">{item.icon}</span>
                                  {item.label}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TEXT & WORDART */}
                      {activeTab === 'text' && (
                        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-left-4 duration-300">
                          {/* Standard Text Presets */}
                          <div className="flex flex-col gap-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 ml-1 text-primary">Add Text Box</p>
                            <button
                              onClick={() => addElement({ type: 'text', name: 'Heading', text: 'Add a heading', fontSize: 32, fontFamily: 'Outfit, sans-serif', fontWeight: '900', color: '#191C1E', width: 280, height: 48 })}
                              className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:border-[var(--color-primary)]/50 hover:shadow-lg transition-all"
                            >
                              <span className="text-xl font-black text-slate-800">Add a heading</span>
                              <span className="material-symbols-outlined text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                            </button>
                            <button
                              onClick={() => addElement({ type: 'text', name: 'Subheading', text: 'Add a subheading', fontSize: 18, fontFamily: 'Outfit, sans-serif', fontWeight: '700', color: '#475569', width: 220, height: 32 })}
                              className="group flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:border-[var(--color-primary)]/50 hover:shadow-lg transition-all"
                            >
                              <span className="text-sm font-bold text-slate-700">Add a subheading</span>
                              <span className="material-symbols-outlined text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                            </button>
                            <button
                              onClick={() => addElement({ type: 'text', name: 'Body Text', text: 'Add a little bit of body text', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: '400', color: '#64748b', width: 180, height: 28 })}
                              className="group flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:border-[var(--color-primary)]/50 hover:shadow-lg transition-all"
                            >
                              <span className="text-[11px] font-medium text-slate-500">Add a little bit of body text</span>
                              <span className="material-symbols-outlined text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                            </button>
                          </div>

                          {/* WordArt Gallery Section */}
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">WordArt styles</p>
                              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                                {WORDART_CATEGORIES.map(t => (
                                  <button 
                                    key={t} 
                                    onClick={(e) => { e.stopPropagation(); setWordArtTab(t); }}
                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${wordArtTab === t ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              {(WORDART_STYLES[wordArtTab] || []).map((art, idx) => (
                                <button key={idx} onClick={() => {
                                  addElement({ type: 'text', text: art.name, ...art.style, width: 220, height: 40, fontFamily: 'Outfit, sans-serif' });
                                  commitUpdate();
                                }} className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-2xl bg-white hover:border-[var(--color-primary)]/50 hover:shadow-xl transition-all group active:scale-[0.98] overflow-hidden min-h-[100px] shadow-sm">
                                  <span style={{ ...art.style, fontSize: '20px' }} className="mb-2 block text-center leading-normal break-words w-full h-auto text-on-surface">{art.name}</span>
                                  <span className="text-[8px] uppercase font-black tracking-widest text-slate-300 group-hover:text-[var(--color-primary)]/50 transition-colors">Apply Preset</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TEMPLATES */}
                      {activeTab === 'templates' && (
                        <div className="grid gap-4">
                          {templates.map(tpl => (
                            <motion.div
                              key={tpl.id}
                              onClick={() => loadTemplate(tpl)}
                              className="group cursor-pointer bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden hover:border-[var(--color-primary)]/50/50 transition-all duration-300"
                              whileHover={{ y: -4 }}
                            >
                              <div className="aspect-[1.5/1] bg-slate-200 flex items-center justify-center p-4">
                                {tpl.imageUrl ? (
                                  <img src={resolveUrl(tpl.imageUrl)} alt={tpl.name} className="max-w-full max-h-full object-contain" />
                                ) : (
                                  <span className="material-symbols-outlined text-[32px] text-slate-400/30">description</span>
                                )}
                              </div>
                              <div className="p-3 border-t border-slate-100 bg-slate-50 group-hover:bg-white transition-colors">
                                <span className="text-[11px] font-black text-slate-800 uppercase truncate block">{tpl.name}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 block">{tpl.category || 'Standard'}</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* SHAPES */}
                      {activeTab === 'shapes' && (
                        <div className="flex flex-col gap-6">
                          <div className="grid grid-cols-2 gap-3">
                            {basicShapes.map(s => (
                              <motion.button
                                key={s.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('application/json', JSON.stringify(s.payload));
                                  
                                  const ghost = document.createElement('div');
                                  ghost.id = 'drag-ghost-' + s.id;
                                  const p = s.payload;
                                  ghost.style.width = p.width + 'px';
                                  ghost.style.height = p.height + 'px';
                                  ghost.style.position = 'absolute';
                                  ghost.style.top = '-9999px';
                                  ghost.style.left = '-9999px';
                                  ghost.style.boxSizing = 'border-box';
                                  ghost.style.backgroundColor = p.shapeType === 'line' ? 'transparent' : (p.bgColor || 'transparent');
                                  if (p.shapeType === 'line') {
                                    ghost.style.borderTop = `${p.height}px solid ${p.bgColor || '#191c1e'}`;
                                  } else {
                                    ghost.style.border = `${p.borderWidth}px solid ${p.borderColor || 'transparent'}`;
                                  }
                                  ghost.style.borderRadius = p.shapeType === 'circle' ? '50%' : `${p.borderRadius || 0}px`;
                                  
                                  document.body.appendChild(ghost);
                                  e.dataTransfer.setDragImage(ghost, p.width / 2, p.height / 2);
                                }}
                                onDragEnd={() => {
                                  const ghost = document.getElementById('drag-ghost-' + s.id);
                                  if (ghost) document.body.removeChild(ghost);
                                }}
                                onClick={() => {
                                  const centerX = AW / 2;
                                  const centerY = AH / 2;
                                  addElement({
                                    ...s.payload,
                                    x: centerX - (s.payload.width / 2),
                                    y: centerY - (s.payload.height / 2)
                                  });
                                }}
                                className="flex flex-col items-center p-4 rounded-2xl border transition-all bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-[var(--color-primary)]/50/50 hover:shadow-sm cursor-grab active:cursor-grabbing"
                                whileHover={{ y: -2 }}
                              >
                                <span className="material-symbols-outlined text-3xl mb-2">{s.render}</span>
                                <span className="text-[10px] font-black uppercase tracking-wider">{s.name}</span>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ICONS */}
                      {activeTab === 'Icons' && (
                        <div className="flex flex-col gap-8">
                           {Object.entries(IconsIcons).map(([cat, icons]) => (
                            <div key={cat}>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 ml-1">{cat}</p>
                              <div className="grid grid-cols-3 gap-2">
                                {icons.slice(0, 15).map((icon, i) => (
                                  <button
                                    key={i}
                                    onClick={() => addElement({ type: 'IconsIcon', svg: icon.svg, name: icon.name, width: 60, height: 60 })}
                                    className="aspect-square flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-100 hover:border-[var(--color-primary)]/50/50 hover:bg-white transition-all group"
                                  >
                                    <div className="w-8 h-8 mb-1.5 flex items-center justify-center transition-transform group-hover:scale-110 opacity-60 group-hover:opacity-100" dangerouslySetInnerHTML={{ __html: icon.svg }} />
                                    <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-slate-900 truncate w-full text-center tracking-tighter">{icon.name.split(' ')[0]}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* VARIABLES */}
                      {activeTab === 'Variables' && (
                        <div className="flex flex-col gap-2.5">
                          {placeholders.map(ph => (
                            <button
                              key={ph.id}
                              onClick={() => addPlaceholder(ph)}
                              className="flex items-center gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:shadow-sm hover:border-[var(--color-primary)]/50/50 transition-all text-left group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/50/10 text-[var(--color-primary)] flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all shadow-sm">
                                <span className="material-symbols-outlined text-[18px]">database</span>
                              </div>
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tight">{ph.name}</span>
                                <span className="text-[9px] font-mono text-[var(--color-primary)] font-bold mt-0.5">{`{{${ph.mappingKey}}}`}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* OBJECTS */}
                      {activeTab === 'Objects' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                           {/* Quick Action: New Asset Upload — AC 18.0 */}
                           <button 
                             onClick={() => setShowAssetModal(true)}
                             className="group flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 hover:bg-white hover:border-[var(--color-primary)]/50 hover:shadow-xl hover:shadow-[var(--color-primary)]/5 transition-all duration-300 text-left active:scale-[0.98]"
                           >
                             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-slate-400 group-hover:from-[var(--color-primary)] group-hover:to-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-lg group-hover:shadow-[var(--color-primary)]/20 border border-slate-200 group-hover:border-transparent">
                               <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                             </div>
                             <div className="flex flex-col flex-1">
                               <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none mb-1.5 transition-colors group-hover:text-[var(--color-primary)]">Upload New Asset</span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Add logo, icon or barcode spec</span>
                             </div>
                             <span className="material-symbols-outlined text-slate-300 group-hover:text-[var(--color-primary)] transition-all group-hover:translate-x-1 opacity-0 group-hover:opacity-100">chevron_right</span>
                           </button>

                           {/* Horizontal Divider */}
                           <div className="flex items-center gap-3 py-2">
                             <div className="h-[1px] flex-1 bg-slate-200"></div>
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Inventory</span>
                             <div className="h-[1px] flex-1 bg-slate-200"></div>
                           </div>

                           {objectsLoading ? (
                             <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                               <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-[var(--color-primary)] animate-spin"></div>
                               <span className="text-[10px] font-black uppercase tracking-widest">Hydrating Assets...</span>
                             </div>
                           ) : objects.length === 0 ? (
                             <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400/60 text-center">
                               <span className="material-symbols-outlined text-[40px] opacity-30">inventory_2</span>
                               <p className="text-[11px] font-bold">No assets found in inventory.<br/>Upload your first design object above.</p>
                             </div>
                           ) : (
                             <div className="flex flex-col gap-3">
                               {objects
                                 .filter(obj => !sidebarSearch || obj.name.toLowerCase().includes(sidebarSearch.toLowerCase()) || obj.type.toLowerCase().includes(sidebarSearch.toLowerCase()))
                                 .slice(0, 30).map(obj => (
                                 <button
                                   key={obj.id}
                                   onClick={() => addObject(obj)}
                                   className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 hover:border-[var(--color-primary)]/50/50 hover:bg-white transition-all group lg:active:scale-[0.98] animate-in fade-in zoom-in-95 duration-300"
                                 >
                                   <div className="w-14 h-14 rounded-xl bg-slate-200/50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 group-hover:border-[var(--color-primary)]/20 transition-all">
                                     {obj.type === 'LOGO' ? (
                                       <img src={resolveUrl(obj.fileUrl)} alt={obj.name} className="w-4/5 h-4/5 object-contain" />
                                     ) : (
                                       <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-[var(--color-primary)] transition-colors">{obj.type === 'QR_SPEC' ? 'qr_code_2' : 'barcode'}</span>
                                     )}
                                   </div>
                                   <div className="flex flex-col min-w-0 text-left flex-1">
                                     <span className="text-[11px] font-black text-slate-800 uppercase truncate tracking-tight">{obj.name}</span>
                                     <span className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest group-hover:text-[var(--color-primary)]/60 transition-colors">{obj.type}</span>
                                   </div>
                                   <span className="material-symbols-outlined text-slate-200 transition-colors group-hover:text-[var(--color-primary)]/30">add_circle</span>
                                 </button>
                               ))}
                             </div>
                           )}
                        </div>
                      )}


                      {/* STOCKS */}
                      {activeTab === 'stocks' && (() => {
                        const activeStocks = labelStocks.filter(s => {
                          if (s.status !== 'ACTIVE') return false;
                          const stockId = s.stockId?.toLowerCase() || '';
                          const isPredefined = [
                            'bottle', 'vial', 'blister', 'a5', 'a4',
                            'tablet-std', 'syrup-std', 'injection-std', 'ointment-std', 'generic-std',
                            'standard tablet', 'standard syrup', 'standard injection', 'standard ointment', 'standard generic'
                          ].includes(stockId);
                          return !isPredefined;
                        });
                        const selectedStock = activeStocks.find(s => s.id === meta.labelStockId);
                        return (
                          <div className="flex flex-col gap-3">
                            {/* Detail card for selected stock — AC 13.3, 13.9 */}
                            {selectedStock && (
                              <div className="p-4 rounded-2xl bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/20 mb-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)] mb-2 flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[14px]">verified</span>
                                  Selected Stock
                                </p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                                  <span className="text-slate-500 font-medium">ID</span>
                                  <span className="font-black text-slate-800 text-right">{selectedStock.stockId}</span>
                                  <span className="text-slate-500 font-medium">Dimensions</span>
                                  <span className="font-black text-slate-800 text-right">{selectedStock.length}×{selectedStock.breadth}×{selectedStock.height} mm</span>
                                  <span className="text-slate-500 font-medium">Unit</span>
                                  <span className="font-black text-slate-800 text-right">{selectedStock.unitOfMeasure}</span>
                                  <span className="text-slate-500 font-medium">In Stock</span>
                                  <span className={`font-black text-right ${Number(selectedStock.quantityOnHand) <= Number(selectedStock.reorderLevel) ? 'text-red-600' : 'text-green-700'}`}>{selectedStock.quantityOnHand}</span>
                                  {selectedStock.supplier && <>
                                    <span className="text-slate-500 font-medium">Supplier</span>
                                    <span className="font-black text-slate-800 text-right truncate">{selectedStock.supplier}</span>
                                  </>}
                                  {selectedStock.costCenter && <>
                                    <span className="text-slate-500 font-medium">Cost Centre</span>
                                    <span className="font-black text-slate-800 text-right">{selectedStock.costCenter}</span>
                                  </>}
                                </div>
                              </div>
                            )}

                            {/* Stock cards list */}
                            {activeStocks.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                                <span className="material-symbols-outlined text-[36px]">inventory_2</span>
                                <p className="text-[10px] font-bold text-center">No active stocks found.<br/>Add stocks in the Label Stocks master.</p>
                              </div>
                            ) : activeStocks.map(stock => (
                              <button
                                key={stock.id}
                                onClick={() => setLabelStock(stock.id)}
                                className={`flex flex-col p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${
                                  meta.labelStockId === stock.id 
                                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-xl scale-[1.02]' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[var(--color-primary)]/50 hover:bg-white'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-1.5">
                                  <span className={`text-[12px] font-black uppercase tracking-tight leading-tight ${meta.labelStockId === stock.id ? 'text-white' : 'text-slate-800'}`}>{stock.name}</span>
                                  {meta.labelStockId === stock.id && <span className="material-symbols-outlined text-white text-lg shrink-0">check_circle</span>}
                                </div>
                                <div className="flex items-center gap-2 opacity-70">
                                  <span className="text-[9px] font-bold uppercase tracking-widest">{stock.unitOfMeasure}</span>
                                  <span className="w-1 h-1 rounded-full bg-current opacity-30"></span>
                                  <span className="text-[9px] font-mono font-bold">{stock.length}×{stock.breadth} mm</span>
                                  <span className="w-1 h-1 rounded-full bg-current opacity-30"></span>
                                  <span className="text-[9px] font-mono">{stock.stockId}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        );
                      })()}


                      {/* LAYERS */}
                      {activeTab === 'layers' && (
                        <div className="flex flex-col gap-1.5">
                          {[...elements].reverse().map(el => (
                            <div
                              key={el.id}
                              onClick={() => setSelectedIds([el.id])}
                              className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                                selectedIds.includes(el.id) 
                                  ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/50/50 text-[var(--color-primary)]' 
                                  : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center gap-4 overflow-hidden">
                                <span className="material-symbols-outlined text-[16px] shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                                   {el.type === 'image' ? 'image' : el.type === 'shape' ? 'category' : el.type === 'text' ? 'match_case' : 'star'}
                                </span>
                                <span className="text-[11px] font-black uppercase tracking-tight truncate">{el.name || el.text || el.type}</span>
                              </div>
                              <span className={`material-symbols-outlined text-lg transition-all ${el.locked ? 'text-[var(--color-primary)]/50' : 'opacity-20'}`}>
                                {el.locked ? 'lock' : 'lock_open'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* NOTES */}
                      {activeTab === 'notes' && (
                        <div className="flex flex-col gap-5">
                          <div className="flex flex-col gap-1">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-300">Project Workspace</h4>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Internal SOPs & Metadata</p>
                          </div>
                          <div className="flex flex-col bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-[var(--color-primary)]/50/20 transition-all h-[400px]">
                            <div className="p-3 bg-slate-100/50 border-b border-slate-100 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-slate-500">edit_note</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Label Notes</span>
                              </div>
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-300 border ${
                                savedStatus === 'saved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                savedStatus === 'saving' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              } text-[8px] font-black uppercase tracking-wider`}>
                                <span className={`material-symbols-outlined text-[12px] ${savedStatus === 'saving' ? 'animate-spin' : ''}`}>
                                  {savedStatus === 'saved' ? 'check_circle' : savedStatus === 'saving' ? 'sync' : 'history'}
                                </span>
                                {savedStatus === 'saved' ? 'Auto-saved' : savedStatus === 'saving' ? 'Saving...' : 'Draft (Unsaved)'}
                              </div>
                            </div>
                            <textarea
                              value={meta.notes || ''}
                              onChange={(e) => setMeta(prev => ({ ...prev, notes: e.target.value }))}
                              onBlur={commitUpdate}
                              placeholder="Type label specific instructions, change logs, or validation requirements here..."
                              className="w-full flex-1 p-4 text-[13px] bg-transparent outline-none resize-none font-medium text-slate-700 leading-relaxed placeholder:text-slate-400 custom-scrollbar-thin"
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-2xl border border-slate-200 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex gap-2 px-3 border-r border-slate-200 items-center">
                  <button onClick={() => setIsEraserMode(false)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${!isEraserMode ? 'btn-gradient shadow-sm text-white shadow-lg shadow-primary/30' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button onClick={() => setIsEraserMode(true)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isEraserMode ? 'btn-gradient shadow-sm text-white shadow-lg shadow-primary/30' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <span className="material-symbols-outlined text-lg">ink_eraser</span>
                  </button>
                </div>
                <div className="flex gap-2 px-3 border-r border-slate-200">
                  {['#191C1E', '#BA1A1A', '#1D4ED8', '#15803D'].map(c => (
                    <button key={c} onClick={() => { setPenColor(c); setIsEraserMode(false); }} className={`w-6 h-6 rounded-full ring-2 transition-all ${(!isEraserMode && penColor === c) ? 'ring-primary ring-offset-2 scale-110' : 'ring-transparent opacity-80 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex items-center gap-3 px-3 border-r border-slate-200">
                  <span className="material-symbols-outlined text-slate-400 text-sm">{isEraserMode ? 'circle' : 'line_weight'}</span>
                  <input type="range" min="1" max="15" value={penWidth} onChange={e => setPenWidth(e.target.value)} className="w-20 h-1 bg-slate-200 rounded-lg accent-primary" title={isEraserMode ? "Eraser Size" : "Pen Size"} />
                </div>
                <div className="flex items-center gap-2 pr-1">
                  <button onClick={() => setCurrentLines(currentLines.slice(0, -1))} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all" title="Undo Last Stroke">
                    <span className="material-symbols-outlined text-lg">undo</span>
                  </button>
                  <button onClick={() => setCurrentLines([])} className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-tight text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">Clear Canvas</button>
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
              <div className="flex items-center gap-3 bg-[var(--color-primary)] p-2.5 rounded-2xl shadow-2xl border border-blue-400 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-xl">
                    {basicShapes.find(s => s.id === shapeDrawingTool)?.render || 'crop_square'}
                  </span>
                </div>
                <div className="flex flex-col pr-2">
                  <span className="text-white text-[11px] font-black uppercase tracking-widest leading-none">
                    Drafting: {basicShapes.find(s => s.id === shapeDrawingTool)?.name || shapeDrawingTool}
                  </span>
                  <span className="text-white/60 text-[10px] font-bold mt-0.5">Click and drag on canvas to draw</span>
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
          <div className="flex flex-col items-center justify-start min-h-full min-w-max p-[100px]">
            <div 
              style={{ 
                width: `${AW * zoomLevel}px`, 
                height: `${AH * zoomLevel}px`, 
                position: 'relative',
                transition: 'width 0.1s ease, height 0.1s ease'
              }}
            >
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
                  transformOrigin: 'top left',
                  overflow: 'visible',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 30 }}
              onClick={e => {
                // Only deselect if the click was directly on the artboard background, not bubbled from a child element
                if (e.target === e.currentTarget || e.target.id === 'pharma-artboard') {
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
                style={{ transform: `scale(${1 / zoomLevel})`, transformOrigin: 'right bottom' }}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <span className="material-symbols-outlined text-[14px] text-primary">aspect_ratio</span>
                  <span className="text-[10px] font-black font-mono text-slate-800">
                    {fromPx(AW, meta.unit).toFixed(1)} × {fromPx(AH, meta.unit).toFixed(1)} {meta.unit}
                  </span>
                </div>
                {artboardCursor.x !== null && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-xl shadow-sm border border-blue-600">
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
                      <circle cx={eraserPos.x} cy={eraserPos.y} r={parseFloat(penWidth) * 2.5} fill="rgba(37, 99, 235, 0.15)" stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="2 2" />
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
                    onAddGuide={(pos) => setManualGuidelines(prev => [...prev, { orientation: 'vertical', pos }])}
                  />
                  <Ruler
                    orientation="vertical"
                    length={AH}
                    zoomLevel={zoomLevel}
                    unit={meta.unit}
                    cursorPos={artboardCursor.y}
                    selection={selectedElement ? { start: selectedElement.y, end: selectedElement.y + (selectedElement.height || 0) } : null}
                    onAddGuide={(pos) => setManualGuidelines(prev => [...prev, { orientation: 'horizontal', pos }])}
                  />
                  {/* Corner Box where rulers meet */}
                  <div
                    className="absolute top-[-32px] left-[-32px] w-8 h-8 z-10"
                    style={{
                      backgroundColor: 'rgba(241, 245, 249, 1)',
                      borderRight: '1px solid rgba(0, 0, 0, 0.15)',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.15)',
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
                      const selectedShape = basicShapes.find(s => s.id === shapeDrawingTool);
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
                      } else if (selectedShape) {
                        addElement({
                          type: 'shape',
                          shapeType: selectedShape.payload.shapeType,
                          x: Math.round(left),
                          y: Math.round(top),
                          width: Math.round(width),
                          height: Math.round(height),
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
                        return <ellipse cx={left + width / 2} cy={top + height / 2} rx={width / 2} ry={height / 2} fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />;
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
                      scale={zoomLevel}
                      size={{ width: elW, height: elH }}
                      position={{ x: el.x, y: el.y }}
                      bounds={undefined}
                      cancel=".rich-text-editor"
                      disableDragging={el.locked || editingElementId === el.id}
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
                      onMouseDown={e => {
                        // If already editing this element, let the event pass naturally to the contenteditable
                        if (editingElementId === el.id) return;
                        // Only handle primary button clicks
                        if (e.button !== 0) return;
                        e.stopPropagation();
                        if (e.shiftKey) {
                          setSelectedIds(prev => prev.some(id => String(id) === String(el.id)) 
                            ? prev.filter(id => String(id) !== String(el.id)) 
                            : [...prev, el.id]);
                        } else if (!selectedIds.some(id => String(id) === String(el.id))) {
                          setSelectedIds([el.id]);
                        }
                        if (editingElementId && String(editingElementId) !== String(el.id)) {
                          setEditingElementId(null);
                          commitUpdate();
                        }
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        // allow editing if already selected OR it is the element we just clicked
                        const isElementSelected = selectedIds.some(id => String(id) === String(el.id));
                        if (!el.locked && isElementSelected && ['text', 'warnings', 'manufacturing', 'dosage', 'storage', 'subtext', 'shape', 'table', 'brand', 'dynamic'].includes(el.type)) {
                          setEditingElementId(el.id);
                        }
                      }}
                      onDoubleClick={e => {
                        e.stopPropagation();
                        // Allow immediate edit on double click regardless of selection state to bypass async state update
                        if (!el.locked && ['text', 'warnings', 'manufacturing', 'dosage', 'storage', 'subtext', 'shape', 'table', 'brand', 'dynamic'].includes(el.type)) {
                          setEditingElementId(el.id);
                          setSelectedIds([el.id]);
                        }
                      }}
                    >
                      {isSelected && (
                        <div className={`absolute left-1/2 -translate-x-1/2 bg-white shadow-xl min-w-max px-2 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1 z-[500] pointer-events-auto transform transition-all origin-center ${(el.y * zoomLevel > AH * zoomLevel - 60 || (el.rotation > 110 && el.rotation < 250))
                            ? '-top-[56px]'
                            : 'top-[calc(100%+8px)]'
                          }`}
                          style={{ transform: `translateX(-50%) scale(${1 / zoomLevel})` }}
                          onMouseDown={e => e.stopPropagation()}
                        >

                          {el.locked ? (
                            <div className="flex items-center gap-2 px-3 py-1 text-[var(--color-primary)] font-bold text-[10px] uppercase tracking-wider animate-pulse">
                              <span className="material-symbols-outlined text-[16px]">lock</span> Layer Locked
                            </div>
                          ) : (
                            <>
                              {/* Table Specific Controls */}
                              {el.type === 'table' && (
                                <div className="flex gap-1 shrink-0 px-2 border-r border-slate-200">
                                  <button onClick={e => {
                                    e.stopPropagation();
                                    const lines = (el.text || '').split('\n');
                                    const colCount = lines[0].split('|').length;
                                    lines.push(Array(colCount).fill('').join('\n'));
                                    updateElement(el.id, { text: lines.join('\n'), height: (el.height || 0) + 25 });
                                    commitUpdate();
                                  }} className="px-2 py-0.5 rounded bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 text-blue-700 text-[10px] font-bold flex items-center gap-1 transition-all" title="Add Row">
                                    <span className="material-symbols-outlined text-[14px]">add</span> Row
                                  </button>
                                  <button onClick={e => {
                                    e.stopPropagation();
                                    const lines = (el.text || '').split('\n');
                                    const next = lines.map(l => l + '|');
                                    updateElement(el.id, { text: next.join('\n'), width: (el.width || 0) + 50 });
                                    commitUpdate();
                                  }} className="px-2 py-0.5 rounded bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 text-blue-700 text-[10px] font-bold flex items-center gap-1 transition-all" title="Add Column">
                                    <span className="material-symbols-outlined text-[14px]">add</span> Column
                                  </button>
                                </div>
                              )}

                              {/* Barcode Data Editor */}
                              {el.type === 'barcode' && (
                                <div className="flex items-center gap-1.5 px-2 border-r border-slate-200">
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
                                  className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-[var(--color-primary)] transition-colors" title="Duplicate">
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
                        className={`w-full h-full relative text-content-wrapper overflow-visible group ${editingElementId === el.id ? 'select-text cursor-text' : 'select-none'} ${isSelected ? 'outline outline-2 outline-[var(--color-primary)]/50 outline-offset-0 ring-4 ring-[var(--color-primary)]/50/10' : ''}`}
                        style={{
                          transform: `rotate(${el.rotation || 0}deg)`,
                          transformOrigin: '50% 50%',
                          opacity: el.opacity !== undefined ? el.opacity : 1,
                        }}
                      >
                        <div className="w-full h-full relative" style={{
                          boxSizing: 'border-box',
                          backgroundColor: (el.type === 'shape' && el.shapeType === 'line') ? 'transparent' : (el.bgColor || 'transparent'),
                          ...((el.type === 'shape' && el.shapeType === 'line')
                            ? {
                              borderTop: `${el.height || 4}px ${el.borderStyle || 'solid'} ${el.bgColor || '#191c1e'}`
                            }
                            : {
                              border: `${el.borderWidth || 0}px ${el.borderStyle || 'solid'} ${el.borderColor || 'transparent'}`,
                            }
                          ),
                          borderRadius: el.type === 'shape' && el.shapeType === 'circle' ? '50%' : `${el.borderRadius || 0}px`,
                          // Auto-fit font size for non-editing text to fit within element bounds
                          fontSize: `${el.fontSize || 16}px`,
                          fontFamily: el.fontFamily || 'Inter, sans-serif',
                          fontWeight: el.fontWeight || '400',
                          fontStyle: el.fontStyle || 'normal',
                          textDecoration: el.textDecoration || 'none',
                          color: el.color || '#191c1e',
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
                                stroke={el.color || '#191c1e'}
                                strokeWidth={el.penWidth || 3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          {(el.heading !== undefined) && isSelected ? (
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
                          ) : el.heading && !isSelected ? (
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
                                color: el.color || '#191c1e'
                              }}>{el.iconName}</span>
                            </div>
                          ) : el.type === 'IconsIcon' ? (
                            <div className="w-full flex-1 min-h-0 p-1 flex items-center justify-center pointer-events-none" style={{
                              color: el.color || '#191c1e'
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
                                            className="w-full h-full bg-white outline-none border-none p-1 text-inherit font-inherit resize-none block m-0"
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
                            <RichTextEditor
                              ref={richTextEditorRef}
                              html={el.html || el.text || ''}
                              onChange={({ html, text }) => updateElement(el.id, { html, text })}
                              onResize={({ height }) => updateElement(el.id, { height })}
                              onSelectionChange={setFormatActiveStates}
                              onBlur={null}
                              style={{
                                fontFamily: 'inherit',
                                fontSize: 'inherit',
                                // Do not force bold/italic/underline to inherit so document.execCommand works
                                color: 'inherit',
                                lineHeight: 'inherit',
                                textAlign: 'inherit', // Let editor's inner divs/tags handle alignment
                                minHeight: '100%',
                                width: '100%'
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
                            <span className="block w-full min-h-[1em]" style={{
                              wordBreak: 'break-word',
                              textAlign: el.align || (el.type === 'shape' ? 'center' : 'left'),
                            }}
                            dangerouslySetInnerHTML={{ __html: el.html || el.text || (isSelected ? '' : '&nbsp;') }}
                            />
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
                              className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-slate-50 text-[var(--color-primary)] z-[60] cursor-grab active:cursor-grabbing"
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
          </div>
        </motion.section>

        {/* ── Premium Right Properties Panel ────────────────────────────────────── */}
        <motion.aside
          className="bg-[#F1F5F9] border-l border-slate-200 flex flex-col overflow-hidden shrink-0 relative shadow-sm"
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
              className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--color-primary)]/50/30 active:bg-[var(--color-primary)]/50 z-50 transition-colors"
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
            className="absolute top-1/2 -translate-y-1/2 left-0 w-5 h-20 bg-white/40 hover:bg-primary transition-all flex items-center justify-center text-slate-400 hover:text-white rounded-r-xl border border-l-0 border-white/10 shadow-sm z-50 group"
          >
            <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:scale-125">
              {rightSidebarCollapsed ? 'chevron_left' : 'chevron_right'}
            </span>
          </button>

          {!rightSidebarCollapsed && (
            <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
              {selectedIds.length > 1 ? (
                <div className="animate-fade-in p-4 space-y-6">
                  <div className="flex items-center justify-between bg-[var(--color-primary)]/5 px-3 py-3 rounded-xl mb-4 border border-[var(--color-primary)]/50/10">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[15px]">group</span>
                        Bulk Selection
                      </span>
                      <span className="text-[9px] text-[var(--color-primary)]/70 font-bold">{selectedIds.length} Elements Selected</span>
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
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-4">
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
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-primary block">Batch Content Action</span>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">Append Suffix to Elements</label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 text-[11px] py-2.5 pl-3 pr-10 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all font-medium"
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
                  <div className="sticky top-0 z-[20] shadow-sm flex flex-col bg-primary-container border-b border-white/20 rounded-b-xl mb-2">
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-[15px]">{selectedElement.locked ? 'lock' : 'lock_open'}</span>
                        {selectedElement.locked ? 'Layer Secured' : 'Unsecured Layer'}
                      </span>
                      <button
                        onClick={() => {
                          updateElement(selectedElement.id, { locked: !selectedElement.locked });
                          commitUpdate();
                        }}
                        className={`h-7 px-3 rounded-xl border text-[10px] font-extrabold uppercase transition-all flex items-center gap-2 shadow-sm ${selectedElement.locked ? 'bg-[var(--color-primary)] border-blue-700 text-white hover:bg-blue-700' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                      >
                        <span className="material-symbols-outlined text-[15px]">{selectedElement.locked ? 'lock_open' : 'lock'}</span>
                        <span>{selectedElement.locked ? 'Unlock' : 'Lock'}</span>
                      </button>
                    </div>

                    {selectedElement.isManaged && (
                      <div className="px-4 py-1.5 bg-blue-600/10 border-t border-blue-600/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-blue-600">verified</span>
                          <span className="text-[9px] font-black text-blue-800 uppercase tracking-widest">Managed Clinical Asset</span>
                        </div>
                        <span className="text-[8px] font-bold text-blue-500 uppercase">v{selectedElement.managedVersion || '1.0'}</span>
                      </div>
                    )}
                  </div>

                  {/* Protected Property Sections */}
                  <div className={selectedElement.locked ? 'pointer-events-none opacity-50 grayscale-[50%]' : ''}>

                    {/* ── Premium Position Block ────────────────────────────────────────── */}
                    <motion.div
                      className="p-5 border-b border-white/20 bg-slate-50/50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Position & Size</span>
                        <motion.button
                          onClick={() => deleteElement(selectedElement.id)}
                          className="h-7 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded-lg border border-red-200 transition-all flex items-center gap-1.5"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                          <span className="uppercase">Delete</span>
                        </motion.button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {['x', 'y'].map(axis => (
                          <div key={axis} className="bg-white border border-slate-200 rounded-lg p-1.5 flex items-center">
                            <span className="text-[9px] font-bold text-slate-400 w-8 pl-1">{axis.toUpperCase()} ({meta.unit})</span>
                            <input
                              type="number"
                              step="0.1"
                              className="w-full text-[11px] font-mono outline-none text-right bg-transparent"
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
                          <div key={dim} className="bg-white border border-slate-200 rounded-lg p-1.5 flex items-center">
                            <span className="text-[9px] font-bold text-slate-400 w-8 pl-1">{label} ({meta.unit})</span>
                            <input
                              type="number"
                              step="0.1"
                              className="w-full text-[11px] font-mono outline-none text-right bg-transparent"
                              value={Number(fromPx(selectedElement[dim] || 0, meta.unit).toFixed(2))}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                updateElement(selectedElement.id, { [dim]: Math.max(0.1, toPx(val, meta.unit)) });
                              }}
                              onBlur={commitUpdate}
                            />
                          </div>
                        ))}
                        <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex items-center mt-2 col-span-2">
                          <span className="text-[9px] font-bold text-slate-400 w-12 pl-1">ROTATE</span>
                          <input
                            type="number"
                            className="w-full text-[11px] font-mono outline-none text-right bg-transparent"
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
                      <div className="p-4 border-b border-white/20">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2">
                          {['barcode', 'qrcode'].includes(selectedElement.type) ? 'Data String' : (selectedElement.type === 'table' ? 'Table Data' : 'Text Content')}
                        </span>

                        {!['barcode', 'qrcode', 'table'].includes(selectedElement.type) && (
                          <div className="mb-4">
                            <label className="text-[9px] font-extrabold uppercase text-primary mb-1.5 block tracking-wider">Field Heading</label>
                            <input
                              type="text"
                              className="w-full bg-[var(--color-primary)]/5/50 border border-[var(--color-primary)]/10 text-[11px] font-bold py-2 px-2.5 focus:border-primary outline-none rounded-lg transition-all"
                              value={selectedElement.heading ?? ''}
                              onChange={e => updateElement(selectedElement.id, { heading: e.target.value })}
                              onBlur={commitUpdate}
                              placeholder="Enter heading (e.g. Composition)..."
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
                                      className="flex-1 min-w-0 h-7 bg-white border border-slate-200 text-[10px] px-2 rounded-lg focus:border-[var(--color-primary)]/50 focus:ring-2 focus:ring-[var(--color-primary)]/50/10 outline-none transition-all"
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
                                className="flex-1 h-8 bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-1.5"
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
                                className="flex-1 h-8 bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[16px]">view_column</span> Add Column
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <textarea
                              disabled={selectedElement.isManaged}
                              className={`w-full border text-[12px] py-2 px-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none rounded-lg resize-none transition-all ${selectedElement.isManaged ? 'bg-slate-100/50 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-200'}`}
                              style={{ minHeight: '80px', height: 'auto' }}
                              value={selectedElement.text || ''}
                              placeholder={selectedElement.type === 'qrcode' ? 'https://...' : selectedElement.type === 'barcode' ? '123456789012' : 'Enter text…'}
                              onChange={e => {
                                updateElement(selectedElement.id, { 
                                  text: e.target.value,
                                  html: e.target.value.replace(/\n/g, '<br/>') // Sync HTML for artboard visibility
                                });
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                              }}
                              onBlur={commitUpdate}
                            />
                            {selectedElement.isManaged && (
                              <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 border border-blue-200 shadow-sm animate-pulse">
                                <span className="material-symbols-outlined text-[12px]">security</span>
                                <span className="text-[8px] font-black uppercase">Standardized Content</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Premium Typography Section ──────────────────────────────────────── */}
                    {!['image', 'barcode', 'qrcode', 'icon', 'IconsIcon'].includes(selectedElement.type) && (
                      <motion.div
                        className="p-5 border-b border-white/20"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-4">Typography</span>
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
                            <input type="range" min="6" max="256" className="w-full accent-[var(--color-primary)]"
                              value={selectedElement.fontSize || 12}
                              onChange={e => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                              onMouseUp={commitUpdate} />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block flex justify-between"><span>Line Height</span><span className="font-mono">{selectedElement.lineHeight || '1.25'}</span></label>
                              <input type="range" min="1" max="3" step="0.05" className="w-full accent-[var(--color-primary)]"
                                value={parseFloat(selectedElement.lineHeight) || 1.25}
                                onChange={e => updateElement(selectedElement.id, { lineHeight: parseFloat(e.target.value) })}
                                onMouseUp={commitUpdate} />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block flex justify-between"><span>Spacing</span><span className="font-mono">{selectedElement.letterSpacing || 0}px</span></label>
                              <input type="range" min="-2" max="20" step="0.5" className="w-full accent-[var(--color-primary)]"
                                value={selectedElement.letterSpacing || 0}
                                onChange={e => updateElement(selectedElement.id, { letterSpacing: parseFloat(e.target.value) })}
                                onMouseUp={commitUpdate} />
                            </div>
                          </div>

                          <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                            {[
                              ['fontWeight', 'bold', 'format_bold', ['bold', '600', '700', '800', '900'].includes(String(selectedElement.fontWeight))],
                              ['fontStyle', 'italic', 'format_italic', selectedElement.fontStyle === 'italic'],
                              ['textDecoration', 'underline', 'format_underlined', selectedElement.textDecoration === 'underline'],
                            ].map(([prop, val, icon, active]) => (
                               <button key={prop} onClick={() => { 
                                 let newVal = val;
                                 if (active) newVal = prop === 'fontWeight' ? '400' : (prop === 'fontStyle' ? 'normal' : 'none');
                                 updateElement(selectedElement.id, { [prop]: newVal }); 
                                 commitUpdate(); 
                               }}
                                className={`flex-1 p-1.5 rounded text-center transition-colors ${active ? 'btn-gradient shadow-sm text-white' : 'hover:bg-slate-200 text-slate-500'}`}>
                                <span className="material-symbols-outlined text-[14px]">{icon}</span>
                              </button>
                            ))}
                            <div className="w-[1px] bg-slate-200 mx-0.5"></div>
                            {['left', 'center', 'right'].map(a => (
                              <button key={a} onClick={() => { updateElement(selectedElement.id, { align: a }); commitUpdate(); }}
                                className={`flex-1 p-1.5 rounded text-center transition-colors ${selectedElement.align === a ? 'bg-[var(--color-primary)]/10 text-primary' : 'hover:bg-slate-200 text-slate-500'}`}>
                                <span className="material-symbols-outlined text-[14px]">format_align_{a}</span>
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Text Color</label>
                              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                                <input type="color" className="w-8 h-8 border-none bg-transparent cursor-pointer"
                                  value={selectedElement.color || '#000000'}
                                  onChange={e => { updateElement(selectedElement.id, { color: e.target.value }); commitUpdate(); }} />
                                <span className="text-[9px] font-mono text-slate-400">{selectedElement.color || '#000000'}</span>
                              </div>
                            </div>
                            <div>
                               <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Background</label>
                               <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                                <input type="color" className="w-8 h-8 border-none bg-transparent cursor-pointer"
                                  value={selectedElement.bgColor || 'transparent'}
                                  onChange={e => { updateElement(selectedElement.id, { bgColor: e.target.value }); commitUpdate(); }} />
                                <span className="text-[9px] font-mono text-slate-400">{selectedElement.bgColor || 'None'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ── Borders & Shapes Section ────────────────────────────────────────── */}
                    <motion.div
                      className="p-5 border-b border-white/20 space-y-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block">Borders & Corners</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Style</label>
                          <select className="w-full bg-slate-50 border border-slate-200 text-[11px] py-1.5 px-1.5 rounded-lg outline-none cursor-pointer"
                            value={selectedElement.borderStyle || 'none'}
                            onChange={e => { updateElement(selectedElement.id, { borderStyle: e.target.value }); commitUpdate(); }}>
                            <option value="none">None</option>
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                            <option value="double">Double</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Width (px)</label>
                          <input type="number" min="0" max="20" className="w-full bg-slate-50 border border-slate-200 text-[11px] py-1 px-2 rounded-lg outline-none"
                            value={selectedElement.borderWidth || 0}
                            onChange={e => { updateElement(selectedElement.id, { borderWidth: parseInt(e.target.value) || 0 }); commitUpdate(); }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Border Color</label>
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                            <input type="color" className="w-8 h-8 border-none bg-transparent cursor-pointer"
                              value={selectedElement.borderColor || '#000000'}
                              onChange={e => { updateElement(selectedElement.id, { borderColor: e.target.value }); commitUpdate(); }} />
                            <span className="text-[9px] font-mono text-slate-400">{selectedElement.borderColor || '#000000'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Radius (px)</label>
                          <input type="number" min="0" max="100" className="w-full bg-slate-50 border border-slate-200 text-[11px] py-1 px-2 rounded-lg outline-none"
                            value={selectedElement.borderRadius || 0}
                            onChange={e => { updateElement(selectedElement.id, { borderRadius: parseInt(e.target.value) || 0 }); commitUpdate(); }} />
                        </div>
                      </div>
                    </motion.div>

                    {/* ── Premium Appearance Section ──────────────────────────────────────── */}
                    {selectedElement.type !== 'image' && (
                      <motion.div
                        className="p-5 border-b border-white/20 space-y-5"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block">Appearance</span>

                        {/* Icon size slider */}
                        {selectedElement.type === 'icon' && (
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 flex justify-between">
                              <span>Icon Size</span><span className="font-mono">{selectedElement.fontSize || 48}px</span>
                            </label>
                            <input type="range" min="12" max="400" className="w-full accent-[var(--color-primary)]"
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

                        {/* ── Dynamic Data & Rules Section ────────────────────────────────── */}
                        {(selectedElement.isPlaceholder || (selectedElement.text && selectedElement.text.includes('{{'))) && (
                          <div className="space-y-4 pt-1">
                            <div className="flex items-center gap-2 mb-2 p-2 bg-[var(--color-primary)]/5 rounded-xl border border-[var(--color-primary)]/10">
                              <span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">database</span>
                              <span className="text-[10px] font-black uppercase text-blue-800 tracking-tighter">Dynamic Configuration</span>
                            </div>

                            {/* Render as Barcode Toggle */}
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Render as Barcode</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateElement(selectedElement.id, { renderAsBarcode: !selectedElement.renderAsBarcode }); commitUpdate(); }}
                                  className={`w-10 h-5 rounded-full relative transition-all duration-300 border ${selectedElement.renderAsBarcode ? 'bg-[var(--color-primary)] border-blue-700' : 'bg-slate-200 border-slate-300'}`}
                                >
                                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${selectedElement.renderAsBarcode ? 'right-0.5' : 'left-0.5'}`} />
                                </button>
                              </div>

                              {selectedElement.renderAsBarcode && (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                  <label className="text-[8px] font-bold uppercase text-slate-400 mb-1 block italic">Barcode Format</label>
                                  <select
                                    className="w-full bg-slate-50 border border-slate-200 text-[11px] py-1.5 px-2 rounded-lg outline-none cursor-pointer font-medium"
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
                                <label className="text-[8px] font-bold uppercase text-slate-400 mb-1 block italic">Fallback Text</label>
                                <input type="text" className="w-full bg-white border border-slate-200 text-[11px] py-1.5 px-2 rounded-lg outline-none"
                                  placeholder="If data null..."
                                  value={selectedElement.fallbackValue || ''}
                                  onChange={e => updateElement(selectedElement.id, { fallbackValue: e.target.value })}
                                  onBlur={commitUpdate} />
                              </div>
                              <div>
                                <label className="text-[8px] font-bold uppercase text-slate-400 mb-1 block italic">Text Case</label>
                                <select className="w-full bg-white border border-slate-200 text-[11px] py-1.5 px-1.5 rounded-lg outline-none"
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
                                <select className="w-full bg-white border border-slate-200 text-[11px] py-1.5 px-1.5 rounded-lg outline-none"
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
                                  <select className="w-full bg-white border border-slate-200 text-[11px] py-1.5 px-1.5 rounded-lg outline-none"
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
                                  <select className="w-full bg-white border border-slate-200 text-[11px] py-1.5 px-1.5 rounded-lg outline-none"
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
                                <input type="text" className="w-full bg-white border border-slate-200 text-[11px] py-1.5 px-2 rounded-lg outline-none font-mono"
                                  placeholder="Ex: 'ID:'"
                                  value={selectedElement.prefix || ''}
                                  onChange={e => updateElement(selectedElement.id, { prefix: e.target.value })}
                                  onBlur={commitUpdate} />
                              </div>
                              <div>
                                <label className="text-[8px] font-bold uppercase text-slate-400 mb-1 block">Suffix</label>
                                <input type="text" className="w-full bg-white border border-slate-200 text-[11px] py-1.5 px-2 rounded-lg outline-none font-mono"
                                  placeholder="Ex: '/mg'"
                                  value={selectedElement.suffix || ''}
                                  onChange={e => updateElement(selectedElement.id, { suffix: e.target.value })}
                                  onBlur={commitUpdate} />
                              </div>
                            </div>

                            {/* Advanced Conditional Logic */}
                            <div className="bg-slate-100/50 p-3 rounded-2xl border border-dashed border-slate-300 mt-2">
                              <div className="flex items-center justify-between mb-3">
                                <label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-1.5">
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
                                  className="text-[9px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/5 px-2 py-1 rounded hover:bg-[var(--color-primary)]/10 transition-colors"
                                >
                                  + Add Rule
                                </button>
                              </div>

                              {selectedElement.displayRules && selectedElement.displayRules.length > 1 && (
                                <div className="flex gap-2 mb-3 bg-white p-1 rounded-lg border border-slate-200">
                                  {['AND', 'OR'].map(l => (
                                    <button key={l} onClick={() => { updateElement(selectedElement.id, { rulesLogic: l }); commitUpdate(); }}
                                      className={`flex-1 text-[9px] font-black py-1 rounded ${selectedElement.rulesLogic === l ? 'bg-[var(--color-primary)]/50 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}>
                                      {l}
                                    </button>
                                  ))}
                                </div>
                              )}

                              <div className="space-y-2">
                                {(selectedElement.displayRules || []).map((rule, idx) => (
                                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-2.5 relative group">
                                    <div className="grid grid-cols-1 gap-2">
                                      <select className="w-full bg-slate-50 border border-slate-200 text-[10px] p-1.5 rounded-lg outline-none"
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
                                        <select className="w-full bg-slate-50 border border-slate-200 text-[10px] p-1.5 rounded-lg outline-none"
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
                                          <input type="text" className="w-full bg-slate-50 border border-slate-200 text-[10px] p-1.5 rounded-lg outline-none"
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
                                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-red-200"
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
                                className={`w-full py-2 px-3 rounded-xl border text-[10px] font-bold uppercase flex items-center justify-between transition-all ${selectedElement.lockAspectRatio !== false ? 'bg-[var(--color-primary)]/5 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                <span className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[16px]">{selectedElement.lockAspectRatio !== false ? 'lock' : 'lock_open'}</span>
                                  {selectedElement.lockAspectRatio !== false ? 'Aspect Ratio Locked' : 'Freeform Resizing'}
                                </span>
                                <div className={`w-6 h-3 rounded-full relative transition-all duration-300 border ${selectedElement.lockAspectRatio !== false ? 'bg-[var(--color-primary)]/50 border-[var(--color-primary)]' : 'bg-slate-200 border-slate-300'}`}>
                                  <div className={`absolute top-0.5 w-1.5 h-1.5 rounded-full bg-white transition-all duration-300 ${selectedElement.lockAspectRatio !== false ? 'right-0.5' : 'left-0.5'}`} />
                                </div>
                              </button>
                            </div>
                            <div>
                              <label className="text-[8px] font-bold uppercase text-slate-400 mb-1.5 block">Image Fit</label>
                              <div className="grid grid-cols-3 gap-1">
                                {['contain', 'cover', 'fill'].map(fit => (
                                  <button key={fit} onClick={() => { updateElement(selectedElement.id, { imageFit: fit }); commitUpdate(); }}
                                    className={`p-1.5 rounded-lg border text-[9px] font-bold capitalize transition-colors ${(selectedElement.imageFit || 'contain') === fit ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/5 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
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
                              <input type="checkbox" className="accent-[var(--color-primary)] w-3.5 h-3.5"
                                checked={selectedElement.tableHeader !== false}
                                onChange={e => { updateElement(selectedElement.id, { tableHeader: e.target.checked }); commitUpdate(); }} />
                              <span className="text-[9px] font-bold text-slate-500">Header Row</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input type="checkbox" className="accent-[var(--color-primary)] w-3.5 h-3.5"
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
                            <input type="range" min="0" max="20" className="flex-1 accent-[var(--color-primary)]"
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
                            <input type="range" min="0" max="60" className="w-full accent-[var(--color-primary)]"
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
                                    ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
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
                            <input type="range" min="1" max="40" className="w-full accent-[var(--color-primary)]"
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
                          <input type="range" min="0" max="1" step="0.01" className="w-full accent-[var(--color-primary)]"
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
                            <input type="range" min="0" max="360" step="1" className="flex-1 accent-[var(--color-primary)]"
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
                      className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <span className="material-symbols-outlined text-[32px] text-[var(--color-primary)]">settings_overscan</span>
                    </motion.div>
                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Label Settings</h3>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-tight">Configure global properties for the entire label surface</p>
                  </div>

                    <div className="space-y-6">
                      {/* Display Stock Information Card - AC 13.9, 13.3 */}
                      {labelStocks?.filter(s => s.id === meta.labelStockId).filter(s => {
                        const sId = s.stockId?.toLowerCase() || '';
                        return ![
                          'bottle', 'vial', 'blister', 'a5', 'a4',
                          'tablet-std', 'syrup-std', 'injection-std', 'ointment-std', 'generic-std',
                          'standard tablet', 'standard syrup', 'standard injection', 'standard ointment', 'standard generic'
                        ].includes(sId);
                      }).map(selectedStock => (
                        <motion.div 
                          key={selectedStock.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-sm shadow-blue-100/50"
                        >
                          <label className="text-[11px] font-extrabold uppercase text-blue-700 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                            Linked Physical Stock
                          </label>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-blue-100 text-blue-600 shadow-sm shrink-0">
                              <span className="material-symbols-outlined text-[24px]">label</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[14px] font-black text-blue-900 truncate tracking-tight">
                                {selectedStock.description || selectedStock.name || 'Matching Stock'}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="px-1.5 py-0.5 bg-blue-100 rounded text-[9px] font-bold text-blue-700 uppercase tracking-tighter">
                                  {selectedStock.stockId}
                                </span>
                                <span className="text-[10px] font-bold text-blue-700/60 uppercase tracking-widest leading-none">
                                  {selectedStock.length}x{selectedStock.breadth}mm
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <label className="text-[11px] font-extrabold uppercase text-slate-700 mb-4 flex items-center gap-2">
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
                          <input type="text" className="w-full text-[11px] font-mono uppercase px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[var(--color-primary)]/50 transition-all font-bold"
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
                                className={`w-6 h-6 rounded-full border border-black/10 ring-2 ${meta.bgColor === c ? 'ring-[var(--color-primary)]/50 ring-offset-2' : 'ring-transparent'}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-slate-100 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-200">
                        <span className="material-symbols-outlined text-[22px] text-[var(--color-primary)]/50">touch_app</span>
                      </div>
                      <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-tight">Select an element</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.aside>
      </motion.main>
      {/* Hidden file inputs for upload actions */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleImageUpload} 
      />
      <input 
        ref={jsonInputRef} 
        type="file" 
        accept=".json" 
        className="hidden" 
        onChange={handleJSONOpen} 
      />
    </div>
  );
}
