import { v4 as uuidv4 } from 'uuid';

const tabletData = [
  { brand: 'PANADOL', comp: 'Paracetamol 500mg', desc: 'Analgesic and Antipyretic Tablet', dose: '1-2 tablets SOS' },
  { brand: 'LIPITOR', comp: 'Atorvastatin 40mg', desc: 'Lipid-Lowering Agent', dose: '1 tablet daily' },
  { brand: 'AMOXIL', comp: 'Amoxicillin Trihydrate 500mg', desc: 'Broad-spectrum antibiotic', dose: '1 TID' },
  { brand: 'GLUCOPHAGE', comp: 'Metformin Hydrochloride 500mg', desc: 'Oral Antidiabetic', dose: '1 BID with meals' },
  { brand: 'NORVASC', comp: 'Amlodipine Besylate 5mg', desc: 'Calcium Channel Blocker', dose: '1 O.D.' },
  { brand: 'SYNTHROID', comp: 'Levothyroxine Sodium 50mcg', desc: 'Thyroid Hormone', dose: '1 O.D. empty stomach' },
  { brand: 'COZAAR', comp: 'Losartan Potassium 50mg', desc: 'Angiotensin II Receptor Blocker', dose: '1 tablet daily' },
  { brand: 'PRILOSEC', comp: 'Omeprazole 20mg', desc: 'Proton Pump Inhibitor', dose: '1 O.D. before breakfast' },
  { brand: 'NEURONTIN', comp: 'Gabapentin 300mg', desc: 'Anticonvulsant / Neuropathy', dose: '1 TID' },
  { brand: 'ZOLOFT', comp: 'Sertraline Hydrochloride 50mg', desc: 'SSRI Antidepressant', dose: '1 tablet daily' },
  { brand: 'LASIX', comp: 'Furosemide 40mg', desc: 'Loop Diuretic', dose: '1 tablet morning' },
  { brand: 'PROTONIX', comp: 'Pantoprazole Sodium 40mg', desc: 'PPI for Acid Reflux', dose: '1 O.D. before meal' },
  { brand: 'LEXAPRO', comp: 'Escitalopram Oxalate 10mg', desc: 'SSRI Antidepressant', dose: '1 tablet daily' },
  { brand: 'ZESTRIL', comp: 'Lisinopril 10mg', desc: 'ACE Inhibitor', dose: '1 tablet daily' },
  { brand: 'ZOCOR', comp: 'Simvastatin 20mg', desc: 'Statins for Cholesterol', dose: '1 tablet daily at night' },
  { brand: 'CRESTOR', comp: 'Rosuvastatin Calcium 10mg', desc: 'Lipid Regulating Agent', dose: '1 O.D.' },
  { brand: 'CELEXA', comp: 'Citalopram Hydrobromide 20mg', desc: 'Antidepressant', dose: '1 tablet daily' },
  { brand: 'CYMBALTA', comp: 'Duloxetine 60mg', desc: 'SNRI Antidepressant', dose: '1 tablet daily' },
  { brand: 'MOBIC', comp: 'Meloxicam 15mg', desc: 'NSAID / Arthritis', dose: '1 tablet daily' },
  { brand: 'PLAVIX', comp: 'Clopidogrel Bisulfate 75mg', desc: 'Antiplatelet', dose: '1 tablet daily' },
  { brand: 'GLUCOTROL', comp: 'Glipizide 5mg', desc: 'Sulfonylurea Antidiabetic', dose: '1 tablet before meal' },
  { brand: 'VOLTAREN', comp: 'Diclofenac Sodium 50mg', desc: 'NSAID Pain relief', dose: '1 BID or TID' },
  { brand: 'NAPROSYN', comp: 'Naproxen 500mg', desc: 'NSAID', dose: '1 tablet BID' },
  { brand: 'ZYRTEC', comp: 'Cetirizine Hydrochloride 10mg', desc: 'Antihistamine', dose: '1 tablet daily' },
  { brand: 'CLARITIN', comp: 'Loratadine 10mg', desc: 'Non-drowsy Antihistamine', dose: '1 O.D.' },
  { brand: 'ALLEGRA', comp: 'Fexofenadine 120mg', desc: 'Antiallergic', dose: '1 O.D.' },
  { brand: 'SINGULAIR', comp: 'Montelukast Sodium 10mg', desc: 'Leukotriene Receptor Antagonist', dose: '1 tablet daily at night' },
  { brand: 'AUGMENTIN', comp: 'Amoxicillin/Clavulanate 625mg', desc: 'Antibacterial', dose: '1 tablet TID' },
  { brand: 'CIPRO', comp: 'Ciprofloxacin 500mg', desc: 'Fluoroquinolone Antibiotic', dose: '1 tablet BID' },
  { brand: 'ZITHROMAX', comp: 'Azithromycin 500mg', desc: 'Macrolide Antibiotic', dose: '1 tablet daily for 3 days' }
];

const syrupData = [
  { brand: 'MUCINEX', comp: 'Guaifenesin 100mg/5ml', desc: 'Expectorant Syrup', warn: 'May cause drowsiness' },
  { brand: 'DELSYM', comp: 'Dextromethorphan Polistirex', desc: 'Cough Suppressant', warn: 'Shake well before use' },
  { brand: 'PHENERGAN', comp: 'Promethazine HCl 6.25mg/5ml', desc: 'Antihistamine Syrup', warn: 'Causes severe drowsiness' },
  { brand: 'BENADRYL', comp: 'Diphenhydramine HCl 12.5mg/5ml', desc: 'Allergy Liquid', warn: 'Avoid alcohol' },
  { brand: 'CHLOR-TRIMETON', comp: 'Chlorpheniramine 2mg/5ml', desc: 'Allergy Syrup', warn: 'May cause drowsiness' },
  { brand: 'BROMHEX', comp: 'Bromhexine 4mg/5ml', desc: 'Mucolytic Syrup', warn: 'Consult doctor if pregnant' },
  { brand: 'MUCOLITE', comp: 'Ambroxol Hydrochloride 30mg/5ml', desc: 'Mucokinetic agent', warn: 'Do not exceed dose' },
  { brand: 'ASTHALIN', comp: 'Levosalbutamol 1mg/5ml', desc: 'Bronchodilator Syrup', warn: 'May cause tremors' },
  { brand: 'BRICANYL', comp: 'Terbutaline 1.5mg/5ml', desc: 'Asthma Expectorant', warn: 'Avoid in heavy heart conditions' },
  { brand: 'CALPOL', comp: 'Paracetamol 250mg/5ml', desc: 'Paediatric Suspension', warn: 'Do not exceed 4 doses in 24h' },
  { brand: 'ADVIL JR', comp: 'Ibuprofen 100mg/5ml', desc: 'Children\'s Pain Reliever', warn: 'Take with food' },
  { brand: 'DUPHALAC', comp: 'Lactulose 10g/15ml', desc: 'Osmotic Laxative', warn: 'Ensure fluid intake' },
  { brand: 'SUPRADYN', comp: 'Vitamins & Minerals', desc: 'Multivitamin Syrup', warn: 'Store below 25°C' },
  { brand: 'DEXORANGE', comp: 'Haematinic Syrup', desc: 'Iron & Vitamin B12', warn: 'May cause dark stools' },
  { brand: 'OSTOCALCIUM', comp: 'Calcium & Vit D3', desc: 'Bone health suspension', warn: 'Shake well' },
  { brand: 'GELUSIL', comp: 'Al & Mg Hydroxide, Simethicone', desc: 'Antacid & Antigas', warn: 'Do not take with antibiotics' },
  { brand: 'SUCRAFIL', comp: 'Sucralfate 1g/10ml', desc: 'Ulcer Healing Suspension', warn: 'Take 1 hour before meals' },
  { brand: 'ZOFER', comp: 'Ondansetron 2mg/5ml', desc: 'Anti-emetic Syrup', warn: 'Use as directed' },
  { brand: 'ZYRTEC ALLERGY', comp: 'Cetirizine 5mg/5ml', desc: 'Allergy Relief', warn: 'May cause mild drowsiness' },
  { brand: 'ZATHRIN', comp: 'Azithromycin 200mg/5ml', desc: 'Antibacterial Oral Suspension', warn: 'Reconstitute with water' }
];

const injectData = [
  { brand: 'LANTUS', comp: 'Insulin Glargine 100 IU/ml', desc: 'Long-acting Insulin', route: 'Subcutaneous' },
  { brand: 'HUMALOG', comp: 'Insulin Lispro 100 IU/ml', desc: 'Fast-acting Insulin', route: 'Subcutaneous' },
  { brand: 'ROCEPHIN', comp: 'Ceftriaxone 1g', desc: 'Broad-spectrum Antibiotic', route: 'IV/IM Injection' },
  { brand: 'TAZOCIN', comp: 'Piperacillin/Tazobactam 4.5g', desc: 'Antibacterial combination', route: 'IV Infusion' },
  { brand: 'HEP-LOCK', comp: 'Heparin Sodium 10,000 U/ml', desc: 'Anticoagulant', route: 'IV/SC' },
  { brand: 'LOVENOX', comp: 'Enoxaparin Sodium 40mg/0.4ml', desc: 'LMWH Anticoagulant', route: 'Subcutaneous' },
  { brand: 'DURAMORPH', comp: 'Morphine Sulfate 10mg/ml', desc: 'Opioid Analgesic', route: 'IV/IM/SC' },
  { brand: 'SUBLIMAZE', comp: 'Fentanyl Citrate 50mcg/ml', desc: 'Opioid Analgesic', route: 'IV/IM' },
  { brand: 'DIPRIVAN', comp: 'Propofol 10mg/ml', desc: 'General Anesthetic', route: 'IV Infusion' },
  { brand: 'VERSED', comp: 'Midazolam 1mg/ml', desc: 'Sedative-Hypnotic', route: 'IV/IM' },
  { brand: 'EPIPEN', comp: 'Adrenaline (Epinephrine) 1mg/ml', desc: 'Anaphylaxis treatment', route: 'IM Injection' },
  { brand: 'LEVOPHED', comp: 'Noradrenaline 4mg/4ml', desc: 'Vasopressor', route: 'IV Infusion' },
  { brand: 'INTROPIN', comp: 'Dopamine 40mg/ml', desc: 'Inotropic/Vasopressor', route: 'IV Infusion' },
  { brand: 'DOBUTREX', comp: 'Dobutamine 250mg/20ml', desc: 'Inotropic Agent', route: 'IV Infusion' },
  { brand: 'ATROPEN', comp: 'Atropine Sulfate 1mg/ml', desc: 'Anticholinergic', route: 'IV/IM/SC' },
  { brand: 'CORDARONE', comp: 'Amiodarone 150mg/3ml', desc: 'Antiarrhythmic', route: 'IV Infusion' },
  { brand: 'ZOFRAN INJ', comp: 'Ondansetron 4mg/2ml', desc: 'Anti-emetic', route: 'IV/IM' },
  { brand: 'PROTONIX IV', comp: 'Pantoprazole 40mg', desc: 'PPI for IV use', route: 'IV Infusion' },
  { brand: 'VOLTAREN INJ', comp: 'Diclofenac Sodium 75mg/3ml', desc: 'NSAID Injection', route: 'IM Injection only' },
  { brand: 'TRAMAL', comp: 'Tramadol HCl 100mg/2ml', desc: 'Centrally Acting Analgesic', route: 'IV/IM/SC' }
];

const ointData = [
  { brand: 'CORTIZONE', comp: 'Hydrocortisone 1%', desc: 'Anti-itch Cream', apply: 'Apply topically' },
  { brand: 'BETNOVATE', comp: 'Betamethasone Valerate 0.1%', desc: 'Topical Corticosteroid', apply: 'Thin layer BID' },
  { brand: 'DERMOVATE', comp: 'Clobetasol Propionate 0.05%', desc: 'Potent Steroid', apply: 'Sparingly to skin' },
  { brand: 'BACTROBAN', comp: 'Mupirocin 2%', desc: 'Antibacterial Ointment', apply: 'TID for 10 days' },
  { brand: 'FUCIDIN', comp: 'Fusidic Acid 2%', desc: 'Antibacterial Cream', apply: 'Apply topically' },
  { brand: 'LOTRIMIN', comp: 'Clotrimazole 1%', desc: 'Antifungal Cream', apply: 'BID to affected area' },
  { brand: 'NIZORAL', comp: 'Ketoconazole 2%', desc: 'Antifungal Cream', apply: 'O.D. for 2-4 weeks' },
  { brand: 'DAKTARIN', comp: 'Miconazole Nitrate 2%', desc: 'Antifungal', apply: 'Apply topically' },
  { brand: 'LAMISIL', comp: 'Terbinafine HCl 1%', desc: 'Antifungal Cream', apply: 'Apply OD or BID' },
  { brand: 'ZOVIRAX', comp: 'Acyclovir 5%', desc: 'Antiviral Cream', apply: 'Apply 5 times daily' },
  { brand: 'VOLTAREN GEL', comp: 'Diclofenac Diethylamine 1.16%', desc: 'Pain Relief Gel', apply: 'Rub gently to skin' },
  { brand: 'FELDENE GEL', comp: 'Piroxicam 0.5%', desc: 'Anti-inflammatory gel', apply: 'Apply topically' },
  { brand: 'ELIMITE', comp: 'Permethrin 5%', desc: 'Scabicide Cream', apply: 'Apply neck down, wash off' },
  { brand: 'CALADRYL', comp: 'Calamine + Diphenhydramine', desc: 'Soothing Lotion', apply: 'Apply to rashes' },
  { brand: 'FLAMAZINE', comp: 'Silver Sulfadiazine 1%', desc: 'Burn Cream', apply: 'Apply to burns' },
  { brand: 'BETADINE', comp: 'Povidone Iodine 10%', desc: 'Antiseptic Ointment', apply: 'Apply on wounds' },
  { brand: 'PROTOPIC', comp: 'Tacrolimus 0.1%', desc: 'Immunosuppressant Ointment', apply: 'Apply thin layer' },
  { brand: 'DIFFERIN', comp: 'Adapalene 0.1%', desc: 'Acne Treatment Gel', apply: 'O.D. night' },
  { brand: 'BENZAC', comp: 'Benzoyl Peroxide 5%', desc: 'Anti-acne Gel', apply: 'Apply topically' },
  { brand: 'RETIN-A', comp: 'Tretinoin 0.05%', desc: 'Acne & Anti-aging Cream', apply: 'O.D. night' },
  { brand: 'DESITIN', comp: 'Zinc Oxide 40%', desc: 'Diaper Rash Cream', apply: 'Apply topically' },
  { brand: 'NEOSPORIN', comp: 'Neomycin/Polymyxin/Bacitracin', desc: 'Triple Antibiotic', apply: 'Apply to minor cuts' },
  { brand: 'KENALOG', comp: 'Triamcinolone Acetonide 0.1%', desc: 'Topical Steroid', apply: '2-4 times daily' },
  { brand: 'ELIDEL', comp: 'Pimecrolimus 1%', desc: 'Eczema Cream', apply: 'Apply BID' },
  { brand: 'EUCERIN', comp: 'Urea 10%', desc: 'Intensive Lotion', apply: 'Apply to dry skin' },
  { brand: 'SUDOCREM', comp: 'Zinc Oxide BP', desc: 'Healing Cream', apply: 'Apply liberally' },
  { brand: 'AQUAPHOR', comp: 'Petrolatum 41%', desc: 'Healing Ointment', apply: 'Apply as needed' },
  { brand: 'CORTA-FLON', comp: 'Fluticasone Propionate 0.05%', desc: 'Corticosteroid Cream', apply: 'Apply BID' },
  { brand: 'ZINCOFAX', comp: 'Zinc Oxide 15%', desc: 'Skin Protectant', apply: 'Apply on affected area' },
  { brand: 'CLINDOXYL', comp: 'Clindamycin + Benzoyl Peroxide', desc: 'Acne Gel', apply: 'O.D. daily' }
];

const genData = [
  { brand: 'VENTOLIN', comp: 'Salbutamol 100mcg', desc: 'Bronchodilator Inhaler', warn: 'Shake well' },
  { brand: 'PULMICORT', comp: 'Budesonide 200mcg', desc: 'Corticosteroid Inhaler', warn: 'Rinse mouth after use' },
  { brand: 'FLONASE', comp: 'Fluticasone Propionate', desc: 'Nasal Spray', warn: 'Do not spray in eyes' },
  { brand: 'OTRIVIN', comp: 'Xylometazoline 0.1%', desc: 'Nasal Decongestant', warn: 'Max 3 days use' },
  { brand: 'TIMOPTIC', comp: 'Timolol 0.5%', desc: 'Eye Drops for Glaucoma', warn: 'Sterile solution' },
  { brand: 'CILOXAN', comp: 'Ciprofloxacin 0.3%', desc: 'Antibacterial Eye Drops', warn: 'Discard 1 month after open' },
  { brand: 'PATANOL', comp: 'Olopatadine 0.1%', desc: 'Allergic Conjunctivitis Drops', warn: 'Remove lenses' },
  { brand: 'POLYSPORIN', comp: 'Polymyxin B/Gramicidin', desc: 'Eye/Ear Drops', warn: 'Use as directed' },
  { brand: 'CANESTEN', comp: 'Clotrimazole 500mg', desc: 'Vaginal Suppository', warn: 'Insert locally' },
  { brand: 'GLYCERIN PLUS', comp: 'Glycerin 2g', desc: 'Laxative Suppository', warn: 'For rectal use only' },
  { brand: 'RESTASIS', comp: 'Cyclosporine 0.05%', desc: 'Ophthalmic Emulsion', warn: 'Single use vials' },
  { brand: 'LUMIGAN', comp: 'Bimatoprost 0.01%', desc: 'Eyelash / Glaucoma Drops', warn: 'Use in evening' },
  { brand: 'NASACORT', comp: 'Triamcinolone Acetonide', desc: 'Allergy 24HR Nasal Spray', warn: 'Do not swallow' },
  { brand: 'DULCOLAX', comp: 'Bisacodyl 10mg', desc: 'Laxative Suppository', warn: 'Effects in 15-60 min' },
  { brand: 'PRED FORTE', comp: 'Prednisolone Acetate 1%', desc: 'Steroid Eye Drop', warn: 'Shake vigorously' },
  { brand: 'SYMBICORT', comp: 'Budesonide/Formoterol', desc: 'Turbohaler', warn: 'Inhale deeply' },
  { brand: 'SPIRIVA', comp: 'Tiotropium Bromide', desc: 'HandiHaler', warn: 'Do not swallow capsules' },
  { brand: 'EUCERIN', comp: 'Hypoallergenic base', desc: 'Moisturizing Cream', warn: 'External only' },
  { brand: 'CETAPHIL', comp: 'Cleansing Formula', desc: 'Gentle Skin Cleanser', warn: 'Rinse with water' },
  { brand: 'LUBRIDERM', comp: 'Daily Moisture', desc: 'Therapy Lotion', warn: 'Apply to skin' }
];

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

  tabletData.forEach((d, i) => {
    result.push({
      id: `tab-${i}`,
      name: `${d.brand} ${d.comp.split(' ')[1] || 'Tab'}`,
      brand: d.brand,
      category: 'Tablets',
      size: tablet.str,
      image: Images.Tablets,
      elements: createElementsForTablet(d.brand, d.comp, d.desc, d.dose, tablet.w, tablet.h)
    });
  });

  syrupData.forEach((d, i) => {
    result.push({
      id: `syr-${i}`,
      name: `${d.brand} Syrup`,
      brand: d.brand,
      category: 'Syrups',
      size: syrup.str,
      image: Images.Syrups,
      elements: createElementsForSyrup(d.brand, d.comp, d.desc, d.warn, syrup.w, syrup.h)
    });
  });

  injectData.forEach((d, i) => {
    result.push({
      id: `inj-${i}`,
      name: `${d.brand} Vial`,
      brand: d.brand,
      category: 'Injections',
      size: injection.str,
      image: Images.Injections,
      elements: createElementsForInjection(d.brand, d.comp, d.desc, d.route, injection.w, injection.h)
    });
  });

  ointData.forEach((d, i) => {
    result.push({
      id: `oint-${i}`,
      name: `${d.brand} Ointment`,
      brand: d.brand,
      category: 'Ointments',
      size: ointment.str,
      image: Images.Ointments,
      elements: createElementsForOintment(d.brand, d.comp, d.desc, d.apply, ointment.w, ointment.h)
    });
  });

  genData.forEach((d, i) => {
    result.push({
      id: `gen-${i}`,
      name: `${d.brand} Med`,
      brand: d.brand,
      category: 'Generic Labels',
      size: generic.str,
      image: Images.Generic,
      elements: createElementsForSyrup(d.brand, d.comp, d.desc, d.warn, generic.w, generic.h)
    });
  });

  return result;
};

export const generatedTemplates = renderAllData();
