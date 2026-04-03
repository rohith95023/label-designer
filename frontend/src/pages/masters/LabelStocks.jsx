import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import AppLayout from '../../components/common/AppLayout';
import { useToast } from '../../components/common/ToastContext';
import { useLabel } from '../../context/LabelContext';
import './LabelStocks.css';

const EMPTY_FORM = {
  id: null,
  name: '',
  stockId: '',
  length: '',
  breadth: '',
  height: '',
  description: '',
  quantityOnHand: '',
  reorderLevel: '',
  maxStockLevel: '',
  unitOfMeasure: 'ROLL',
};

const UOM_OPTIONS = ['ROLL', 'SHEET', 'PKT', 'BOX', 'CASE'];

const LabelStocks = () => {
  const initialized = useRef(false);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState('');

  const { settings } = useLabel();
  const unit = settings?.units || 'mm';

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
    
    // AC1-5: Validation logic
    const { name, stockId, length, breadth, height, description, quantityOnHand, reorderLevel, maxStockLevel, unitOfMeasure } = formData;

    if (!name || !stockId || !length || !breadth || !height || !description || !unitOfMeasure) {
      toastError('All fields marked with * are mandatory.');
      return;
    }

    // AC2: Format check (simplified frontend version)
    if (!/^[a-zA-Z0-9\-]+$/.test(stockId)) {
      toastError('Stock ID must be alphanumeric (hyphens allowed).');
      return;
    }

    if (length <= 0 || breadth <= 0 || height <= 0) {
      toastError('Dimensions must be positive values.');
      return;
    }

    // AC3: Non-negative quantity
    if (quantityOnHand < 0) {
      toastError('Quantity on hand cannot be negative.');
      return;
    }

    // AC4: Reorder level checks
    if (reorderLevel < 0) {
      toastError('Reorder level must be a non-negative number.');
      return;
    }
    if (maxStockLevel && Number(reorderLevel) > Number(maxStockLevel)) {
      toastError('Reorder level cannot exceed maximum stock level.');
      return;
    }

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
      toastError(err.response?.data?.message || 'Failed to delete stock. It might be in use.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStocks = stocks.filter(s => 
    (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.stockId && s.stockId.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
              placeholder="Search by name, ID or description..."
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
                  <th>Stock Details</th>
                  <th>Dimensions ({unit})</th>
                  <th>Inventory Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map(stock => {
                  const isLowStock = stock.quantityOnHand <= stock.reorderLevel;
                  return (
                    <tr key={stock.id} className="um-row">
                      <td>
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">{stock.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">{stock.stockId}</span>
                          <span className="text-slate-500 text-[11px] mt-1 line-clamp-1">{stock.description || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold">{stock.length} × {stock.breadth} × {stock.height}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">L × B × H</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <span className={`text-sm font-black ${isLowStock ? 'text-red-500' : 'text-emerald-500'}`}>
                               {stock.quantityOnHand} {stock.unitOfMeasure}
                             </span>
                             {isLowStock && (
                               <span className="material-symbols-outlined text-red-500 text-sm animate-pulse">warning</span>
                             )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                             <span>Reorder: {stock.reorderLevel}</span>
                             <span>•</span>
                             <span>Max: {stock.maxStockLevel || '∞'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="um-actions" style={{ justifyContent: 'flex-end' }}>
                          <button className="um-action-btn" onClick={() => openEditModal(stock)} title="Edit Configuration">
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button className="um-action-btn um-action-delete" onClick={() => handleDelete(stock.id)} title="Delete Record">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">{isEditing ? 'edit_note' : 'add_circle'}</span>
                 </div>
                 <h2>{isEditing ? 'Modify Stock Configuration' : 'Onboard New Label Stock'}</h2>
              </div>
              <button className="um-modal-close" onClick={closeModal}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group span-2">
                    <label>Internal Reference Name *</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      maxLength="100"
                      placeholder="e.g. Premium High-Gloss Pharma Roll"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>System Stock ID *</label>
                    <input 
                      type="text" 
                      name="stockId" 
                      value={formData.stockId} 
                      onChange={handleInputChange} 
                      maxLength="50"
                      placeholder="STK-001"
                      required 
                    />
                  </div>
                </div>

                <div className="form-divider">Dimensions & Material</div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Length ({unit}) *</label>
                    <input type="number" step="0.01" min="0.01" name="length" value={formData.length} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Breadth ({unit}) *</label>
                    <input type="number" step="0.01" min="0.01" name="breadth" value={formData.breadth} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Height ({unit}) *</label>
                    <input type="number" step="0.01" min="0.01" name="height" value={formData.height} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="form-divider">Inventory Controls</div>

                <div className="form-grid">
                   <div className="form-group">
                    <label>Current Stock Quantity *</label>
                    <input type="number" step="0.01" min="0" name="quantityOnHand" value={formData.quantityOnHand} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Unit of Measure *</label>
                    <select name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleInputChange} required>
                       {UOM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Reorder Level *</label>
                    <input type="number" step="0.01" min="0" name="reorderLevel" value={formData.reorderLevel} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Max Stock Level</label>
                    <input type="number" step="0.01" min="0" name="maxStockLevel" value={formData.maxStockLevel} onChange={handleInputChange} placeholder="Optional" />
                  </div>
                </div>

                <div className="form-group mt-4">
                  <label>Technical Description / Notes *</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    rows="3" 
                    maxLength="255"
                    placeholder="Adhesive details, core size, compatible printers..."
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="um-cancel-btn" onClick={closeModal}>Discard Changes</button>
                <button type="submit" className="um-add-btn" disabled={actionLoading}>
                  {actionLoading ? 'Synchronizing...' : (isEditing ? 'Commit Configuration' : 'Activate Stock')}
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
