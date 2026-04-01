import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import AppLayout from '../../components/common/AppLayout';
import { useToast } from '../../components/common/ToastContext';
import './LabelStocks.css';

const EMPTY_FORM = {
  id: null,
  name: '',
  length: '',
  width: '',
  height: '',
  description: '',
};

const LabelStocks = () => {
  const initialized = useRef(false);
  const [stocks, setStocks] = useState([]);
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
      const data = await api.getLabelStocks();
      setStocks(data);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load label stocks.');
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

  const openEditModal = (stock) => {
    setIsEditing(true);
    setFormData(stock);
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
        const updated = await api.updateLabelStock(formData.id, formData);
        setStocks(prev => prev.map(s => s.id === updated.id ? updated : s));
        success(`Stock "${formData.name}" updated.`);
      } else {
        const created = await api.createLabelStock(formData);
        setStocks(prev => [...prev, created]);
        success(`Stock "${formData.name}" created.`);
      }
      closeModal();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save label stock.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stock?')) return;
    setActionLoading(true);
    try {
      await api.deleteLabelStock(id);
      setStocks(prev => prev.filter(s => s.id !== id));
      success('Stock deleted.');
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete stock.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStocks = stocks.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppLayout activePage="masters">
      <div className="um-container animate-fade-in">
        <div className="um-header">
          <div className="um-header-left">
            <div className="um-header-icon" style={{ background: 'var(--um-primary-container)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--um-primary)' }}>inventory_2</span>
            </div>
            <div>
              <h1>Label Stocks</h1>
              <p>Manage physical label dimensions and specifications</p>
            </div>
          </div>
          <button className="um-add-btn" onClick={openAddModal}>
            <span className="material-symbols-outlined">add</span>
            Add Stock
          </button>
        </div>

        <div className="um-filter-bar">
          <div className="um-search-wrap">
            <span className="um-search-icon material-symbols-outlined">search</span>
            <input
              type="text"
              className="um-search-input"
              placeholder="Search stocks..."
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
                  <th>Dimensions (L×W×H)</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map(stock => (
                  <tr key={stock.id} className="um-row">
                    <td className="font-bold">{stock.name}</td>
                    <td>{stock.length || 0} × {stock.width || 0} × {stock.height || 0} mm</td>
                    <td className="text-slate-500 text-xs">{stock.description || '—'}</td>
                    <td>
                      <div className="um-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="um-action-btn" onClick={() => openEditModal(stock)}>
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className="um-action-btn um-action-delete" onClick={() => handleDelete(stock.id)}>
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
              <h2>{isEditing ? 'Edit Stock' : 'Add New Label Stock'}</h2>
              <button className="um-modal-close" onClick={closeModal}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Stock Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Length (mm)</label>
                    <input type="number" step="0.1" name="length" value={formData.length} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Width (mm)</label>
                    <input type="number" step="0.1" name="width" value={formData.width} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Height (mm)</label>
                    <input type="number" step="0.1" name="height" value={formData.height} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="um-add-btn" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : (isEditing ? 'Update Stock' : 'Create Stock')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default LabelStocks;
