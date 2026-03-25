import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLabel } from '../context/LabelContext';
import { useTheme } from '../context/ThemeContext';

export default function TemplateLibrary() {
  const { templates, loadTemplate, meta } = useLabel();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSize, setActiveSize] = useState('All Sizes');
  const [viewMode, setViewMode] = useState('grid');
  const [confirmTemplate, setConfirmTemplate] = useState(null);

  const categories = ['All', 'Tablets', 'Syrups', 'Injections', 'Ointments', 'Generic Labels'];
  const sizes = ['All Sizes', '30x60mm', '35x75mm', '40x80mm', '50x100mm', 'Custom Sizes'];

  // Filter logic
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || template.category === activeCategory;
      const matchesSize = activeSize === 'All Sizes' || template.size.includes(activeSize.split('x')[0]); // rough match for demo
      return matchesSearch && matchesCategory && matchesSize;
    });
  }, [templates, searchQuery, activeCategory, activeSize]);

  const handleUseTemplate = (template) => {
    if (meta.fileName) {
      setConfirmTemplate(template);
    } else {
      executeLoad(template);
    }
  };

  const executeLoad = (template) => {
    loadTemplate(template);
    navigate('/editor');
  };

  return (
    <div className="bg-background text-on-surface min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-[#F8FAFC]/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-black/5 dark:border-white/10 h-16 flex items-center justify-between px-8 relative">
        <div className="flex items-center">
          <span className="text-xl font-bold tracking-tighter text-blue-900 dark:text-blue-100">Pharma Label Design</span>
        </div>
        
        <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 gap-8 items-center font-inter antialiased tracking-tight text-[15px] font-semibold">
          <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
            Dashboard
          </Link>
          <Link to="/assets" className="text-blue-700 dark:text-blue-400 border-b-2 border-primary pb-1">
            Template Library
          </Link>
          <Link to="/editor" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
            Label Editor
          </Link>
          <Link to="/translation" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
            Translation
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary w-64 transition-all outline-none"
              placeholder="Search templates..."
              type="text"
            />
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 text-on-surface-variant hover:bg-blue-50/50 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <div className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant">
            <img alt="User profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFpJZbrJ2YQtd7MEMTjf3puH15-aHWbln71bIeOkmBEO90SjfSneviiWG94g6J8d4RmyzBatWhrfBZzRugVKnKrfPrR75pUCgUr6BoAQxy_X_06oT8ChIcCiKGx3QSZiORscP18DJt_JF2NIjXXIH1ffPlWQ30baVlsvnFb3fcdf8yJpzM4cHCqYE2r-LSthNCH3tfe4ZtSyYsV03GTVwGZFZZ0Zi4qVeEkR95Cphq59bldU7Cwj9j0aqfXUhzZhakq6j7NYbjeAtP" />
          </div>
        </div>
      </header>

      <div className="flex pt-16 h-screen overflow-hidden">
        {/* SideNavBar */}
        <aside className="hidden lg:flex flex-col gap-4 p-6 h-full w-64 bg-[#F8FAFC] dark:bg-slate-950 shrink-0 border-r border-outline-variant/10">

          <nav className="flex flex-col gap-2">
            <Link to="/" className="flex items-center gap-3 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:translate-x-1 transition-transform duration-200 rounded-lg">
              <span className="material-symbols-outlined text-xl">dashboard</span>
              <span className="font-inter text-xs uppercase tracking-widest font-semibold">Dashboard</span>
            </Link>
            <Link to="/assets" className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm rounded-lg hover:translate-x-1 transition-transform duration-200">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
              <span className="font-inter text-xs uppercase tracking-widest font-semibold">Assets</span>
            </Link>
            <Link to="/history" className="flex items-center gap-3 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:translate-x-1 transition-transform duration-200 rounded-lg">
              <span className="material-symbols-outlined text-xl">history</span>
              <span className="font-inter text-xs uppercase tracking-widest font-semibold">History</span>
            </Link>
            <Link to="/settings" className="flex items-center gap-3 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:translate-x-1 transition-transform duration-200 rounded-lg">
              <span className="material-symbols-outlined text-xl">settings</span>
              <span className="font-inter text-xs uppercase tracking-widest font-semibold">Settings</span>
            </Link>
          </nav>

        </aside>

        {/* Main Content Canvas */}
        <main className="flex-1 overflow-y-auto bg-surface p-8 lg:p-12">
          {/* Header Section */}
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-primary font-bold text-[0.7rem] uppercase tracking-[0.2em] block mb-2">Curated Assets</span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface leading-tight">Template Library</h1>
              <p className="text-on-surface-variant max-w-lg mt-4 body-md">Browse our medically validated label library. All templates are compliant with international pharmaceutical standards and ready for instant localization.</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-surface-container-lowest p-1 rounded-xl shadow-sm flex items-center">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${viewMode === 'grid' ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${viewMode === 'list' ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  List View
                </button>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="sticky top-0 z-10 bg-surface pb-6 -mx-2 px-2 pt-2">
            <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm transition-all border ${activeCategory === cat
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-primary-fixed hover:text-on-primary-fixed border-transparent hover:border-primary/20'
                    }`}
                >
                  {cat === 'All' ? 'All Templates' : cat}
                </button>
              ))}
              <div className="h-6 w-[1px] bg-outline-variant/30 mx-2"></div>
              <select
                value={activeSize}
                onChange={e => setActiveSize(e.target.value)}
                className="bg-surface-container-lowest border-none rounded-full px-5 py-2.5 text-xs font-semibold text-on-surface-variant focus:ring-primary shadow-sm outline-none"
              >
                {sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Template Layout */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {filteredTemplates.map((template, idx) => (
                <div key={template.id} className="group bg-surface-container-lowest dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-[0px_12px_32px_rgba(25,28,30,0.06)] transition-all duration-300 flex flex-col border border-outline-variant/10">
                  <div className="aspect-[4/3] bg-surface-container-low overflow-hidden relative p-4 flex items-center justify-center">
                    <img className="w-full h-full object-cover rounded shadow-sm group-hover:scale-105 transition-transform duration-500" alt={template.name} src={template.image} />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-outline-variant/20">
                      <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-tight">Compliant</span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{template.category}</span>
                      <span className="text-[10px] text-on-surface-variant font-medium">Standard V2</span>
                    </div>
                    <h3 className="text-lg font-bold text-on-surface tracking-tight mb-4">{template.name}</h3>
                    <div className="mt-auto pt-4 flex items-center justify-between gap-4 border-t border-outline-variant/10">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">Dimensions</span>
                        <span className="text-xs font-medium">{template.size}</span>
                      </div>
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="btn-gradient text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm hover:translate-y-[-1px] active:scale-95 transition-all text-center"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredTemplates.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <span className="material-symbols-outlined text-6xl text-outline-variant/50 mb-4">search_off</span>
                  <h3 className="text-xl font-bold text-on-surface">No templates found</h3>
                  <p className="text-on-surface-variant">Try adjusting your filters or search query.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="group bg-surface-container-lowest dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-[0px_12px_32px_rgba(25,28,30,0.06)] transition-all duration-300 flex flex-col sm:flex-row border border-outline-variant/10">
                  <div className="w-full sm:w-48 h-32 shrink-0 bg-surface-container-low relative p-3 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-outline-variant/10">
                    <img className="w-full h-full object-cover rounded shadow-sm group-hover:scale-105 transition-transform duration-500" alt={template.name} src={template.image} />
                  </div>
                  <div className="p-6 flex flex-1 flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{template.category}</span>
                        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-tight flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          Compliant
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-on-surface tracking-tight leading-tight">{template.name}</h3>
                      <p className="text-xs text-on-surface-variant mt-1.5 font-medium">{template.brand} • <span className="text-slate-400">Dim: {template.size}</span></p>
                    </div>
                    <div>
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="w-full sm:w-auto btn-gradient text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all text-center"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredTemplates.length === 0 && (
                <div className="py-20 text-center">
                  <span className="material-symbols-outlined text-6xl text-outline-variant/50 mb-4">search_off</span>
                  <h3 className="text-xl font-bold text-on-surface">No templates found</h3>
                  <p className="text-on-surface-variant">Try adjusting your filters or search query.</p>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
      {/* Confirmation Modal */}
      {confirmTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 animate-fade-in border border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-amber-500 text-3xl">warning_amber</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">Active Design Detected</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
              You are currently editing <span className="font-extrabold text-blue-600 dark:text-blue-400 underline decoration-blue-500/30 underline-offset-4 tracking-tight">"{meta.fileName}"</span>.
              Using a new template will replace your current design. How would you like to proceed?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => executeLoad(confirmTemplate)}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add_box</span>
                Start New Label with Template
              </button>
              <button
                onClick={() => navigate('/editor')}
                className="w-full bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 py-3.5 rounded-2xl text-sm font-bold border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">edit_note</span>
                Continue Editing "{meta.fileName}"
              </button>
              <button
                onClick={() => setConfirmTemplate(null)}
                className="w-full py-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
