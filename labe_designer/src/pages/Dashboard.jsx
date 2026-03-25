import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLabel } from '../context/LabelContext';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
  const { newFile, openFileById, getAllFiles } = useLabel();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const allFiles = getAllFiles().sort((a, b) => b.updatedAt - a.updatedAt);
  
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return allFiles;
    return allFiles.filter(f => (f.fileName || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allFiles, searchQuery]);

  const recentFiles = filteredFiles.slice(0, 10);
  
  const handleNewFile = () => {
    newFile();
    navigate('/editor');
  };

  const handleOpenFile = (id) => {
    openFileById(id);
    navigate('/editor');
  };

  const handleJSONUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      openFileFromJSON(ev.target.result);
      navigate('/editor');
    };
    reader.readAsText(file);
    // Reset input so the same file can be uploaded again if needed
    e.target.value = null;
  };

  let totalExports = 0;
  try { totalExports = parseInt(localStorage.getItem('plabel_total_exports') || '0', 10); } catch {}

  const lastEdited = allFiles.length > 0 ? allFiles[0].fileName || 'Untitled' : 'None';

  return (
    <div className="bg-background text-on-surface min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-[#F8FAFC]/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-black/5 dark:border-white/10 h-16 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <span className="text-xl font-bold tracking-tighter text-blue-900 dark:text-blue-100">Pharma Label Design</span>
        </div>
        
        <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 gap-8 items-center font-inter antialiased tracking-tight text-[15px] font-semibold">
          <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
            Dashboard
          </Link>
          <Link to="/assets" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
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
              placeholder="Search files..."
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
        </div>
      </header>

      <div className="flex pt-16 h-screen overflow-hidden">
        {/* SideNavBar */}
        <aside className={`hidden lg:flex flex-col gap-8 p-6 h-full bg-white dark:bg-slate-950 shrink-0 border-r border-slate-100 overflow-y-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-24' : 'w-72'}`}>
          <nav className="flex flex-col gap-3">
            <Link to="/" className={`flex items-center gap-4 py-4 transition-all duration-300 rounded-[20px] ${sidebarCollapsed ? 'justify-center px-0' : 'px-5 bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-900/50'}`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
              {!sidebarCollapsed && <span className="font-bold text-[15px] tracking-tight">Dashboard</span>}
            </Link>
            <Link to="/assets" className={`flex items-center gap-4 py-4 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 rounded-[20px] ${sidebarCollapsed ? 'justify-center px-0' : 'px-5'}`}>
              <span className="material-symbols-outlined text-2xl">business</span>
              {!sidebarCollapsed && <span className="font-semibold text-[15px] tracking-tight whitespace-nowrap">Template Library</span>}
            </Link>
            <Link to="/history" className={`flex items-center gap-4 py-4 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 rounded-[20px] ${sidebarCollapsed ? 'justify-center px-0' : 'px-5'}`}>
              <span className="material-symbols-outlined text-2xl">history</span>
              {!sidebarCollapsed && <span className="font-semibold text-[15px] tracking-tight">History</span>}
            </Link>
            <Link to="/settings" className={`flex items-center gap-4 py-4 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 rounded-[20px] ${sidebarCollapsed ? 'justify-center px-0' : 'px-5'}`}>
              <span className="material-symbols-outlined text-2xl">settings</span>
              {!sidebarCollapsed && <span className="font-semibold text-[15px] tracking-tight">Settings</span>}
            </Link>
          </nav>
        </aside>

        {/* Main Content Canvas */}
        <main className="flex-1 overflow-y-auto bg-surface p-4 lg:p-6 pb-20">
          {/* Header Section */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface leading-tight">Dashboard</h1>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <button 
              onClick={() => navigate('/history')}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between text-left hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 text-primary mb-4">
                <span className="material-symbols-outlined text-2xl">description</span>
                <span className="text-xs font-bold uppercase tracking-widest">Total Labels</span>
              </div>
              <div>
                <span className="text-4xl font-black">{allFiles.length}</span>
                <span className="block text-sm text-slate-500 mt-1">Files created</span>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/history')}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between text-left hover:border-green-500/50 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 text-green-600 mb-4">
                <span className="material-symbols-outlined text-2xl">download</span>
                <span className="text-xs font-bold uppercase tracking-widest">Total Exports</span>
              </div>
              <div>
                <span className="text-4xl font-black">{totalExports}</span>
                <span className="block text-sm text-slate-500 mt-1">Successful downloads</span>
              </div>
            </button>
            
            <button 
              onClick={() => allFiles[0] && handleOpenFile(allFiles[0].fileId)}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between text-left hover:border-orange-500/50 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 text-orange-500 mb-4">
                <span className="material-symbols-outlined text-2xl">schedule</span>
                <span className="text-xs font-bold uppercase tracking-widest">Last Edited</span>
              </div>
              <div>
                <span className="text-2xl font-bold truncate block" title={lastEdited}>{lastEdited}</span>
                <span className="block text-sm text-slate-500 mt-1">Most recent project</span>
              </div>
            </button>
          </div>

          {/* Quick Actions */}
          <section className="mb-12">
             <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-on-surface">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <button onClick={handleNewFile} className="flex flex-col items-center justify-center gap-3 p-6 bg-blue-50 dark:bg-slate-800/50 hover:bg-blue-100 dark:hover:bg-slate-800 rounded-xl border border-blue-100 dark:border-slate-700 transition-colors group">
                  <span className="material-symbols-outlined text-3xl text-blue-500 group-hover:scale-110 transition-transform">add_box</span>
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Create New Label</span>
               </button>
               <button onClick={() => navigate('/assets')} className="flex flex-col items-center justify-center gap-3 p-6 bg-purple-50 dark:bg-slate-800/50 hover:bg-purple-100 dark:hover:bg-slate-800 rounded-xl border border-purple-100 dark:border-slate-700 transition-colors group">
                  <span className="material-symbols-outlined text-3xl text-purple-500 group-hover:scale-110 transition-transform">auto_awesome_mosaic</span>
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Use Template</span>
               </button>
               <button onClick={() => document.getElementById('json-upload')?.click()} className="flex flex-col items-center justify-center gap-3 p-6 bg-emerald-50 dark:bg-slate-800/50 hover:bg-emerald-100 dark:hover:bg-slate-800 rounded-xl border border-emerald-100 dark:border-slate-700 transition-colors group relative overflow-hidden">
                  <span className="material-symbols-outlined text-3xl text-emerald-500 group-hover:scale-110 transition-transform">upload_file</span>
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Open JSON File</span>
                  <input id="json-upload" type="file" accept=".json" onChange={handleJSONUpload} className="hidden" />
               </button>
            </div>
          </section>



        </main>
      </div>
    </div>
  );
}
