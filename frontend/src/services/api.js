const BASE_URL = 'http://localhost:8080/api/v1';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const api = {
  // Dashboard / User Session
  getDashboard: (userId) => 
    fetch(`${BASE_URL}/dashboard/${userId}`).then(handleResponse),
  
  saveDashboard: (userId, data) => 
    fetch(`${BASE_URL}/dashboard/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  // Templates
  getTemplates: () => 
    fetch(`${BASE_URL}/templates`).then(handleResponse),

  getTemplate: (id) => 
    fetch(`${BASE_URL}/templates/${id}`).then(handleResponse),

  createTemplate: (data) => 
    fetch(`${BASE_URL}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  updateTemplate: (id, data) => 
    fetch(`${BASE_URL}/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteTemplate: (id) => 
    fetch(`${BASE_URL}/templates/${id}`, {
      method: 'DELETE',
    }).then(res => res.ok),

  // User Templates
  getUserTemplates: (userId) => 
    fetch(`${BASE_URL}/user-templates/user/${userId}`).then(handleResponse),

  getUserTemplate: (id) => 
    fetch(`${BASE_URL}/user-templates/${id}`).then(handleResponse),

  createUserTemplate: (userId, data) => 
    fetch(`${BASE_URL}/user-templates/user/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  updateUserTemplate: (id, data) => 
    fetch(`${BASE_URL}/user-templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteUserTemplate: (id) => 
    fetch(`${BASE_URL}/user-templates/${id}`, {
      method: 'DELETE',
    }).then(res => res.ok),

  // Versions (History)
  getHistory: (templateId) => 
    fetch(`${BASE_URL}/templates/${templateId}/history`).then(handleResponse),

  getUserHistory: (templateId) => 
    fetch(`${BASE_URL}/user-templates/${templateId}/history`).then(handleResponse),
};
