/**
 * Utility for resolving dynamic placeholders and applying conditional logic
 * aligned with Clinical Label Designer requirements.
 */

export const SAMPLE_TRIAL_DATA = {
  PROTOCOL_NO: "CL-2024-V91",
  PATIENT_ID: "P-882931",
  MEDICATION: "Methylprednisolone IP",
  STRENGTH: "40 mg / mL",
  DOSAGE: "10 mL Injection",
  EXP_DATE: "2027-02-15",
  MFG_DATE: "2024-02-15",
  ROUTE: "Subcutaneous",
  BATCH_NO: "BATCH-XQ102",
  SITE_NAME: "St. Jude Research Center",
  SPONSOR: "PharmaCore Solutions",
  MARKETED_BY: "PharmaCore Solutions Inc.",
  MFG_LIC_NO: "MFG/2024/99182",
  MRP: "$299.00",
  NET_CONTENT: "50 Strips",
  COUNTRY: "United States",
  VISIT_ID: "V2-POST",
  GENDER: "Male",
  AGE: "45",
};

/**
 * Formats a raw value based on user-defined rules.
 */
export function formatDataValue(value, formatOptions = {}) {
  if (value === null || value === undefined || value === '') return '';
  
  let formatted = String(value);

  // 1. Text Case
  if (formatOptions.textCase === 'uppercase') formatted = formatted.toUpperCase();
  if (formatOptions.textCase === 'lowercase') formatted = formatted.toLowerCase();
  if (formatOptions.textCase === 'titlecase') {
    formatted = formatted.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  // 2. Date Formatting (Basic heuristic)
  if (formatOptions.type === 'date' && formatOptions.dateFormat) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      if (formatOptions.dateFormat === 'MM/YY') {
        formatted = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear().toString().slice(-2)}`;
      } else if (formatOptions.dateFormat === 'DD-MMM-YYYY') {
        const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        formatted = `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
      } else if (formatOptions.dateFormat === 'YYYY-MM-DD') {
        formatted = d.toISOString().split('T')[0];
      }
    }
  }

  // 3. Number Formatting
  if (formatOptions.type === 'number' && formatOptions.precision !== undefined) {
    const n = parseFloat(value);
    if (!isNaN(n)) {
      formatted = n.toFixed(parseInt(formatOptions.precision));
    }
  }

  return formatted;
}

/**
 * Evaluates a single conditional rule.
 */
function evaluateRule(rule, data) {
  const { field, operator, value: targetValue } = rule;
  const actualValue = data[field];

  switch (operator) {
    case 'equals': return String(actualValue) === String(targetValue);
    case 'not_equals': return String(actualValue) !== String(targetValue);
    case 'contains': return String(actualValue).includes(String(targetValue));
    case 'is_empty': return !actualValue;
    case 'not_empty': return !!actualValue;
    case 'gt': return parseFloat(actualValue) > parseFloat(targetValue);
    case 'lt': return parseFloat(actualValue) < parseFloat(targetValue);
    default: return true;
  }
}

/**
 * Resolves an element's final display state and text.
 */
export function resolveElementData(el, trialData) {
  // 1. Evaluate Visibility Rules (AC 3, 4, 5)
  if (el.displayRules && el.displayRules.length > 0) {
    const logic = el.rulesLogic || 'AND';
    const results = el.displayRules.map(rule => evaluateRule(rule, trialData));
    
    const isVisible = logic === 'AND' 
      ? results.every(r => r === true)
      : results.some(r => r === true);
    
    if (!isVisible) return { ...el, hidden: true };
  }

  // 2. Resolve Text if it's a dynamic field
  let finalContent = el.text || '';

  // Replace placeholders: {{FIELD_NAME}}
  const regex = /\{\{([\w\d_]+)\}\}/g;
  finalContent = finalContent.replace(regex, (match, key) => {
    let val = trialData[key];
    
    // Fallback if null/empty (AC 7)
    if (val === null || val === undefined || val === '') {
      return el.fallbackValue || '';
    }

    // Apply formatting (AC 6)
    if (el.formatting) {
       val = formatDataValue(val, el.formatting);
    }
    
    return val;
  });

  // 3. Apply Prefix/Suffix (AC 8)
  if (finalContent && !el.isPlaceholderHidden) {
    finalContent = (el.prefix || '') + finalContent + (el.suffix || '');
  }

  return { ...el, resolvedText: finalContent, hidden: false };
}
