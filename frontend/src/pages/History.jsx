// Repaired History page with correct context imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useLabel } from '../context/LabelContext';
import AppLayout from '../components/common/AppLayout';
import PreviewModal from '../components/modals/PreviewModal';
import VersionComparisonModal from '../components/modals/VersionComparisonModal';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

const LOG_STYLE_MAP = {
  'Created new label':    { icon: 'add_circle',     grad: 'from-blue-500 to-blue-700',    bg: 'bg-blue-50',    text: 'text-blue-600' },
  'Opened file':          { icon: 'folder_open',     grad: 'from-violet-500 to-purple-700', bg: 'bg-violet-50', text: 'text-violet-600' },
  'Added new element':    { icon: 'add_box',         grad: 'from-emerald-500 to-teal-700', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  'Deleted element':      { icon: 'delete',          grad: 'from-red-500 to-red-700',      bg: 'bg-red-50',      text: 'text-red-500' },
  'Exported JSON':        { icon: 'download',        grad: 'from-orange-500 to-amber-600', bg: 'bg-orange-50', text: 'text-orange-500' },
  'Duplicated file as':   { icon: 'file_copy',       grad: 'from-teal-500 to-cyan-600',   bg: 'bg-teal-50',    text: 'text-teal-500' },
  'Started from template':{ icon: 'auto_awesome',    grad: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-50', text: 'text-yellow-600' },
};
const getLogStyle = (action) => {
  const key = Object.keys(LOG_STYLE_MAP).find(k => action.startsWith(k));
  return key ? LOG_STYLE_MAP[key] : { icon: 'info', grad: 'from-slate-400 to-slate-600', bg: 'bg-slate-100', text: 'text-slate-500' };
};

const TABS = [
  { key: 'files', icon: 'folder', label: 'File Versions' },
  { key: 'activity', icon: 'timeline', label: 'Activity Log' },
];

export default function History() {
  const { getAllFiles, openFileById, setElements, activityLogs, getTemplateHistory, getTemplateById, restoreVersion } = useLabel();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('files');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileVersions, setFileVersions] = useState([]);
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [confirmGoToEditor, setConfirmGoToEditor] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [compareSelection, setCompareSelection] = useState([]); // Array of version objects
  const [showCompareModal, setShowCompareModal] = useState(false);

  const allFiles = getAllFiles().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const handleSelectFile = async (file) => {
    setSelectedFile(file);
    setCompareSelection([]);
    const history = await getTemplateHistory(file.id);
    setFileVersions(history);
  };

  const confirmRestoreAction = async () => {
    if (!confirmRestore || !selectedFile) return;
    const success = await restoreVersion(selectedFile, confirmRestore);
    if (success) {
      setConfirmRestore(null);
      navigate('/editor');
    }
  };

  return (
    <div className="p-6 lg:p-10 pb-24 max-w-6xl mx-auto">

        {/* Hero */}
        <div className="mb-8 animate-slide-up">
          <p className="text-primary font-bold text-[11px] uppercase tracking-[0.2em] mb-2">label version control</p>
          <h1 className="text-4xl font-extrabold tracking-tighter text-primary-dark mb-2">History</h1>
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
                  ? 'bg-primary text-on-primary shadow-glow-sm'
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
                      key={file.id}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all group flex items-center gap-3 relative ${
                        selectedFile?.id === file.id
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
                        selectedFile?.id === file.id
                          ? 'bg-primary/10'
                          : 'bg-surface-container-low'
                      }`}>
                        <span className="material-symbols-outlined text-base text-primary"
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                          draft
                        </span>
                      </div>

                      <div className="overflow-hidden flex-1 relative z-10 pointer-events-none">
                        <p className="text-sm font-semibold text-on-surface truncate">{file.name || 'Untitled'}</p>
                        <p className="text-xs text-on-surface-variant">{timeAgo(new Date(file.updatedAt).getTime())}</p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0 relative z-20">
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            const data = await getTemplateById(file.id);
                            if (data) setPreviewData({ elements: data.elementsData, meta: { labelSize: data.labelSize, fileName: data.name }, title: data.name });
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-slate-500 hover:text-blue-600 transition-all shadow-sm border border-slate-100 hover:scale-110"
                          title="Quick Preview"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmGoToEditor(file);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-slate-500 hover:text-emerald-500 transition-all shadow-sm border border-slate-100 hover:scale-110"
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
                {selectedFile ? `Versions — ${selectedFile.name || 'Untitled'}` : ''}
              </p>
              {selectedFile && (
                <div className="flex items-center gap-4">
                  {compareSelection.length === 2 && (
                    <button 
                      onClick={() => setShowCompareModal(true)}
                      className="flex items-center gap-2 px-4 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-glow-sm hover:bg-indigo-700 transition-all animate-fade-in"
                    >
                      <span className="material-symbols-outlined text-[16px]">difference</span>
                      Compare Selected
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedFile(null);
                      setFileVersions([]);
                      setCompareSelection([]);
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    Close
                  </button>
                </div>
              )}
            </div>
              {!selectedFile && (
                <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-32 gap-4 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
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
                      <div className="flex items-center px-1">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary"
                          checked={compareSelection.some(s => s.id === v.id)}
                          onChange={() => {
                            setCompareSelection(prev => {
                              const isSelected = prev.some(s => s.id === v.id);
                              if (isSelected) return prev.filter(s => s.id !== v.id);
                              if (prev.length >= 2) return [prev[1], v];
                              return [...prev, v];
                            });
                          }}
                        />
                      </div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        i === 0
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-base"
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                          {i === 0 ? 'stars' : 'history'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface">
                          {v.versionNo ? `Version ${v.versionNo}` : (v.action || 'Manual Snapshot')}
                        </p>
                        <p className="text-[10px] opacity-60 font-medium text-on-surface-variant italic truncate max-w-[200px]">
                          {v.notes || 'No change description provided'}
                        </p>
                        <p className="text-[10px] text-on-surface-variant font-bold mt-0.5">
                          {new Date(v.createdAt).toLocaleString()} · {v.elementsData?.length ?? 0} elements
                        </p>
                      </div>
                    </div>
                    {i === 0
                      ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setPreviewData({ elements: v.elementsData, meta: { labelSize: selectedFile.labelSize, fileName: selectedFile.name }, title: `Latest Version - ${selectedFile.name}` })}
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
                            onClick={() => setPreviewData({ elements: v.elementsData, meta: { labelSize: selectedFile.labelSize, fileName: selectedFile.name }, title: `${v.versionNo ? 'V'+v.versionNo : 'Snapshot'} - ${new Date(v.createdAt).toLocaleTimeString()}` })}
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
            {activityLogs.length === 0 && (
              <div className="glass-card rounded-2xl flex flex-col items-center py-24 gap-4 text-center">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary/50 text-3xl">format_list_bulleted</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface mb-1">No activity yet</p>
                  <p className="text-sm text-on-surface-variant">Go make something!</p>
                </div>
              </div>
            )}

            {activityLogs.length > 0 && (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute top-5 left-5 bottom-5 w-0.5 bg-primary/20 rounded-full z-0" />
                <div className="space-y-4">
                  {activityLogs.map((log, idx) => {
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
                          <span className="text-[11px] text-on-surface-variant/70 shrink-0 font-medium">{timeAgo(new Date(log.time).getTime())}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Confirm Restore Modal */}
      {confirmRestore && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2005] flex items-center justify-center p-8 animate-fade-in">
          <div className="glass-card bg-white rounded-3xl shadow-float p-8 max-w-sm w-full animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                published_with_changes
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-800">Restore Version?</h3>
            <p className="text-sm text-slate-500 mb-6">
              This will replace the current canvas with the snapshot from{' '}
              <strong>{new Date(confirmRestore.createdAt).toLocaleString()}</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRestore(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestoreAction}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-glow-sm"
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
          <div className="glass-card bg-white rounded-3xl shadow-float p-8 max-w-sm w-full animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                edit_square
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-800">Switch to Editor?</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium italic">
              selected one will be moving to active log
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmGoToEditor(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Not now
              </button>
              <button
                onClick={() => {
                  openFileById(confirmGoToEditor.id);
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
      <VersionComparisonModal 
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        versionA={compareSelection[0]}
        versionB={compareSelection[1]}
      />
    </div>
  );
}
