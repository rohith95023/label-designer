import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import AppLayout from '../components/common/AppLayout';
import PermissionMatrix from '../components/users/PermissionMatrix';
import ConfirmDeleteModal from '../components/users/ConfirmDeleteModal';
import ToastContainer, { useToast } from '../components/common/ToastContainer';
import { useAuth } from '../context/AuthContext';
import './UserManagement.css';

const EMPTY_FORM = {
  id: null,
  username: '',
  email: '',
  password: '',
  role: '',
  isExternal: false,
  permissions: [],
};

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const initialized = useRef(false);

  // Data state
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [systemConfigs, setSystemConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Search / Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Audit log sidebar
  const [auditUser, setAuditUser] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const { toasts, dismissToast, success, error: toastError, warning } = useToast();

  useEffect(() => {
    console.log('UserManagement Render. fetchData stable?', Boolean(fetchData));
  });

  const fetchData = useCallback(async () => {
    console.log('--- FETCH DATA EXECUTED ---');
    try {
      setLoading(true);
      const [usersData, rolesData, configsData] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getSystemConfigs(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setSystemConfigs(configsData);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load user data. Check your permissions.');
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

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q);
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchStatus = filterStatus === 'ALL' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  // ── Form Handlers ──────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'password') setPasswordError('');
  };

  const validatePassword = (password) => {
    if (!password) return true;
    if (password.length < 8) { setPasswordError('Minimum 8 characters'); return false; }
    if (!/[a-z]/.test(password)) { setPasswordError('Must contain a lowercase letter'); return false; }
    if (!/[A-Z]/.test(password)) { setPasswordError('Must contain an uppercase letter'); return false; }
    if (!/\d/.test(password)) { setPasswordError('Must contain a digit'); return false; }
    if (!/[@$!%*?&]/.test(password)) { setPasswordError('Must contain a special character (@$!%*?&)'); return false; }
    return true;
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ ...EMPTY_FORM, role: roles[0] || '' });
    setPasswordError('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setIsEditing(true);
    setFormData({
      id: user.id,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      isExternal: user.isExternal || false,
      permissions: user.permissions || [],
    });
    setPasswordError('');
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing && !validatePassword(formData.password)) return;
    if (isEditing && formData.password && !validatePassword(formData.password)) return;

    setActionLoading(true);
    setFormError('');
    try {
      if (isEditing) {
        const updatedUser = await api.updateUser(formData.id, {
          email: formData.email,
          password: formData.password || null,
          role: formData.role,
          isExternal: formData.isExternal,
          permissions: formData.permissions,
        });
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        success(`User "${formData.username}" updated successfully.`);
      } else {
        const newUser = await api.createUser(formData);
        setUsers(prev => [...prev, newUser]);
        success(`User "${formData.username}" created successfully.`);
      }
      closeModal();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLock = async (user) => {
    if (user.id === currentUser?.id) {
      warning('You cannot lock your own account.');
      return;
    }
    setActionLoading(true);
    try {
      if (user.status === 'LOCKED') {
        await api.unlockUser(user.id);
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'ACTIVE', failedLoginAttempts: 0 } : u));
        success(`"${user.username}" has been unlocked.`);
      } else {
        await api.lockUser(user.id);
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'LOCKED' } : u));
        success(`"${user.username}" has been locked.`);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (user) => {
    if (user.id === currentUser?.id) {
      warning('You cannot delete your own account.');
      return;
    }
    setDeleteTarget(user);
  };

  const handleConfirmDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await api.deleteUser(id);
      success(`User account has been removed/archived.`);
      setUsers(prev => prev.filter(u => u.id !== id));
      setDeleteTarget(null);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete user.');
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openAuditSidebar = async (user) => {
    setAuditUser(user);
    setAuditLoading(true);
    try {
      const data = await api.getUserAuditLogs(user.id);
      setAuditLogs(Array.isArray(data) ? data : data.content || []);
    } catch (err) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const sodConfig = systemConfigs.find(c => c.configKey === 'sod.prevent_same_user_approve');

  const handleToggleSoD = async () => {
    if (!sodConfig) return;
    setActionLoading(true);
    try {
      const newValue = sodConfig.configValue === 'true' ? 'false' : 'true';
      await api.updateSystemConfig(sodConfig.configKey, newValue);
      success(`SoD policy ${newValue === 'true' ? 'enabled' : 'disabled'}.`);
      await fetchData();
    } catch (err) {
      toastError('Failed to update compliance setting.');
    } finally {
      setActionLoading(false);
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    locked: users.filter(u => u.status === 'LOCKED').length,
    external: users.filter(u => u.isExternal).length,
  };

  return (
    <AppLayout activePage="users">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="um-container animate-fade-in">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="um-header">
          <div className="um-header-left">
            <div className="um-header-icon">
              <span className="material-symbols-outlined">manage_accounts</span>
            </div>
            <div>
              <h1>User Management</h1>
              <p>Identity & Access Control — FDA 21 CFR Part 11 Compliant</p>
            </div>
          </div>
          <button className="um-add-btn" onClick={openAddModal}>
            <span className="material-symbols-outlined">person_add</span>
            Add User
          </button>
        </div>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <div className="um-stats-row">
          <div className="um-stat-card">
            <div className="um-stat-icon-box">
              <span className="material-symbols-outlined">group</span>
            </div>
            <div className="um-stat-info">
              <span className="um-stat-value">{stats.total}</span>
              <span className="um-stat-label">Total Users</span>
            </div>
          </div>

          <div className="um-stat-card um-stat-active">
            <div className="um-stat-icon-box">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <div className="um-stat-info">
              <span className="um-stat-value">{stats.active}</span>
              <span className="um-stat-label">Active</span>
            </div>
          </div>

          <div className="um-stat-card um-stat-locked">
            <div className="um-stat-icon-box">
              <span className="material-symbols-outlined">lock</span>
            </div>
            <div className="um-stat-info">
              <span className="um-stat-value">{stats.locked}</span>
              <span className="um-stat-label">Locked</span>
            </div>
          </div>

          <div className="um-stat-card um-stat-external">
            <div className="um-stat-icon-box">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <div className="um-stat-info">
              <span className="um-stat-value">{stats.external}</span>
              <span className="um-stat-label">External</span>
            </div>
          </div>
        </div>

        {/* ── SoD Compliance Banner ────────────────────────────────────────── */}
        {sodConfig && (
          <div className={`um-compliance-banner ${sodConfig.configValue === 'true' ? 'sod-active' : 'sod-inactive'}`}>
            <div className="um-compliance-left">
              <span className="material-symbols-outlined">
                {sodConfig.configValue === 'true' ? 'verified' : 'warning'}
              </span>
              <div>
                <h3>Segregation of Duties (SoD)</h3>
                <p>
                  Policy is currently <strong>{sodConfig.configValue === 'true' ? 'Active' : 'Missing'}</strong> — same user cannot complete and approve.
                </p>
              </div>
            </div>
            <button
              className={`um-sod-btn ${sodConfig.configValue === 'true' ? 'enforced' : ''} ${actionLoading ? 'btn-loading' : ''}`}
              onClick={handleToggleSoD}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <div className="um-spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', borderTopColor: 'currentColor' }} />
                  <span>Processing...</span>
                </>
              ) : (
                sodConfig.configValue === 'true' ? 'Deactivate SoD' : 'Enable SoD Protection'
              )}
            </button>
          </div>
        )}

        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <div className="um-filter-bar">
          <div className="um-search-wrap">
            <span className="um-search-icon material-symbols-outlined">search</span>
            <input
              type="text"
              className="um-search-input"
              placeholder="Search by username, email or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="um-search-clear" onClick={() => setSearchQuery('')}>
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>

          <select
            className="um-filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            className="um-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="LOCKED">Locked</option>
          </select>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <div className="um-table-card">
          {loading ? (
            <div className="um-loading-state">
              <div className="um-spinner" />
              <p>Loading users...</p>
            </div>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Failed Attempts</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const isSelf = user.id === currentUser?.id;
                  return (
                    <tr key={user.id} className={`um-row ${user.status === 'LOCKED' ? 'um-row-locked' : ''} ${isSelf ? 'um-row-self' : ''}`}>
                      <td>
                        <div className="um-user-cell">
                          <div className="um-avatar" data-self={isSelf}>
                            {user.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="um-user-info">
                            <span className="um-username">
                              {user.username}
                              {isSelf && <span className="um-self-badge">Me</span>}
                            </span>
                            <span className="um-email">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`type-badge type-${user.isExternal ? 'external' : 'internal'}`}>
                          {user.isExternal ? 'EXTERNAL' : 'INTERNAL'}
                        </span>
                      </td>
                      <td>
                        <div className={`status-badge status-${user.status?.toLowerCase()}`}>
                          <span className="status-dot" />
                          {user.status}
                        </div>
                      </td>
                      <td>
                        <span className={`attempts-badge ${user.failedLoginAttempts >= 3 ? 'attempts-warn' : ''}`}>
                          {user.failedLoginAttempts}
                        </span>
                      </td>
                      <td className="um-date-cell">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        <div className="um-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="um-action-btn"
                            title="View Activity Log"
                            onClick={() => openAuditSidebar(user)}
                          >
                            <span className="material-symbols-outlined">history</span>
                          </button>
                          <button
                            className="um-action-btn"
                            title="Edit Permissions"
                            onClick={() => openEditModal(user)}
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            className="um-action-btn"
                            title={user.status === 'LOCKED' ? 'Unlock Account' : 'Lock Account'}
                            onClick={() => handleToggleLock(user)}
                            disabled={actionLoading || isSelf}
                          >
                            <span className="material-symbols-outlined">
                              {user.status === 'LOCKED' ? 'lock_open' : 'lock'}
                            </span>
                          </button>
                          <button
                            className="um-action-btn um-action-delete"
                            title="Delete User"
                            onClick={() => openDeleteModal(user)}
                            disabled={actionLoading || isSelf}
                          >
                            <span className="material-symbols-outlined">person_remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && !loading && (
                  <tr>
                    <td colSpan="7">
                      <div className="um-empty-state">
                        <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', opacity: 0.3 }}>person_search</span>
                        <p>No users match the current filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <div className="um-modal-title-icon">
                <span className="material-symbols-outlined">
                  {isEditing ? 'manage_accounts' : 'person_add'}
                </span>
              </div>
              <h2>{isEditing ? `Edit User — ${formData.username}` : 'Create New System User'}</h2>
              <button className="um-modal-close" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {formError && (
              <div className="um-form-error" style={{ margin: '0 1.5rem 1rem' }}>
                <span className="material-symbols-outlined">error</span>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Username <span className="required-star">*</span></label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={isEditing}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email <span className="required-star">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Initial Role <span className="required-star">*</span></label>
                  <select name="role" value={formData.role} onChange={handleInputChange} required>
                    <option value="" disabled>Select role...</option>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{isEditing ? 'New Password' : 'Password'} {!isEditing && '*'}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={isEditing ? 'Leave blank to keep' : 'Min 8 chars...'}
                    required={!isEditing}
                  />
                  {passwordError && <p className="password-error">{passwordError}</p>}
                </div>
              </div>

              <div className="um-external-toggle">
                <div>
                  <h4>External Identity</h4>
                  <p>Check if user is from an external vendor or auditor.</p>
                </div>
                <input
                  type="checkbox"
                  name="isExternal"
                  checked={formData.isExternal}
                  onChange={handleInputChange}
                />
              </div>

              <PermissionMatrix
                permissions={formData.permissions}
                role={formData.role}
                onChange={(p) => setFormData(prev => ({ ...prev, permissions: p }))}
              />

              </div>

              <div className="modal-actions">
                <button type="button" className="um-sod-btn" onClick={closeModal} style={{ color: 'var(--um-on-surface-variant)' }}>Cancel</button>
                <button type="submit" className="um-add-btn" disabled={actionLoading} style={{ background: 'var(--um-primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', fontWeight: 'bold' }}>
                  {isEditing ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        user={deleteTarget}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {auditUser && (
        <div className="um-audit-overlay" onClick={() => setAuditUser(null)}>
          <div className="um-audit-sidebar" onClick={e => e.stopPropagation()}>
            <div className="um-audit-header">
              <div>
                <h3>Activity Log</h3>
                <p>{auditUser.username}</p>
              </div>
              <button className="um-modal-close" onClick={() => setAuditUser(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="um-audit-body">
              {auditLoading ? (
                <div className="um-loading-state"><div className="um-spinner" /></div>
              ) : auditLogs.length === 0 ? (
                <div className="um-audit-empty"><p>No activity recorded.</p></div>
              ) : (
                <div className="um-audit-list">
                  {auditLogs.map((log, i) => (
                    <div key={i} className="um-audit-entry">
                      <span className="um-audit-action">{log.action}</span>
                      <p className="um-audit-detail">{log.details}</p>
                      <time className="um-audit-time">{new Date(log.timestamp).toLocaleString()}</time>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default UserManagement;
