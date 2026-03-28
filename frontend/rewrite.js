const fs = require('fs');
const file = 'd:/PROJECTS/pharma label designer/labe_designer/src/pages/LabelEditor.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/bg-\[#F8FAFC\] dark:bg-slate-900 border-(b|r|l) border-black\/5/g, 'glass border-$1 border-white/20 dark:border-white/10');
content = content.replace(/bg-\[#F8FAFC\] dark:bg-slate-800 border-b border-black\/5/g, 'glass border-b border-white/20 dark:border-white/10');
content = content.replace(/bg-\[#E8EAF0\]/g, 'bg-slate-100 dark:bg-slate-900');
content = content.replace(/bg-\[#E2E8F0\]/g, 'bg-slate-50 dark:bg-slate-950');

// Replace standard cards with glass-cards
content = content.replace(/bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white\/10 shadow-sm/g, 'glass-card group hover:-translate-y-1 transition-all duration-300');

// Replace Modals/Panels with glass-panel + shadow-glow/shadow-float
content = content.replace(/bg-white dark:bg-slate-800 rounded-2xl shadow-xl/g, 'glass-panel rounded-2xl shadow-float');
content = content.replace(/bg-white dark:bg-slate-800 rounded-3xl shadow-2xl/g, 'glass-panel rounded-3xl shadow-glow');

// Buttons
content = content.replace(/bg-blue-600 border-blue-600 text-white/g, 'btn-gradient shadow-glow');
content = content.replace(/bg-primary text-white/g, 'btn-gradient shadow-sm text-white');

// General borders replacement
content = content.replace(/border-black\/5/g, 'border-white/20 dark:border-white/10');

// Additional adjustments from the previous view
content = content.replace(/shadow-3xl/g, 'shadow-2xl shadow-slate-300/50 dark:shadow-black/50 ring-1 ring-white/50 dark:ring-white/10');

fs.writeFileSync(file, content, 'utf8');
console.log('Regex replacements applied successfully');
