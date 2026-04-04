import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function TemplateConflictModal({ 
  isOpen, 
  onClose, 
  onClearAndLoad, 
  onCreateNew, 
  canvasName = 'Untitled Label',
  replaceLabel = 'Replace Current Design',
  replaceDescription = `Clears all elements in "${canvasName}"`,
  showCreateNew = true,
  title = 'Already active label found'
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-900 rounded-[32px] shadow-3xl w-full max-w-md overflow-hidden border border-white/20 dark:border-white/10"
      >
        {/* Header with Icon */}
        <div className="pt-8 px-8 pb-4 flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-6 shadow-sm border border-amber-100 dark:border-amber-800/30">
            <span className="material-symbols-outlined text-amber-500 text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome_motion
            </span>
          </div>
          
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight text-center">
            {title}
          </h2>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-2 text-center leading-relaxed">
            Choose whether to replace your current workspace or start fresh in a new file.
          </p>
        </div>

        {/* Content / Options */}
        <div className="p-6 pt-2 flex flex-col gap-3">
          
          <button
            onClick={onClearAndLoad}
            className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-red-50 dark:bg-slate-800/50 dark:hover:bg-red-900/10 border border-slate-200/50 dark:border-white/5 hover:border-red-200 dark:hover:border-red-800 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-red-500 shadow-sm border border-slate-100 dark:border-white/5 transition-colors">
              <span className="material-symbols-outlined text-[20px]">layers_clear</span>
            </div>
            <div className="flex-1">
              <span className="block text-[13px] font-bold text-slate-800 dark:text-white">{replaceLabel}</span>
              <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{replaceDescription}</span>
            </div>
            <span className="material-symbols-outlined text-slate-300 group-hover:text-red-400 transition-colors">chevron_right</span>
          </button>

          {showCreateNew && (
            <button
              onClick={onCreateNew}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 border border-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shadow-inner border border-white/20">
                <span className="material-symbols-outlined text-[20px]">add_box</span>
              </div>
              <div className="flex-1">
                <span className="block text-[13px] font-bold text-white">Create New Label</span>
                <span className="block text-[10px] font-medium text-blue-100 mt-0.5">Keep current work and start a new canvas</span>
              </div>
              <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors">chevron_right</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="mt-2 w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all text-center"
          >
            Cancel and Discard Template
          </button>
        </div>
        
        {/* Progress Footer (Subtle) */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800 mt-2">
            <div className="h-full w-1/3 bg-blue-500"></div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
