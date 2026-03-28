import authApi from '../context/AuthContext';

export const api = {
  // Dashboard / User Session
  getDashboard: (userId) => 
    authApi.get(`/dashboard/${userId}`).then(res => res.data),
  
  saveDashboard: (userId, data) => 
    authApi.post(`/dashboard/${userId}`, data).then(res => res.data),

  // Templates (System)
  getTemplates: () => 
    authApi.get('/templates').then(res => res.data),

  getTemplate: (id) => 
    authApi.get(`/templates/${id}`).then(res => res.data),

  createTemplate: (data) => 
    authApi.post('/templates', data).then(res => res.data),

  updateTemplate: (id, data) => 
    authApi.put(`/templates/${id}`, data).then(res => res.data),

  deleteTemplate: (id) => 
    authApi.delete(`/templates/${id}`).then(res => res.status === 200),

  // User Templates (Saved templates)
  getUserTemplates: (userId) => 
    authApi.get(`/user-templates/user/${userId}`).then(res => res.data),

  getUserTemplate: (id) => 
    authApi.get(`/user-templates/${id}`).then(res => res.data),

  createUserTemplate: (userId, data) => 
    authApi.post(`/user-templates/user/${userId}`, data).then(res => res.data),

  updateUserTemplate: (id, data) => 
    authApi.put(`/user-templates/${id}`, data).then(res => res.data),

  deleteUserTemplate: (id) => 
    authApi.delete(`/user-templates/${id}`).then(res => res.status === 200),

  // Versions (History)
  getHistory: (templateId) => 
    authApi.get(`/templates/${templateId}/history`).then(res => res.data),

  getUserHistory: (templateId) => 
    authApi.get(`/user-templates/${templateId}/history`).then(res => res.data),

  // Users (Admin Only)
  getUsers: () => 
    authApi.get('/users').then(res => res.data),
    
  createUser: (data) => 
    authApi.post('/users', data).then(res => res.data),
    
  updateUser: (id, data) => 
    authApi.put(`/users/${id}`, data).then(res => res.data),
    
  deleteUser: (id) => 
    authApi.delete(`/users/${id}`).then(res => res.status === 200),
    
  lockUser: (id) => 
    authApi.post(`/users/${id}/lock`).then(res => res.status === 200),
    
  unlockUser: (id) => 
    authApi.post(`/users/${id}/unlock`).then(res => res.status === 200),
    
  getRoles: () => 
    authApi.get('/users/roles').then(res => res.data),
};
