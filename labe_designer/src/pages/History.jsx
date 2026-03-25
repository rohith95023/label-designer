import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLabel } from '../context/LabelContext';
import { useTheme } from '../context/ThemeContext';
import { getFileHistory, getLogs } from '../context/LabelContext';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function History() {
  const { getAllFiles, openFileById, setElements, meta } = useLabel();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('files');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileVersions, setFileVersions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const allFiles = getAllFiles().sort((a, b) => b.updatedAt - a.updatedAt);

  useEffect(() => {
    setLogs(getLogs());
  }, []);

  const handleSelectFile = (file) => {
    setSelectedFile(file);
    setFileVersions(getFileHistory(file.fileId));
  };

  const handleRestore = (version) => {
    setConfirmRestore(version);
  };

  const confirmRestoreAction = () => {
    if (!confirmRestore || !selectedFile) return;
    openFileById(selectedFile.fileId);
    // We overwrite elements with the restored snapshot
    setTimeout(() => {
      setElements(confirmRestore.elements);
    }, 100);
    setConfirmRestore(null);
    navigate('/editor');
  };

  const logIconMap = {
    'Created new label': { icon: 'add_circle', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
    'Opened file': { icon: 'folder_open', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30' },
    'Added new element': { icon: 'add_box', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
    'Deleted element': { icon: 'delete', color: 'text-red-500 bg-red-50 dark:bg-red-900/30' },
    'Exported JSON': { icon: 'download', color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30' },
    'Duplicated file as': { icon: 'file_copy', color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/30' },
    'Started from template': { icon: 'auto_awesome', color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30' },
  };
  const getLogStyle = (action) => {
    const key = Object.keys(logIconMap).find(k => action.startsWith(k));
    return key ? logIconMap[key] : { icon: 'info', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
  };

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
          <button onClick={toggleTheme} className="p-2 text-on-surface-variant hover:bg-blue-50/50 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95">
            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </header>

      <div className="flex pt-16 h-screen overflow-hidden">
        {/* SideNavBar */}
        <aside className={`hidden lg:flex flex-col gap-8 p-6 h-full bg-white dark:bg-slate-950 shrink-0 border-r border-slate-100 overflow-y-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-24' : 'w-72'}`}>
          <nav className="flex flex-col gap-3">
            <Link to="/" className={`flex items-center gap-4 py-4 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 rounded-[20px] ${sidebarCollapsed ? 'justify-center px-0' : 'px-5'}`}>
              <span className="material-symbols-outlined text-2xl">grid_view</span>
              {!sidebarCollapsed && <span className="font-semibold text-[15px] tracking-tight">Dashboard</span>}
            </Link>
            <Link to="/assets" className={`flex items-center gap-4 py-4 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 rounded-[20px] ${sidebarCollapsed ? 'justify-center px-0' : 'px-5'}`}>
              <span className="material-symbols-outlined text-2xl">business</span>
              {!sidebarCollapsed && <span className="font-semibold text-[15px] tracking-tight">Template Library</span>}
            </Link>
            <Link to="/history" className={`flex items-center gap-4 py-4 transition-all duration-300 rounded-[20px] ${sidebarCollapsed ? 'justify-center px-0' : 'px-5 bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-900/50'}`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
              {!sidebarCollapsed && <span className="font-bold text-[15px] tracking-tight">History</span>}
            </Link>
            <Link to="/settings" className={`flex items-center gap-4 py-4 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 rounded-[20px] ${sidebarCollapsed ? 'justify-center px-0' : 'px-5'}`}>
              <span className="material-symbols-outlined text-2xl">settings</span>
              {!sidebarCollapsed && <span className="font-semibold text-[15px] tracking-tight">Settings</span>}
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-surface p-8 lg:p-12">
          <div className="mb-10">
            <span className="text-primary font-bold text-[0.7rem] uppercase tracking-[0.2em] block mb-2">Version Control</span>
            <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface">History</h1>
            <p className="text-on-surface-variant max-w-lg mt-3 text-sm">Browse saved versions and the full activity timeline for your label projects.</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-8">
            {['files', 'activity'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-t-lg transition-colors ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-primary border border-b-0 border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-primary'}`}
              >
                {tab === 'files' ? '📂 File Versions' : '📋 Activity Log'}
              </button>
            ))}
          </div>

          {/* File Versions Tab */}
          {activeTab === 'files' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* File List */}
              <div className="lg:col-span-1">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Select File</h2>
                <div className="space-y-2">
                  {allFiles.length === 0 && (
                    <p className="text-sm text-slate-400 py-8 text-center">No files found.</p>
                  )}
                  {allFiles.map(file => (
                    <button
                      key={file.fileId}
                      onClick={() => handleSelectFile(file)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${selectedFile?.fileId === file.fileId ? 'bg-blue-50 dark:bg-blue-900/30 border-primary/40 text-primary' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300'}`}
                    >
                      <span className="material-symbols-outlined text-lg">draft</span>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate">{file.fileName || 'Untitled'}</p>
                        <p className="text-xs text-slate-400">{timeAgo(file.updatedAt)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Versions Panel */}
              <div className="lg:col-span-2">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 h-5">
                  {selectedFile ? `Versions — ${selectedFile.fileName || 'Untitled'}` : ''}
                </h2>
                {!selectedFile && (
                  <div className="flex flex-col items-center justify-center py-32 text-slate-200 dark:text-slate-800 transition-all">
                    <span className="material-symbols-outlined text-8xl">history</span>
                  </div>
                )}
                {selectedFile && fileVersions.length === 0 && (
                  <div className="flex flex-col items-center py-20 text-slate-400">
                    <span className="material-symbols-outlined text-5xl mb-3">cloud_off</span>
                    <p className="text-sm">No versions recorded for this file yet.</p>
                  </div>
                )}
                <div className="space-y-3">
                  {fileVersions.map((v, i) => (
                    <div key={v.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                          <span className="material-symbols-outlined text-lg">save</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{v.action}</p>
                          <p className="text-xs text-slate-400">{new Date(v.time).toLocaleString()} · {v.elements?.length ?? 0} elements</p>
                        </div>
                      </div>
                      {i !== 0 && (
                        <button
                          onClick={() => handleRestore(v)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-primary/50 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shrink-0"
                        >
                          Restore
                        </button>
                      )}
                      {i === 0 && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full shrink-0">Latest</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Activity Log Tab */}
          {activeTab === 'activity' && (
            <div>
              {logs.length === 0 && (
                <div className="flex flex-col items-center py-20 text-slate-400">
                  <span className="material-symbols-outlined text-5xl mb-3">format_list_bulleted</span>
                  <p className="text-sm">No activity logged yet. Go make something!</p>
                </div>
              )}
              <div className="relative">
                {logs.length > 0 && <div className="absolute top-0 left-[22px] h-full w-px bg-slate-200 dark:bg-slate-700 z-0" />}
                <div className="space-y-4">
                  {logs.map(log => {
                    const style = getLogStyle(log.action);
                    return (
                      <div key={log.id} className="relative z-10 flex items-start gap-4">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${style.color}`}>
                          <span className="material-symbols-outlined text-lg">{style.icon}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 px-4 py-3 flex-1 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold">{log.action}</p>
                            {log.fileName && <p className="text-xs text-slate-400 truncate">File: {log.fileName}</p>}
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(log.time)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirm Restore Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Restore Version?</h3>
            <p className="text-sm text-slate-500 mb-6">This will replace the current canvas with the snapshot from <strong>{new Date(confirmRestore.time).toLocaleString()}</strong>. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRestore(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
              <button onClick={confirmRestoreAction} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">Restore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
