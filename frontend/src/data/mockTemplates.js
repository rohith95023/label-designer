import { v4 as uuidv4 } from 'uuid';

// (Mock data arrays removed for simplicity)

const Images = {
  Tablets: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSiaeAayZfueBnsduY5QBuSpvvp1o52sXv9Gms4s8DDXzCg35p1PVI7fGnJBIe6o28S2BMbE0rSBc_dYfthr-9oQFj06PXseU9EmCO9cLMQSwx5kLmfxGNZqwwX8IE1n2samFtoMqoV4I2fsJCBOaKVNEqrjscyyG0Nf81gzIdfc8bxIzsuGBT-olgLyG0zkH_cO3MngPSb93gAsnzm78aZXRasjIPOhLxJkLmCWM4J_f7MDZ0T1v07GKtOZ_98PFPtnoLol5lP6DJ',
  Syrups: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7niTIAhjNqf3IBSGE2I66N6Ji5S7LEyTbd9BSCJD9EI2yimwYPZFlWKP4JEA8JvNqTUoFyGAvP0wZ_-wT3DHsox-iiLYYsKXKmtkOVFGZQEOFXGsxL53GBNeruas6-RcDlRPo96x366pBpnIRjzw40JjI6-l-GcZGqZ0wS9YXY3YqWN-Kja_S6SZvCyrsiYGQ_Tl0g2apTZT-47xXLwoj_U-Bg6xf19Z0tHgGPVllfP867i-ltTw9bWiUUvyqJGTyu4MlQt4_MBHC',
  Injections: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeDBuiu1BpLkVlOariuZKZGmdjIydU_BaagNhWmo9DmkBkAN3T0E8Hdh2RXhhiGWMRS_tDYjAvQWZ8Ifty0YhOaClraQKl59f5CSeKbl2GjMY35WT6gI1OWseEYymne0pmCwGGGWfF6LXzc20pcWjTVdDjt8fe4dAttzmQKhvPM_HpwWN4qEqIynwnILoQiOSXcAUnLOqkTeKbfKAgqgnHfALtmh_r6_mWsjY1gto8DKvTxDUjpJ8Q0M8zTvn-NYWAyHvaMcXLjgIT',
  Ointments: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGjtinBEWI-g2GwomdCjmEYpnRA3ym4GS_NZHl1bq9wT6spPZhVgpjMHAV91jduHsQDJszDvAoMyeSVYr5zYbzpoFprKtX9yls5xrdWVJD55wvgjS84ojO3oan9anGJSAG2PtKQMSbh16o04vaQduwP-TfRpHRB7lA85jrY4pELGQnmCJKLWnauFzVTXC_5KdOxodthtwCQh-Yz4qVmo6sYN9S9GCzrTRrUqemI5SY0vbGJu8GCfqhM9oB_QWn6yIstWYTfsccC6A7',
  Generic: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxHcv-jzXgoRhjFZTF5oBUqLwbXU0mZq0SBkb6LlxiMHwVlS3fZQbaw3B88pSXukdltThAANfKB2AFOs1B8Kb3-qmYIBIBLgMSDRXczHJ7PmJBP4S5ZUWmmg7OI8T6aaSBgNT92E-WbUe68HELI1Zh1p7pUW9McaE3JbYZ3Nhl2jX0Nz5Lbn0QX5Ltch13GcER0OOK2nW9yhppB60-ORoTj2QOrZ0gPa5--Sw-THgvIAeb2GaKWSActPVFqeo0AvPa4djax0H-0VDW'
};

const MM_TO_PX = 3.7795275591;

// ─── Dimension presets per category (mm → px) ────────────────────────────────
const SIZES = {
  tablet:    { w: Math.round(75  * MM_TO_PX), h: Math.round(35 * MM_TO_PX), str: '75 x 35 mm' },
  syrup:     { w: Math.round(120 * MM_TO_PX), h: Math.round(50 * MM_TO_PX), str: '120 x 50 mm' },
  injection: { w: Math.round(55  * MM_TO_PX), h: Math.round(20 * MM_TO_PX), str: '55 x 20 mm' },
  ointment:  { w: Math.round(90  * MM_TO_PX), h: Math.round(35 * MM_TO_PX), str: '90 x 35 mm' },
  generic:   { w: Math.round(80  * MM_TO_PX), h: Math.round(40 * MM_TO_PX), str: '80 x 40 mm' },
};

// ─── Helper: pct of a value, no upper bound ──────────────────────────────────
const pct = (v, fraction) => Math.max(1, Math.round(v * fraction));

// ─── TABLET — landscape, two-column layout ────────────────────────────────────
// Left: Brand | Rx badge | Description | Warnings | Expiry  (all within fh)
// Right: Dosage (top 38%) | Barcode (remaining)
const createElementsForTablet = (brand, comp, desc, dose, W, H) => {
  const p   = pct(H, 0.05);             // 5% padding
  const g   = pct(H, 0.02);             // 2% gap
  const fh  = H - 2 * p;               // full available height
  const col = Math.round(W * 0.62);    // column break x
  const lW  = col - 2 * p;            // left col width
  const rW  = W - col - p;            // right col width

  // Row fractions for left column (must total ≤ 1.0 of fh, minus gaps)
  // 5 rows + 4 gaps → budget gaps first: 4*g
  const gapBudget = 4 * g;
  const rowBudget = fh - gapBudget;
  // fractions (should sum to 1.0):
  const h_brand  = Math.round(rowBudget * 0.26);
  const h_rx     = Math.round(rowBudget * 0.13);
  const h_desc   = Math.round(rowBudget * 0.28);
  const h_warn   = Math.round(rowBudget * 0.18);
  const h_expiry = rowBudget - h_brand - h_rx - h_desc - h_warn; // remainder

  // Right column
  const h_dosage = Math.round(fh * 0.35);
  const h_bar    = fh - h_dosage - g;

  // Font sizes strictly proportional to their row heights (no overflow possible)
  const fs_brand = Math.round(h_brand * 0.65);
  const fs_desc  = Math.max(7, Math.round(h_desc * 0.32));
  const fs_sm    = Math.max(6, Math.round(h_warn * 0.45));
  const fs_dos   = Math.max(7, Math.round(h_dosage * 0.25));

  let y = p;
  const yBrand  = y; y += h_brand  + g;
  const yRx     = y; y += h_rx     + g;
  const yDesc   = y; y += h_desc   + g;
  const yWarn   = y; y += h_warn   + g;
  const yExpiry = y;

  return [
    { id: uuidv4(), type: 'text', name: 'Brand Name', subtype: 'brand', zIndex: 12,
      text: brand, x: p, y: yBrand,
      fontSize: fs_brand, fontWeight: '800', color: '#191C1E', align: 'left',
      width: lW, height: h_brand },

    { id: uuidv4(), type: 'subtext', name: 'Rx Badge', zIndex: 13,
      text: 'Rx Only', x: p, y: yRx,
      fontSize: Math.max(6, Math.round(h_rx * 0.55)), fontWeight: '700',
      color: '#ffffff', bgColor: '#1976d2', align: 'left',
      width: Math.round(lW * 0.30), height: h_rx },

    { id: uuidv4(), type: 'text', name: 'Composition', zIndex: 11,
      text: desc + '\n' + comp, x: p, y: yDesc,
      fontSize: fs_desc, fontWeight: '500', color: '#414752', align: 'left',
      width: lW, height: h_desc },

    { id: uuidv4(), type: 'dosage', name: 'Dosage', heading: 'Dosage', zIndex: 12,
      text: dose, x: col, y: p,
      fontSize: fs_dos, fontWeight: '700', color: '#191C1E', align: 'right',
      width: rW, height: h_dosage },

    { id: uuidv4(), type: 'warnings', name: 'Warnings', heading: 'Warnings', zIndex: 11,
      text: 'Store below 25°C.', x: p, y: yWarn,
      fontSize: fs_sm, fontWeight: '500', color: '#191c1e', alertColor: '#ba1a1a', align: 'left',
      width: lW, height: h_warn },

    { id: uuidv4(), type: 'barcode', name: 'Barcode', zIndex: 10,
      text: '1234567890', x: col, y: p + h_dosage + g,
      width: rW, height: Math.max(4, h_bar), color: '#191c1e' },

    { id: uuidv4(), type: 'expiry', name: 'Expiry/Batch', heading: 'Expiry / Batch', zIndex: 12,
      text: 'EXP 11/26 | B.No 125B', x: p, y: yExpiry,
      fontSize: Math.max(6, Math.round(h_expiry * 0.45)), fontWeight: '700',
      color: '#191c1e', align: 'left', width: lW, height: h_expiry },
  ];
};

// ─── SYRUP — main text column (left 75%) + barcode anchored right ─────────────
const createElementsForSyrup = (brand, comp, desc, warn, W, H) => {
  const p   = pct(H, 0.05);
  const g   = pct(H, 0.02);
  const fh  = H - 2 * p;
  const barW = Math.round(W * 0.22);
  const barX = W - barW - p;
  const lW   = barX - p - g;

  // Row fractions: brand + desc + warn + expiry = 1.0
  const gapBudget = 3 * g;
  const rowBudget = fh - gapBudget;
  const h_brand  = Math.round(rowBudget * 0.28);
  const h_desc   = Math.round(rowBudget * 0.32);
  const h_warn   = Math.round(rowBudget * 0.22);
  const h_expiry = rowBudget - h_brand - h_desc - h_warn;

  const barH = Math.round(fh * 0.50);
  const barY = p + Math.round((fh - barH) / 2);

  let y = p;
  const yBrand  = y; y += h_brand  + g;
  const yDesc   = y; y += h_desc   + g;
  const yWarn   = y; y += h_warn   + g;
  const yExpiry = y;

  return [
    { id: uuidv4(), type: 'text', name: 'Brand Name', subtype: 'brand', zIndex: 12,
      text: brand, x: p, y: yBrand,
      fontSize: Math.round(h_brand * 0.65), fontWeight: '800',
      color: '#191C1E', align: 'left', width: lW, height: h_brand },

    { id: uuidv4(), type: 'text', name: 'Composition', zIndex: 11,
      text: desc + '\n' + comp, x: p, y: yDesc,
      fontSize: Math.max(7, Math.round(h_desc * 0.30)), fontWeight: '500',
      color: '#414752', align: 'left', width: lW, height: h_desc },

    { id: uuidv4(), type: 'warnings', name: 'Caution', heading: 'Caution', zIndex: 11,
      text: warn, x: p, y: yWarn,
      fontSize: Math.max(6, Math.round(h_warn * 0.42)), fontWeight: '700',
      color: '#ba1a1a', align: 'left', width: lW, height: h_warn },

    { id: uuidv4(), type: 'expiry', name: 'Expiry/Batch', heading: 'Expiry / Batch', zIndex: 12,
      text: 'EXP 11/26 | B.No 125B', x: p, y: yExpiry,
      fontSize: Math.max(6, Math.round(h_expiry * 0.42)), fontWeight: '700',
      color: '#191c1e', align: 'left', width: Math.round(lW * 0.65), height: h_expiry },

    { id: uuidv4(), type: 'barcode', name: 'Barcode', zIndex: 10,
      text: '1234567890', x: barX, y: barY,
      width: barW, height: barH, color: '#1b6d24' },
  ];
};

// ─── INJECTION — horizontal 3-column layout ───────────────────────────────────
const createElementsForInjection = (brand, comp, desc, route, W, H) => {
  const p  = pct(H, 0.07);
  const g  = pct(W, 0.02);
  const fh = H - 2 * p;

  // Column widths — must sum to W - 2p - 2g
  const available = W - 2 * p - 2 * g;
  const c1W = Math.round(available * 0.28);  // brand
  const c3W = Math.round(available * 0.25);  // warning
  const c2W = available - c1W - c3W;         // middle: comp + route

  const c1X = p;
  const c2X = c1X + c1W + g;
  const c3X = c2X + c2W + g;

  const h_comp  = Math.round(fh * 0.50);
  const h_route = fh - h_comp - g;

  return [
    { id: uuidv4(), type: 'text', name: 'Brand Name', subtype: 'brand', zIndex: 13,
      text: brand, x: c1X, y: p,
      fontSize: Math.max(6, Math.round(fh * 0.50)), fontWeight: '900',
      color: '#ba1a1a', align: 'left', width: c1W, height: fh },

    { id: uuidv4(), type: 'text', name: 'Composition', zIndex: 11,
      text: comp, x: c2X, y: p,
      fontSize: Math.max(5, Math.round(h_comp * 0.38)), fontWeight: '500',
      color: '#191C1E', align: 'left', width: c2W, height: h_comp },

    { id: uuidv4(), type: 'subtext', name: 'Route', zIndex: 12,
      text: route, x: c2X, y: p + h_comp + g,
      fontSize: Math.max(5, Math.round(h_route * 0.50)), fontWeight: '700',
      color: '#ffffff', bgColor: '#1b6d24', align: 'left',
      width: Math.round(c2W * 0.90), height: h_route },

    { id: uuidv4(), type: 'warnings', name: 'Caution', heading: 'Hospital Use Only', zIndex: 12,
      text: 'Single dose vial', x: c3X, y: p,
      fontSize: Math.max(5, Math.round(fh * 0.22)), fontWeight: '700',
      color: '#191c1e', alertColor: '#ba1a1a', align: 'right',
      width: c3W, height: fh },
  ];
};

// ─── OINTMENT — centered single-column layout ─────────────────────────────────
const createElementsForOintment = (brand, comp, desc, apply, W, H) => {
  const p  = pct(H, 0.05);
  const g  = pct(H, 0.02);
  const fh = H - 2 * p;
  const fw = W - 2 * p;

  const gapBudget = 3 * g;
  const rowBudget = fh - gapBudget;
  const h_brand  = Math.round(rowBudget * 0.30);
  const h_desc   = Math.round(rowBudget * 0.32);
  const h_dir    = Math.round(rowBudget * 0.22);
  const h_expiry = rowBudget - h_brand - h_desc - h_dir;

  let y = p;
  const yBrand  = y; y += h_brand  + g;
  const yDesc   = y; y += h_desc   + g;
  const yDir    = y; y += h_dir    + g;
  const yExpiry = y;

  return [
    { id: uuidv4(), type: 'text', name: 'Brand Name', subtype: 'brand', zIndex: 13,
      text: brand, x: p, y: yBrand,
      fontSize: Math.round(h_brand * 0.62), fontWeight: '800',
      color: '#005dac', align: 'center', width: fw, height: h_brand },

    { id: uuidv4(), type: 'text', name: 'Composition', zIndex: 11,
      text: desc + '\n' + comp, x: p, y: yDesc,
      fontSize: Math.max(6, Math.round(h_desc * 0.30)), fontWeight: '500',
      color: '#414752', align: 'center', width: fw, height: h_desc },

    { id: uuidv4(), type: 'manufacturing', name: 'Directions', heading: 'Directions', zIndex: 11,
      text: apply, x: p, y: yDir,
      fontSize: Math.max(6, Math.round(h_dir * 0.42)), fontWeight: '700',
      color: '#191C1E', align: 'center', width: fw, height: h_dir },

    { id: uuidv4(), type: 'expiry', name: 'Expiry/Batch', heading: 'Expiry / Batch', zIndex: 12,
      text: 'EXP 11/26 | B.No 125B', x: p, y: yExpiry,
      fontSize: Math.max(5, Math.round(h_expiry * 0.42)), fontWeight: '700',
      color: '#191c1e', align: 'left', width: Math.round(fw * 0.6), height: h_expiry },
  ];
};


const renderAllData = () => {
  const result = [];
  const { tablet, syrup, injection, ointment, generic } = SIZES;

  // 1. Tablets
  result.push({
    id: 'tablet-std',
    name: 'Standard Tablet Label',
    brand: 'PHARMA TABLET',
    category: 'Tablets',
    size: tablet.str,
    image: Images.Tablets,
    elements: createElementsForTablet('PHARMA BRAND', 'Active Ingredient 500mg', 'Pharmacological Category', '1-2 tablets daily or as directed', tablet.w, tablet.h)
  });

  // 2. Syrups
  result.push({
    id: 'syrup-std',
    name: 'Standard Syrup Label',
    brand: 'PHARMA SYRUP',
    category: 'Syrups',
    size: syrup.str,
    image: Images.Syrups,
    elements: createElementsForSyrup('PHARMA SYRUP', 'Active Compound 100mg/5ml', 'Oral Liquid Suspension', 'Shake well before use. Store in a cool place.', syrup.w, syrup.h)
  });

  // 3. Injections
  result.push({
    id: 'injection-std',
    name: 'Standard Injection Label',
    brand: 'PHARMA INJECTION',
    category: 'Injections',
    size: injection.str,
    image: Images.Injections,
    elements: createElementsForInjection('PHARMA INJ', 'Concentrate 10mg/ml', 'Sterile Aqueous Solution', 'Intravenous / Intramuscular', injection.w, injection.h)
  });

  // 4. Ointments
  result.push({
    id: 'ointment-std',
    name: 'Standard Ointment Label',
    brand: 'PHARMA OINTMENT',
    category: 'Ointments',
    size: ointment.str,
    image: Images.Ointments,
    elements: createElementsForOintment('PHARMA DERMA', 'Medicine 1% w/w', 'Topical Cream/Ointment', 'Apply thin layer to affected area', ointment.w, ointment.h)
  });

  // 5. Generic
  result.push({
    id: 'generic-std',
    name: 'Standard Generic Label',
    brand: 'PHARMA GENERIC',
    category: 'Generic Labels',
    size: generic.str,
    image: Images.Generic,
    elements: createElementsForSyrup('GENERIC ITEM', 'Content details', 'General medical label', 'Handle with care. For medical use only.', generic.w, generic.h)
  });

  return result;
};

export const generatedTemplates = renderAllData();
