import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import AppLayout from '../../components/common/AppLayout';
import { useToast } from '../../components/common/ToastContext';
import './LabelStocks.css';

const EMPTY_FORM = {
  id: null,
  name: '',
  code: '',
  parentLanguageId: null,
  countryCode: '',
  regionName: '',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm',
  currencySymbol: '$',
  isDefaultVariant: false,
  direction: 'LTR',
  status: 'ACTIVE',
};

const Languages = () => {
  const initialized = useRef(false);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBase, setExpandedBase] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE

  const { success, error: toastError } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getLanguages();
      setLanguages(data);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load languages.');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (lang) => {
    setIsEditing(true);
    setFormData(lang);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      // Ensure empty strings are handled as null for the backend UUID field
      const cleanData = {
        ...formData,
        parentLanguageId: formData.parentLanguageId === '' ? null : formData.parentLanguageId
      };

      if (isEditing) {
        const updated = await api.updateLanguage(formData.id, cleanData);
        setLanguages(prev => prev.map(l => l.id === updated.id ? updated : l));
        success(`Language "${formData.name}" updated.`);
      } else {
        const created = await api.createLanguage(cleanData);
        setLanguages(prev => [...prev, created]);
        success(`Language "${formData.name}" created.`);
      }
      closeModal();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save language.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this language?')) return;
    setActionLoading(true);
    try {
      await api.deleteLanguage(id);
      setLanguages(prev => prev.filter(l => l.id !== id));
      success('Language deleted.');
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete language.');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBaseGroup = (id) => {
    setExpandedBase(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const matchesFilter = (l) => {
    const s = searchQuery.toLowerCase();
    const searchMatch = l.name.toLowerCase().includes(s) || l.code.toLowerCase().includes(s);
    const statusMatch = statusFilter === 'ALL' || l.status === statusFilter;
    return searchMatch && statusMatch;
  };

  // Find all base languages and their matching variants
  const baseLanguages = languages.filter(l => !l.parentLanguageId);
  
  // Group and process for display
  const displayData = baseLanguages.map(base => {
    const rawVariants = languages.filter(l => l.parentLanguageId === base.id);
    const matchingVariants = rawVariants.filter(matchesFilter);
    const baseMatches = matchesFilter(base);
    
    // Only show the base if it matches OR if any of its children match
    if (baseMatches || matchingVariants.length > 0) {
      return { ...base, variants: rawVariants, matchingVariants };
    }
    return null;
  }).filter(Boolean);

  return (
    <AppLayout activePage="masters">
      <div className="um-container animate-fade-in">
        <motion.div 
          className="um-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="um-header-left">
            <div className="um-header-icon shadow-xl">
              <span className="material-symbols-outlined text-[28px] !text-white">translate</span>
            </div>
            <div>
              <p className="text-[var(--color-primary)] font-black text-[10px] uppercase tracking-[0.3em] mb-1 opacity-60">Global Localization Master</p>
              <h1 className="text-3xl font-black text-[var(--color-primary-dark)] tracking-tighter">Languages</h1>
            </div>
          </div>
          <button className="um-add-btn group" onClick={openAddModal}>
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add_circle</span>
            Add Language
          </button>
        </motion.div>

        <motion.div 
          className="um-filter-bar bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-[var(--color-primary-dark)]/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="um-search-wrap">
            <span className="um-search-icon material-symbols-outlined opacity-40">search</span>
            <input
              type="text"
              className="um-search-input bg-white border-none shadow-sm font-bold text-[var(--color-primary-dark)] placeholder:text-[var(--color-primary-dark)]/30"
              placeholder="Search by language name, ISO code, or territorial reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 p-1 bg-white/50 rounded-xl">
            {['ALL', 'ACTIVE', 'INACTIVE'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === s ? 'bg-[var(--color-primary-dark)] text-white shadow-lg shadow-[var(--color-primary-dark)]/20' : 'text-[var(--color-primary-dark)]/40 hover:bg-[var(--color-primary-dark)]/5'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="um-table-card overflow-visible">
          {loading ? (
            <div className="um-loading-state"><div className="um-spinner" /></div>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Language & Country</th>
                  <th>Code</th>
                  <th>Locale Defaults</th>
                  <th>Direction</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayData.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-10 text-outline">No languages found matching your criteria.</td></tr>
                )}
                {displayData.map(base => {
                  const variants = base.variants || [];
                  const isExpanded = expandedBase.has(base.id);
                  const isBaseActive = base.status === 'ACTIVE';
                  
                  return (
                    <React.Fragment key={base.id}>
                    <motion.tr 
                      key={base.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 + 0.3 }}
                      className={`um-row ${isExpanded ? 'bg-[var(--color-primary-light)]/20 shadow-inner' : ''} ${!isBaseActive ? 'opacity-40' : ''}`}
                    >
                      <td className="text-center">
                        {variants.length > 0 && (
                          <button
                            onClick={() => toggleBaseGroup(base.id)}
                            className={`p-2 rounded-xl hover:bg-[var(--color-primary-dark)]/5 transition-all ${isExpanded ? 'rotate-90 bg-[var(--color-primary-dark)]/10 text-[var(--color-primary-dark)]' : 'text-[var(--color-primary-dark)]/30'}`}
                          >
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                          </button>
                        )}
                      </td>
                      <td className="font-black">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-dark)] text-white shadow-lg flex items-center justify-center">
                             <span className="material-symbols-outlined text-[20px]">language</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[var(--color-primary-dark)] text-[14px]">{base.name}</span>
                             {variants.length > 0 && <span className="text-[9px] font-black uppercase text-[var(--color-primary)] opacity-60 tracking-widest">{variants.length} regional variants</span>}
                           </div>
                        </div>
                      </td>
                      <td><code className="text-[var(--color-primary-dark)] font-black px-3 py-1 bg-[var(--color-primary-light)]/40 rounded-lg font-mono text-[11px] tracking-widest">{base.code}</code></td>
                      <td className="text-[11px] font-bold text-[var(--color-primary-dark)]/40 uppercase tracking-tighter">{base.dateFormat} • {base.currencySymbol}</td>
                      <td>
                        <span className="text-[9px] bg-white border border-[var(--color-primary-dark)]/10 text-[var(--color-primary-dark)] px-3 py-1 rounded-full font-black tracking-widest uppercase">
                          {base.direction}
                        </span>
                      </td>
                      <td>
                        <div className={`status-badge status-${base.status?.toLowerCase()} !text-[9px] font-black tracking-widest flex items-center gap-2`}>
                          <span className={`status-dot !w-2 !h-2 rounded-full ${base.status === 'ACTIVE' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'} animate-pulse`} />
                          {base.status}
                        </div>
                      </td>
                      <td>
                        <div className="um-actions" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            className="um-action-btn hover:!bg-[var(--color-primary-dark)] hover:!text-white transition-all shadow-sm" 
                            title="Add Regional Deployment" 
                            onClick={() => { openAddModal(); setFormData(prev => ({ ...prev, parentLanguageId: base.id, direction: base.direction, name: `${base.name}-` })); }}
                          >
                            <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
                          </button>
                          <button className="um-action-btn hover:!bg-[var(--color-primary-dark)] hover:!text-white transition-all shadow-sm" onClick={() => openEditModal(base)}>
                            <span className="material-symbols-outlined text-[18px]">edit_note</span>
                          </button>
                          <button className="um-action-btn hover:!bg-[var(--color-error)] hover:!text-white transition-all shadow-sm um-action-delete" onClick={() => handleDelete(base.id)}>
                            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                      <AnimatePresence>
                        {isExpanded && variants.map((v, vIdx) => (
                          <motion.tr 
                            key={v.id} 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ delay: vIdx * 0.03 }}
                            className="bg-[var(--color-primary-light)]/10 border-l-[3px] border-[var(--color-primary-dark)]"
                          >
                            <td />
                            <td className="pl-12 py-3">
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[16px] text-[var(--color-primary-dark)]/30">subdirectory_arrow_right</span>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-[var(--color-primary-dark)] text-[13px]">{v.name}</span>
                                    {v.isDefaultVariant && <span className="bg-[var(--color-warning)] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest shadow-sm">MASTER</span>}
                                  </div>
                                  {v.regionName && <span className="text-[10px] text-[var(--color-primary)] font-black uppercase tracking-widest opacity-40 italic">{v.regionName}</span>}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <code className="text-[var(--color-primary-dark)] font-black px-2 py-0.5 bg-white rounded-md font-mono text-[10px] tracking-widest shadow-sm">{v.code}</code>
                                {v.countryCode && <code className="text-white font-black px-2 py-0.5 bg-[var(--color-primary-dark)]/60 rounded-md font-mono text-[10px] tracking-widest">{v.countryCode}</code>}
                              </div>
                            </td>
                            <td className="text-[10px] font-black text-[var(--color-primary-dark)]/40 uppercase tracking-widest">{v.dateFormat} • {v.timeFormat} • {v.currencySymbol}</td>
                            <td>
                              <span className="text-[9px] font-black text-[var(--color-primary-dark)]/40 uppercase tracking-widest">{v.direction}</span>
                            </td>
                            <td>
                              <span className={`status-badge status-${v.status?.toLowerCase() || 'active'} !text-[8px] font-black tracking-widest scale-90`}>
                                {v.status || 'ACTIVE'}
                              </span>
                            </td>
                            <td>
                              <div className="um-actions" style={{ justifyContent: 'flex-end' }}>
                                <button className="um-action-btn hover:!bg-[var(--color-primary-dark)] hover:!text-white transition-all scale-90" onClick={() => openEditModal(v)}>
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button className="um-action-btn um-action-delete hover:!bg-[var(--color-error)] hover:!text-white transition-all scale-90" onClick={() => handleDelete(v.id)}>
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay !bg-[var(--color-primary-dark)]/80 backdrop-blur-sm" onClick={closeModal}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="modal-content !bg-[var(--color-background)] !rounded-[40px] shadow-[0_32px_120px_rgba(56,36,13,0.3)] border border-white/40" 
              style={{ width: '600px' }} 
              onClick={e => e.stopPropagation()}
            >
              <div className="um-modal-header !p-10 !border-none !bg-transparent">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-[24px] bg-[var(--color-primary-dark)] flex items-center justify-center text-white shadow-2xl">
                      <span className="material-symbols-outlined text-[32px]">{isEditing ? 'language_us_featured' : 'language'}</span>
                   </div>
                   <div>
                     <p className="text-[var(--color-primary)] font-black text-[11px] uppercase tracking-[0.4em] mb-1 opacity-60">Localization Configuration</p>
                     <h2 className="text-3xl font-black text-[var(--color-primary-dark)] tracking-tighter">{isEditing ? 'Refine Locale Identity' : 'Initialize New Locale'}</h2>
                   </div>
                </div>
                <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--color-primary-dark)]/30 hover:bg-[var(--color-primary-dark)]/5 hover:text-[var(--color-primary-dark)] transition-all" onClick={closeModal}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Language Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g., English-US" />
                  </div>
                  <div className="form-group">
                    <label>ISO Language Code (2-char) *</label>
                    <input type="text" name="code" value={formData.code} onChange={handleInputChange} required placeholder="e.g., en" maxLength={2} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Parent Language (Base)</label>
                    <select name="parentLanguageId" value={formData.parentLanguageId || ''} onChange={handleInputChange}>
                      <option value="">-- No Parent (This is a Base Language) --</option>
                      {languages.filter(l => !l.parentLanguageId && l.id !== formData.id).map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ISO Country Code (2-char)</label>
                    <input type="text" name="countryCode" value={formData.countryCode || ''} onChange={handleInputChange} placeholder="e.g., US" maxLength={2} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="form-group">
                    <label>Date Format</label>
                    <input type="text" name="dateFormat" value={formData.dateFormat} onChange={handleInputChange} placeholder="dd/MM/yyyy" />
                  </div>
                  <div className="form-group">
                    <label>Time Format</label>
                    <input type="text" name="timeFormat" value={formData.timeFormat} onChange={handleInputChange} placeholder="HH:mm" />
                  </div>
                  <div className="form-group">
                    <label>Currency</label>
                    <input type="text" name="currencySymbol" value={formData.currencySymbol} onChange={handleInputChange} placeholder="e.g., $" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Text Direction *</label>
                    <select name="direction" value={formData.direction} onChange={handleInputChange} required>
                      <option value="LTR">LTR (Left to Right)</option>
                      <option value="RTL">RTL (Right to Left)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-6 p-6 bg-[var(--color-primary-light)]/20 rounded-[20px] border border-[var(--color-primary-dark)]/5">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      id="isDefaultVariant" 
                      className="w-6 h-6 rounded-lg border-2 border-[var(--color-primary-dark)]/20 checked:bg-[var(--color-primary-dark)] transition-all cursor-pointer accent-[var(--color-primary-dark)]"
                      checked={formData.isDefaultVariant} 
                      onChange={e => setFormData(prev => ({ ...prev, isDefaultVariant: e.target.checked }))}
                    />
                  </div>
                  <label htmlFor="isDefaultVariant" className="text-[12px] font-black text-[var(--color-primary-dark)] uppercase tracking-wider cursor-pointer">
                    Set as Primary Default Variant for this language
                  </label>
                </div>
              </div>
              <div className="modal-actions !p-10 !bg-transparent !border-none">
                <button type="button" onClick={closeModal} className="h-16 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] text-[var(--color-primary-dark)]/40 hover:bg-[var(--color-primary-dark)]/5 transition-all">Cancel Operation</button>
                <button 
                  type="submit" 
                  className="h-16 px-10 bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] text-white rounded-[24px] shadow-2xl shadow-[var(--color-primary-dark)]/20 flex items-center justify-center gap-4 transition-all font-black uppercase tracking-[0.2em] text-[12px] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <div className="flex items-center gap-3">
                       <div className="um-spinner !w-5 !h-5 !border-[3px] !border-white/20 !border-t-white" />
                       <span>Synchronizing...</span>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">verified</span>
                      {isEditing ? 'Commit Configuration' : 'Initialize Locale'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default Languages;
