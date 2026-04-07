import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';

import { useToast } from '../../components/common/ToastContext';
import { createPortal } from 'react-dom';
import { resolveUrl } from '../../utils/url';
import ConfirmModal from '../../components/common/ConfirmModal';

const EMPTY_FORM = {
  id: null,
  name: '',
  type: 'LOGO', // LOGO, ICON, PICTO, REGULATORY, QR_SPEC, BARCODE_SPEC
  description: '',
  tags: '',
  activationStatus: 'DRAFT',
};

const OBJECT_TYPES = [
  { value: 'LOGO', label: 'Company Logo' },
  { value: 'ICON', label: 'Interface Icon' },
  { value: 'PICTO', label: 'Pictogram' },
  { value: 'REGULATORY', label: 'Regulatory Symbol' },
  { value: 'QR_SPEC', label: 'QR Specification' },
  { value: 'BARCODE_SPEC', label: 'Barcode Specification' },
];

const Objects = () => {
  const initialized = useRef(false);
  const fileInputRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modals status
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(null); // stores the parent object for history
  const [showReplace, setShowReplace] = useState(null); // stores object to replace
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Custom Confirm State
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { success, error: toastError } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getObjects();
      // Group by parentId to show only "latest/active" in the main list
      setObjects(data);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load objects.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (!initialized.current) {
      fetchData();
      initialized.current = true;
    }
  }, [fetchData]);

  // Scroll Lock
  useEffect(() => {
    if (showModal || showHistory || showReplace || pendingDeleteId) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showModal, showHistory, showReplace, pendingDeleteId]);

  // --- Handlers ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      toastError('File size exceeds 5MB limit.');
      e.target.value = null;
      return;
    }
    setSelectedFile(file);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(EMPTY_FORM);
    setSelectedFile(null);
    setShowModal(true);
  };

  const openEditModal = (obj) => {
    setIsEditing(true);
    setFormData({
      id: obj.id,
      name: obj.name,
      type: obj.type,
      description: obj.description || '',
      tags: obj.tags || '',
      activationStatus: obj.activationStatus
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (isEditing) {
        const updated = await api.updateObject(formData.id, formData);
        setObjects(prev => prev.map(o => o.id === updated.id ? updated : o));
        success(`Metadata for "${formData.name}" updated.`);
      } else {
        if (!selectedFile) {
          toastError('Please select a file to upload.');
          return;
        }
        const uploadData = new FormData();
        uploadData.append('name', formData.name);
        uploadData.append('type', formData.type);
        uploadData.append('description', formData.description);
        uploadData.append('tags', formData.tags);
        uploadData.append('file', selectedFile);

        const created = await api.uploadObject(uploadData);
        setObjects(prev => [...prev, created]);
        success(`Object "${formData.name}" uploaded safely.`);
      }
      setShowModal(false);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to process request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async (id) => {
    setActionLoading(true);
    try {
      await api.activateObjectVersion(id);
      success('Version activated. Previous versions deactivated.');
      fetchData(); // Refresh list to reflect status changes across all versions
      setShowHistory(null);
    } catch (err) {
      toastError('Failed to activate version.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplace = async (e) => {
    e.preventDefault();
    if (!selectedFile || !showReplace) return;
    setActionLoading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', selectedFile);
      const newVer = await api.replaceObject(showReplace.id, uploadData);
      setObjects(prev => [...prev, newVer]);
      success('New version created as DRAFT.');
      setShowReplace(null);
      setSelectedFile(null);
    } catch (err) {
      toastError('Replacement failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVersion = (id) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeleteLoading(true);
    try {
      await api.deleteObject(pendingDeleteId);
      setObjects(prev => prev.filter(o => o.id !== pendingDeleteId));
      success('Version removed.');
      setPendingDeleteId(null);
    } catch (err) {
      toastError('Delete failed.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Filtering & UI Logic ---

  // For the main table, we typically only show the "most relevant" version (Active, or latest Draft if no active)
  const mainList = useMemo(() => {
    // 1. Group by parentId
    const groups = {};
    objects.forEach(o => {
      const pid = o.parentId || o.id;
      if (!groups[pid]) groups[pid] = [];
      groups[pid].push(o);
    });

    // 2. For each group, pick the "representative"
    return Object.values(groups).map(vers => {
      const active = vers.find(v => v.activationStatus === 'ACTIVE');
      if (active) return active;
      // Sort by version desc and pick latest
      return vers.sort((a, b) => (b.version || 0) - (a.version || 0))[0];
    });
  }, [objects]);

  const filtered = mainList.filter(o => {
    const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (o.tags && o.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || o.activationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto h-full flex flex-col gap-6 animate-fade-in font-inter">
        
        {/* Clinical Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <span className="material-symbols-outlined text-[32px]">inventory_2</span>
            </div>
            <div>
              <p className="text-primary font-bold text-[11px] uppercase tracking-[0.2em] mb-1">Central Asset Hub</p>
              <h1 className="text-3xl font-black text-text-primary tracking-tighter">Managed Objects</h1>
            </div>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-[13px] font-bold shadow-md transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Register New Object
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-border shadow-sm">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search by name or regulatory tag..."
              className="w-full pl-12 pr-4 py-2.5 bg-transparent border-none text-[13px] font-medium outline-none text-text-primary placeholder:text-text-muted"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="h-8 w-[1px] bg-border mx-2"></div>
          <div className="flex items-center gap-1.5 p-1 bg-bg-main rounded-xl">
            {['ALL', 'ACTIVE', 'DRAFT', 'INACTIVE'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
                  statusFilter === s 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Grid View */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filtered.map((obj, idx) => (
                <motion.div
                  key={obj.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-white rounded-[24px] border border-border hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden flex flex-col"
                >
                  {/* Preview Area */}
                  <div className="h-44 bg-bg-main relative flex items-center justify-center p-6 border-b border-border-light group-hover:bg-white transition-colors">
                    {obj.fileUrl?.endsWith('.pdf') ? (
                        <div className="flex flex-col items-center gap-2">
                             <span className="material-symbols-outlined text-[48px] text-red-500">picture_as_pdf</span>
                             <span className="text-[10px] font-bold text-text-muted uppercase">Clinical PDF</span>
                        </div>
                    ) : (
                        <img src={resolveUrl(obj.fileUrl)} alt={obj.name} className="max-w-full max-h-full object-contain drop-shadow-md" />
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <div className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5 border shadow-sm ${
                        obj.activationStatus === 'ACTIVE' 
                        ? 'bg-green-50 text-green-700 border-green-100' 
                        : obj.activationStatus === 'DRAFT'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-slate-50 text-slate-700 border-slate-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${obj.activationStatus === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-current'}`} />
                        {obj.activationStatus}
                      </div>
                    </div>
                    
                    {/* Version Tag */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border border-border px-2 py-0.5 rounded-md text-[9px] font-bold text-text-secondary">
                      v{obj.version}
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div>
                      <h3 className="font-bold text-[15px] text-text-primary tracking-tight leading-tight mb-1 truncate">{obj.name}</h3>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-none">{obj.type.replace('_', ' ')}</p>
                        {(obj.labels?.length > 0 || obj.labelName) && (
                          <div className="flex items-center gap-1 bg-blue-50/50 px-2 py-0.5 rounded-md border border-blue-100/50 max-w-[60%] overflow-hidden" title={obj.labels?.map(l => l.name).join(', ') || obj.labelName}>
                            <span className="material-symbols-outlined text-[10px] text-blue-500 shrink-0">label</span>
                            <span className="text-[9px] font-bold text-blue-600 truncate uppercase tracking-tighter">
                              {obj.labels?.map(l => l.name).join(', ') || obj.labelName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {obj.description && (
                      <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">{obj.description}</p>
                    )}

                    {obj.tags && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {obj.tags.split(',').map(tag => (
                          <span key={tag} className="text-[9px] font-bold bg-bg-main text-text-muted px-2 py-0.5 rounded-md border border-border-light">#{tag.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="px-5 py-4 bg-bg-main/50 border-t border-border-light flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowHistory(obj)}
                        className="p-2 bg-white border border-border rounded-lg text-text-secondary hover:text-primary transition-all shadow-sm"
                        title="Version History"
                      >
                        <span className="material-symbols-outlined text-[18px]">history</span>
                      </button>
                      <button 
                        onClick={() => setShowReplace(obj)}
                        className="p-2 bg-white border border-border rounded-lg text-text-secondary hover:text-primary transition-all shadow-sm"
                        title="Upload New Version"
                      >
                        <span className="material-symbols-outlined text-[18px]">published_with_changes</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => openEditModal(obj)}
                        className="p-2 bg-white border border-border rounded-lg text-text-secondary hover:text-primary transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteVersion(obj.id)}
                        className="p-2 bg-white border border-border rounded-lg text-text-secondary hover:text-red-500 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-dashed border-border text-center">
            <div className="w-20 h-20 bg-bg-main rounded-[24px] flex items-center justify-center text-text-muted mb-4 opacity-50">
              <span className="material-symbols-outlined text-[40px]">search_off</span>
            </div>
            <h3 className="text-lg font-bold text-text-primary">No assets found</h3>
            <p className="text-text-secondary text-[13px] max-w-sm mt-1">Refine your search parameters or register a new clinical resource to begin.</p>
          </div>
        )}
      </div>

      {/* --- Modals --- */}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && createPortal(
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8 bg-text-primary/60 backdrop-blur-[6px]" onClick={() => setShowModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-lg w-full max-w-lg max-h-[85vh] overflow-hidden border border-border flex flex-col" 
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-primary p-8 text-white">
                <div className="flex items-center justify-between mb-2">
                   <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black tracking-widest uppercase mb-2">
                      Clinical Resource Setup
                   </div>
                   <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white transition-colors">
                      <span className="material-symbols-outlined">close</span>
                   </button>
                </div>
                <h2 className="text-2xl font-black tracking-tight">{isEditing ? 'Update Object Metadata' : 'Register Managed Object'}</h2>
                <p className="text-white/70 text-[13px] mt-1">Configure global asset properties for high-fidelity clinical labels.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-5 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Primary Identifier</label>
                    <input
                      name="name"
                      required
                      placeholder="e.g., FDA-Pictogram-Danger"
                      className="w-full px-4 py-2.5 bg-bg-main border border-border rounded-xl text-[13px] font-bold outline-none focus:border-primary transition-all"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Object Category</label>
                    <select
                      name="type"
                      className="w-full px-4 py-2.5 bg-bg-main border border-border rounded-xl text-[13px] font-bold outline-none focus:border-primary appearance-none cursor-pointer"
                      value={formData.type}
                      onChange={handleInputChange}
                    >
                      {OBJECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Regulatory Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    placeholder="Describe usage constraints and regulatory context..."
                    className="w-full px-4 py-2.5 bg-bg-main border border-border rounded-xl text-[13px] font-medium outline-none focus:border-primary resize-none"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Metadata Tags (comma separated)</label>
                  <input
                    name="tags"
                    placeholder="safety, warning, fda-compliance, iso-standard"
                    className="w-full px-4 py-2.5 bg-bg-main border border-border rounded-xl text-[13px] font-bold outline-none focus:border-primary"
                    value={formData.tags}
                    onChange={handleInputChange}
                  />
                </div>

                {!isEditing && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Source File (.png, .jpg, .svg, .pdf)</label>
                    <div 
                      onClick={() => fileInputRef.current.click()}
                      className={`cursor-pointer w-full p-8 border-2 border-dashed rounded-2xl flex flex-col items-center gap-2 transition-all ${selectedFile ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-bg-main text-text-muted hover:border-primary/50'}`}
                    >
                      <span className="material-symbols-outlined text-[32px]">{selectedFile ? 'check_circle' : 'clinical_notes'}</span>
                      <span className="text-[11px] font-bold">{selectedFile ? selectedFile.name : 'Select or drop asset file here'}</span>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".png,.jpg,.jpeg,.svg,.pdf" onChange={handleFileChange} />
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 rounded-xl text-[13px] font-bold text-text-secondary bg-bg-main hover:bg-bg-hover transition-colors">Cancel</button>
                  <button 
                    disabled={actionLoading}
                    type="submit" 
                    className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-[13px] font-bold shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {isEditing ? 'Update Asset' : 'Begin Processing'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && createPortal(
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8 bg-text-primary/60 backdrop-blur-[6px]" onClick={() => setShowHistory(null)}>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-border h-[80vh] flex flex-col" 
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-bg-main p-8 border-b border-border flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-black text-text-primary tracking-tight">Version Timeline</h2>
                   <p className="text-[12px] text-text-secondary font-medium mt-1">Audit log and activation control for <span className="text-primary font-bold">{showHistory.name}</span></p>
                </div>
                <button onClick={() => setShowHistory(null)} className="w-10 h-10 rounded-full hover:bg-border/50 flex items-center justify-center transition-colors">
                   <span className="material-symbols-outlined text-text-secondary">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-bg-main/20">
                {/* List versions - we fetch from api or local state */}
                {objects.filter(o => o.parentId === (showHistory.parentId || showHistory.id))
                  .sort((a,b) => b.version - a.version)
                  .map((v, i) => (
                    <div key={v.id} className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${v.activationStatus === 'ACTIVE' ? 'bg-white border-primary shadow-md' : 'bg-white/50 border-border opacity-70'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${v.activationStatus === 'ACTIVE' ? 'bg-primary text-white' : 'bg-border text-text-muted'}`}>
                        <span className="text-[13px] font-black font-mono">V{v.version}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-text-primary">Snapshot {new Date(v.createdAt).toLocaleDateString()}</span>
                            {v.activationStatus === 'ACTIVE' && <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Current Active</span>}
                         </div>
                         <p className="text-[11px] text-text-muted/60 mb-3 truncate">{v.fileUrl}</p>
                         <div className="flex items-center gap-2">
                           {v.activationStatus !== 'ACTIVE' && (
                             <button 
                               onClick={() => handleActivate(v.id)}
                               className="text-[11px] font-bold text-primary hover:underline"
                             >
                               Set as Active
                             </button>
                           )}
                           <button 
                             onClick={() => window.open(resolveUrl(v.fileUrl), '_blank')}
                             className="text-[11px] font-bold text-text-secondary hover:underline"
                           >
                             View File
                           </button>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Modified</p>
                         <p className="text-[11px] font-medium text-text-secondary">{new Date(v.updatedAt || v.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Replace Version Modal */}
      <AnimatePresence>
        {showReplace && createPortal(
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8 bg-text-primary/60 backdrop-blur-[6px]" onClick={() => setShowReplace(null)}>
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center"
               onClick={e => e.stopPropagation()}
            >
               <div className="w-16 h-16 bg-bg-main rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                  <span className="material-symbols-outlined text-[32px]">published_with_changes</span>
               </div>
               <h3 className="text-xl font-black text-text-primary mb-2">New Revision</h3>
               <p className="text-[13px] text-text-secondary mb-6 leading-relaxed">
                  Upload a replacement file for <span className="font-bold text-primary">{showReplace.name}</span>. This will create <span className="font-bold">Version {showReplace.version + 1}</span> as a draft.
               </p>

               <div 
                  onClick={() => fileInputRef.current.click()}
                  className={`cursor-pointer w-full p-10 border-2 border-dashed rounded-2xl flex flex-col items-center gap-2 mb-6 transition-all ${selectedFile ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-bg-main hover:border-primary/50'}`}
                >
                  <span className="material-symbols-outlined text-[32px]">{selectedFile ? 'check_circle' : 'cloud_upload'}</span>
                  <span className="text-[11px] font-bold truncate max-w-full px-4">{selectedFile ? selectedFile.name : 'Select clinical update'}</span>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".png,.jpg,.jpeg,.svg,.pdf" onChange={handleFileChange} />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => { setShowReplace(null); setSelectedFile(null); }} className="flex-1 py-3 text-[13px] font-bold text-text-secondary bg-bg-main rounded-xl">Discard</button>
                  <button 
                    disabled={!selectedFile || actionLoading}
                    onClick={handleReplace}
                    className="flex-1 py-3 bg-primary text-white text-[13px] font-bold rounded-xl shadow-lg shadow-blue-100 disabled:opacity-40"
                  >
                    Commit Revision
                  </button>
                </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Custom Confirm Dialog */}
      <ConfirmModal
        isOpen={!!pendingDeleteId}
        title="Delete Specification?"
        message="By removing this version, reference data for labels using this specific asset index may become unlinked or display errors in legacy documents."
        confirmText="Confirm Deletion"
        cancelText="Retain Version"
        type="danger"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

    </>
  );
};

export default Objects;
