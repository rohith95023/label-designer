import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

import PermissionMatrix from '../components/users/PermissionMatrix';
import ConfirmDeleteModal from '../components/users/ConfirmDeleteModal';
import { useToast } from '../components/common/ToastContext';
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
  const [filterExternal, setFilterExternal] = useState(false);

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Audit log sidebar
  const [auditUser, setAuditUser] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const { success, error: toastError, warn: warning } = useToast();

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
    const matchExternal = !filterExternal || u.isExternal === true;
    return matchSearch && matchRole && matchStatus && matchExternal;
  });

  const handleStatCardClick = (type) => {
    if (type === 'active') {
      setFilterExternal(false);
      setFilterStatus(prev => prev === 'ACTIVE' ? 'ALL' : 'ACTIVE');
    } else if (type === 'locked') {
      setFilterExternal(false);
      setFilterStatus(prev => prev === 'LOCKED' ? 'ALL' : 'LOCKED');
    } else if (type === 'external') {
      setFilterStatus('ALL');
      setFilterExternal(prev => !prev);
    }
  };

  // ── Form Handlers ──────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'password') setPasswordError('');
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
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
    console.log("Submit triggered. isEditing:", isEditing);

    // Client-side validation feedback
    if (!isEditing && !formData.password) {
      toastError('Password is required for new users.');
      return;
    }

    if (!isEditing && !validatePassword(formData.password)) {
      toastError('Password does not meet security requirements.');
      return;
    }

    if (!formData.role) {
      toastError('Please select a system role.');
      return;
    }

    if (isEditing && formData.password && !validatePassword(formData.password)) {
      toastError('New password does not meet security requirements.');
      return;
    }

    setActionLoading(true);
    setFormError('');
    setFieldErrors({});
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
      console.error("Submission error:", err);
      const rawMsg = err.response?.data?.message || err.message || 'Action failed.';
      let genericError = `Failed to ${isEditing ? 'update' : 'create'} user: ${rawMsg}`;
      setFormError(genericError);
      toastError(genericError);
      
      let errorsMap = {};
      
      // Parse errors to assign them to specific fields or generic alert
      if (rawMsg.includes('users_email_key') || rawMsg.toLowerCase().includes('email address is already registered')) {
        errorsMap.email = `This email is already registered.`;
      } else if (rawMsg.includes('users_username_key') || rawMsg.toLowerCase().includes('duplicate key value violates unique constraint') || rawMsg.toLowerCase().includes('username is already taken')) {
        errorsMap.username = `This username is already taken.`;
      } else if (rawMsg.includes('403')) {
        genericError = 'Permission Denied: You do not have permission to manage users.';
      } else if (rawMsg.length > 80) {
        genericError = 'Could not save user. Check for duplicate details.';
      } else {
        genericError = rawMsg;
      }

      setFormError(genericError);
      setFieldErrors(errorsMap);
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
    <>
      <div className="um-container animate-fade-in">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div 
          className="um-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="um-header-left">
            <div className="um-header-icon shadow-xl">
              <span className="material-symbols-outlined text-[28px]">manage_accounts</span>
            </div>
            <div>
              <p className="text-[var(--color-primary)] font-black text-[10px] uppercase tracking-[0.3em] mb-1 opacity-60">Identity & Access Control</p>
              <h1 className="text-3xl font-black text-[var(--color-primary-dark)] tracking-tighter">User Management</h1>
            </div>
          </div>
          <button className="um-add-btn group" onClick={openAddModal}>
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">person_add</span>
            Add System User
          </button>
        </motion.div>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <div className="um-stats-row">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="um-stat-card bg-white border border-slate-200 shadow-sm"
            onClick={() => {
              setFilterStatus('ALL');
              setFilterExternal(false);
              setFilterRole('ALL');
              setSearchQuery('');
            }}
            style={{
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: (filterStatus !== 'ALL' || filterExternal || filterRole !== 'ALL' || searchQuery !== '') ? 1 : 0.85
            }}
          >
            <div className="um-stat-icon-box bg-white shadow-sm">
              <span className="material-symbols-outlined text-[var(--color-primary)]">group</span>
            </div>
            <div className="um-stat-info">
              <span className="um-stat-value text-[var(--color-primary-dark)]">{stats.total}</span>
              <span className="um-stat-label">System-Wide</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="um-stat-card um-stat-active bg-white border border-slate-200 shadow-sm"
            onClick={() => handleStatCardClick('active')}
            style={{
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: filterStatus === 'ACTIVE' ? '0 0 0 3px var(--color-primary-dark)' : 'none',
              transform: filterStatus === 'ACTIVE' ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <div className="um-stat-icon-box bg-white shadow-sm">
              <span className="material-symbols-outlined text-[var(--color-success)] text-[var(--color-success)]">verified_user</span>
            </div>
            <div className="um-stat-info">
              <span className="um-stat-value text-[var(--color-primary-dark)]">{stats.active}</span>
              <span className="um-stat-label">Operational</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="um-stat-card um-stat-locked bg-white border border-slate-200 shadow-sm"
            onClick={() => handleStatCardClick('locked')}
            style={{
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: filterStatus === 'LOCKED' ? '0 0 0 3px var(--color-error)' : 'none',
              transform: filterStatus === 'LOCKED' ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <div className="um-stat-icon-box bg-white shadow-sm">
              <span className="material-symbols-outlined text-[var(--color-error)]">lock</span>
            </div>
            <div className="um-stat-info">
              <span className="um-stat-value text-[var(--color-primary-dark)]">{stats.locked}</span>
              <span className="um-stat-label">Restricted</span>
            </div>
          </motion.div>

          <div
            className="um-stat-card um-stat-external"
            onClick={() => handleStatCardClick('external')}
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: filterExternal ? '2px solid #a78bfa' : '2px solid transparent',
              transform: filterExternal ? 'scale(1.04)' : 'scale(1)',
              boxShadow: filterExternal ? '0 0 0 4px rgba(167,139,250,0.15)' : '',
            }}
            title="Click to filter External users"
          >
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
        <motion.div 
          className="um-filter-bar bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="um-search-wrap">
            <span className="um-search-icon material-symbols-outlined opacity-40">search</span>
            <input
              type="text"
              className="um-search-input bg-white border-none shadow-sm font-bold text-[var(--color-primary-dark)] placeholder:text-[var(--color-primary-dark)]/30"
              placeholder="Search by identity reference, audit trail, or role access..."
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
            className="um-filter-select bg-white border-none shadow-sm font-black text-[var(--color-primary-dark)] uppercase text-[11px] tracking-widest cursor-pointer"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="ALL">All Validated Roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            className="um-filter-select bg-white border-none shadow-sm font-black text-[var(--color-primary-dark)] uppercase text-[11px] tracking-widest cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Account Status</option>
            <option value="ACTIVE">Active Deployment</option>
            <option value="LOCKED">Access Restricted</option>
          </select>
        </motion.div>

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
                {filteredUsers.map((user, idx) => {
                  const isSelf = user.id === currentUser?.id;
                  return (
                    <motion.tr 
                      key={user.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 + 0.6 }}
                      className={`um-row ${user.status === 'LOCKED' ? 'um-row-locked' : ''} ${isSelf ? 'um-row-self bg-[var(--color-primary-light)]/40' : ''}`}
                    >
                      <td>
                        <div className="um-user-cell">
                          <div className={`um-avatar !bg-[var(--color-primary-dark)] shadow-lg shadow-[var(--color-primary-dark)]/20`} data-self={isSelf}>
                            {user.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="um-user-info">
                            <span className="um-username !text-[var(--color-primary-dark)] font-black">
                              {user.username}
                              {isSelf && <span className="um-self-badge !bg-[var(--color-primary-dark)] !text-white ml-2 text-[9px] uppercase px-2 py-0.5 rounded-full">(Primary)</span>}
                            </span>
                            <span className="um-email font-bold text-slate-500">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge role-${user.role?.toLowerCase()} !text-[9px] font-black tracking-widest`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`type-badge type-${user.isExternal ? 'external' : 'internal'} !text-[9px] font-black tracking-widest`}>
                          {user.isExternal ? 'AUDITOR / VENDOR' : 'INTERNAL ASSET'}
                        </span>
                      </td>
                      <td>
                        <div className={`status-badge status-${user.status?.toLowerCase()} !text-[9px] font-black tracking-widest flex items-center gap-2`}>
                          <span className={`status-dot !w-2 !h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'} animate-pulse`} />
                          {user.status}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={`attempts-badge px-3 py-1 rounded-lg text-[11px] font-black ${user.failedLoginAttempts >= 3 ? 'bg-[var(--color-error)] text-white' : 'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]'}`}>
                          {user.failedLoginAttempts} / 5
                        </span>
                      </td>
                      <td className="um-date-cell font-bold text-slate-600">
                        {user.createdAt
                          ? format(new Date(user.createdAt), 'MMM dd, yyyy')
                          : '—'}
                      </td>
                      <td>
                        <div className="um-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="um-action-btn hover:!bg-[var(--color-primary-dark)] hover:!text-white transition-all shadow-sm"
                            title="View Activity Log"
                            onClick={() => openAuditSidebar(user)}
                          >
                            <span className="material-symbols-outlined text-[18px]">history</span>
                          </button>
                          <button
                            className="um-action-btn hover:!bg-[var(--color-primary-dark)] hover:!text-white transition-all shadow-sm"
                            title="Edit Permissions"
                            onClick={() => openEditModal(user)}
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            className={`um-action-btn hover:!text-white transition-all shadow-sm ${user.status === 'LOCKED' ? 'hover:!bg-[var(--color-success)]' : 'hover:!bg-[var(--color-error)]'}`}
                            title={user.status === 'LOCKED' ? 'Unlock Account' : 'Lock Account'}
                            onClick={() => handleToggleLock(user)}
                            disabled={actionLoading || isSelf}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {user.status === 'LOCKED' ? 'lock_open' : 'lock'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
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

      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay !bg-[var(--color-primary-dark)]/80 backdrop-blur-sm" onClick={closeModal}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="modal-content !bg-[var(--color-background)] !rounded-[40px] shadow-[0_32px_120px_rgba(56,36,13,0.3)] border border-white/40" 
              onClick={e => e.stopPropagation()}
            >
              <div className="um-modal-header !p-10 !border-none !bg-transparent">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-[var(--color-primary-dark)] flex items-center justify-center text-white shadow-2xl">
                    <span className="material-symbols-outlined text-[32px]">
                      {isEditing ? 'manage_accounts' : 'person_add'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[var(--color-primary)] font-black text-[11px] uppercase tracking-[0.4em] mb-1 opacity-60">Identity Management</p>
                    <h2 className="text-3xl font-black text-[var(--color-primary-dark)] tracking-tighter">{isEditing ? `Audit Trial: ${formData.username}` : 'Initialize System Account'}</h2>
                  </div>
                </div>
                <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--color-primary-dark)]/30 hover:bg-[var(--color-primary-dark)]/5 hover:text-[var(--color-primary-dark)] transition-all" onClick={closeModal}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

            {formError && (
              <div className="um-alert-card um-alert-danger um-alert-compact" style={{ margin: '0 1.5rem 1rem' }}>
                <span className="material-symbols-outlined">gpp_maybe</span>
                <span className="um-alert-text">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
              <div className="form-grid">
                <div className={`form-group ${fieldErrors.username ? 'has-error' : ''}`}>
                  <label>Username <span className="required-star">*</span></label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={isEditing}
                    required
                    className={fieldErrors.username ? 'um-input-invalid' : ''}
                  />
                  {fieldErrors.username && (
                    <span className="um-field-error">
                      <span className="material-symbols-outlined">error</span>
                      {fieldErrors.username}
                    </span>
                  )}
                </div>
                <div className={`form-group ${fieldErrors.email ? 'has-error' : ''}`}>
                  <label>Email <span className="required-star">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={fieldErrors.email ? 'um-input-invalid' : ''}
                  />
                  {fieldErrors.email && (
                    <span className="um-field-error">
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>error</span>
                      {fieldErrors.email}
                    </span>
                  )}
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

              <div className="modal-actions !p-10 !bg-transparent !border-none">
                <button type="button" className="h-16 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] text-[var(--color-primary-dark)]/40 hover:bg-[var(--color-primary-dark)]/5 transition-all" onClick={closeModal}>Cancel Operation</button>
                <button 
                  type="submit" 
                  className="h-16 px-10 bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] text-white rounded-[24px] shadow-2xl shadow-[var(--color-primary-dark)]/20 flex items-center justify-center gap-4 transition-all font-black uppercase tracking-[0.2em] text-[12px] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="um-spinner !w-5 !h-5 !border-[3px] !border-white/20 !border-t-white" />
                      <span>Synchronizing...</span>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">verified_user</span>
                      {isEditing ? 'Commit Changes' : 'Initialize Account'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDeleteModal
        user={deleteTarget}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      <AnimatePresence>
        {auditUser && (
          <div className="um-audit-overlay !bg-[var(--color-primary-dark)]/60 backdrop-blur-[2px] z-[9999]" onClick={() => setAuditUser(null)}>
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="um-audit-sidebar !bg-[var(--color-background)] !w-[450px] shadow-[-20px_0_60px_rgba(56,36,13,0.2)] border-l border-white/20" 
              onClick={e => e.stopPropagation()}
            >
              <div className="um-audit-header !p-10 !border-b !border-[var(--color-primary-dark)]/5">
                <div>
                  <p className="text-[var(--color-primary)] font-black text-[10px] uppercase tracking-[0.4em] mb-1 opacity-60">Compliance Monitoring</p>
                  <h3 className="text-2xl font-black text-[var(--color-primary-dark)] tracking-tighter">Activity Log</h3>
                  <p className="text-[12px] font-bold opacity-40">Origin: {auditUser.username}</p>
                </div>
                <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--color-primary-dark)]/30 hover:bg-[var(--color-primary-dark)]/5 hover:text-[var(--color-primary-dark)] transition-all" onClick={() => setAuditUser(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="um-audit-body !p-10">
                {auditLoading ? (
                  <div className="um-loading-state !py-20"><div className="um-spinner !w-10 !h-10" /></div>
                ) : auditLogs.length === 0 ? (
                  <div className="um-audit-empty !py-20 text-center opacity-30">
                    <span className="material-symbols-outlined text-[48px] mb-4">history_toggle_off</span>
                    <p className="font-bold uppercase tracking-widest text-[11px]">No activity recorded</p>
                  </div>
                ) : (
                  <div className="um-audit-list space-y-6">
                    {auditLogs.map((log, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="um-audit-entry !p-6 !bg-white !rounded-2xl shadow-sm border border-[var(--color-primary-dark)]/5"
                      >
                        <span className="um-audit-action !text-[var(--color-primary)] !text-[11px] font-black uppercase tracking-widest block mb-2">{log.action}</span>
                        <p className="um-audit-detail !text-[var(--color-primary-dark)] font-bold text-[13px] mb-3 leading-relaxed">{log.details}</p>
                        <div className="flex items-center gap-2 opacity-30">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <time className="um-audit-time font-black text-[10px] uppercase tracking-tighter">{format(new Date(log.timestamp), 'MMM dd | HH:mm:ss')}</time>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserManagement;
