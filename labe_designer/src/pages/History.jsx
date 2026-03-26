import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useLabel, getFileHistory, getLogs, readFile } from '../context/LabelContext';
import AppLayout from '../components/common/AppLayout';
import PreviewModal from '../components/modals/PreviewModal';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

const LOG_STYLE_MAP = {
  'Created new label':    { icon: 'add_circle',     grad: 'from-blue-500 to-blue-700',    bg: 'bg-blue-50 dark:bg-blue-950/40',    text: 'text-blue-600' },
  'Opened file':          { icon: 'folder_open',     grad: 'from-violet-500 to-purple-700', bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600' },
  'Added new element':    { icon: 'add_box',         grad: 'from-emerald-500 to-teal-700', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600' },
  'Deleted element':      { icon: 'delete',          grad: 'from-red-500 to-red-700',      bg: 'bg-red-50 dark:bg-red-950/40',      text: 'text-red-500' },
  'Exported JSON':        { icon: 'download',        grad: 'from-orange-500 to-amber-600', bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-500' },
  'Duplicated file as':   { icon: 'file_copy',       grad: 'from-teal-500 to-cyan-600',   bg: 'bg-teal-50 dark:bg-teal-950/40',    text: 'text-teal-500' },
  'Started from template':{ icon: 'auto_awesome',    grad: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-50 dark:bg-yellow-950/40', text: 'text-yellow-600' },
};
const getLogStyle = (action) => {
  const key = Object.keys(LOG_STYLE_MAP).find(k => action.startsWith(k));
  return key ? LOG_STYLE_MAP[key] : { icon: 'info', grad: 'from-slate-400 to-slate-600', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500' };
};

const TABS = [
  { key: 'files', icon: 'folder', label: 'File Versions' },
  { key: 'activity', icon: 'timeline', label: 'Activity Log' },
];

export default function History() {
  const { getAllFiles, openFileById, setElements } = useLabel();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('files');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileVersions, setFileVersions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [confirmGoToEditor, setConfirmGoToEditor] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const allFiles = getAllFiles().sort((a, b) => b.updatedAt - a.updatedAt);

  useEffect(() => { setLogs(getLogs()); }, []);

  const handleSelectFile = (file) => {
    const data = readFile(file.fileId);
    setSelectedFile(data ? { ...data, ...file } : file);
    setFileVersions(getFileHistory(file.fileId));
  };

  const confirmRestoreAction = () => {
    if (!confirmRestore || !selectedFile) return;
    openFileById(selectedFile.fileId);
    setTimeout(() => setElements(confirmRestore.elements), 100);
    setConfirmRestore(null);
    navigate('/editor');
  };

  return (
    <AppLayout activePage="history">
      <div className="p-6 lg:p-10 pb-24 max-w-6xl mx-auto">

        {/* Hero */}
        <div className="mb-8 animate-slide-up">
          <p className="text-primary font-bold text-[11px] uppercase tracking-[0.2em] mb-2">label version control</p>
          <h1 className="text-4xl font-extrabold tracking-tighter text-gradient mb-2">History</h1>
          <p className="text-on-surface-variant text-sm max-w-lg">
            Browse saved versions and the full activity timeline for your label projects.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 animate-slide-up stagger-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-250 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-primary to-tertiary text-on-primary shadow-glow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: activeTab === tab.key ? "'FILL' 1" : "'FILL' 0" }}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* File Versions Tab */}
        {activeTab === 'files' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up stagger-2">
            {/* File list */}
            <div className="lg:col-span-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Select File</p>
              {allFiles.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
                  <span className="material-symbols-outlined text-outline/50 text-4xl">folder_off</span>
                  <p className="text-sm text-on-surface-variant">No files found.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allFiles.map(file => (
                    <div
                      key={file.fileId}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all group flex items-center gap-3 relative ${
                        selectedFile?.fileId === file.fileId
                          ? 'border-primary/40 bg-primary/6 text-primary shadow-glow-sm'
                          : 'glass-card border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {/* Selection Overlay (Clickable area for selecting file) */}
                      <div 
                        className="absolute inset-0 z-0 cursor-pointer" 
                        onClick={() => handleSelectFile(file)}
                      />

                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative z-10 ${
                        selectedFile?.fileId === file.fileId
                          ? 'bg-primary/10'
                          : 'bg-surface-container-low dark:bg-slate-800'
                      }`}>
                        <span className="material-symbols-outlined text-base text-primary"
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                          draft
                        </span>
                      </div>

                      <div className="overflow-hidden flex-1 relative z-10 pointer-events-none">
                        <p className="text-sm font-semibold text-on-surface truncate">{file.fileName || 'Untitled'}</p>
                        <p className="text-xs text-on-surface-variant">{timeAgo(file.updatedAt)}</p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0 relative z-20">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const data = readFile(file.fileId);
                            if (data) setPreviewData({ elements: data.elements, meta: data.meta, title: data.meta.fileName });
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-600 transition-all shadow-sm border border-slate-100 dark:border-white/10 hover:scale-110"
                          title="Quick Preview"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmGoToEditor(file);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 text-slate-500 hover:text-emerald-500 transition-all shadow-sm border border-slate-100 dark:border-white/10 hover:scale-110"
                          title="Open in Editor"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit_square</span>
                        </button>
                      </div>

                      <span className="material-symbols-outlined text-outline/40 text-base group-hover:text-primary transition-colors shrink-0 relative z-10">
                        chevron_right
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Versions panel */}
            <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3 h-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                {selectedFile ? `Versions — ${selectedFile.fileName || 'Untitled'}` : ''}
              </p>
              {selectedFile && (
                <button 
                  onClick={() => {
                    setSelectedFile(null);
                    setFileVersions([]);
                  }}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                  Close
                </button>
              )}
            </div>
              {!selectedFile && (
                <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-32 gap-4 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-tertiary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary/40 text-4xl">history</span>
                  </div>
                  <p className="text-on-surface-variant text-sm">Select a file to view its version history</p>
                </div>
              )}
              {selectedFile && fileVersions.length === 0 && (
                <div className="glass-card rounded-2xl flex flex-col items-center py-20 gap-3 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline/50">cloud_off</span>
                  <p className="text-sm text-on-surface-variant">No versions recorded for this file yet.</p>
                </div>
              )}
              <div className="space-y-3">
                {fileVersions.map((v, i) => (
                  <div
                    key={v.id}
                    className={`glass-card rounded-xl p-4 flex items-center justify-between gap-4 animate-slide-up stagger-${Math.min(i+1,8)}`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        i === 0
                          ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-base"
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                          save
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface">{v.action}</p>
                        <p className="text-xs text-on-surface-variant">
                          {new Date(v.time).toLocaleString()} · {v.elements?.length ?? 0} elements
                        </p>
                      </div>
                    </div>
                    {i === 0
                      ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setPreviewData({ elements: v.elements, meta: selectedFile.meta, title: `Latest Version - ${selectedFile.fileName}` })}
                            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-all"
                            title="Preview Snapshot"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">Latest</span>
                        </div>
                      )
                      : (
                        <div className="flex items-center gap-2 shrink-0">
                         <button
                            onClick={() => setPreviewData({ elements: v.elements, meta: selectedFile.meta, title: `${v.action} - ${new Date(v.time).toLocaleTimeString()}` })}
                            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-all"
                            title="Preview Snapshot"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={() => setConfirmRestore(v)}
                            className="bg-primary/10 text-primary hover:bg-primary/20 font-bold text-[11px] py-1.5 px-3 rounded-lg transition-all"
                          >
                            Restore
                          </button>
                        </div>
                      )
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <div className="animate-slide-up stagger-2">
            {logs.length === 0 && (
              <div className="glass-card rounded-2xl flex flex-col items-center py-24 gap-4 text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/10 to-tertiary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary/50 text-3xl">format_list_bulleted</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface mb-1">No activity yet</p>
                  <p className="text-sm text-on-surface-variant">Go make something!</p>
                </div>
              </div>
            )}

            {logs.length > 0 && (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute top-5 left-5 bottom-5 w-0.5 bg-gradient-to-b from-primary/30 via-tertiary/20 to-transparent rounded-full z-0" />
                <div className="space-y-4">
                  {logs.map((log, idx) => {
                    const style = getLogStyle(log.action);
                    return (
                      <div key={log.id} className={`relative z-10 flex items-start gap-4 animate-fade-in stagger-${Math.min(idx+1,10)}`}>
                        {/* Node */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                          <span className="material-symbols-outlined text-lg"
                            style={{ fontVariationSettings: "'FILL' 1" }}>
                            {style.icon}
                          </span>
                        </div>
                        {/* Card */}
                        <div className="glass-card rounded-xl px-4 py-3 flex-1 flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-transform duration-200">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-on-surface">{log.action}</p>
                            {log.fileName && (
                              <p className="text-xs text-on-surface-variant truncate">File: {log.fileName}</p>
                            )}
                          </div>
                          <span className="text-[11px] text-on-surface-variant/70 shrink-0 font-medium">{timeAgo(log.time)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Restore Modal */}
      {confirmRestore && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2005] flex items-center justify-center p-8 animate-fade-in">
          <div className="glass-card bg-white dark:bg-slate-800 rounded-3xl shadow-float p-8 max-w-sm w-full animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                published_with_changes
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white">Restore Version?</h3>
            <p className="text-sm text-slate-500 mb-6">
              This will replace the current canvas with the snapshot from{' '}
              <strong>{new Date(confirmRestore.time).toLocaleString()}</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRestore(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestoreAction}
                className="flex-1 py-2.5 rounded-xl btn-gradient text-white text-sm"
              >
                Restore
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Go To Editor Modal */}
      {confirmGoToEditor && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[3000] flex items-center justify-center p-8 animate-fade-in">
          <div className="glass-card bg-white dark:bg-slate-800 rounded-3xl shadow-float p-8 max-w-sm w-full animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                edit_square
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white">Switch to Editor?</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium italic">
              selected one will be moving to active log
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmGoToEditor(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
              >
                Not now
              </button>
              <button
                onClick={() => {
                  openFileById(confirmGoToEditor.fileId);
                  setConfirmGoToEditor(null);
                  navigate('/editor');
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 text-sm font-bold"
              >
                Open Editor
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Preview Modal Popup */}
      {previewData && (
        <PreviewModal 
          isOpen={true} 
          onClose={() => setPreviewData(null)} 
          elements={previewData.elements} 
          meta={previewData.meta || { labelSize: { w:302, h:454 } }}
          title={previewData.title}
        />
      )}
    </AppLayout>
  );
}
