import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import AppLayout from '../components/common/AppLayout';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
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
    role: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        api.getUsers(),
        api.getRoles()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load users. Are you an admin?');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ id: null, username: '', email: '', password: '', role: roles[0] || '' });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setIsEditing(true);
    setFormData({
      id: user.id,
      username: user.username,
      email: user.email,
      password: '', // Blank unless they want to change it
      role: user.role
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.updateUser(formData.id, {
          username: formData.username,
          email: formData.email,
          password: formData.password || null,
          role: formData.role
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

      {error && <div className="error-alert">{error}</div>}

      <div className="table-responsive">
        <table className="user-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
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
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>{isEditing ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  required={!isEditing}
                  minLength={8}
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleInputChange} required>
                  <option value="" disabled>Select a role...</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

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
