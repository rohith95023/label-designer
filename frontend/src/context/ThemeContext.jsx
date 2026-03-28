import React, { createContext, useContext, useEffect, useState } from 'react';

import { getGuestId } from '../utils/auth';
import { api } from '../services/api';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('pharma-theme');
    return saved || 'light';
  });

  // Sync theme to backend if guest ID exists
  useEffect(() => {
    const guestId = getGuestId();
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('pharma-theme', theme);
    
    // Fire and forget update to backend
    api.saveDashboard(guestId, {
      dashboardPreferences: { theme }
    }).catch(err => console.error('Failed to sync theme to backend', err));
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));


  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
