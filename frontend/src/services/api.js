import authApi from '../context/AuthContext';

export const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8080';

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

  saveLabelVersion: (id, data) => 
    authApi.post(`/labels/${id}/versions`, data).then(res => res.data),
  
  updateLatestVersion: (id, data) => 
    authApi.put(`/labels/${id}/versions/latest`, data).then(res => res.data),

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

  // Label Stocks
  getLabelStocks: () => authApi.get('/label-stocks').then(res => res.data),
  getLabelStock: (id) => authApi.get(`/label-stocks/${id}`).then(res => res.data),
  createLabelStock: (data) => authApi.post('/label-stocks', data).then(res => res.data),
  updateLabelStock: (id, data) => authApi.put(`/label-stocks/${id}`, data).then(res => res.data),
  deleteLabelStock: (id) => authApi.delete(`/label-stocks/${id}`).then(res => res.status === 204),

  // Placeholders
  getPlaceholders: () => authApi.get('/placeholders').then(res => res.data),
  getPlaceholder: (id) => authApi.get(`/placeholders/${id}`).then(res => res.data),
  createPlaceholder: (data) => authApi.post('/placeholders', data).then(res => res.data),
  updatePlaceholder: (id, data) => authApi.put(`/placeholders/${id}`, data).then(res => res.data),
  deletePlaceholder: (id) => authApi.delete(`/placeholders/${id}`).then(res => res.status === 204),

  // Objects (Assets)
  getObjects: () => authApi.get('/objects').then(res => res.data),
  getObjectsByStatus: (status) => authApi.get(`/objects/status/${status}`).then(res => res.data),
  getObject: (id) => authApi.get(`/objects/${id}`).then(res => res.data),
  getObjectVersions: (id) => authApi.get(`/objects/${id}/versions`).then(res => res.data),
  uploadObject: (formData) => authApi.post('/objects/upload', formData).then(res => res.data),
  replaceObject: (id, formData) => authApi.post(`/objects/${id}/replace`, formData).then(res => res.data),
  activateObjectVersion: (id) => authApi.post(`/objects/${id}/activate`).then(res => res.data),
  updateObject: (id, data) => {
    const params = new URLSearchParams();
    params.append('name', data.name);
    params.append('type', data.type);
    if (data.description) params.append('description', data.description);
    if (data.tags) params.append('tags', data.tags);
    return authApi.put(`/objects/${id}?${params.toString()}`).then(res => res.data);
  },
  deleteObject: (id) => authApi.delete(`/objects/${id}`).then(res => res.status === 204),

  // Languages
  getLanguages: () => authApi.get('/languages').then(res => res.data),
  getLanguage: (id) => authApi.get(`/languages/${id}`).then(res => res.data),
  createLanguage: (data) => authApi.post('/languages', data).then(res => res.data),
  updateLanguage: (id, data) => authApi.put(`/languages/${id}`, data).then(res => res.data),
  deleteLanguage: (id) => authApi.delete(`/languages/${id}`).then(res => res.status === 204),

  // Phrases
  getPhrases: () => authApi.get('/phrases').then(res => res.data),
  getPhrase: (id) => authApi.get(`/phrases/${id}`).then(res => res.data),
  createPhrase: (data) => authApi.post('/phrases', data).then(res => res.data),
  updatePhrase: (id, data) => authApi.put(`/phrases/${id}`, data).then(res => res.data),
  deletePhrase: (id) => authApi.delete(`/phrases/${id}`).then(res => res.status === 204),

  // Translations
  getTranslations: () => authApi.get('/translations').then(res => res.data),
  getTranslationsByPhrase: (phraseId) => authApi.get(`/translations/phrase/${phraseId}`).then(res => res.data),
  getTranslationsByLanguage: (languageId) => authApi.get(`/translations/language/${languageId}`).then(res => res.data),
  createTranslation: (data) => authApi.post('/translations', data).then(res => res.data),
  updateTranslation: (id, data) => authApi.put(`/translations/${id}`, data).then(res => res.data),
  deleteTranslation: (id) => authApi.delete(`/translations/${id}`).then(res => res.status === 204),

  // Approvals
  getApprovals: () => authApi.get('/approvals').then(res => res.data),
  getApprovalsByLabel: (labelId) => authApi.get(`/approvals/label/${labelId}`).then(res => res.data),
  submitForApproval: (labelId, versionNo, comments) => 
    authApi.post(`/approvals/submit?labelId=${labelId}&versionNo=${versionNo}${comments ? `&comments=${encodeURIComponent(comments)}` : ''}`).then(res => res.data),
  approveLabel: (id, comments) => 
    authApi.post(`/approvals/${id}/approve${comments ? `?comments=${encodeURIComponent(comments)}` : ''}`).then(res => res.data),
  rejectLabel: (id, comments) => 
    authApi.post(`/approvals/${id}/reject${comments ? `?comments=${encodeURIComponent(comments)}` : ''}`).then(res => res.data),

  // Print Requests
  getPrintRequests: () => authApi.get('/print-requests').then(res => res.data),
  getMyPrintRequests: () => authApi.get('/print-requests/my').then(res => res.data),
  createPrintRequest: (data) => authApi.post('/print-requests', data).then(res => res.data),
  updatePrintRequestStatus: (id, status) => authApi.patch(`/print-requests/${id}/status?status=${status}`).then(res => res.data),
};


