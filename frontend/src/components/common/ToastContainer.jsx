import React, { useEffect, useRef } from 'react';

const ICONS = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const COLORS = {
  success: 'var(--color-success, #16a34a)',
  error: 'var(--color-error, #dc2626)',
  warning: '#d97706',
  info: 'var(--color-primary, #0096EB)',
};

const Toast = ({ id, type = 'info', message, onDismiss, duration = 4000 }) => {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timerRef.current);
  }, [id, duration, onDismiss]);

  return (
    <div
      className="toast-item"
      style={{ '--toast-color': COLORS[type] }}
      onClick={() => onDismiss(id)}
    >
      <span className="material-symbols-outlined toast-icon">{ICONS[type]}</span>
      <p className="toast-message">{message}</p>
      <button className="toast-close" onClick={() => onDismiss(id)}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default ToastContainer;

// Hook for easy usage
let _toastCount = 0;
export function useToast() {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((message, type = 'info', duration = 4000) => {
    _toastCount++;
    const id = _toastCount;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const dismissToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = React.useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = React.useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const warning = React.useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const info = React.useCallback((msg) => addToast(msg, 'info'), [addToast]);

  return { toasts, addToast, dismissToast, success, error, warning, info };
}
