import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import AppLayout from '../../components/common/AppLayout';
import { useToast } from '../../components/common/ToastContext';
import './LabelStocks.css';

const EMPTY_FORM = {
  id: null,
  name: '',
  code: '',
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
      if (isEditing) {
        const updated = await api.updateLanguage(formData.id, formData);
        setLanguages(prev => prev.map(l => l.id === updated.id ? updated : l));
        success(`Language "${formData.name}" updated.`);
      } else {
        const created = await api.createLanguage(formData);
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

  const filtered = languages.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              placeholder="Search by name or code (en, fr)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="um-table-card">
          {loading ? (
            <div className="um-loading-state"><div className="um-spinner" /></div>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Direction</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lang => (
                  <tr key={lang.id} className="um-row">
                    <td className="font-bold">{lang.name}</td>
                    <td><code className="text-blue-600 px-2 py-1 bg-blue-50 rounded font-mono">{lang.code}</code></td>
                    <td>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold">
                        {lang.direction === 'LTR' ? 'Left to Right' : 'Right to Left'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${lang.status?.toLowerCase() || 'active'}`}>
                        {lang.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className="um-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="um-action-btn" onClick={() => openEditModal(lang)}>
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className="um-action-btn um-action-delete" onClick={() => handleDelete(lang.id)}>
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h2>{isEditing ? 'Edit Language' : 'Add Language'}</h2>
              <button className="um-modal-close" onClick={closeModal}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Language Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g., Arabic" />
                </div>
                <div className="form-group">
                  <label>Language Code *</label>
                  <input type="text" name="code" value={formData.code} onChange={handleInputChange} required placeholder="e.g., ar" disabled={isEditing} />
                </div>
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
              <div className="modal-actions">
                <button type="button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="um-add-btn" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
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
