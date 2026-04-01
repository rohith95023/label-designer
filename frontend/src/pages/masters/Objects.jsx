import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import AppLayout from '../../components/common/AppLayout';
import { useToast } from '../../components/common/ToastContext';
import './LabelStocks.css';

const EMPTY_FORM = {
  id: null,
  name: '',
  type: 'LOGO', // LOGO, ICON, QR_SPEC, BARCODE_SPEC
  status: 'ACTIVE',
};

const Objects = () => {
  const initialized = useRef(false);
  const fileInputRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { success, error: toastError } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getObjects();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(EMPTY_FORM);
    setSelectedFile(null);
    setShowModal(true);
  };

  const openEditModal = (obj) => {
    setIsEditing(true);
    setFormData(obj);
    setSelectedFile(null);
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
        const updated = await api.updateObject(formData.id, formData);
        setObjects(prev => prev.map(o => o.id === updated.id ? updated : o));
        success(`Object "${formData.name}" updated.`);
      } else {
        if (!selectedFile) {
          toastError('Please select a file to upload.');
          return;
        }
        const uploadData = new FormData();
        uploadData.append('name', formData.name);
        uploadData.append('type', formData.type);
        uploadData.append('file', selectedFile);

        const created = await api.uploadObject(uploadData);
        setObjects(prev => [...prev, created]);
        success(`Object "${formData.name}" uploaded.`);
      }
      closeModal();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to process request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    setActionLoading(true);
    try {
      await api.deleteObject(id);
      setObjects(prev => prev.filter(o => o.id !== id));
      success('Asset deleted.');
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete asset.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = objects.filter(o => 
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout activePage="masters">
      <div className="um-container animate-fade-in">
        <div className="um-header">
          <div className="um-header-left">
            <div className="um-header-icon" style={{ background: 'var(--um-tertiary-container)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--um-tertiary)' }}>image</span>
            </div>
            <div>
              <h1>Assets & Logos</h1>
              <p>Manage images, logos and specification objects</p>
            </div>
          </div>
          <button className="um-add-btn" onClick={openAddModal}>
            <span className="material-symbols-outlined">upload</span>
            Upload Asset
          </button>
        </div>

        <div className="um-filter-bar">
          <div className="um-search-wrap">
            <span className="um-search-icon material-symbols-outlined">search</span>
            <input
              type="text"
              className="um-search-input"
              placeholder="Search by name or type..."
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
                  <th>Preview</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>URL Path</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(obj => (
                  <tr key={obj.id} className="um-row">
                    <td>
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                        {obj.type === 'LOGO' ? (
                          <img src={obj.fileUrl} alt={obj.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400">insert_drive_file</span>
                        )}
                      </div>
                    </td>
                    <td className="font-bold">{obj.name}</td>
                    <td><span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold">{obj.type}</span></td>
                    <td className="text-xs text-blue-600 font-mono">{obj.fileUrl}</td>
                    <td>
                      <span className={`status-badge status-${obj.status?.toLowerCase() || 'active'}`}>
                        {obj.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className="um-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="um-action-btn" onClick={() => openEditModal(obj)}>
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className="um-action-btn um-action-delete" onClick={() => handleDelete(obj.id)}>
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
              <h2>{isEditing ? 'Edit Asset' : 'Upload New Asset'}</h2>
              <button className="um-modal-close" onClick={closeModal}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Asset Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g., Company Logo" />
                </div>
                <div className="form-group">
                  <label>Asset Type *</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} required>
                    <option value="LOGO">LOGO</option>
                    <option value="ICON">ICON</option>
                    <option value="QR_SPEC">QR_SPEC</option>
                    <option value="BARCODE_SPEC">BARCODE_SPEC</option>
                  </select>
                </div>
                {!isEditing && (
                  <div className="form-group">
                    <label>File *</label>
                    <div 
                      className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="material-symbols-outlined text-3xl text-slate-400">cloud_upload</span>
                      <span className="text-xs font-bold text-slate-500">{selectedFile ? selectedFile.name : 'Click to select SVG/PNG file'}</span>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden accept=".svg,.png,.jpg,.jpeg" />
                    </div>
                  </div>
                )}
                {isEditing && (
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="um-add-btn" disabled={actionLoading}>
                  {actionLoading ? 'Uploading...' : (isEditing ? 'Update' : 'Upload Asset')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Objects;
