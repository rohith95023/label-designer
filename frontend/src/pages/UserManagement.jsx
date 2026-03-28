import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import AppLayout from '../components/common/AppLayout';
import PermissionMatrix from '../components/users/PermissionMatrix';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [systemConfigs, setSystemConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    username: '',
    email: '',
    password: '',
    role: '',
    isExternal: false,
    permissions: []
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, configsData] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getSystemConfigs()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setSystemConfigs(configsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load users. Are you an admin?');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (name === 'password') {
      setPasswordError('');
    }
  };

  const validatePassword = (password) => {
    if (!password) return true; // Allow empty for edit mode
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/\d/.test(password)) {
      setPasswordError('Password must contain at least one digit');
      return false;
    }
    if (!/[@$!%*?&]/.test(password)) {
      setPasswordError('Password must contain at least one special character (@$!%*?&)');
      return false;
    }
    return true;
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ id: null, username: '', email: '', password: '', role: roles[0] || '', isExternal: false, permissions: [] });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setIsEditing(true);
    setFormData({
      id: user.id,
      username: user.username,
      email: user.email,
      password: '', // Blank unless they want to change it
      role: user.role,
      isExternal: user.isExternal || false,
      permissions: user.permissions || []
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing && !validatePassword(formData.password)) {
      return;
    }
    if (isEditing && formData.password && !validatePassword(formData.password)) {
      return;
    }
    try {
      if (isEditing) {
        await api.updateUser(formData.id, {
          email: formData.email,
          password: formData.password || null,
          role: formData.role,
          isExternal: formData.isExternal,
          permissions: formData.permissions
        });
      } else {
        await api.createUser(formData);
      }
      closeModal();
      fetchData(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user.');
    }
  };

  const handleToggleLock = async (user) => {
    try {
      if (user.status === 'LOCKED') {
        await api.unlockUser(user.id);
      } else {
        await api.lockUser(user.id);
      }
      fetchData();
    } catch (err) {
      console.error('Error toggling lock status:', err);
      setError('Failed to update user status.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      try {
        await api.deleteUser(id);
        fetchData();
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user.');
      }
    }
  };

  const handleToggleSystemConfig = async (key, currentValue) => {
    try {
      const newValue = currentValue === 'true' ? 'false' : 'true';
      await api.updateSystemConfig(key, newValue);
      fetchData(); // Refresh list to get new config values
    } catch (err) {
      console.error('Error updating system config:', err);
      setError('Failed to update compliance setting.');
    }
  };

  const sodConfig = systemConfigs.find(c => c.configKey === 'sod.prevent_same_user_approve');

  if (loading && users.length === 0) return (
    <AppLayout activePage="users">
      <div className="user-management-loading">Loading users...</div>
    </AppLayout>
  );

  return (
    <AppLayout activePage="users">
      <div className="user-management-container">
        <div className="header-actions">
          <h1>User Management</h1>
          <button className="primary-btn" onClick={openAddModal}>+ Add User</button>
        </div>

        {sodConfig && (
          <div className="compliance-banner glass-card">
            <div className="banner-content">
              <span className="material-symbols-outlined banner-icon">verified_user</span>
              <div className="banner-text">
                <h3>Global Compliance Module</h3>
                <p>Segregation of Duties (SoD) is currently <strong>{sodConfig.configValue === 'true' ? 'Active' : 'Disabled'}</strong>.</p>
              </div>
            </div>
            <button 
              className={`toggle-btn ${sodConfig.configValue === 'true' ? 'enforced' : ''}`}
              onClick={() => handleToggleSystemConfig(sodConfig.configKey, sodConfig.configValue)}
            >
              {sodConfig.configValue === 'true' ? 'Deactivate SoD' : 'Enforce SoD Policy'}
            </button>
          </div>
        )}

      {error && <div className="error-alert">{error}</div>}

      <div className="table-responsive">
        <table className="user-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
               <th>Role</th>
              <th>Type</th>
              <th>Status</th>
              <th>Failed Attempts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={user.status === 'LOCKED' ? 'locked-row' : ''}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                 <td><span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span></td>
                <td>
                  <span className={`type-badge ${user.isExternal ? 'type-external' : 'type-internal'}`}>
                    {user.isExternal ? 'External' : 'Internal'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.failedLoginAttempts}</td>
                <td className="actions-cell">
                  <button className="icon-btn edit-btn" onClick={() => openEditModal(user)} title="Edit user">✏️</button>
                  <button 
                    className={`icon-btn lock-btn ${user.status === 'LOCKED' ? 'unlock' : 'lock'}`} 
                    onClick={() => handleToggleLock(user)}
                    title={user.status === 'LOCKED' ? 'Unlock user' : 'Lock user'}
                  >
                    {user.status === 'LOCKED' ? '🔓' : '🔒'}
                  </button>
                  <button className="icon-btn delete-btn" onClick={() => handleDelete(user.id)} title="Delete user">🗑️</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="empty-state">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isEditing ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Username</label>
                  <input 
                    type="text" 
                    name="username" 
                    placeholder="Enter unique clinical ID"
                    value={formData.username} 
                    onChange={handleInputChange} 
                    disabled={isEditing}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="name@organization.com"
                    value={formData.email} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Personnel Role</label>
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleInputChange} 
                    required
                  >
                    <option value="" disabled>Select clinical role...</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <p className="text-[10px] mt-1 text-on-surface-variant font-medium opacity-60 italic">Determines base access privileges.</p>
                </div>

                <div className="form-group">
                  <label>Authentication</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      name="password" 
                      placeholder={isEditing ? "••••••••" : "Min 8 chars..."}
                      value={formData.password} 
                      onChange={handleInputChange} 
                      required={!isEditing}
                      minLength={8}
                    />
                    {passwordError && <p className="password-error">{passwordError}</p>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 p-4 rounded-xl bg-surface-container-low border border-outline-variant/5 mt-4">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-on-surface mb-0.5">External Identity</h4>
                  <p className="text-[10px] text-on-surface-variant opacity-70">Mark if this user is a third-party vendor or auditor.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="isExternal" 
                    className="sr-only peer"
                    checked={formData.isExternal} 
                    onChange={handleInputChange} 
                  />
                  <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="form-divider"></div>

              <PermissionMatrix 
                permissions={formData.permissions} 
                onChange={(perms) => setFormData(prev => ({ ...prev, permissions: perms }))}
                role={formData.role}
              />

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
};

export default UserManagement;
