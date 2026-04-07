import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';

import { useToast } from '../../components/common/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import './LabelStocks.css'; // Reusing the same grid/table styles

const EMPTY_FORM = {
  id: null,
  name: '',
  mappingKey: '',
  type: 'DATA',
  defaultValue: '',
  description: '',
  status: 'ACTIVE',
};

const Placeholders = () => {
  const initialized = useRef(false);
  const [placeholders, setPlaceholders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Confirm State
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const { success, error: toastError } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getPlaceholders();
      setPlaceholders(data);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load placeholders.');
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
    if (showModal || pendingDeleteId) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => { 
      document.body.classList.remove('modal-open');
    };
  }, [showModal, pendingDeleteId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (ph) => {
    setIsEditing(true);
    setFormData(ph);
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
        const updated = await api.updatePlaceholder(formData.id, formData);
        setPlaceholders(prev => prev.map(p => p.id === updated.id ? updated : p));
        success(`Placeholder "${formData.name}" updated.`);
      } else {
        const created = await api.createPlaceholder(formData);
        setPlaceholders(prev => [...prev, created]);
        success(`Placeholder "${formData.name}" created.`);
      }
      closeModal();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save placeholder.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (id) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setActionLoading(true);
    try {
      await api.deletePlaceholder(pendingDeleteId);
      setPlaceholders(prev => prev.filter(p => p.id !== pendingDeleteId));
      success('Placeholder deleted.');
      setPendingDeleteId(null);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete placeholder.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = placeholders.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.mappingKey && p.mappingKey.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div className="um-container animate-fade-in">
        <div className="um-header">
          <div className="um-header-left">
            <div className="um-header-icon" style={{ background: 'var(--um-secondary-container)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--um-secondary)' }}>data_object</span>
            </div>
            <div>
              <h1>Placeholders</h1>
              <p>Dynamic variables for label automation (Batch, Expiry, etc.)</p>
            </div>
          </div>
          <button className="um-add-btn" onClick={openAddModal}>
            <span className="material-symbols-outlined">add</span>
            Add Placeholder
          </button>
        </div>

        <div className="um-filter-bar">
          <div className="um-search-wrap">
            <span className="um-search-icon material-symbols-outlined">search</span>
            <input
              type="text"
              className="um-search-input"
              placeholder="Search by name or key..."
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
                  <th>Key</th>
                  <th>Default Value</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ph => (
                  <tr key={ph.id} className="um-row">
                    <td>{ph.name}</td>
                    <td><code className="text-blue-600 font-mono text-xs">{`{{${ph.mappingKey}}}`}</code></td>
                    <td>{ph.type}</td>
                    <td>{ph.defaultValue || '—'}</td>
                    <td>
                      <span className={`status-badge status-${ph.status?.toLowerCase() || 'active'}`}>
                        {ph.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className="um-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="um-action-btn" onClick={() => openEditModal(ph)}>
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className="um-action-btn um-action-delete" onClick={() => handleDelete(ph.id)}>
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

      {showModal && createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h2>{isEditing ? 'Edit Placeholder' : 'Add Placeholder'}</h2>
              <button className="um-modal-close" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="modal-body">
                <div className="form-group animate-slide-in-up" style={{ animationDelay: '0.05s' }}>
                  <label>Display Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g., Batch Number" />
                </div>
                <div className="form-group animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                  <label>Type *</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} required>
                    <option value="DATA">DATA</option>
                    <option value="FREE_TEXT">FREE_TEXT</option>
                    <option value="RUNTIME">RUNTIME</option>
                    <option value="VISIT">VISIT</option>
                  </select>
                </div>
                <div className="form-group animate-slide-in-up" style={{ animationDelay: '0.15s' }}>
                  <label>Placeholder Key *</label>
                  <input type="text" name="mappingKey" value={formData.mappingKey} onChange={handleInputChange} required placeholder="e.g., BATCH_NO" disabled={isEditing} />
                  <p className="text-[10px] text-slate-500 mt-1">Usage: <code>{`{{${formData.mappingKey || 'KEY'}}}`}</code></p>
                </div>
                <div className="form-group animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                  <label>Default Value</label>
                  <input type="text" name="defaultValue" value={formData.defaultValue} onChange={handleInputChange} placeholder="Sample text..." />
                </div>
                <div className="form-group animate-slide-in-up" style={{ animationDelay: '0.25s' }}>
                  <label>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="um-cancel-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="um-add-btn h-[48px] shadow-lg" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {/* Custom Confirm Dialog */}
      <ConfirmModal
        isOpen={!!pendingDeleteId}
        title="Delete Placeholder Component?"
        message="Are you sure you want to permanently remove this automated data mapping? Existing label templates using this key may fail to resolve dynamic data."
        confirmText="Confirm Removal"
        cancelText="Retain Mapping"
        type="danger"
        loading={actionLoading}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
};

export default Placeholders;
