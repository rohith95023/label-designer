import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../services/api';
import { getGuestId } from '../utils/auth';
import { useAuth } from './AuthContext';
import { UNITS, toPx, fromPx, PX_PER_UNIT } from '../utils/units';
import { PREDEFINED_TEMPLATES } from '../data/templates';

const LabelContext = createContext({ loading: true, hydrated: false });

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Initial definitions in PX (96dpi)
export const LABEL_PRESETS = [
  { id: 'bottle', name: 'Bottle Label', w: 302, h: 454 },  // 80×120mm
  { id: 'vial', name: 'Vial Wrap', w: 208, h: 132 },  // 55×35mm
  { id: 'blister', name: 'Blister Pack', w: 416, h: 265 },  // 110×70mm
  { id: 'a5', name: 'A5 Label', w: 559, h: 794 },
  { id: 'a4', name: 'A4 Sheet', w: 794, h: 1123 },
  { id: 'strip', name: 'Strip Pack', w: 567, h: 189 },  // 150×50mm
  { id: 'sachet', name: 'Sachet', w: 265, h: 340 },  // 70×90mm
  { id: 'custom', name: 'Custom …', w: 600, h: 400 },
];

const DEFAULT_META = {
  fileId: null,
  fileName: null,
  labelStockId: null,
  labelSize: { w: 302, h: 454 },
  bgColor: '#FFFFFF',
  unit: UNITS.MM,
  notes: '',
  imageUrl: null
};

export const DEFAULT_SETTINGS = {
  profileName: 'Pharma Designer',
  defaultSize: 'custom',
  gridEnabled: true,
  units: 'mm',
  defaultLanguage: 'en',
  languageId: null,
  direction: 'LTR',
  autoTranslate: false,
  fdaValidation: true,
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const LabelProvider = ({ children }) => {
  const [templates, setTemplates] = useState(PREDEFINED_TEMPLATES);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [meta, setMeta] = useState(DEFAULT_META);
  const [elements, setElements] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [savedStatus, setSavedStatus] = useState('saved'); // 'saved'|'saving'|'unsaved'
  const [toast, setToast] = useState(null);     // { msg, type }
  const [hydrated, setHydrated] = useState(false);    // true after API restore
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userFiles, setUserFiles] = useState([]);
  const [labelStocks, setLabelStocks] = useState([]);
  
  const debounceRef = useRef(null);
  const isSavingRef = useRef(false);
  const lastSavedRef = useRef(""); // Store stringified state hash
  const defaultStockIdRef = useRef(null);

  const { user, accessToken } = useAuth();
  const guestId = getGuestId();
  const effectiveId = user?.id || guestId;

  // ── Toast helper ──
  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refreshStocks = async () => {
    try {
      const stocks = await api.getLabelStocks();
      if (Array.isArray(stocks)) {
        setLabelStocks(stocks);
        if (!meta.labelStockId && stocks.length > 0) {
          defaultStockIdRef.current = stocks[0].id;
        }
      }
    } catch (err) {
      console.error('Failed to refresh stocks', err);
    }
  };

  // ── Hydrate from Backend (Highly Optimized) ──
  useEffect(() => {
    const init = async () => {
      // 1. Handle No User (Guest or logged out)
      if (!user) {
        setHydrated(true);
        setLoading(false);
        return;
      }

      // 2. Wait for Token (If user is present (from hint), we MUST wait for the token to be set by refreshAction)
      if (!accessToken) return;

      try {
        setLoading(true);

        // Tier 1: Parallel fetch all essential data
        const [dashRes, stockRes, templatesRes, labelsRes, languagesRes] = await Promise.allSettled([
          api.getDashboard(effectiveId),
          api.getLabelStocks(),
          api.getLabels('PREDEFINED'),
          api.getLabels('ACTIVE'),
          api.getLanguages()
        ]);

        // Process Tier 1 immediately
        if (dashRes.status === 'fulfilled' && dashRes.value) {
          const session = dashRes.value;
          if (session.dashboardPreferences) setSettings(prev => ({ ...prev, ...session.dashboardPreferences }));
          if (session.recentActivityLog) setActivityLogs(Array.isArray(session.recentActivityLog) ? session.recentActivityLog : []);
        }

        if (stockRes.status === 'fulfilled' && Array.isArray(stockRes.value)) {
          setLabelStocks(stockRes.value);
          if (stockRes.value.length > 0) defaultStockIdRef.current = stockRes.value[0].id;
        }

        if (templatesRes.status === 'fulfilled' && Array.isArray(templatesRes.value)) {
          setTemplates(prev => {
            const merged = [...prev];
            templatesRes.value.forEach(sl => {
              const idx = merged.findIndex(m => m.id === sl.id);
              if (idx !== -1) merged[idx] = { ...merged[idx], ...sl };
              else merged.push(sl);
            });
            return merged;
          });
        }

        if (languagesRes.status === 'fulfilled' && Array.isArray(languagesRes.value)) {
          const activeLangs = languagesRes.value.filter(l => l.status === 'ACTIVE');
          const currentLangCode = settings.defaultLanguage || DEFAULT_SETTINGS.defaultLanguage;
          const currentLanguage = activeLangs.find(l => l.code === currentLangCode || l.id === settings.languageId);
          if (currentLanguage) {
            setSettings(prev => ({ ...prev, languageId: currentLanguage.id, direction: currentLanguage.direction }));
          }
        }

        if (labelsRes.status === 'fulfilled' && Array.isArray(labelsRes.value)) {
          const labels = labelsRes.value;
          setUserFiles(labels);

          // Tier 2: Session Restoration (Don't block the UI if possible)
          if (labels.length > 0) {
            const last = [...labels].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0];
            
            // Only block for latest version if we are on the Editor route or if it's the first visit
            const isEditor = window.location.pathname.includes('/editor');
            
            const restoreSession = async () => {
              try {
                const latestVersion = await api.getLatestLabelVersion(last.id);
                if (latestVersion) {
                  setMeta(prev => ({
                    ...prev,
                    fileId: last.id,
                    fileName: last.name,
                    labelStockId: last.labelStockId || last.labelStock?.id,
                    labelSize: latestVersion.designJson?.labelSize || { w: 600, h: 400 },
                    bgColor: latestVersion.designJson?.bgColor || '#FFFFFF',
                    notes: latestVersion.designJson?.notes || '',
                    imageUrl: last.imageUrl
                  }));
                  setElements(latestVersion.designJson?.elementsData || []);
                }
              } catch (e) { console.error('Session restore failed', e); }
            };

            if (isEditor) {
              await restoreSession(); // Block only for Editor
            } else {
              restoreSession(); // background for Dashboard
            }
          }
        }

        setHydrated(true);
      } catch (err) {
        console.error('Hydration error', err);
      } finally {
        setLoading(false); // Release the Splash Screen
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

  // ── Debounced clinical auto-save ──
  useEffect(() => {
    if (!meta.fileId || !hydrated) return;
    
    // Comparison hash to prevent loops on meta/version updates
    const getDesignerStateHash = () => {
      return JSON.stringify({
        elements,
        labelSize: meta.labelSize,
        bgColor: meta.bgColor,
        notes: meta.notes
      });
    };

    const currentStateHash = getDesignerStateHash();

    // 1. SILENT INITIALIZATION: Capture baseline state upon first hydration or file change
    if (!lastSavedRef.current) {
        lastSavedRef.current = currentStateHash;
        setSavedStatus('saved');
        return;
    }

    // 2. EQUALITY GUARD: If state matches last known save, do nothing.
    if (lastSavedRef.current === currentStateHash) {
      // If we were showing 'unsaved', but they undid back to the saved state, sync status
      if (savedStatus === 'unsaved') setSavedStatus('saved');
      return;
    }

    // 3. DIRTY STATE: Update UI to unsaved and prepare sync
    setSavedStatus('unsaved');
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    const triggerAutoSave = async () => {
      if (isSavingRef.current || !meta.fileId) return;

      const currentHash = getDesignerStateHash();

      if (lastSavedRef.current === currentHash) {
          setSavedStatus('saved');
          return;
      }

      let currentSuccess = false;
      isSavingRef.current = true;
      try {
        setSavedStatus('saving');
        const response = await api.updateLatestVersion(meta.fileId, {
          designJson: {
            elementsData: elements,
            labelSize: meta.labelSize,
            bgColor: meta.bgColor,
            labelStockId: meta.labelStockId
          },
          labelStockId: meta.labelStockId,
          notes: meta.notes
        });
        
        lastSavedRef.current = currentHash; 

        if (response && response.versionNo) {
          setMeta(m => ({ ...m, versionNo: response.versionNo }));
        }
        
        setSavedStatus('saved');
        currentSuccess = true;
      } catch (err) {
        console.error('Auto-save engine failed:', err);
        setSavedStatus('unsaved');
      } finally {
        isSavingRef.current = false;
        
        // ONLY RECURSE ON SUCCESS: If the user changed things DURING the API call 
        // AND the last call was successful, then schedule a catch-up.
        // If the call FAILED (e.g. 500), we STOP to prevent a crash loop.
        if (currentSuccess) {
           const actualHash = getDesignerStateHash();
           
           if (actualHash !== lastSavedRef.current) {
             setSavedStatus('unsaved');
             debounceRef.current = setTimeout(triggerAutoSave, 2000);
           }
        }
      }
    };

    debounceRef.current = setTimeout(triggerAutoSave, 1500); 
  }, [elements, meta.fileId, meta.labelSize, meta.bgColor, meta.notes, hydrated]);

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
      setSelectedIds([]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const ni = historyIndex + 1;
      setElements([...history[ni]]);
      setHistoryIndex(ni);
      setSelectedIds([]);
    }
  };

  // ── File Operations ──
  const newFile = () => {
    setMeta(DEFAULT_META);
    setActiveTemplate(null);
    setElements([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setSelectedIds([]);
    setZoomLevel(1);
    setSavedStatus('saved');
    lastSavedRef.current = ""; // Reset baseline
  };

  const initNewFile = useCallback(async (name) => {
    const trimmed = name.trim();
    const stockId = defaultStockIdRef.current;
    if (!stockId) {
      showToast('No label stock available. Please contact admin.', 'error');
      return;
    }
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      setSavedStatus('saving');
      // Create with EMPTY content since it's a NEW file
      const newLabel = await api.createLabel({
        name: trimmed,
        labelStockId: stockId,
        status: 'ACTIVE',
        designJson: {
          elementsData: [],
          labelSize: DEFAULT_META.labelSize,
          bgColor: DEFAULT_META.bgColor,
          notes: ''
        }
      });

      // Reset local state to match the fresh new label
      setMeta({
        ...DEFAULT_META,
        fileName: trimmed,
        fileId: newLabel.id,
        labelStockId: stockId
      });
      setElements([]);
      setHistory([[]]);
      setHistoryIndex(0);
      setSelectedIds([]);
      setZoomLevel(1);
      setSavedStatus('saved');
      
      setUserFiles(prev => [...prev, newLabel]);
      lastSavedRef.current = JSON.stringify({
        elements: [],
        labelSize: DEFAULT_META.labelSize,
        bgColor: DEFAULT_META.bgColor,
        notes: ''
      });
      addActivityLog('Created new design', newLabel.id, trimmed);
      return true;
    } catch (err) {
      console.error('Initial save failed:', err);
      showToast('Failed to start new design in database', 'error');
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [setUserFiles, showToast, addActivityLog]);

  const setFileName = useCallback(async (name) => {
    const trimmed = name.trim();
    if (!meta.fileId) {
      // This path is usually for the very first file after a fresh load
      const stockId = defaultStockIdRef.current;
      if (!stockId) {
        showToast('No label stock available. Please contact admin.', 'error');
        return;
      }
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      try {
        setSavedStatus('saving');
        const newLabel = await api.createLabel({
          name: trimmed,
          labelStockId: meta.labelStockId || stockId,
          status: 'ACTIVE',
          designJson: {
            elementsData: elements,
            labelSize: meta.labelSize,
            bgColor: meta.bgColor,
            notes: meta.notes
          }
        });
        setMeta(m => ({ ...m, fileName: trimmed, fileId: newLabel.id }));
        setUserFiles(prev => [...prev, newLabel]);
        setSavedStatus('saved');
        lastSavedRef.current = JSON.stringify({
          elements,
          labelSize: meta.labelSize,
          bgColor: meta.bgColor,
          notes: meta.notes
        });
        addActivityLog('Created label', newLabel.id, trimmed);
      } catch (err) {
        console.error('Failed to create label:', err);
        showToast('Failed to initialize label in backend', 'error');
      } finally {
        isSavingRef.current = false;
      }
    } else {
      // Renaming existing
      try {
        // Sync to backend rename if possible (optional but good)
        await api.updateLabel(meta.fileId, { name: trimmed });
        setMeta(m => ({ ...m, fileName: trimmed }));
        // Update the list in memory so other pages (Dashboard/History) reflect it immediately
        setUserFiles(prev => prev.map(f => f.id === meta.fileId ? { ...f, name: trimmed, updatedAt: new Date().toISOString() } : f));
        showToast('Label renamed', 'success');
      } catch (err) {
        console.error('Rename failed', err);
        setMeta(m => ({ ...m, fileName: trimmed })); // UI only if DB fails
      }
    }
  }, [meta.fileId, meta.labelStockId, meta.labelSize, meta.bgColor, meta.notes, elements, setUserFiles, showToast, addActivityLog]);

  const scaleElements = useCallback((newW, newH) => {
    const oldW = meta.labelSize.w;
    const oldH = meta.labelSize.h;
    if (!oldW || !oldH || (oldW === newW && oldH === newH)) return;

    const scaleX = newW / oldW;
    const scaleY = newH / oldH;
    const minScale = Math.min(scaleX, scaleY);

    setElements(prev => {
      const scaled = prev.map(el => {
        // Calculate new dimensions with scaling
        let upW = el.width ? Math.round(el.width * scaleX) : el.width;
        let upH = el.height ? Math.round(el.height * scaleY) : el.height;
        
        // Font size and borders use proportional minScale to avoid stretching
        let upFS = el.fontSize ? Math.round(el.fontSize * minScale) : el.fontSize;
        
        // Ensure minimum visibility
        if (el.width && upW < 2) upW = 2;
        if (el.height && upH < 2) upH = 2;
        if (el.fontSize && upFS < 4) upFS = 4;

        // Calculate new position
        let upX = Math.round((el.x || 0) * scaleX);
        let upY = Math.round((el.y || 0) * scaleY);

        // CLAMPING: Ensure element stays within new canvas boundaries
        if (upX < 0) upX = 0;
        if (upY < 0) upY = 0;
        
        const finalW = upW || 0;
        const finalH = upH || 0;
        
        if (upX + finalW > newW) {
          upX = Math.max(0, newW - finalW);
        }
        if (upY + finalH > newH) {
          upY = Math.max(0, newH - finalH);
        }

        return {
          ...el,
          x: upX,
          y: upY,
          width: upW,
          height: upH,
          fontSize: upFS,
          borderWidth: el.borderWidth ? Math.max(1, Math.round(el.borderWidth * minScale)) : el.borderWidth,
          borderRadius: el.borderRadius ? Math.round(el.borderRadius * minScale) : el.borderRadius
        };
      });
      return scaled;
    });
  }, [meta.labelSize, setElements]);

  const restoreVersion = async (targetFile, versionData) => {
    if (isSavingRef.current) return;
    try {
      setSavedStatus('saving');
      // 1. Prepare design payload from the historical version
      const payload = {
        designJson: versionData.designJson || {
          elementsData: versionData.elementsData || [],
          labelSize: versionData.labelSize || meta.labelSize,
          bgColor: versionData.bgColor || meta.bgColor,
          labelStockId: versionData.labelStockId || meta.labelStockId
        },
        labelStockId: versionData.labelStockId || targetFile.labelStockId,
        notes: `Restored to version ${versionData.versionNo || 'previous'} on ${new Date().toLocaleString()}`
      };

      // 2. Commit as NEW version record
      const response = await api.saveLabelVersion(targetFile.id, payload);
      
      // 3. Hydrate state for the editor
      const fresh = await api.getLabel(targetFile.id);
      openFileById(targetFile.id);
      setElements(payload.designJson.elementsData);
      setMeta(m => ({
        ...m,
        ...payload.designJson,
        versionNo: response.versionNo
      }));

      setSavedStatus('saved');
      showToast(`Restored to v${versionData.versionNo} as new version ✓`, 'success');
      return true;
    } catch (err) {
      console.error('Restore failed:', err);
      showToast('Restore version failed', 'error');
      return false;
    } finally {
      setSavedStatus('unsaved');
    }
  };

  const setLabelSize = useCallback(async (w, h) => {
    if (w < 10 || h < 10) return; // Prevent invalid sizes
    scaleElements(w, h);
    setMeta(prev => ({ ...prev, labelSize: { w, h } }));

    // If we have a file ID, proactively update the size in the DB to ensure it "applies" 
    // even if auto-save hasn't fired yet.
    if (meta.fileId) {
      try {
        await api.updateLabel(meta.fileId, {
          designJson: {
            elementsData: elements,
            labelSize: { w, h },
            bgColor: meta.bgColor
          }
        });
        // Also update the UI list
        setUserFiles(prev => prev.map(f => f.id === meta.fileId ? { ...f, labelSize: { w, h }, updatedAt: new Date().toISOString() } : f));
      } catch (err) {
        console.warn('Proactive size save failed, relying on auto-save', err);
      }
    }
  }, [meta.fileId, meta.bgColor, elements, scaleElements, setUserFiles]);

  const setLabelStock = (stockId) => {
    const stock = labelStocks.find(s => s.id === stockId);
    if (stock) {
      const MM_TO_PX = 3.7795;
      const w = Math.round(stock.breadth * MM_TO_PX);
      const h = Math.round(stock.height * MM_TO_PX);
      scaleElements(w, h);
      setMeta(prev => ({
        ...prev,
        labelStockId: stockId,
        labelSize: { w, h }
      }));
      showToast(`Stock changed: ${stock.name}`, 'info');
    }
  };

  const setUnit = (unit) => setMeta(m => ({ ...m, unit }));

  const toggleOrientation = () => {
    const newW = meta.labelSize.h;
    const newH = meta.labelSize.w;
    scaleElements(newW, newH);
    setMeta(prev => ({
      ...prev,
      labelSize: { w: newW, h: newH }
    }));
  };

  const finalizeFile = async (comment = '') => {
    if (!meta.fileId) {
      showToast('Please name your file first', 'warning');
      return;
    }
    try {
      setSavedStatus('saving');
      // 1. Create a final version record first
      await saveFile(comment || 'Finalized version for production');
      
      // 2. Lock the label
      await api.updateLabel(meta.fileId, { status: 'LOCKED' });
      
      setMeta(m => ({ ...m, status: 'LOCKED' }));
      showToast('Label successfully FINALIZED and LOCKED ✓', 'success');
    } catch (err) {
      console.error('Finalize failed', err);
      showToast('Finalize failed', 'error');
    } finally {
      setSavedStatus('saved');
    }
  };

  const saveFile = async (comment = '') => {
    if (!meta.fileId) {
      showToast('Please name your file first', 'warning');
      return;
    }
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      setSavedStatus('saving');
      const response = await api.saveLabelVersion(meta.fileId, {
        designJson: {
          elementsData: elements,
          labelSize: meta.labelSize,
          bgColor: meta.bgColor,
          labelStockId: meta.labelStockId
        },
        labelStockId: meta.labelStockId,
        notes: comment || meta.notes
      });
      
      lastSavedRef.current = JSON.stringify({
        elements,
        labelSize: meta.labelSize,
        bgColor: meta.bgColor,
        notes: comment || meta.notes
      });

      if (response && response.versionNo) {
        setMeta(m => ({ ...m, versionNo: response.versionNo }));
      }
      
      setSavedStatus('saved');
      showToast(comment ? `Version ${response?.versionNo || ''} saved with audit note ✓` : 'New version saved ✓', 'success');
    } catch (err) {
      console.error('Manual save failed', err);
      showToast('Manual save failed', 'error');
    } finally {
      isSavingRef.current = false;
    }
  };

  const saveFileAs = async (newName) => {
    const stockId = defaultStockIdRef.current;
    if (!stockId) {
      showToast('No label stock available. Please contact admin.', 'error');
      return;
    }
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      setSavedStatus('saving');
      const newLabel = await api.createLabel({
        name: newName,
        labelStockId: meta.labelStockId || stockId,
        status: 'ACTIVE',
        notes: meta.notes,
        designJson: {
          elementsData: elements,
          labelSize: meta.labelSize,
          bgColor: meta.bgColor
        }
      });
      setMeta({
        fileId: newLabel.id,
        fileName: newName,
        labelStockId: meta.labelStockId || stockId,
        labelSize: meta.labelSize,
        bgColor: meta.bgColor,
        notes: meta.notes
      });
      setUserFiles(prev => [...prev, newLabel]);
      setSavedStatus('saved');
      lastSavedRef.current = JSON.stringify({
        elements,
        labelSize: meta.labelSize,
        bgColor: meta.bgColor,
        notes: meta.notes
      });
      showToast('Label copy saved ✓', 'success');
      addActivityLog('Saved as new label', newLabel.id, newName);
    } catch (err) {
      console.error('Save as failed', err);
      showToast('Save as failed', 'error');
    } finally {
      isSavingRef.current = false;
    }
  };

  const openFileById = async (id) => {
    try {
      setLoading(true);
      const label = await api.getLabel(id);
      const version = await api.getLatestLabelVersion(id);

      const design = version.designJson || {};

      setMeta({
        fileId: label.id,
        fileName: label.name,
        labelStockId: label.labelStockId || label.labelStock?.id,
        labelSize: design.labelSize || { w: 600, h: 400 },
        bgColor: design.bgColor || '#FFFFFF',
        notes: label.notes || design.notes || ''
      });
      setElements(design.elementsData || []);
      setHistory([design.elementsData || []]);
      setHistoryIndex(0);
      setSelectedIds([]);
      setSavedStatus('saved');
      // Update baseline immediately after loading
      lastSavedRef.current = JSON.stringify({
        elements: design.elementsData || [],
        labelSize: design.labelSize || { w: 600, h: 400 },
        bgColor: design.bgColor || '#FFFFFF',
        notes: label.notes || design.notes || ''
      });
      addActivityLog('Opened label', id, label.name);
    } catch (err) {
      showToast('Could not open label from backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteUserTemplate = async (id) => {
    try {
      const success = await api.deleteLabel(id);
      if (success) {
        setUserFiles(prev => prev.filter(f => f.id !== id));
        showToast('Label deleted permanently', 'success');
        addActivityLog('Deleted label', id, 'Removed from repository');
        return true;
      }
      return false;
    } catch (err) {
      showToast('Failed to delete label', 'error');
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
          labelStockId: data.meta.labelStockId || null,
          labelSize: data.meta.labelSize || { w: 600, h: 400 },
          bgColor: data.meta.bgColor || '#FFFFFF',
          notes: data.meta.notes || ''
        });
      }
      if (data.elements && Array.isArray(data.elements)) {
        setElements(data.elements);
        setHistory([data.elements]);
        setHistoryIndex(0);
      }
      setSelectedIds([]);
      setSavedStatus('saved'); // Initially marked as saved
      lastSavedRef.current = JSON.stringify({
        elements: data.elements,
        labelSize: data.meta.labelSize || { w: 600, h: 400 },
        bgColor: data.meta.bgColor || '#FFFFFF',
        notes: data.meta.notes || ''
      });
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
      return await api.getLabelHistory(id);
    } catch (err) {
      showToast('Failed to fetch version history', 'error');
      return [];
    }
  };

  const getTemplateById = async (id) => {
    try {
      const label = await api.getLabel(id);
      const version = await api.getLatestLabelVersion(id);
      return {
        ...label,
        elementsData: version.designJson?.elementsData,
        labelSize: version.designJson?.labelSize,
        bgColor: version.designJson?.bgColor
      };
    } catch (err) {
      showToast('Failed to fetch label details', 'error');
      return null;
    }
  };

  // ── Template Loader ──
  const loadTemplate = async (template) => {
    console.log('[LabelContext] Loading Template:', template.name, template);
    setLoading(true);

    let fullTemplate = template;
    // If elementsData is missing, fetch the full details including latest version
    if (!template.elementsData && !template.elements_data && template.id) {
      try {
        const details = await getTemplateById(template.id);
        if (details) fullTemplate = details;
      } catch (err) {
        console.error('Failed to fetch full template details', err);
        showToast('Could not load full template details', 'error');
      }
    }

    // Normalize elements data
    const rawElements = fullTemplate.elementsData || fullTemplate.elements_data || [];

    const MM_TO_PX = 3.7795275591;
    let targetW = 600, targetH = 400; // Calculated physical canvas (px)
    let designW = 600; // Coordinate space basis for scaling (predefined templates use 600px)
    let designH = 400;

    // 1. Attempt to find a matching physical stock for this template
    let matchedStockId = null;
    if (fullTemplate.size && labelStocks.length > 0) {
      const sizeStr = fullTemplate.size.toLowerCase();
      const parts = sizeStr.includes('x') ? sizeStr.split('x') : [];
      if (parts.length >= 2) {
        const tw = parseFloat(parts[0]);
        const th = parseFloat(parts[1]);
        
        // Use template specified size as baseline
        targetW = Math.round(tw * MM_TO_PX);
        targetH = Math.round(th * MM_TO_PX);

        const match = labelStocks.find(s => 
          (Math.abs(s.breadth - tw) < 2 && Math.abs(s.height - th) < 2) ||
          (Math.abs(s.breadth - th) < 2 && Math.abs(s.height - tw) < 2)
        );
        
        if (match) {
          matchedStockId = match.id;
          targetW = Math.round(match.breadth * MM_TO_PX);
          targetH = Math.round(match.height * MM_TO_PX);
        }
      }
    }

    // 2. Fallback to template size if still using defaults
    if (targetW === 600 && targetH === 400 && fullTemplate.size) {
       const parts = fullTemplate.size.split('x');
       if (parts.length >= 2) {
         targetW = Math.round(parseFloat(parts[0]) * MM_TO_PX);
         targetH = Math.round(parseFloat(parts[1]) * MM_TO_PX);
       }
    }

    // 3. Scale elements to fit the current physical target from the standard design basis (600px)
    const scaleX = targetW / designW;
    const scaleY = targetH / designH;
    const minScale = Math.min(scaleX, scaleY);

    const enriched = rawElements.map((el, i) => {
      const up = {
        ...el,
        id: el.id || uuidv4(),
        x: Math.round((el.x || 0) * scaleX),
        y: Math.round((el.y || 0) * scaleY),
        width: el.width ? Math.round(el.width * scaleX) : el.width, // Non-proportional width (stretch to fill)
        height: el.height ? Math.round(el.height * scaleY) : el.height, // Non-proportional height
        fontSize: el.fontSize ? Math.round(el.fontSize * minScale) : el.fontSize, // Proportional font
        zIndex: el.zIndex || (i + 10)
      };

      if (el.type === 'shape') {
        if (el.borderWidth) up.borderWidth = Math.max(1, Math.round(el.borderWidth * minScale));
        if (el.borderRadius) up.borderRadius = Math.round(el.borderRadius * minScale);
      }

      return up;
    });

    setMeta({
      fileId: null,
      fileName: fullTemplate.name || 'New Label',
      labelStockId: matchedStockId || defaultStockIdRef.current,
      labelSize: { w: targetW, h: targetH },
      bgColor: fullTemplate.bgColor || '#FFFFFF',
      notes: fullTemplate.notes || ''
    });

    setActiveTemplate(fullTemplate);
    setElements(enriched);
    setHistory([enriched]);
    setHistoryIndex(0);
    setSelectedIds([]);
    setZoomLevel(1);
    setSavedStatus('unsaved');
    setLoading(false);
    
    if (matchedStockId) {
      showToast(`Matched stock for "${fullTemplate.name}" automatically`, 'info');
    }
  };

  // ── Element CRUD ──
  const addElement = (data) => {
    const maxZ = elements.reduce((mx, el) => Math.max(mx, el.zIndex || 0), 10);
    const el = { 
      id: uuidv4(), 
      x: 20, 
      y: 20, 
      zIndex: maxZ + 1, 
      borderStyle: 'none',
      borderWidth: 0,
      borderColor: '#000000',
      borderRadius: 0,
      ...data 
    };
    const next = [...elements, el];
    setElements(next);
    saveToHistory(next);
    setSelectedIds([el.id]);
  };

  const duplicateElement = (id) => {
    const src = elements.find(e => e.id === id);
    if (!src) return;
    const maxZ = elements.reduce((mx, el) => Math.max(mx, el.zIndex || 0), 10);
    const copy = { ...src, id: uuidv4(), x: src.x + 20, y: src.y + 20, zIndex: maxZ + 1 };
    const next = [...elements, copy];
    setElements(next);
    saveToHistory(next);
    setSelectedIds([copy.id]);
  };

  const updateElement = (id, updates) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const commitUpdate = () => {
    setElements(prev => { saveToHistory(prev); return prev; });
  };

  const saveAsTemplate = async (name) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      setSavedStatus('saving');
      const newTpl = await api.createLabel({
        name,
        labelStockId: defaultStockIdRef.current,
        status: 'PREDEFINED', // Promotes to template library
        designJson: {
          elementsData: elements,
          labelSize: meta.labelSize,
          bgColor: meta.bgColor,
          notes: meta.notes
        }
      });
      setTemplates(prev => [newTpl, ...prev]);
      setSavedStatus('saved');
      showToast('Design saved to templates ✓', 'success');
      return newTpl;
    } catch (err) {
      console.error('Failed to save as template', err);
      showToast('Failed to save as template', 'error');
    } finally {
      isSavingRef.current = false;
    }
  };

  const deleteElement = (id) => {
    const next = elements.filter(e => e.id !== id);
    setElements(next);
    saveToHistory(next);
    setSelectedIds(prev => prev.filter(sid => sid !== id));
  };

  const moveLayer = (id, dir) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    let z = el.zIndex || 10;
    const allZ = elements.map(e => e.zIndex || 10);
    if (dir === 'up') z += 1;
    if (dir === 'down') z = Math.max(1, z - 1);
    if (dir === 'front') z = Math.max(...allZ) + 1;
    if (dir === 'back') z = Math.min(...allZ) - 1;
    const next = elements.map(e => e.id === id ? { ...e, zIndex: z } : e);
    setElements(next);
    saveToHistory(next);
  };

  // ── Design Tools: Alignment Helpers ──────────────────────────────────────────
  const alignElements = useCallback((direction, relativeTo = 'selection') => {
    if (selectedIds.length === 0) return;

    const AW = meta.labelSize.w;
    const AH = meta.labelSize.h;
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));

    // Calculate common bounding box
    const minX = Math.min(...selectedElements.map(el => el.x));
    const minY = Math.min(...selectedElements.map(el => el.y));
    const maxX = Math.max(...selectedElements.map(el => el.x + (el.width || 0)));
    const maxY = Math.max(...selectedElements.map(el => el.y + (el.height || 0)));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const next = elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      const w = el.width || 0;
      const h = el.height || 0;

      const isCanvas = relativeTo === 'canvas' || selectedIds.length === 1;

      if (isCanvas) {
        if (direction === 'left') return { ...el, x: 0 };
        if (direction === 'right') return { ...el, x: AW - w };
        if (direction === 'top') return { ...el, y: 0 };
        if (direction === 'bottom') return { ...el, y: AH - h };
        if (direction === 'centerH') return { ...el, x: (AW - w) / 2 };
        if (direction === 'centerV') return { ...el, y: (AH - h) / 2 };
      } else {
        if (direction === 'left') return { ...el, x: minX };
        if (direction === 'right') return { ...el, x: maxX - w };
        if (direction === 'top') return { ...el, y: minY };
        if (direction === 'bottom') return { ...el, y: maxY - h };
        if (direction === 'centerH') return { ...el, x: centerX - w / 2 };
        if (direction === 'centerV') return { ...el, y: centerY - h / 2 };
      }
      return el;
    });

    setElements(next);
    saveToHistory(next);
  }, [selectedIds, elements, meta]);

  // ── FDA Validation ──
  const validateLabel = () => {
    const errors = [];
    const has = (fn) => elements.some(fn);

    // 1. Basic FDA Compliance
    if (!has(e => e.type === 'barcode' || e.type === 'qrcode')) errors.push('Missing Barcode / QR Code.');
    if (!has(e => {
      const content = (e.text || e.html || '').toLowerCase();
      return content.includes('exp') || content.includes('expiry');
    }))
      errors.push('Missing Expiry Date field.');
    if (!has(e => (e.fontSize || 0) > 18 || e.subtype === 'brand')) errors.push('Missing prominent Brand Name.');
    if (!has(e => e.type === 'warnings')) errors.push('Missing Safety / Rx Warning.');

    // 2. Physical Stock Validation
    if (meta.labelStockId) {
      const stock = labelStocks.find(s => s.id === meta.labelStockId || s.stockId === meta.labelStockId);
      if (stock) {
        if (stock.quantityOnHand <= 0) {
          errors.push(`OUT OF STOCK: "${stock.name}" has zero inventory. Cannot print.`);
        } else if (stock.quantityOnHand <= stock.reorderLevel) {
          errors.push(`LOW STOCK: "${stock.name}" is below reorder level (${stock.quantityOnHand} ${stock.unitOfMeasure} remaining).`);
        }
      }
    } else {
      errors.push('No physical Label Stock selected for this design.');
    }

    // 3. Dynamic Field Validation (AC 10)
    const validKeys = Object.keys(SAMPLE_TRIAL_DATA);
    elements.forEach(el => {
      const text = el.text || el.html || '';
      const placeholders = [...text.matchAll(/\{\{([\w\d_]+)\}\}/g)].map(m => m[1]);

      placeholders.forEach(key => {
        if (!validKeys.includes(key)) {
          errors.push(`Invalid placeholder: {{${key}}} in element "${el.name || 'Text'}"`);
        }
      });

      // Validate conditional rules
      if (el.displayRules) {
        el.displayRules.forEach((rule, idx) => {
          if (!validKeys.includes(rule.field)) {
            errors.push(`Invalid rule field: "${rule.field}" in element "${el.name || 'Text'}"`);
          }
        });
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  const value = {
    templates, userFiles, labelStocks,
    activeTemplate, setActiveTemplate,
    meta, setMeta,
    elements, setElements,
    selectedIds, setSelectedIds,
    zoomLevel, setZoomLevel,
    savedStatus, toast, showToast,
    historyIndex, historyLength: history.length,
    hydrated, loading,
    settings, updateSettings,
    activityLogs,
    // File ops
    newFile, setFileName, initNewFile, setLabelSize,
    saveFile, saveFileAs, finalizeFile, restoreVersion,
    openFileById, openFileFromJSON, deleteUserTemplate,
    exportJSON, getAllFiles,
    getTemplateHistory, getTemplateById,
    // Template
    loadTemplate,
    // Element ops
    addElement, duplicateElement, updateElement, commitUpdate,
    deleteElement, moveLayer, alignElements,
    // Design Tools: Orientation & Template logic
    toggleOrientation, saveAsTemplate,
    undo, redo,
    // Validation
    validateLabel,
    LABEL_PRESETS,
    setUnit,
    setLabelStock, // Add this line
    refreshStocks,
    toPx, fromPx, UNITS,
  };

  return <LabelContext.Provider value={value}>{children}</LabelContext.Provider>;
};

export const useLabel = () => {
  const context = useContext(LabelContext);
  if (context === undefined) {
    console.error('useLabel must be used within a LabelProvider');
    return { loading: true, hydrated: false }; // Fallback to prevent destructuring crash
  }
  return context;
};

