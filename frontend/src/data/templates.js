export const PREDEFINED_TEMPLATES = [
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
