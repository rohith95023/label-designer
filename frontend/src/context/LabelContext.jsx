import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../services/api';
import { getGuestId } from '../utils/auth';
import { useAuth } from './AuthContext';
import { UNITS, toPx, fromPx, PX_PER_UNIT } from '../utils/units';
import { SAMPLE_TRIAL_DATA } from '../utils/dynamicData';

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
  notes: ''
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
const PREDEFINED_TEMPLATES = [
  {
    id: 'tpl-tablet-std',
    name: 'Standard Tablet Compliant Label',
    brand: 'PHARMA-ASPIRIN USP',
    category: 'Tablets',
    size: '80x120mm',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSiaeAayZfueBnsduY5QBuSpvvp1o52sXv9Gms4s8DDXzCg35p1PVI7fGnJBIe6o28S2BMbE0rSBc_dYfthr-9oQFj06PXseU9EmCO9cLMQSwx5kLmfxGNZqwwX8IE1n2samFtoMqoV4I2fsJCBOaKVNEqrjscyyG0Nf81gzIdfc8bxIzsuGBT-olgLyG0zkH_cO3MngPSb93gAsnzm78aZXRasjIPOhLxJkLmCWM4J_f7MDZ0T1v07GKtOZ_98PFPtnoLol5lP6DJ',
    elementsData: [
      { id: "t1-header-bg", type: "shape", subtype: "rect", x: 0, y: 0, width: 600, height: 75, bgColor: "#003366", zIndex: 1 },
      { id: "t1-rx", type: "text", text: "Rx ONLY", x: 20, y: 25, fontSize: 18, fontWeight: "bold", color: "#ffffff", zIndex: 10 },
      { id: "t1-brand", type: "text", subtype: "brand", text: "PHARMA-ASPIRIN USP", x: 120, y: 25, fontSize: 24, fontWeight: "bold", color: "#ffffff", tracking: 2, zIndex: 11 },
      
      { id: "t1-divider", type: "shape", subtype: "line", x: 20, y: 85, width: 560, height: 2, bgColor: "#cccccc", zIndex: 2 },
      { id: "t1-strength", type: "text", text: "Strength: 500 mg tablets", x: 20, y: 100, fontSize: 14, fontWeight: "bold", color: "#111111", zIndex: 12 },
      { id: "t1-ndc", type: "text", text: "NDC: 12345-678-90", x: 420, y: 100, fontSize: 14, fontWeight: "bold", color: "#333333", zIndex: 13 },
      { id: "t1-active", type: "text", text: "Active Ingredient: Aspirin USP 500mg, NSAID", x: 20, y: 130, fontSize: 11, color: "#333333", zIndex: 14 },
      { id: "t1-dosage", type: "text", text: "Dosage: Adults (12+) 1 tablet every 4-6h. Do not exceed 8 tablets in 24h.", x: 20, y: 155, fontSize: 11, color: "#000000", fontWeight: "bold", zIndex: 15 },
      
      { id: "t1-warning-box", type: "shape", subtype: "rect", x: 20, y: 190, width: 350, height: 60, bgColor: "#fff0f0", borderWidth: 2, borderColor: "#ff0000", zIndex: 3 },
      { id: "t1-warning", type: "warnings", text: "WARNING: Reye's Syndrome risk in children.", x: 30, y: 210, fontSize: 12, color: "#cc0000", fontWeight: "bold", zIndex: 16 },

      { id: "t1-storage", type: "text", text: "Store at 20°-25°C (68°-77°F); excursions permitted to 15°-30°C.", x: 20, y: 270, fontSize: 10, color: "#444444", zIndex: 17 },

      { id: "t1-barcode", type: "barcode", text: "00312345678905", x: 400, y: 190, width: 180, height: 60, zIndex: 18 },
      { id: "t1-batch", type: "text", text: "Lot: 2024-X91", x: 20, y: 340, fontSize: 12, color: "#111111", fontWeight: "bold", zIndex: 20 },
      { id: "t1-exp", type: "text", text: "Exp: 02/2027", x: 150, y: 340, fontSize: 12, color: "#111111", fontWeight: "bold", zIndex: 21 },
      { id: "t1-mfg", type: "text", text: "Mfd by: PharmaCore Labs, USA", x: 20, y: 365, fontSize: 10, color: "#002244", zIndex: 22 },
      { id: "t1-qr", type: "qrcode", text: "(01)00312345678905(17)270228(10)2024-X91", x: 500, y: 280, width: 80, height: 80, zIndex: 23 }
    ]
  },
  {
    id: 'tpl-syrup-std',
    name: 'Standard Suspension Label',
    brand: 'TUSSI-PRO PLUS',
    category: 'Syrups',
    size: '80x120mm',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7niTIAhjNqf3IBSGE2I66N6Ji5S7LEyTbd9BSCJD9EI2yimwYPZFlWKP4JEA8JvNqTUoFyGAvP0wZ_-wT3DHsox-iiLYYsKXKmtkOVFGZQEOFXGsxL53GBNeruas6-RcDlRPo96x366pBpnIRjzw40JjI6-l-GcZGqZ0wS9YXY3YqWN-Kja_S6SZvCyrsiYGQ_Tl0g2apTZT-47xXLwoj_U-Bg6xf19Z0tHgGPVllfP867i-ltTw9bWiUUvyqJGTyu4MlQt4_MBHC',
    elementsData: [
      { id: "t2-header-bg", type: "shape", subtype: "rect", x: 0, y: 0, width: 600, height: 75, bgColor: "#0055aa", zIndex: 1 },
      { id: "t2-rx", type: "text", text: "Rx", x: 20, y: 25, fontSize: 18, fontWeight: "bold", color: "#ffffff", zIndex: 10 },
      { id: "t2-brand", type: "text", subtype: "brand", text: "TUSSI-PRO PLUS", x: 60, y: 25, fontSize: 24, fontWeight: "bold", color: "#ffffff", tracking: 2, zIndex: 11 },
      { id: "t2-vol", type: "text", text: "120 mL", x: 500, y: 25, fontSize: 18, fontWeight: "bold", color: "#ffffff", zIndex: 12 },
      
      { id: "t2-strength", type: "text", text: "10 mg / 5 mL Oral Suspension", x: 20, y: 95, fontSize: 14, fontWeight: "bold", color: "#111111", zIndex: 12 },
      { id: "t2-active", type: "text", text: "Active: Dextromethorphan HBr USP 10mg per 5mL", x: 20, y: 125, fontSize: 11, color: "#333333", zIndex: 14 },
      
      { id: "t2-warning-box", type: "shape", subtype: "rect", x: 20, y: 160, width: 450, height: 40, bgColor: "#ffebd6", borderColor: "#ff8c00", borderWidth: 2, zIndex: 3 },
      { id: "t2-warning", type: "warnings", text: "SHAKE WELL BEFORE USE. MEASURE WITH DOSING CUP.", x: 30, y: 172, fontSize: 12, color: "#cc4400", fontWeight: "bold", zIndex: 16 },

      { id: "t2-dosage", type: "text", text: "Dosage: See prescribing information.", x: 20, y: 230, fontSize: 11, color: "#111111", fontWeight: "bold", zIndex: 15 },
      { id: "t2-storage", type: "text", text: "Store at 20° to 25°C (68° to 77°F). Protect from light.", x: 20, y: 255, fontSize: 10, color: "#444444", zIndex: 17 },

      { id: "t2-barcode", type: "barcode", text: "300450123126", x: 20, y: 290, width: 220, height: 45, zIndex: 18 },
      { id: "t2-batch", type: "text", text: "Lot: TP-9902X", x: 300, y: 300, fontSize: 12, color: "#111111", fontWeight: "bold", zIndex: 19 },
      { id: "t2-exp", type: "text", text: "Exp: 11/2026", x: 300, y: 325, fontSize: 12, color: "#111111", fontWeight: "bold", zIndex: 20 },
      { id: "t2-mfg", type: "text", text: "Mfd by: Tussi Labs, Chicago, IL", x: 20, y: 365, fontSize: 10, color: "#002244", zIndex: 21 },
      { id: "t2-qr", type: "qrcode", text: "(01)10300450123123(17)261130(10)TP-9902X", x: 500, y: 270, width: 80, height: 80, zIndex: 22 }
    ]
  },
  {
    id: 'tpl-injection-std',
    name: 'Vial Direct Print Label',
    brand: 'HUMAN INSULIN (rDNA)',
    category: 'Injections',
    size: '55x35mm',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeDBuiu1BpLkVlOariuZKZGmdjIydU_BaagNhWmo9DmkBkAN3T0E8Hdh2RXhhiGWMRS_tDYjAvQWZ8Ifty0YhOaClraQKl59f5CSeKbl2GjMY35WT6gI1OWseEYymne0pmCwGGGWfF6LXzc20pcWjTVdDjt8fe4dAttzmQKhvPM_HpwWN4qEqIynwnILoQiOSXcAUnLOqkTeKbfKAgqgnHfALtmh_r6_mWsjY1gto8DKvTxDUjpJ8Q0M8zTvn-NYWAyHvaMcXLjgIT',
    elementsData: [
      { id: "t3-brand", type: "text", subtype: "brand", text: "HUMAN INSULIN", x: 20, y: 30, fontSize: 32, fontWeight: "bold", color: "#006600", tracking: 1, zIndex: 11 },
      { id: "t3-strength", type: "text", text: "100 Units/mL (U-100)", x: 20, y: 70, fontSize: 24, fontWeight: "bold", color: "#111111", zIndex: 12 },
      { id: "t3-cat", type: "text", text: "10 mL Multi-Dose Vial", x: 20, y: 110, fontSize: 18, color: "#333333", zIndex: 13 },
      { id: "t3-route", type: "text", text: "For Subcutaneous Use", x: 20, y: 150, fontSize: 18, fontWeight: "bold", color: "#cc0000", zIndex: 14 },
      
      { id: "t3-warning-box", type: "shape", subtype: "rect", x: 20, y: 190, width: 280, height: 50, bgColor: "#003366", zIndex: 1 },
      { id: "t3-warning", type: "text", text: "REFRIGERATE", x: 45, y: 202, fontSize: 18, fontWeight: "bold", color: "#ffffff", tracking: 1, zIndex: 15 },
      
      { id: "t3-batch", type: "text", text: "Lot: INS-98Q", x: 20, y: 270, fontSize: 18, fontWeight: "bold", color: "#111111", zIndex: 16 },
      { id: "t3-exp", type: "text", text: "Exp: 08/25", x: 20, y: 300, fontSize: 18, fontWeight: "bold", color: "#111111", zIndex: 17 },
      { id: "t3-ndc", type: "text", text: "NDC 0002-8215-01", x: 20, y: 340, fontSize: 16, color: "#333333", zIndex: 18 },
      
      // Right side rotated data matrix and barcode
      { id: "t3-qr", type: "qrcode", text: "(01)00300028215018(17)250831(10)INS-98Q", x: 440, y: 30, width: 120, height: 120, zIndex: 19 },
      { id: "t3-barcode", type: "barcode", text: "0002821501", x: 380, y: 170, width: 200, height: 70, zIndex: 20 },
      { id: "t3-mfg", type: "text", text: "Biogen Pharma", x: 430, y: 300, fontSize: 14, color: "#333333", zIndex: 21 }
    ]
  },
  {
    id: 'tpl-ointment-std',
    name: 'Topical Ointment Tube Label',
    brand: 'DERMA-HEAL 2%',
    category: 'Ointments',
    size: '90x35mm',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtY9Yf8yXjXvR1E1T1W1Q1P1S1W1R1U1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1',
    elementsData: [
      { id: "t4-header-bg", type: "shape", subtype: "rect", x: 0, y: 0, width: 600, height: 60, bgColor: "#6b21a8", zIndex: 1 },
      { id: "t4-brand", type: "text", subtype: "brand", text: "DERMA-HEAL 2%", x: 20, y: 15, fontSize: 24, fontWeight: "bold", color: "#ffffff", tracking: 1, zIndex: 11 },
      { id: "t4-strength", type: "text", text: "Hydrocortisone Valerate Ointment, USP 0.2%", x: 20, y: 80, fontSize: 16, fontWeight: "bold", color: "#4b5563", zIndex: 12 },
      { id: "t4-size", type: "text", text: "NET WT 45g", x: 480, y: 80, fontSize: 14, fontWeight: "bold", color: "#374151", zIndex: 13 },
      { id: "t4-use", type: "text", text: "FOR EXTERNAL USE ONLY. NOT FOR OPHTHALMIC USE.", x: 20, y: 115, fontSize: 13, fontWeight: "black", color: "#dc2626", zIndex: 14 },
      { id: "t4-dosage", type: "text", text: "Apply to affected area 2-3 times daily or as directed by physician.", x: 20, y: 145, fontSize: 11, color: "#4b5563", zIndex: 15 },
      { id: "t4-barcode", type: "barcode", text: "1234567890123", x: 20, y: 180, width: 200, height: 50, zIndex: 20 },
      { id: "t4-mfg", type: "text", text: "Mfd by: DermaLife Pharma, NJ", x: 20, y: 250, fontSize: 10, color: "#9ca3af", zIndex: 21 }
    ]
  },
  {
    id: 'tpl-case-label',
    name: 'Industrial Case / Shipping Label',
    brand: 'BULK LOGISTICS SPEC',
    category: 'Generic Labels',
    size: '150x100mm',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1E1T1W1Q1P1S1W1R1U1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T1T',
    elementsData: [
      { id: "t5-box", type: "shape", subtype: "rect", x: 10, y: 10, width: 580, height: 380, bgColor: "transparent", borderWidth: 4, borderColor: "#000000", zIndex: 1 },
      { id: "t5-title", type: "text", text: "BULK SHIPMENT - PHARMA GRADE", x: 30, y: 30, fontSize: 18, fontWeight: "black", color: "#000000", zIndex: 10 },
      { id: "t5-product", type: "text", text: "PRODUCT: AMBLIN-X POWDER", x: 30, y: 70, fontSize: 24, fontWeight: "bold", color: "#000000", zIndex: 11 },
      { id: "t5-weight", type: "text", text: "WEIGHT: 25.00 KG", x: 30, y: 110, fontSize: 18, color: "#000000", zIndex: 12 },
      { id: "t5-barcode-large", type: "barcode", text: "BULK-AMX-2024-001", x: 30, y: 160, width: 540, height: 120, zIndex: 13 },
      { id: "t5-qr-large", type: "qrcode", text: "BULK-AMX-2024-001|25.00KG|EXP:2028-01", x: 450, y: 30, width: 120, height: 120, zIndex: 14 }
    ]
  }
];

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
  const defaultStockIdRef = useRef(null);
  const isSavingRef = useRef(false);

  const { user } = useAuth();
  const guestId = getGuestId();
  const effectiveId = user?.id || guestId;
  const debounceRef = useRef(null);

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

  // ── Hydrate from Backend (only when authenticated) ──
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        if (!user) {
          setHydrated(true);
          return;
        }

        // Parallelize initial fetches to improve boot time
        const [dashRes, stockRes, templatesRes, labelsRes, languagesRes] = await Promise.allSettled([
          api.getDashboard(effectiveId),
          api.getLabelStocks(),
          api.getLabels('PREDEFINED'),
          api.getLabels('ACTIVE'),
          api.getLanguages()
        ]);

        // 1. Process Dashboard
        if (dashRes.status === 'fulfilled') {
          const session = dashRes.value;
          if (session.dashboardPreferences) setSettings(prev => ({ ...prev, ...session.dashboardPreferences }));
          if (session.recentActivityLog) setActivityLogs(Array.isArray(session.recentActivityLog) ? session.recentActivityLog : []);
        }

        // 2. Process Stocks
        if (stockRes.status === 'fulfilled') {
          const stocks = stockRes.value;
          if (Array.isArray(stocks) && stocks.length > 0) {
            setLabelStocks(stocks);
            defaultStockIdRef.current = stocks[0].id;
          }
        }

        // 3. Process Templates (Merge system labels with frontend predefined ones)
        if (templatesRes.status === 'fulfilled') {
          const systemLabels = templatesRes.value;
          if (Array.isArray(systemLabels) && systemLabels.length > 0) {
            setTemplates(prev => {
              const merged = [...prev];
              systemLabels.forEach(sl => {
                const idx = merged.findIndex(m => m.id === sl.id);
                if (idx !== -1) {
                  // Merge: server data overrides but keeps frontend defaults if missing
                  merged[idx] = { ...merged[idx], ...sl };
                } else {
                  merged.push(sl);
                }
              });
              return merged;
            });
          }
        }

        // 4. Process Languages & Global Setting Synchronization
        if (languagesRes.status === 'fulfilled') {
          const langs = languagesRes.value;
          const activeLangs = Array.isArray(langs) ? langs.filter(l => l.status === 'ACTIVE') : [];
          
          // Determine current language using preference from dashboard (set above) or default
          const currentLangCode = settings.defaultLanguage || DEFAULT_SETTINGS.defaultLanguage;
          const currentLanguage = activeLangs.find(l => l.code === currentLangCode || l.id === settings.languageId);
          
          if (currentLanguage) {
            setSettings(prev => ({
              ...prev,
              languageId: currentLanguage.id,
              direction: currentLanguage.direction
            }));
          }
        }

        // 5. Process Labels & Restore Last Session
        if (labelsRes.status === 'fulfilled') {
          const labels = labelsRes.value;
          setUserFiles(labels);

          if (labels.length > 0) {
            const last = labels.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0];
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
                  notes: latestVersion.designJson?.notes || ''
                }));
                setElements(latestVersion.designJson?.elementsData || []);
              }
            } catch (verErr) {
              console.error('Failed to restore last version', verErr);
            }
          }
        }

        setHydrated(true);
      } catch (err) {
        console.error('Critical hydration error', err);
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
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      try {
        setSavedStatus('saving');
        await api.saveLabelVersion(meta.fileId, {
          designJson: {
            elementsData: elements,
            labelSize: meta.labelSize,
            bgColor: meta.bgColor,
            labelStockId: meta.labelStockId
          },
          labelStockId: meta.labelStockId,
          notes: meta.notes
        });
        setSavedStatus('saved');
      } catch (err) {
        console.error('Auto-save failed', err);
        setSavedStatus('unsaved');
      } finally {
        isSavingRef.current = false;
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
    setSavedStatus('unsaved');
  };

  const setFileName = async (name) => {
    const trimmed = name.trim();
    if (!meta.fileId) {
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
        addActivityLog(activeTemplate ? 'Started from template' : 'Created new label', newLabel.id, trimmed);
      } catch (err) {
        console.error('Failed to create label:', err);
        showToast('Failed to initialize label in backend', 'error');
      } finally {
        isSavingRef.current = false;
      }
    } else {
      setMeta(m => ({ ...m, fileName: trimmed }));
    }
  };

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

  const setLabelSize = (w, h) => {
    if (w < 10 || h < 10) return; // Prevent invalid sizes
    scaleElements(w, h);
    setMeta(prev => ({ ...prev, labelSize: { w, h } }));
  };

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

  const saveFile = async () => {
    if (!meta.fileId) {
      showToast('Please name your file first', 'warning');
      return;
    }
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      setSavedStatus('saving');
      await api.saveLabelVersion(meta.fileId, {
        designJson: {
          elementsData: elements,
          labelSize: meta.labelSize,
          bgColor: meta.bgColor,
          labelStockId: meta.labelStockId
        },
        labelStockId: meta.labelStockId,
        notes: meta.notes
      });
      setSavedStatus('saved');
      showToast('New version saved ✓', 'success');
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
    const el = { id: uuidv4(), x: 20, y: 20, zIndex: maxZ + 1, ...data };
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
    if (!has(e => (e.text || '').toLowerCase().includes('exp') || (e.text || '').toLowerCase().includes('expiry')))
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
      const text = el.text || '';
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

