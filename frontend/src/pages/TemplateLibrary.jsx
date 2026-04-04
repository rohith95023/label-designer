import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLabel } from '../context/LabelContext';
import AppLayout from '../components/common/AppLayout';
import TemplateConflictModal from '../components/modals/TemplateConflictModal';

const CATEGORIES = ['All', 'Tablets', 'Syrups', 'Injections', 'Ointments', 'Generic Labels'];
const SIZES = ['All Sizes', '30x60mm', '35x75mm', '40x80mm', '50x100mm', 'Custom Sizes'];

const CATEGORY_ICONS = {
  'All': 'grid_view', 'Tablets': 'medication', 'Syrups': 'water_drop',
  'Injections': 'vaccines', 'Ointments': 'science', 'Generic Labels': 'label',
};

export default function TemplateLibrary() {
  const { templates, loadTemplate, newFile, meta, elements } = useLabel();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSize, setActiveSize] = useState('All Sizes');
  const [viewMode, setViewMode] = useState('grid');
  const [confirmTemplate, setConfirmTemplate] = useState(null);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
      const matchesSize = activeSize === 'All Sizes' || t.size.includes(activeSize.split('x')[0]);
      return matchesSearch && matchesCategory && matchesSize;
    });
  }, [templates, searchQuery, activeCategory, activeSize]);

  const executeLoad = (template) => { loadTemplate(template); navigate('/editor'); };
  
  const handleUseTemplate = (template) => {
    const isDirty = (elements && elements.length > 0) || (meta.fileName && meta.fileName !== 'Untitled Label') || (meta.fileId && meta.fileId !== 'new');
    
    if (isDirty) {
      setConfirmTemplate(template);
    } else {
      executeLoad(template);
    }
  };

  const searchBar = (
    <div className="relative group w-full max-w-sm mx-auto">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-[18px] text-[var(--color-primary-dark)] opacity-40 group-focus-within:opacity-100 group-focus-within:scale-110 transition-all duration-300">search</span>
      </div>
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="w-full bg-white/80 hover:bg-white/90 focus:bg-white backdrop-blur-sm pl-11 pr-10 py-2 rounded-xl text-[12px] font-bold text-[var(--color-primary-dark)] placeholder:text-[var(--color-primary-dark)] placeholder:opacity-50 border border-white focus:border-[var(--color-primary-dark)]/20 focus:ring-4 focus:ring-[var(--color-primary-dark)]/10 transition-all outline-none shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
        placeholder="Search clinical assets, templates, or files..."
        type="text"
      />
      {searchQuery && (
        <button 
          onClick={() => setSearchQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/20 text-[var(--color-primary-dark)]/40 hover:text-[var(--color-primary-dark)] transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}
    </div>
  );

  return (
    <AppLayout activePage="assets" searchBar={searchBar}>
      <div className="p-6 lg:p-10 pb-24">

        {/* Hero */}
        <motion.div 
          className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <p className="text-[var(--color-primary)] font-black text-[11px] uppercase tracking-[0.3em] mb-2 opacity-60">Curated Assets</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[var(--color-primary-dark)] mb-3">Template Library</h1>
            <p className="text-[var(--color-on-surface-variant)] text-sm max-w-lg font-medium leading-relaxed">
              Browse medically validated label templates, compliant with international pharma standards and clinical guidelines.
            </p>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-[var(--color-surface-container-low)] rounded-xl p-1 border border-[var(--color-secondary)]/10">
            {[
              { mode: 'grid', icon: 'grid_view' },
              { mode: 'list', icon: 'view_list' },
            ].map(({ mode, icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all duration-200 ${
                  viewMode === mode
                    ? 'bg-[var(--color-primary-dark)] text-white shadow-lg'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-primary-mid)]/5'
                }`}
              >
                <span className="material-symbols-outlined text-base"
                  style={{ fontVariationSettings: viewMode === mode ? "'FILL' 1" : "'FILL' 0" }}>
                  {icon}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="sticky top-0 z-10 py-3 -mx-6 px-6 mb-8 border-b border-[var(--color-secondary)]/5 shadow-sm bg-[var(--color-background)]/80" 
          style={{ backdropFilter: 'blur(24px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-[var(--color-primary-dark)] text-white shadow-xl shadow-black/10 scale-105'
                    : 'bg-white/40 text-[var(--color-on-surface-variant)]/60 hover:bg-white hover:text-[var(--color-primary-dark)] border border-[var(--color-secondary)]/10'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: activeCategory === cat ? "'FILL' 1" : "'FILL' 0" }}>
                  {CATEGORY_ICONS[cat]}
                </span>
                {cat === 'All' ? 'All Templates' : cat}
              </button>
            ))}
            <div className="h-6 w-px bg-[var(--color-secondary)]/10 mx-2" />
            <select
              value={activeSize}
              onChange={e => setActiveSize(e.target.value)}
              className="bg-white/40 border border-[var(--color-secondary)]/10 rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-widest text-[var(--color-on-surface-variant)]/60 focus:bg-white focus:text-[var(--color-primary-dark)] outline-none transition-all cursor-pointer"
            >
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </motion.div>

        {/* Empty state */}
        {filteredTemplates.length === 0 && (
          <div className="glass-card rounded-2xl py-24 flex flex-col items-center gap-4 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/10 to-tertiary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary/40 text-3xl">search_off</span>
            </div>
            <div>
              <p className="font-bold text-on-surface mb-1">No templates found</p>
              <p className="text-sm text-on-surface-variant">Try adjusting your filters or search query.</p>
            </div>
          </div>
        )}

        {/* Grid view */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' && filteredTemplates.length > 0 && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredTemplates.map((template, idx) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -8 }}
                  className="group flex flex-col bg-white rounded-[32px] overflow-hidden border border-[var(--color-secondary)]/10 shadow-sm hover:shadow-2xl hover:shadow-[var(--color-primary-dark)]/5 transition-all duration-500"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-[var(--color-primary-light)]/30 overflow-hidden relative flex items-center justify-center p-6">
                    <motion.img
                      className="w-full h-full object-cover rounded-2xl shadow-2xl group-hover:scale-110 transition-transform duration-700 ease-out-expo"
                      alt={template.name}
                      src={template.imageUrl || template.image}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/600x400/38240D/white/png?text=${encodeURIComponent(template.name)}`;
                      }}
                    />
                    {/* Compliant badge */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm border border-black/5">
                      <span className="material-symbols-outlined text-[var(--color-primary)] text-[14px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                      <span className="text-[10px] font-black text-[var(--color-primary-dark)] uppercase tracking-tighter">FDA Standard</span>
                    </div>
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary-dark)]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="bg-white text-[var(--color-primary-dark)] font-black uppercase tracking-widest text-[11px] w-full py-4 rounded-2xl flex items-center justify-center gap-2 shadow-2xl hover:bg-[var(--color-primary)] hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-500"
                      >
                        <span className="material-symbols-outlined text-base">bolt</span>
                        Quick Deploy
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[9px] font-black uppercase tracking-widest rounded-full">{template.category}</span>
                      <span className="text-[10px] text-[var(--color-on-surface-variant)] font-bold opacity-40">v2.4.0</span>
                    </div>
                    <h3 className="text-lg font-black text-[var(--color-primary-dark)] tracking-tight mb-1 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">{template.name}</h3>
                    <p className="text-xs text-[var(--color-on-surface-variant)] font-medium mb-6">{template.brand}</p>
                    
                    <div className="mt-auto pt-5 flex items-center justify-between border-t border-[var(--color-secondary)]/5">
                      <div>
                        <p className="text-[9px] text-[var(--color-on-surface-variant)] uppercase font-black tracking-widest opacity-40 mb-1">Dimensions</p>
                        <p className="text-[12px] font-black text-[var(--color-primary-dark)]">{template.size}</p>
                      </div>
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="w-10 h-10 rounded-full bg-[var(--color-secondary)]/5 flex items-center justify-center text-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] hover:text-white transition-all group/btn"
                      >
                        <span className="material-symbols-outlined text-xl group-hover/btn:translate-x-0.5 transition-transform">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* List view */}
        {viewMode === 'list' && filteredTemplates.length > 0 && (
          <div className="glass-card rounded-2xl overflow-hidden">
            {filteredTemplates.map((template, idx) => (
              <div
                key={template.id}
                className={`group flex items-center gap-4 px-6 py-4 hover:bg-primary/4 transition-all duration-200 animate-fade-in stagger-${Math.min(idx+1,10)} ${
                  idx !== filteredTemplates.length - 1 ? 'border-b border-outline-variant/15' : ''
                }`}
              >
                <div className="w-20 h-14 shrink-0 bg-surface-container-low rounded-xl overflow-hidden">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    alt={template.name} 
                    src={template.imageUrl || template.image} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/100x70/2c3e50/white/png?text=Pharma';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{template.category}</span>
                    <span className="text-[10px] font-bold text-secondary flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      FDA
                    </span>
                  </div>
                  <p className="text-sm font-bold text-on-surface">{template.name}</p>
                  <p className="text-xs text-on-surface-variant">{template.brand} · {template.size}</p>
                </div>
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="btn-gradient text-xs py-2 px-4 shrink-0"
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Conflict Resolution Modal */}
      <TemplateConflictModal
        isOpen={!!confirmTemplate}
        onClose={() => setConfirmTemplate(null)}
        onClearAndLoad={() => {
          if (confirmTemplate) executeLoad(confirmTemplate);
          setConfirmTemplate(null);
        }}
        onCreateNew={async () => {
          if (confirmTemplate) {
            await newFile();
            executeLoad(confirmTemplate);
          }
          setConfirmTemplate(null);
        }}
        canvasName={meta.fileName || 'Untitled Label'}
        title="How would you like to load this template?"
      />
    </AppLayout>
  );
}
