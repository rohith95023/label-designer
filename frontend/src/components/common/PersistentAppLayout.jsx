import React from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from './AppLayout';

/**
 * Persists the AppLayout across dashboard pages to avoid
 * re-mounting (and re-animating) the header/sidebar on every navigation.
 */
export default function PersistentAppLayout({ children }) {
  const location = useLocation();
  
  // Map path to activePage key
  const getActivePage = (path) => {
    if (path === '/') return 'dashboard';
    if (path === '/assets') return 'assets';
    if (path === '/saved-templates') return 'saved-templates';
    if (path === '/history') return 'history';
    if (path === '/translation') return 'translation';
    if (path === '/print-requests') return 'print';
    if (path === '/settings') return 'settings';
    if (path.startsWith('/admin')) return 'users';
    if (path.startsWith('/masters')) return path.split('/').pop();
    return '';
  };

  const activePage = getActivePage(location.pathname);

  return (
    <AppLayout activePage={activePage}>
      {children}
    </AppLayout>
  );
}
