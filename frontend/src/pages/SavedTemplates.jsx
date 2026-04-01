import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLabel } from '../context/LabelContext';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/common/AppLayout';
import PreviewModal from '../components/modals/PreviewModal';

export default function SavedTemplates() {
  const { userFiles, openFileById, deleteUserTemplate, loading, getTemplateById } = useLabel();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
  const [previewFile, setPreviewFile] = useState(null);    // file object
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const filteredFiles = useMemo(() => {
    return userFiles.filter(f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (isAdmin && f.createdByUsername?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [userFiles, searchQuery, isAdmin]);

  const handleOpen = async (id) => {
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const searchBar = (
    <div className="relative group w-72">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/80 group-focus-within:text-primary transition-colors text-[20px]">search</span>
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="input-premium pl-12 pr-4 py-2.5 w-full rounded-full text-[13px] border-outline-variant/30 focus:border-primary/50 transition-all shadow-sm group-hover:shadow-md"
        placeholder={isAdmin ? "Search all system templates..." : "Search your saved labels..."}
        type="text"
      />
    </div>
  );

  return (
    <AppLayout activePage="saved-templates" searchBar={searchBar}>
      <div className="p-6 lg:p-10 pb-24">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-slide-up">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tighter text-gradient mb-2">Labels List</h1>
          </div>
        </div>

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
          <div className="glass-card rounded-2xl py-24 flex flex-col items-center gap-4 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/10 to-tertiary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary/40 text-3xl">folder_open</span>
            </div>
            <div>
              <p className="font-bold text-on-surface mb-1">No saved labels found</p>
              <p className="text-sm text-on-surface-variant">Your created designs will appear here.</p>
            </div>
            <button className="btn-gradient px-6 py-2.5 text-xs mt-2" onClick={() => navigate('/editor')}>
              <span className="material-symbols-outlined text-base">add_box</span>
              Create New Label
            </button>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden shadow-glow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low/50 dark:bg-surface-container-high/20 border-b border-outline-variant/20">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold text-outline dark:text-outline-variant/80 uppercase tracking-widest">label name</th>
                    {isAdmin && <th className="px-6 py-4 text-[11px] font-bold text-outline dark:text-outline-variant/80 uppercase tracking-widest">Ownership</th>}
                    <th className="px-6 py-4 text-[11px] font-bold text-outline dark:text-outline-variant/80 uppercase tracking-widest">Label Size</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-outline dark:text-outline-variant/80 uppercase tracking-widest">Last Modified</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-outline dark:text-outline-variant/80 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file, idx) => (
                    <tr
                      key={file.id}
                      className={`group hover:bg-primary/5 transition-colors border-b border-outline-variant/10 last:border-0 animate-fade-in stagger-${Math.min(idx + 1, 10)}`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/20 items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-xl">description</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface mb-0.5">{file.name}</p>
                            <p className="text-[10px] text-on-surface-variant uppercase font-medium tracking-tight">System Ref: {file.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary/60 dark:text-primary-variant">person</span>
                            <span className="text-xs font-medium text-on-surface dark:text-on-surface-variant">
                              {file.createdByUsername || 'Guest/Anonymous'}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-surface-container-high dark:bg-surface-container-highest/30 text-on-surface-variant dark:text-on-secondary-container rounded-full text-[11px] font-bold">
                          {file.latestVersionDesign?.labelSize ? `${file.latestVersionDesign.labelSize.w} x ${file.latestVersionDesign.labelSize.h} px` : 'Custom'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs text-on-surface-variant dark:text-on-surface-variant/80">{formatDate(file.updatedAt)}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePreviewRequest(file)}
                            className="bg-secondary/10 hover:bg-secondary text-secondary hover:text-on-secondary p-2.5 rounded-xl transition-all active:scale-95 group"
                            title="Quick Preview"
                          >
                            <span className="material-symbols-outlined text-base">visibility</span>
                          </button>
                          <button
                            onClick={() => handleOpen(file.id)}
                            className="bg-primary/10 hover:bg-primary text-primary hover:text-on-primary p-2.5 rounded-xl transition-all active:scale-95 group"
                            title="Open in Designer"
                          >
                            <span className="material-symbols-outlined text-base">edit_document</span>
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(file.id, file.name)}
                            className="p-2.5 rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-all"
                            title="Delete Permanently"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
    </AppLayout>
  );
}

