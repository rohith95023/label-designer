import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { api } from '../../services/api';

import { useToast } from '../../components/common/ToastContext';
import { useLabel } from '../../context/LabelContext';
import { useAuth } from '../../context/AuthContext';
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
  status: 'ACTIVE',
  supplier: '',
  costCenter: '',
};

const UOM_OPTIONS = ['ROLL', 'SHEET', 'PKT', 'BOX', 'CASE'];

const LabelStocks = () => {
  const { accessToken } = useAuth();
  const initialized = useRef(false);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState('');

  const { settings, refreshStocks } = useLabel();
  const unit = settings?.units || 'mm';

  const { success, error: toastError } = useToast();

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
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
    if (accessToken && !initialized.current) {
      fetchData();
      initialized.current = true;
    }
  }, [accessToken, fetchData]);

  // Lock body scroll when modal is open to prevent clumsiness
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showModal]);

  const [fieldErrors, setFieldErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear individual field error on typing (AC 10)
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }));
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
    setFieldErrors({});
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { name, stockId, length, breadth, height, description, quantityOnHand, reorderLevel, maxStockLevel, unitOfMeasure } = formData;

    // AC 10: Per-field inline validation
    const errors = {};
    if (!name?.trim()) errors.name = 'Internal reference name is required.';
    if (!stockId?.trim()) errors.stockId = 'System Stock ID is required.';
    else if (!/^[a-zA-Z0-9\-]+$/.test(stockId)) errors.stockId = 'Stock ID must be alphanumeric (hyphens allowed only).';
    if (!length || Number(length) <= 0) errors.length = 'Length must be a positive value.';
    if (!breadth || Number(breadth) <= 0) errors.breadth = 'Breadth must be a positive value.';
    if (!height || Number(height) <= 0) errors.height = 'Height must be a positive value.';
    if (!description?.trim()) errors.description = 'Technical description is required.';
    if (quantityOnHand === '' || quantityOnHand === null || Number(quantityOnHand) < 0) errors.quantityOnHand = 'Quantity on hand cannot be negative.';
    if (reorderLevel === '' || reorderLevel === null || Number(reorderLevel) < 0) errors.reorderLevel = 'Reorder level must be a non-negative number.';
    if (maxStockLevel && Number(reorderLevel) > Number(maxStockLevel)) errors.maxStockLevel = 'Reorder level cannot exceed max stock level.';
    if (!unitOfMeasure) errors.unitOfMeasure = 'Unit of measure is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toastError('Please correct the highlighted fields.');
      return;
    }
    setFieldErrors({});

    // Ensure numeric fields are sent as numbers
    const submissionData = {
      ...formData,
      length: Number(length),
      breadth: Number(breadth),
      height: Number(height),
      quantityOnHand: Number(quantityOnHand),
      reorderLevel: Number(reorderLevel),
      maxStockLevel: maxStockLevel ? Number(maxStockLevel) : null,
      status: formData.status || 'ACTIVE'
    };

    setActionLoading(true);
    try {
      if (isEditing) {
        const updated = await api.updateLabelStock(formData.id, submissionData);
        setStocks(prev => prev.map(s => s.id === updated.id ? updated : s));
        success(`Stock "${formData.name}" updated.`);
      } else {
        const created = await api.createLabelStock(submissionData);
        setStocks(prev => [...prev, created]);
        success(`Stock "${formData.name}" created.`);
      }
      await refreshStocks();
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
      await refreshStocks();
      setStocks(prev => prev.filter(s => s.id !== id));
      success('Stock deleted.');
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete stock. It might be in use.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStocks = stocks.filter(s => {
    const stockId = s.stockId?.toLowerCase() || '';
    const isPredefined = [
      'bottle', 'vial', 'blister', 'a5', 'a4',
      'tablet-std', 'syrup-std', 'injection-std', 'ointment-std', 'generic-std',
      'standard tablet', 'standard syrup', 'standard injection', 'standard ointment', 'standard generic'
    ].includes(stockId);
    
    if (isPredefined) return false;
    
    return (
      (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (stockId.includes(searchQuery.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <>
      <div className="um-container animate-fade-in">
        <motion.div 
          className="um-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="um-header-left">
            <div className="um-header-icon shadow-xl">
              <span className="material-symbols-outlined text-[28px] !text-white">inventory_2</span>
            </div>
            <div>
              <p className="text-[var(--color-primary)] font-black text-[10px] uppercase tracking-[0.3em] mb-1">Physical Inventory Master</p>
              <h1 className="text-3xl font-black text-[var(--color-primary-dark)] tracking-tighter">Label Stocks</h1>
            </div>
          </div>
          <button className="um-add-btn group" onClick={openAddModal}>
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add_circle</span>
            Initialize New Stock
          </button>
        </motion.div>

        <motion.div 
          className="um-filter-bar bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="um-search-wrap">
            <span className="um-search-icon material-symbols-outlined opacity-40">search</span>
            <input
              type="text"
              className="um-search-input bg-white border-none shadow-sm font-bold text-[var(--color-primary-dark)] placeholder:text-[var(--color-primary-dark)]/30"
              placeholder="Search by physical identifier, specification, or material reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

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
                {filteredStocks.map((stock, idx) => {
                  const isLowStock = stock.quantityOnHand <= stock.reorderLevel;
                  const isPredefined = ['bottle', 'vial', 'blister', 'a5', 'a4'].includes(stock.stockId?.toLowerCase());
                  
                  return (
                    <motion.tr 
                      key={stock.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 + 0.3 }}
                      className={`um-row ${isLowStock ? 'bg-red-50' : ''}`}
                    >
                      <td>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-[var(--color-primary-dark)] tracking-tight">{stock.name}</span>
                            {isPredefined && (
                              <span className="bg-[var(--color-primary-dark)] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">SYSTEM SPEC</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase mt-0.5">{stock.stockId}</span>
                          <p className="text-slate-500 text-[11px] mt-2 font-bold line-clamp-1 italic">
                            {stock.description || 'No material specifications provided.'}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[13px] font-black text-[var(--color-primary-dark)]">{stock.length}</span>
                            <span className="text-[10px] opacity-30 font-black">×</span>
                            <span className="text-[13px] font-black text-[var(--color-primary-dark)]">{stock.breadth}</span>
                            <span className="text-[10px] opacity-30 font-black">×</span>
                            <span className="text-[13px] font-black text-[var(--color-primary-dark)]">{stock.height}</span>
                            <span className="text-[10px] ml-1 font-black opacity-40 uppercase">{unit}</span>
                          </div>
                          <span className="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em] opacity-40">Dimensions Master</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                             <div className={`px-3 py-1 rounded-lg text-[12px] font-black tracking-tight ${isLowStock ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                               {stock.quantityOnHand} {stock.unitOfMeasure}
                             </div>
                             {isLowStock && (
                               <motion.span 
                                 animate={{ opacity: [1, 0.4, 1] }} 
                                 transition={{ repeat: Infinity, duration: 1.5 }}
                                 className="material-symbols-outlined text-[var(--color-error)] text-[18px]"
                               >
                                 report_problem
                               </motion.span>
                             )}
                          </div>
                          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-40">
                             <span className={isLowStock ? 'text-[var(--color-error)] opacity-100' : ''}>Alert @ {stock.reorderLevel}</span>
                             <span>•</span>
                             <span>Cap @ {stock.maxStockLevel || '∞'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="um-actions" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            className="um-action-btn hover:!bg-[var(--color-primary-dark)] hover:!text-white transition-all shadow-sm" 
                            onClick={() => openEditModal(stock)} 
                            title="Refine Specifications"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit_note</span>
                          </button>
                          <button 
                            className={`um-action-btn hover:!bg-[var(--color-error)] hover:!text-white transition-all shadow-sm ${isPredefined ? 'opacity-30 pointer-events-none' : ''}`} 
                            onClick={() => handleDelete(stock.id)} 
                            title={isPredefined ? 'System-protected stock' : 'Relinquish Record'}
                            disabled={isPredefined}
                          >
                            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
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
              className="modal-content modal-large !bg-[var(--color-background)] !rounded-[40px] shadow-[0_32px_120px_rgba(56,36,13,0.3)] border border-white/40" 
              onClick={e => e.stopPropagation()}
            >
              <div className="um-modal-header !p-10 !border-none !bg-transparent">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-[24px] bg-[var(--color-primary-dark)] flex items-center justify-center text-white shadow-2xl">
                      <span className="material-symbols-outlined text-[32px]">{isEditing ? 'inventory' : 'add_to_photos'}</span>
                   </div>
                   <div>
                      <p className="text-[var(--color-primary)] font-black text-[11px] uppercase tracking-[0.4em] mb-1">Inventory Specification Master</p>
                     <h2 className="text-3xl font-black text-[var(--color-primary-dark)] tracking-tighter">{isEditing ? 'Refine Stock Configuration' : 'Initialize Physical Asset'}</h2>
                   </div>
                </div>
                <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all" onClick={closeModal}>
                  <span className="material-symbols-outlined">close</span>
                </button>
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
                      className={fieldErrors.name ? '!border-red-400' : ''}
                    />
                    {fieldErrors.name && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{fieldErrors.name}</p>}
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
                      className={fieldErrors.stockId ? '!border-red-400' : ''}
                    />
                    {fieldErrors.stockId && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{fieldErrors.stockId}</p>}
                  </div>
                </div>

                <div className="form-divider">Dimensions & Material</div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Length ({unit}) *</label>
                    <input type="number" step="0.01" min="0.01" name="length" value={formData.length} onChange={handleInputChange} placeholder="0.00" className={fieldErrors.length ? '!border-red-400' : ''} />
                    {fieldErrors.length && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{fieldErrors.length}</p>}
                  </div>
                  <div className="form-group">
                    <label>Breadth ({unit}) *</label>
                    <input type="number" step="0.01" min="0.01" name="breadth" value={formData.breadth} onChange={handleInputChange} placeholder="0.00" className={fieldErrors.breadth ? '!border-red-400' : ''} />
                    {fieldErrors.breadth && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{fieldErrors.breadth}</p>}
                  </div>
                  <div className="form-group">
                    <label>Height ({unit}) *</label>
                    <input type="number" step="0.01" min="0.01" name="height" value={formData.height} onChange={handleInputChange} placeholder="0.00" className={fieldErrors.height ? '!border-red-400' : ''} />
                    {fieldErrors.height && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{fieldErrors.height}</p>}
                  </div>
                </div>

                <div className="form-divider">Inventory Controls</div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Current Stock Quantity *</label>
                    <input type="number" step="0.01" min="0" name="quantityOnHand" value={formData.quantityOnHand} onChange={handleInputChange} placeholder="0" className={fieldErrors.quantityOnHand ? '!border-red-400' : ''} />
                    {fieldErrors.quantityOnHand && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{fieldErrors.quantityOnHand}</p>}
                  </div>
                  <div className="form-group">
                    <label>Unit of Measure *</label>
                    <select name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleInputChange} className={fieldErrors.unitOfMeasure ? '!border-red-400' : ''}>
                       {UOM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    {fieldErrors.unitOfMeasure && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{fieldErrors.unitOfMeasure}</p>}
                  </div>
                  <div className="form-group">
                    <label>Reorder Level *</label>
                    <input type="number" step="0.01" min="0" name="reorderLevel" value={formData.reorderLevel} onChange={handleInputChange} placeholder="0" className={fieldErrors.reorderLevel ? '!border-red-400' : ''} />
                    {fieldErrors.reorderLevel && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{fieldErrors.reorderLevel}</p>}
                  </div>
                  <div className="form-group">
                    <label>Max Stock Level</label>
                    <input type="number" step="0.01" min="0" name="maxStockLevel" value={formData.maxStockLevel} onChange={handleInputChange} placeholder="Optional (0 for ∞)" className={fieldErrors.maxStockLevel ? '!border-red-400' : ''} />
                    {fieldErrors.maxStockLevel && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{fieldErrors.maxStockLevel}</p>}
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
                    className={fieldErrors.description ? '!border-red-400' : ''}
                  />
                  {fieldErrors.description && <p className="text-red-500 text-[10px] font-bold mt-1 pl-1">{fieldErrors.description}</p>}
                </div>
              </div>
              <div className="modal-actions !p-10 !bg-transparent !border-none">
                <button type="button" className="h-16 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] text-slate-500 hover:bg-[var(--color-primary-dark)]/5 transition-all" onClick={closeModal}>Discard Transaction</button>
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
                        {isEditing ? 'Commit Configuration' : 'Initialize Physical Asset'}
                     </>
                   )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LabelStocks;
