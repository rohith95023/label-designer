import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'info' | 'warning'
  loading = false,
  icon = null
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      accent: 'linear-gradient(135deg, #ef4444, #991b1b)',
      icon: icon || 'delete_forever',
      btn: 'bg-red-600 hover:bg-red-700 shadow-red-200',
      text: 'text-red-700',
      bgIcon: 'bg-red-50 text-red-600'
    },
    warning: {
      accent: 'linear-gradient(135deg, #f59e0b, #b45309)',
      icon: icon || 'warning',
      btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
      text: 'text-amber-800',
      bgIcon: 'bg-amber-50 text-amber-600'
    },
    info: {
      accent: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
      icon: icon || 'info',
      btn: 'bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] shadow-blue-200',
      text: 'text-slate-700',
      bgIcon: 'bg-blue-50 text-[var(--color-primary-dark)]'
    }
  }[type];

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/40"
      >
        {/* Accent Top Bar */}
        <div style={{ background: typeConfig.accent }} className="h-1.5 w-full" />

        <div className="p-8 pt-10 flex flex-col items-center text-center">
          {/* Icon Circle */}
          <div className={`w-20 h-20 rounded-[28px] ${typeConfig.bgIcon} flex items-center justify-center mb-6 shadow-sm border border-white`}>
            <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {typeConfig.icon}
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
            {title}
          </h2>
          
          <p className={`text-[14px] font-medium leading-relaxed opacity-80 ${typeConfig.text} px-4`}>
            {message}
          </p>

          {/* FDA Compliance Subtext (Implicitly themed) */}
          <div className="mt-6 py-2 px-4 bg-slate-50 rounded-2xl flex items-center gap-2 border border-slate-100">
             <span className="material-symbols-outlined text-slate-400 text-[16px]">verified_user</span>
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Regulatory Protection Protocol Active</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-10 flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.15em] text-[12px] transition-all active:scale-[0.98] disabled:opacity-50 ${typeConfig.btn}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">{typeConfig.icon}</span>
                {confirmText}
              </>
            )}
          </button>
          
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full h-14 rounded-2xl flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            {cancelText}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
