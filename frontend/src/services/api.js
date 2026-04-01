import authApi from '../context/AuthContext';

export const api = {
  // Dashboard / User Session
  getDashboard: (userId) => 
    authApi.get(`/dashboard/${userId}`).then(res => res.data),
  
  saveDashboard: (userId, data) => 
    authApi.post(`/dashboard/${userId}`, data).then(res => res.data),

  // Labels (Unified System)
  getLabels: (status) => 
    authApi.get(`/labels${status ? `?status=${status}` : ''}`).then(res => res.data),

  getLabel: (id) => 
    authApi.get(`/labels/${id}`).then(res => res.data),

  createLabel: (data) => 
    authApi.post('/labels', data).then(res => res.data),

  updateLabel: (id, data) => 
    authApi.put(`/labels/${id}`, data).then(res => res.data),

  deleteLabel: (id) => 
    authApi.delete(`/labels/${id}`).then(res => res.status === 204),

  // Versioning
  getLabelHistory: (id) => 
    authApi.get(`/labels/${id}/versions`).then(res => res.data),

  getLabelVersion: (id, versionNo) => 
    authApi.get(`/labels/${id}/versions/${versionNo}`).then(res => res.data),

  getLatestLabelVersion: (id) => 
    authApi.get(`/labels/${id}/versions/latest`).then(res => res.data),

  saveLabelVersion: (id, designJson) => 
    authApi.post(`/labels/${id}/versions`, designJson).then(res => res.data),

  // Users (Admin Only)
  getUsers: () => 
    authApi.get('/users').then(res => res.data),
    
  createUser: (data) => 
    authApi.post('/users', data).then(res => {
      if (res.data && res.data.success === false) {
        throw { response: { data: { message: res.data.message } } };
      }
      return res.data;
    }),
    
  updateUser: (id, data) => 
    authApi.put(`/users/${id}`, data).then(res => {
      if (res.data && res.data.success === false) {
        throw { response: { data: { message: res.data.message } } };
      }
      return res.data;
    }),
    
  deleteUser: (id) => 
    authApi.delete(`/users/${id}`).then(res => res.status === 200),
    
  lockUser: (id) => 
    authApi.post(`/users/${id}/lock`).then(res => res.status === 200),
    
  unlockUser: (id) => 
    authApi.post(`/users/${id}/unlock`).then(res => res.status === 200),
    
  getRoles: () => 
    authApi.get('/users/roles').then(res => res.data),

  // System Config (Admin Only)
  getSystemConfigs: () =>
    authApi.get('/system-configs').then(res => res.data),
  
  updateSystemConfig: (key, value) =>
    authApi.post('/system-configs', { key, value }).then(res => res.data),

  // Permissions (Admin Only)
  getPermissionsByRole: (roleId) =>
    authApi.get(`/permissions/role/${roleId}`).then(res => res.data),

  updatePermission: (permissionId, allowed) =>
    authApi.patch(`/permissions/${permissionId}`, allowed).then(res => res.data),

  // Electronic Signatures
  createSignature: (data) =>
    authApi.post('/signatures', data).then(res => res.data),

  // Audit Logs (Admin Only)
  getAuditLogs: (page = 0, size = 50) =>
    authApi.get(`/audit-logs?page=${page}&size=${size}`).then(res => res.data),

  getUserAuditLogs: (userId, page = 0, size = 20) =>
    authApi.get(`/audit-logs/user/${userId}?page=${page}&size=${size}`).then(res => res.data),

  getModuleAuditLogs: (module, page = 0, size = 50) =>
    authApi.get(`/audit-logs/module/${module}?page=${page}&size=${size}`).then(res => res.data),
};

