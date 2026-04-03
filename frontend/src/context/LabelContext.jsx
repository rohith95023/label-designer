import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../services/api';
import { getGuestId } from '../utils/auth';
import { useAuth } from './AuthContext';
import { UNITS, toPx, fromPx, PX_PER_UNIT } from '../utils/units';
import { SAMPLE_TRIAL_DATA } from '../utils/dynamicData';

const LabelContext = createContext();

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Initial definitions in PX (96dpi)
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
  autoTranslate: false,
  fdaValidation: true,
};

// ─── Provider ─────────────────────────────────────────────────────────────────
const PREDEFINED_TEMPLATES = [
  {
    id: 'tpl-tablet-std',
    name: 'Standard Tablet Label',
    brand: 'ASPIRIN USP',
    category: 'Tablets',
    size: '80x120mm',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSiaeAayZfueBnsduY5QBuSpvvp1o52sXv9Gms4s8DDXzCg35p1PVI7fGnJBIe6o28S2BMbE0rSBc_dYfthr-9oQFj06PXseU9EmCO9cLMQSwx5kLmfxGNZqwwX8IE1n2samFtoMqoV4I2fsJCBOaKVNEqrjscyyG0Nf81gzIdfc8bxIzsuGBT-olgLyG0zkH_cO3MngPSb93gAsnzm78aZXRasjIPOhLxJkLmCWM4J_f7MDZ0T1v07GKtOZ_98PFPtnoLol5lP6DJ',
    elementsData: [
      // 🔝 Top Section
      { id: "t1-rx", type: "text", text: "Rx", x: 20, y: 20, fontSize: 18, fontWeight: "bold", color: "#000000", zIndex: 10 },
      { id: "t1-brand", type: "text", subtype: "brand", text: "ASPIRIN USP", x: 60, y: 20, fontSize: 22, fontWeight: "bold", color: "#cc0000", zIndex: 11 },
      
      // 🧾 Middle Section
      { id: "t1-strength", type: "text", text: "Strength: 500 mg tablets", x: 60, y: 50, fontSize: 13, fontWeight: "bold", color: "#111111", zIndex: 12 },
      { id: "t1-category", type: "text", text: "Category: Analgesic / Antipyretic", x: 60, y: 70, fontSize: 10, color: "#555555", zIndex: 13 },
      
      // 📄 Details Section
      { id: "t1-active", type: "text", text: "Active Ingredient: Aspirin USP 500mg", x: 20, y: 105, fontSize: 9, color: "#333333", zIndex: 14 },
      { id: "t1-dosage", type: "text", text: "Dosage: Adults (12+) 1 tablet every 4-6h", x: 20, y: 125, fontSize: 9, color: "#000000", fontWeight: "bold", zIndex: 15 },
      
      // ⚠️ Warning Section
      { id: "t1-warning", type: "warnings", text: "KEEP OUT OF REACH OF CHILDREN", x: 20, y: 160, fontSize: 11, color: "#ff0000", fontWeight: "bold", zIndex: 16 },
      { id: "t1-storage", type: "text", text: "Store below 25°C in a dry place.", x: 20, y: 185, fontSize: 9, color: "#444444", zIndex: 17 },
      
      // 📦 Bottom Section
      { id: "t1-barcode", type: "barcode", text: "7192837465", x: 25, y: 215, width: 250, height: 50, zIndex: 18 },
      
      // 📊 Bottom Left
      { id: "t1-batch", type: "text", text: "Batch: 2024-X91", x: 20, y: 290, fontSize: 9, color: "#333333", zIndex: 20 },
      { id: "t1-exp", type: "text", text: "Exp: 02/2027", x: 20, y: 310, fontSize: 10, color: "#333333", fontWeight: "bold", zIndex: 21 },
      { id: "t1-mfg", type: "text", text: "Mfd by: PharmaCore Labs, USA", x: 20, y: 330, fontSize: 9, fontWeight: "bold", color: "#002244", zIndex: 22 },
      
      // 🔳 Bottom Right
      { id: "t1-qr", type: "qrcode", text: "ASP-REF-001928", x: 210, y: 280, width: 75, height: 75, zIndex: 23 }
    ]
  },
  {
    id: 'tpl-syrup-std',
    name: 'Standard Syrup Label',
    brand: 'TUSSI-PRO PLUS',
    category: 'Syrups',
    size: '80x120mm',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7niTIAhjNqf3IBSGE2I66N6Ji5S7LEyTbd9BSCJD9EI2yimwYPZFlWKP4JEA8JvNqTUoFyGAvP0wZ_-wT3DHsox-iiLYYsKXKmtkOVFGZQEOFXGsxL53GBNeruas6-RcDlRPo96x366pBpnIRjzw40JjI6-l-GcZGqZ0wS9YXY3YqWN-Kja_S6SZvCyrsiYGQ_Tl0g2apTZT-47xXLwoj_U-Bg6xf19Z0tHgGPVllfP867i-ltTw9bWiUUvyqJGTyu4MlQt4_MBHC',
    elementsData: [
      { id: "t2-rx", type: "text", text: "Rx", x: 20, y: 20, fontSize: 18, fontWeight: "bold", zIndex: 10 },
      { id: "t2-brand", type: "text", subtype: "brand", text: "TUSSI-PRO PLUS", x: 55, y: 20, fontSize: 20, fontWeight: "bold", color: "#0055aa", zIndex: 11 },
      { id: "t2-strength", type: "text", text: "Strength: 100mL Content", x: 55, y: 45, fontSize: 12, fontWeight: "bold", color: "#000000", zIndex: 12 },
      { id: "t2-category", type: "text", text: "Category: Cough & Cold Suspension", x: 55, y: 65, fontSize: 10, color: "#555555", zIndex: 13 },
      { id: "t2-active", type: "text", text: "Active: 5mg per 10ml liquid base", x: 20, y: 100, fontSize: 9, color: "#444444", zIndex: 14 },
      { id: "t2-dosage", type: "text", text: "Dosage: Adults 10ml thrice daily.", x: 20, y: 120, fontSize: 10, color: "#000000", fontWeight: "bold", zIndex: 15 },
      { id: "t2-warning", type: "warnings", text: "SHAKE WELL BEFORE USE", x: 20, y: 155, fontSize: 13, color: "#ff3300", fontWeight: "bold", zIndex: 16 },
      { id: "t2-storage", type: "text", text: "Store in a cool dry place below 30°C.", x: 20, y: 180, fontSize: 9, color: "#555555", zIndex: 17 },
      { id: "t2-barcode", type: "barcode", text: "TP-992-1", x: 25, y: 215, width: 250, height: 50, zIndex: 18 },
      { id: "t2-batch", type: "text", text: "Lot No: TP-101X", x: 20, y: 290, fontSize: 9, color: "#333333", zIndex: 19 },
      { id: "t2-exp", type: "text", text: "Exp: 11/2026", x: 20, y: 310, fontSize: 10, color: "#333333", fontWeight: "bold", zIndex: 20 },
      { id: "t2-mfg", type: "text", text: "Mfd by: Tussi Labs, Chicago", x: 20, y: 330, fontSize: 9, fontWeight: "bold", color: "#002244", zIndex: 21 },
      { id: "t2-qr", type: "qrcode", text: "https://t-pro-info.com", x: 210, y: 280, width: 75, height: 75, zIndex: 22 }
    ]
  },
  {
    id: 'tpl-injection-std',
    name: 'Standard Injection Label',
    brand: 'HUMAN INSULIN',
    category: 'Injections',
    size: '80x120mm',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeDBuiu1BpLkVlOariuZKZGmdjIydU_BaagNhWmo9DmkBkAN3T0E8Hdh2RXhhiGWMRS_tDYjAvQWZ8Ifty0YhOaClraQKl59f5CSeKbl2GjMY35WT6gI1OWseEYymne0pmCwGGGWfF6LXzc20pcWjTVdDjt8fe4dAttzmQKhvPM_HpwWN4qEqIynwnILoQiOSXcAUnLOqkTeKbfKAgqgnHfALtmh_r6_mWsjY1gto8DKvTxDUjpJ8Q0M8zTvn-NYWAyHvaMcXLjgIT',
    elementsData: [
      { id: "t3-rx", type: "text", text: "Rx Only", x: 20, y: 20, fontSize: 14, fontWeight: "bold", color: "#ff0000", zIndex: 10 },
      { id: "t3-brand", type: "text", subtype: "brand", text: "HUMAN INSULIN", x: 85, y: 20, fontSize: 18, fontWeight: "bold", color: "#008000", zIndex: 11 },
      { id: "t3-strength", type: "text", text: "Strength: 100 Units per mL (U-100)", x: 85, y: 45, fontSize: 13, fontWeight: "bold", zIndex: 12 },
      { id: "t3-category", type: "text", text: "Vial: 10 mL Multi-dose vial", x: 85, y: 65, fontSize: 10, color: "#555555", zIndex: 13 },
      { id: "t3-active", type: "text", text: "Active: Intermediate-acting Insulin", x: 20, y: 100, fontSize: 9, color: "#444444", zIndex: 14 },
      { id: "t3-dosage", type: "text", text: "Route: For Subcutaneous Use Only", x: 20, y: 120, fontSize: 10, color: "#cc0000", fontWeight: "bold", zIndex: 15 },
      { id: "t3-warning", type: "warnings", text: "REFRIGERATE: 2°C TO 8°C", x: 20, y: 155, fontSize: 13, fontWeight: "bold", color: "#003366", zIndex: 16 },
      { id: "t3-storage", type: "text", text: "Do not freeze. Protect from direct heat.", x: 20, y: 180, fontSize: 9, color: "#444444", zIndex: 17 },
      { id: "t3-barcode", type: "barcode", text: "HI100ML99", x: 25, y: 215, width: 250, height: 50, zIndex: 18 },
      { id: "t3-batch", type: "text", text: "Lot No: INS-Q9", x: 20, y: 290, fontSize: 9, color: "#333333", zIndex: 19 },
      { id: "t3-exp", type: "text", text: "Exp: 08/2025", x: 20, y: 310, fontSize: 10, color: "#333333", fontWeight: "bold", zIndex: 20 },
      { id: "t3-mfg", type: "text", text: "Mfd by: Biogen Pharma Co.", x: 20, y: 330, fontSize: 9, fontWeight: "bold", zIndex: 21 },
      { id: "t3-qr", type: "qrcode", text: "HI-99812-7B", x: 210, y: 280, width: 75, height: 75, zIndex: 22 }
    ]
  },
  {
    id: 'tpl-ointment-std',
    name: 'Standard Ointment Label',
    brand: 'DERMACARE HC',
    category: 'Ointments',
    size: '80x120mm',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGjtinBEWI-g2GwomdCjmEYpnRA3ym4GS_NZHl1bq9wT6spPZhVgpjMHAV91jduHsQDJszDvAoMyeSVYr5zYbzpoFprKtX9yls5xrdWVJD55wvgjS84ojO3oan9anGJSAG2PtKQMSbh16o04vaQduwP-TfRpHRB7lA85jrY4pELGQnmCJKLWnauFzVTXC_5KdOxodthtwCQh-Yz4qVmo6sYN9S9GCzrTRrUqemI5SY0vbGJu8GCfqhM9oB_QWn6yIstWYTfsccC6A7',
    elementsData: [
      { id: "t4-rx", type: "text", text: "Rx", x: 20, y: 20, fontSize: 18, fontWeight: "bold", zIndex: 10 },
      { id: "t4-brand", type: "text", subtype: "brand", text: "DERMACARE HC", x: 55, y: 20, fontSize: 20, fontWeight: "bold", color: "#800080", zIndex: 11 },
      { id: "t4-strength", type: "text", text: "Strength: 10mg HA per 1g (1%)", x: 55, y: 45, fontSize: 12, fontWeight: "bold", color: "#000000", zIndex: 12 },
      { id: "t4-category", type: "text", text: "Net Weight: 30g Tube", x: 55, y: 65, fontSize: 10, color: "#555555", zIndex: 13 },
      { id: "t4-active", type: "text", text: "Active: Hydrocortisone USP", x: 20, y: 100, fontSize: 9, color: "#444444", zIndex: 14 },
      { id: "t4-dosage", type: "text", text: "Use: Apply to affected area thin layer", x: 20, y: 120, fontSize: 10, color: "#000000", fontWeight: "bold", zIndex: 15 },
      { id: "t4-warning", type: "warnings", text: "FOR EXTERNAL USE ONLY", x: 20, y: 155, fontSize: 13, color: "#ff0000", fontWeight: "bold", zIndex: 16 },
      { id: "t4-storage", type: "text", text: "Store below 30°C. Keep from reach.", x: 20, y: 180, fontSize: 9, color: "#555555", zIndex: 17 },
      { id: "t4-barcode", type: "barcode", text: "7766554433", x: 25, y: 215, width: 250, height: 50, zIndex: 18 },
      { id: "t4-batch", type: "text", text: "Lot: HC-O012", x: 20, y: 290, fontSize: 9, color: "#333333", zIndex: 19 },
      { id: "t4-exp", type: "text", text: "Exp: 12/2026", x: 20, y: 310, fontSize: 10, color: "#333333", fontWeight: "bold", zIndex: 20 },
      { id: "t4-mfg", type: "text", text: "Mfd by: SkinCare Labs, Berlin", x: 20, y: 330, fontSize: 9, fontWeight: "bold", color: "#002244", zIndex: 21 },
      { id: "t4-qr", type: "qrcode", text: "HC-OINT-30", x: 210, y: 280, width: 75, height: 75, zIndex: 22 }
    ]
  },
  {
    id: 'tpl-generic-std',
    name: 'Standard Generic Label',
    brand: 'VITA-C FORTE',
    category: 'Generic Labels',
    size: '80x120mm',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxHcv-jzXgoRhjFZTF5oBUqLwbXU0mZq0SBkb6LlxiMHwVlS3fZQbaw3B88pSXukdltThAANfKB2AFOs1B8Kb3-qmYIBIBLgMSDRXczHJ7PmJBP4S5ZUWmmg7OI8T6aaSBgNT92E-WbUe68HELI1Zh1p7pUW9McaE3JbYZ3Nhl2jX0Nz5Lbn0QX5Ltch13GcER0OOK2nW9yhppB60-ORoTj2QOrZ0gPa5--Sw-THgvIAeb2GaKWSActPVFqeo0AvPa4djax0H-0VDW',
    elementsData: [
      { id: "t5-rx", type: "text", text: "OTC", x: 20, y: 20, fontSize: 18, fontWeight: "bold", zIndex: 10 },
      { id: "t5-brand", type: "text", subtype: "brand", text: "VITA-C FORTE", x: 65, y: 20, fontSize: 20, fontWeight: "bold", color: "#ff6600", zIndex: 11 },
      { id: "t5-strength", type: "text", text: "Strength: 1000 mg tablet", x: 65, y: 45, fontSize: 12, fontWeight: "bold", color: "#000000", zIndex: 12 },
      { id: "t5-category", type: "text", text: "Source: High potency Ascorbic Acid", x: 65, y: 65, fontSize: 10, color: "#555555", zIndex: 13 },
      { id: "t5-active", type: "text", text: "Each tablet contains: 1000mg Vit C", x: 20, y: 100, fontSize: 9, color: "#444444", zIndex: 14 },
      { id: "t5-dosage", type: "text", text: "Take 1 tablet daily with water.", x: 20, y: 120, fontSize: 10, color: "#000000", fontWeight: "bold", zIndex: 15 },
      { id: "t5-warning", type: "warnings", text: "Do not exceed stated daily dose.", x: 20, y: 155, fontSize: 12, color: "#880000", fontWeight: "bold", zIndex: 16 },
      { id: "t5-storage", type: "text", text: "FSSAI LIC: 100293884766", x: 20, y: 180, fontSize: 9, color: "#444444", zIndex: 17 },
      { id: "t5-barcode", type: "barcode", text: "VITA-C-1000", x: 25, y: 215, width: 250, height: 50, zIndex: 18 },
      { id: "t5-batch", type: "text", text: "Batch: VC-2024", x: 20, y: 290, fontSize: 9, color: "#333333", zIndex: 19 },
      { id: "t5-exp", type: "text", text: "Exp: 09/2026", x: 20, y: 310, fontSize: 10, color: "#333333", fontWeight: "bold", zIndex: 20 },
      { id: "t5-mfg", type: "text", text: "Mfd by: VitaNutri BioLabs", x: 20, y: 330, fontSize: 9, fontWeight: "bold", color: "#002244", zIndex: 21 },
      { id: "t5-qr", type: "qrcode", text: "VITA-INFO-QR", x: 210, y: 280, width: 75, height: 75, zIndex: 22 }
    ]
  }
];

export const LabelProvider = ({ children }) => {
  const [templates, setTemplates]      = useState(PREDEFINED_TEMPLATES);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [meta,     setMeta]    = useState(DEFAULT_META);
  const [elements, setElements] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
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
  const [labelStocks, setLabelStocks]   = useState([]);
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
        const [dashRes, stockRes, templatesRes, labelsRes] = await Promise.allSettled([
          api.getDashboard(effectiveId),
          api.getLabelStocks(),
          api.getLabels('PREDEFINED'),
          api.getLabels('ACTIVE')
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

        // 3. Process Templates
        if (templatesRes.status === 'fulfilled') {
          const systemLabels = templatesRes.value;
          if (Array.isArray(systemLabels) && systemLabels.length > 0) setTemplates(systemLabels);
        }

        // 4. Process Labels & Restore Last Session
        if (labelsRes.status === 'fulfilled') {
          const labels = labelsRes.value;
          setUserFiles(labels);

          if (labels.length > 0) {
            const last = labels.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0];
            try {
              const latestVersion = await api.getLatestLabelVersion(last.id);
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

  const setLabelSize = (w, h) => setMeta(m => ({ ...m, labelSize: { w, h } }));
  
  const setLabelStock = (stockId) => {
    const stock = labelStocks.find(s => s.id === stockId);
    if (stock) {
      const MM_TO_PX = 3.7795;
      const w = Math.round(stock.breadth * MM_TO_PX);
      const h = Math.round(stock.height * MM_TO_PX);
      setMeta(prev => ({ 
        ...prev, 
        labelStockId: stockId,
        labelSize: { w, h }
      }));
      showToast(`Stock changed: ${stock.name}`, 'info');
    }
  };

  const setUnit = (unit) => setMeta(m => ({ ...m, unit }));

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
  const loadTemplate = (template) => {
    console.log('[LabelContext] Loading Template:', template.name, template);
    
    // Normalize elements data
    const rawElements = template.elementsData || template.elements_data || [];
    
    const MM_TO_PX = 3.7795275591;
    let targetW = 600, targetH = 400;
    let designW = 600, designH = 400; // Default design basis if not specified

    // Determine Design Size (what it was built for in DB)
    if (template.size && template.size.toLowerCase().includes('x')) {
      const parts = template.size.toLowerCase().split('x');
      const val1 = parseFloat(parts[0]);
      const val2 = parseFloat(parts[1]);
      if (!isNaN(val1) && !isNaN(val2)) {
        designW = Math.round(val1 * MM_TO_PX);
        designH = Math.round(val2 * MM_TO_PX);
      }
    }

    // Determine Target Size (what we will set the canvas to)
    if (template.labelSize) {
      targetW = template.labelSize.w;
      targetH = template.labelSize.h;
    } else {
      targetW = designW;
      targetH = designH;
    }

    // Calculate scale factors to ensure everything fits the new proportions
    const scaleX = targetW / designW;
    const scaleY = targetH / designH;
    const minScale = Math.min(scaleX, scaleY); // Used for font sizes/dimensions to prevent stretching

    const enriched = rawElements.map((el, i) => {
      const up = {
        ...el,
        id: el.id || uuidv4(),
        x: Math.round((el.x || 0) * scaleX),
        y: Math.round((el.y || 0) * scaleY),
        width: el.width ? Math.round(el.width * minScale) : el.width,
        height: el.height ? Math.round(el.height * minScale) : el.height,
        fontSize: el.fontSize ? Math.round(el.fontSize * minScale) : el.fontSize,
        zIndex: el.zIndex || (i + 10)
      };

      // Proportional border/stroke scaling for shapes
      if (el.type === 'shape') {
          if (el.borderWidth)  up.borderWidth  = Math.max(1, Math.round(el.borderWidth * minScale));
          if (el.borderRadius) up.borderRadius = Math.round(el.borderRadius * minScale);
      }

      return up;
    });

    console.log(`[LabelContext] Auto-scaling complete (Ratio ${scaleX.toFixed(2)}x${scaleY.toFixed(2)}). Elements:`, enriched.length);

    setMeta({ 
      fileId: null, 
      fileName: null, 
      labelSize: { w: targetW, h: targetH }, 
      bgColor: template.bgColor || '#FFFFFF',
      notes: template.notes || ''
    });
    setActiveTemplate(template);
    setElements(enriched);
    setHistory([enriched]);
    setHistoryIndex(0);
    setSelectedIds([]);
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

  const toggleOrientation = () => {
    setMeta(prev => ({
      ...prev,
      labelSize: { w: prev.labelSize.h, h: prev.labelSize.w }
    }));
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
    if (dir === 'up')    z += 1;
    if (dir === 'down')  z = Math.max(1, z - 1);
    if (dir === 'front') z = Math.max(...allZ) + 1;
    if (dir === 'back')  z = Math.min(...allZ) - 1;
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
        if (direction === 'centerH') return { ...el, x: centerX - w/2 };
        if (direction === 'centerV') return { ...el, y: centerY - h/2 };
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
    if (!has(e => e.type === 'barcode' || e.type === 'qrcode'))          errors.push('Missing Barcode / QR Code.');
    if (!has(e => (e.text || '').toLowerCase().includes('exp') || (e.text || '').toLowerCase().includes('expiry')))
                                                                          errors.push('Missing Expiry Date field.');
    if (!has(e => (e.fontSize || 0) > 18 || e.subtype === 'brand'))      errors.push('Missing prominent Brand Name.');
    if (!has(e => e.type === 'warnings'))                                 errors.push('Missing Safety / Rx Warning.');

    // 2. Dynamic Field Validation (AC 10)
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
    // Validation
    validateLabel,
    LABEL_PRESETS,
    setUnit,
    toPx, fromPx, UNITS,
  };

  return <LabelContext.Provider value={value}>{children}</LabelContext.Provider>;
};

export const useLabel = () => useContext(LabelContext);

