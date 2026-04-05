import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLabel } from '../context/LabelContext';
import { useAuth } from '../context/AuthContext';

import PreviewModal from '../components/modals/PreviewModal';
import TemplateConflictModal from '../components/modals/TemplateConflictModal';

export default function SavedTemplates() {
  const { userFiles, openFileById, deleteUserTemplate, loading, getTemplateById, newFile, meta, elements } = useLabel();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
  const [previewFile, setPreviewFile] = useState(null);    // file object
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(null); // { id, name }

  const [sortBy, setSortBy] = useState('modified'); // 'created', 'modified', 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  const isAdmin = user?.role === 'ADMIN';

  const filteredFiles = useMemo(() => {
    let filtered = userFiles.filter(f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (isAdmin && f.createdByUsername?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'created') {
        comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      } else if (sortBy === 'modified') {
        comparison = new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [userFiles, searchQuery, isAdmin, sortBy, sortOrder]);

  const handleOpen = (file) => {
    const isDirty = (elements && elements.length > 0) || (meta.fileName && meta.fileName !== 'Untitled Label') || (meta.fileId && meta.fileId !== 'new');
    if (isDirty) {
      setConfirmOpen(file);
    } else {
      executeOpen(file.id);
    }
  };

  const executeOpen = async (id) => {
    await openFileById(id);
    navigate('/editor');
  };

  const handleDeleteRequest = (id, name) => {
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    await deleteUserTemplate(deleteConfirm.id);
    setIsDeleting(false);
    setDeleteConfirm(null);
  };

  const handlePreviewRequest = async (file) => {
    try {
      const data = await getTemplateById(file.id);
      if (data) setPreviewFile(data);
    } catch (err) {
      console.error('Failed to preview', err);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: 'Unknown', time: '' };
    const d = new Date(dateStr);
    const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return { date, time };
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
        placeholder={isAdmin ? "Search all system templates..." : "Search your saved labels..."}
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
    <>
      <div className="p-6 lg:p-10 pb-24">
        <motion.div 
          className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <p className="text-[var(--color-primary)] font-black text-[11px] uppercase tracking-[0.3em] mb-2 opacity-60">Inventory Management</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[var(--color-primary-dark)] mb-3">Saved Labels</h1>
            <p className="text-[var(--color-on-surface-variant)] text-sm max-w-lg font-medium leading-relaxed">
              Manage and deploy your high-resolution pharmaceutical label designs from your secure repository.
            </p>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <div className="relative flex items-center bg-white/60 backdrop-blur border border-[var(--color-secondary)]/20 rounded-xl px-3 py-2 shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-[var(--color-primary-dark)]/50 mr-2">sort</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-transparent text-[11px] font-black uppercase tracking-wider text-[var(--color-primary-dark)] outline-none cursor-pointer appearance-none pr-4"
              >
                <option value="modified">Last Modified</option>
                <option value="created">Creation Date</option>
                <option value="name">Alphabetical Name</option>
              </select>
            </div>
            
            <button
              onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
              className="w-9 h-9 flex items-center justify-center bg-white/60 backdrop-blur border border-[var(--color-secondary)]/20 rounded-xl hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm group"
              title={`Toggle sort order (Currently ${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
            >
              <span className="material-symbols-outlined text-[18px] text-[var(--color-primary-dark)] group-hover:text-white transition-colors">
                {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
            </button>
          </div>
        </motion.div>

        {loading ? (
          <div className="glass-card rounded-2xl overflow-hidden shadow-glow-sm animate-pulse">
            <div className="h-12 bg-surface-container-low/50 border-b border-outline-variant/10"></div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-6 px-6 py-5 border-b border-outline-variant/10 last:border-0">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-surface-container-high rounded-full"></div>
                  <div className="h-2 w-24 bg-surface-container-high/60 rounded-full"></div>
                </div>
                <div className="h-3 w-20 bg-surface-container-high rounded-full"></div>
                <div className="h-3 w-28 bg-surface-container-high rounded-full"></div>
                <div className="flex gap-2">
                  <div className="w-9 h-9 rounded-xl bg-surface-container-high"></div>
                  <div className="w-9 h-9 rounded-xl bg-surface-container-high"></div>
                  <div className="w-9 h-9 rounded-xl bg-surface-container-high"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <motion.div 
            className="bg-white/40 backdrop-blur-xl border border-[var(--color-secondary)]/10 rounded-[32px] py-32 flex flex-col items-center gap-6 text-center shadow-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 rounded-[28px] bg-[var(--color-primary-light)]/50 flex items-center justify-center text-[var(--color-primary)] shadow-inner">
              <span className="material-symbols-outlined text-4xl">folder_open</span>
            </div>
            <div>
              <p className="text-xl font-black text-[var(--color-primary-dark)] mb-2">Repository Empty</p>
              <p className="text-sm text-[var(--color-on-surface-variant)] font-medium max-w-xs leading-relaxed opacity-60">You haven't saved any labels yet. Your future designs will be stored securely here.</p>
            </div>
            <button 
              className="bg-[var(--color-primary-dark)] text-white font-black uppercase tracking-widest text-[11px] px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-[var(--color-primary)] transition-all shadow-xl shadow-[var(--color-primary-dark)]/10 active:scale-95" 
              onClick={() => navigate('/editor')}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Initialize New Design
            </button>
          </motion.div>
        ) : (
          <motion.div 
            className="bg-white/60 backdrop-blur-xl border border-[var(--color-secondary)]/10 rounded-[32px] overflow-hidden shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--color-primary-dark)]">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-white uppercase tracking-[0.2em]">Clinical Asset Name</th>
                    {isAdmin && <th className="px-8 py-5 text-[10px] font-black text-white uppercase tracking-[0.2em]">Custodian</th>}
                    <th className="px-8 py-5 text-[10px] font-black text-white uppercase tracking-[0.2em]">Label Dimensions</th>
                    <th className="px-8 py-5 text-[10px] font-black text-white uppercase tracking-[0.2em]">Creation Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-white uppercase tracking-[0.2em]">Last Modified</th>
                    <th className="px-8 py-5 text-[10px] font-black text-white uppercase tracking-[0.2em] text-right">Deployment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-secondary)]/5">
                  {filteredFiles.map((file, idx) => (
                    <motion.tr
                      key={file.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 + 0.1 }}
                      className="group hover:bg-[var(--color-primary-light)]/40 transition-all cursor-default"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[18px] bg-[var(--color-primary-dark)] items-center justify-center text-white/10 hidden sm:flex group-hover:text-[var(--color-primary)] group-hover:bg-[var(--color-primary-dark)]/90 transition-all shadow-lg shadow-black/10">
                            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                          </div>
                          <div>
                            <p className="text-[14px] font-black text-[var(--color-primary-dark)] group-hover:text-[var(--color-primary)] transition-colors mb-0.5">{file.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-[var(--color-secondary)]/10 text-[9px] font-black uppercase text-slate-600 rounded">PHMA-{file.id.slice(0, 4)}</span>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">v{file.id.length % 5}.0</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)]/5 flex items-center justify-center text-[var(--color-primary-dark)] text-xs font-black">
                              {(file.createdByUsername || 'G')[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-black text-slate-700">
                              {file.createdByUsername || 'Guest Account'}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-8 py-6">
                        <span className="text-xs font-black text-slate-700">
                          {file.latestVersionDesign?.labelSize ? `${file.latestVersionDesign.labelSize.w} \u00D7 ${file.latestVersionDesign.labelSize.h} px` : 'Custom Adaptive'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <p className="text-[12px] font-black text-slate-800">{formatDateTime(file.createdAt)?.date}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{formatDateTime(file.createdAt)?.time}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <p className="text-[12px] font-black text-slate-800">{formatDateTime(file.updatedAt)?.date}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{formatDateTime(file.updatedAt)?.time}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={() => handlePreviewRequest(file)}
                            className="w-10 h-10 rounded-xl bg-white border border-[var(--color-secondary)]/10 text-[var(--color-primary-dark)] shadow-sm hover:bg-[var(--color-primary-dark)] hover:text-white transition-all transform hover:-translate-y-1 flex items-center justify-center"
                            title="Quick Inspect"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                          <button
                            onClick={() => handleOpen(file)}
                            className="w-10 h-10 rounded-xl bg-[var(--color-primary-dark)] text-white shadow-xl shadow-[var(--color-primary-dark)]/20 hover:bg-[var(--color-primary)] transition-all transform hover:-translate-y-1 flex items-center justify-center"
                            title="Open Editor"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(file.id, file.name)}
                            className="w-10 h-10 rounded-xl bg-white border border-[var(--color-secondary)]/10 text-red-400 hover:bg-red-500 hover:text-white transition-all transform hover:-translate-y-1 flex items-center justify-center"
                            title="Purge Design"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteConfirm(null)}></div>
          <div className="glass-card relative w-full max-w-md p-8 rounded-3xl shadow-2xl border border-outline-variant/30 animate-scale-in">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error border border-error/20">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Confirm Destruction</h3>
                <p className="text-sm text-on-surface-variant px-4">
                  Are you absolutely sure you want to delete <span className="text-on-surface font-bold">"{deleteConfirm.name}"</span>?
                  This will permanently remove the record and all its historical versions from the 21 CFR repository.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full mt-6">
                <button
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-6 py-3 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant font-bold text-xs transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 rounded-2xl bg-error text-on-error font-bold text-xs transition-all shadow-lg shadow-error/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin"></span>
                      Deleting...
                    </>
                  ) : (
                    'Delete Record'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Preview Modal (Aligned with History) */}
      {previewFile && (
        <PreviewModal
          isOpen={true}
          onClose={() => setPreviewFile(null)}
          elements={previewFile.latestVersionDesign?.elementsData}
          meta={{ labelSize: previewFile.latestVersionDesign?.labelSize, bgColor: previewFile.latestVersionDesign?.bgColor, fileName: previewFile.name }}
          title={previewFile.name}
        />
      )}

      {/* Template Conflict Resolution Modal */}
      <TemplateConflictModal
        isOpen={!!confirmOpen}
        onClose={() => setConfirmOpen(null)}
        onClearAndLoad={() => {
          if (confirmOpen) executeOpen(confirmOpen.id);
          setConfirmOpen(null);
        }}
        canvasName={meta.fileName || 'Untitled Label'}
        showCreateNew={false}
        title={`Active label found: ${meta.fileName || 'Untitled Label'}`}
        replaceLabel="Close current label and open this"
        replaceDescription="This will discard any unsaved changes in the current workspace"
      />
    </>
  );
}

