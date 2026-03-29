import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  withCredentials: true, // Crucial for BFF/Cookie refresh
});

let refreshPromise = null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { accessToken: token, user: userData } = response.data;
      setAccessToken(token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      return userData;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  };

  const logout = async () => {
    setLogoutLoading(true);
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setAccessToken(null);
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
  };

  const refreshAction = useCallback(async () => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = api.post('/auth/refresh')
      .then(response => {
        const { accessToken: token, user: userData } = response.data;
        setAccessToken(token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return token;
      })
      .catch(err => {
        // If refresh fails (e.g. no cookie), silently clear state
        setUser(null);
        setAccessToken(null);
        delete api.defaults.headers.common['Authorization'];
        // Only reject if it wasn't just a missing token
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          throw err;
        }
      })
      .finally(() => {
        refreshPromise = null;
      });

    return refreshPromise;
  }, []);

  // Silent refresh on boot — failure is expected when not logged in
  useEffect(() => {
    refreshAction().finally(() => setLoading(false));
  }, [refreshAction]);

  // Response interceptor for automatic refresh on 401
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/')
        ) {
          originalRequest._retry = true;
          try {
            const newToken = await refreshAction();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // ignore
          }
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, [refreshAction]);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, refreshAction, loading, logoutLoading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default api;
