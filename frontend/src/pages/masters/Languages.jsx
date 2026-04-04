import React, { useState, useEffect, useCallback, useRef } from 'react';
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
        <div className="um-header">
          <div className="um-header-left">
            <div className="um-header-icon" style={{ background: 'var(--um-primary-container)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--um-primary)' }}>translate</span>
            </div>
            <div>
              <h1>Languages</h1>
              <p>System-wide supported languages and text directions</p>
            </div>
          </div>
          <button className="um-add-btn" onClick={openAddModal}>
            <span className="material-symbols-outlined">add</span>
            Add Language
          </button>
        </div>

        <div className="um-filter-bar">
          <div className="um-search-wrap">
            <span className="um-search-icon material-symbols-outlined">search</span>
            <input
              type="text"
              className="um-search-input"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['ALL', 'ACTIVE', 'INACTIVE'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase transition-all ${
                  statusFilter === s ? 'bg-primary text-white' : 'bg-surface-container text-outline hover:bg-surface-container-high'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

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
                      <tr className={`um-row ${isExpanded ? 'bg-primary/5' : ''} ${!isBaseActive ? 'opacity-60' : ''}`}>
                        <td className="text-center">
                          {variants.length > 0 && (
                            <button
                              onClick={() => toggleBaseGroup(base.id)}
                              className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                          )}
                        </td>
                        <td className="font-bold">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                               <span className="material-symbols-outlined text-[18px]">language</span>
                             </div>
                            {base.name}
                            {variants.length > 0 && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{variants.length} variants</span>}
                          </div>
                        </td>
                        <td><code className="text-blue-600 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded font-mono text-xs">{base.code}</code></td>
                        <td className="text-xs text-outline">{base.dateFormat} • {base.currencySymbol}</td>
                        <td>
                          <span className="text-[10px] bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full font-bold">
                            {base.direction}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${base.status?.toLowerCase() || 'active'}`}>
                            {base.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td>
                          <div className="um-actions" style={{ justifyContent: 'flex-end' }}>
                            <button className="um-action-btn" title="Add Variant" onClick={() => { openAddModal(); setFormData(prev => ({ ...prev, parentLanguageId: base.id, direction: base.direction, name: `${base.name}-` })); }}>
                              <span className="material-symbols-outlined">add_circle</span>
                            </button>
                            <button className="um-action-btn" onClick={() => openEditModal(base)}>
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button className="um-action-btn um-action-delete" onClick={() => handleDelete(base.id)}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && variants.map(v => (
                        <tr key={v.id} className="bg-slate-50/50 dark:bg-white/2 border-l-2 border-primary/20">
                          <td />
                          <td className="pl-10">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-primary/40">subdirectory_arrow_right</span>
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mr-1" />
                              <span className="font-medium">{v.name}</span>
                              {v.regionName && <span className="text-[10px] text-outline font-medium">({v.regionName})</span>}
                              {v.isDefaultVariant && <span className="material-symbols-outlined text-[16px] text-amber-500" title="Primary default variant">star</span>}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <code className="text-blue-600 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded font-mono text-xs">{v.code}</code>
                              {v.countryCode && <code className="text-tertiary px-2 py-0.5 bg-tertiary/10 rounded font-mono text-xs">{v.countryCode}</code>}
                            </div>
                          </td>
                          <td className="text-xs text-outline">{v.dateFormat} • {v.timeFormat} • {v.currencySymbol}</td>
                          <td className="text-[10px] font-bold text-outline-variant">{v.direction}</td>
                          <td>
                            <span className={`status-badge status-${v.status?.toLowerCase() || 'active'} scale-90`}>
                              {v.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td>
                            <div className="um-actions" style={{ justifyContent: 'flex-end' }}>
                              <button className="um-action-btn scale-90" onClick={() => openEditModal(v)}>
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button className="um-action-btn um-action-delete scale-90" onClick={() => handleDelete(v.id)}>
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" style={{ width: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h2>{isEditing ? 'Edit Localization Details' : 'Configure New Language'}</h2>
              <button className="um-modal-close" onClick={closeModal}><span className="material-symbols-outlined">close</span></button>
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

                <div className="flex items-center gap-2 mt-4 p-3 bg-surface-container rounded-xl border border-outline-variant/30">
                  <input 
                    type="checkbox" 
                    id="isDefaultVariant" 
                    checked={formData.isDefaultVariant} 
                    onChange={e => setFormData(prev => ({ ...prev, isDefaultVariant: e.target.checked }))}
                  />
                  <label htmlFor="isDefaultVariant" className="text-xs font-bold text-on-surface-variant cursor-pointer">
                    Set as Primary Default Variant for this language
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving config...' : (isEditing ? 'Update Config' : 'Initialize')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Languages;
