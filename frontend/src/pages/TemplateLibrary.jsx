import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
    <div className="relative group w-72">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/80 group-focus-within:text-primary transition-colors text-[20px]">search</span>
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="input-premium pl-12 pr-4 py-2.5 w-full rounded-full text-[13px] border-outline-variant/30 focus:border-primary/50 transition-all shadow-sm group-hover:shadow-md"
        placeholder="Search medical templates..."
        type="text"
      />
    </div>
  );

  return (
    <AppLayout activePage="assets" searchBar={searchBar}>
      <div className="p-6 lg:p-10 pb-24">

        {/* Hero */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-slide-up">
          <div>
            <p className="text-primary font-bold text-[11px] uppercase tracking-[0.2em] mb-2">Curated Assets</p>
            <h1 className="text-4xl font-extrabold tracking-tighter text-gradient mb-2">Template Library</h1>
            <p className="text-on-surface-variant text-sm max-w-lg">
              Browse medically validated label templates, compliant with international pharma standards.
            </p>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1 border border-outline-variant/20">
            {[
              { mode: 'grid', icon: 'grid_view' },
              { mode: 'list', icon: 'view_list' },
            ].map(({ mode, icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all duration-200 ${
                  viewMode === mode
                    ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-glow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-base"
                  style={{ fontVariationSettings: viewMode === mode ? "'FILL' 1" : "'FILL' 0" }}>
                  {icon}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="sticky top-0 z-10 bg-mesh py-3 -mx-6 px-6 mb-6 animate-slide-up stagger-1" style={{ backdropFilter: 'blur(12px)' }}>
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-primary to-tertiary text-on-primary shadow-glow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-outline-variant/20'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]"
                  style={{ fontVariationSettings: activeCategory === cat ? "'FILL' 1" : "'FILL' 0" }}>
                  {CATEGORY_ICONS[cat]}
                </span>
                {cat === 'All' ? 'All Templates' : cat}
              </button>
            ))}
            <div className="h-5 w-px bg-outline-variant/30 mx-1" />
            <select
              value={activeSize}
              onChange={e => setActiveSize(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/20 rounded-full px-4 py-2 text-xs font-semibold text-on-surface-variant focus:ring-2 focus:ring-primary outline-none"
            >
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

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
        {viewMode === 'grid' && filteredTemplates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template, idx) => (
              <div
                key={template.id}
                className={`group glass-card rounded-2xl overflow-hidden flex flex-col cursor-pointer animate-slide-up stagger-${Math.min(idx+1,10)}`}
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-surface-container-low overflow-hidden relative flex items-center justify-center p-3">
                  <img
                    className="w-full h-full object-cover rounded-xl shadow-card group-hover:scale-105 transition-transform duration-500"
                    alt={template.name}
                    src={template.imageUrl || template.image}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://placehold.co/600x400/2c3e50/white/png?text=${encodeURIComponent(template.name)}`;
                    }}
                  />
                  {/* Compliant badge */}
                  <div className="absolute top-3 right-3 glass rounded-full px-2.5 py-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-[13px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-tight">FDA</span>
                  </div>
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-end p-4">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="btn-gradient text-xs w-full py-2.5"
                    >
                      <span className="material-symbols-outlined text-base">bolt</span>
                      Use Template
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{template.category}</span>
                    <span className="text-[10px] text-on-surface-variant font-medium">v2.0</span>
                  </div>
                  <h3 className="text-base font-bold text-on-surface tracking-tight mb-1">{template.name}</h3>
                  <p className="text-xs text-on-surface-variant">{template.brand}</p>
                  <div className="mt-4 pt-4 flex items-center justify-between border-t border-outline-variant/15">
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold">Label Size</p>
                      <p className="text-xs font-semibold text-on-surface">{template.size}</p>
                    </div>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="btn-ghost text-xs py-1.5 px-3"
                    >
                      Use
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
      />
    </AppLayout>
  );
}
