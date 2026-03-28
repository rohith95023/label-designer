import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {}, setAuthUser: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('pharma-theme');
    return saved || 'light';
  });
  const [authUserId, setAuthUserId] = useState(null);

  // Apply theme to DOM and persist to localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pharma-theme', theme);
  }, [theme]);

  // Sync to backend only when authenticated
  useEffect(() => {
    if (!authUserId) return;
    api.saveDashboard(authUserId, {
      dashboardPreferences: { theme }
    }).catch(err => console.error('Failed to sync theme to backend', err));
  }, [theme, authUserId]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setAuthUser: setAuthUserId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
