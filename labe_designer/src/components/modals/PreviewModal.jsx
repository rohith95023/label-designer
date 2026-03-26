import { createPortal } from 'react-dom';
import LabelPreview from '../common/LabelPreview';

export default function PreviewModal({ isOpen, onClose, elements, meta, title }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4 lg:p-10">
      <div className="glass-card bg-white dark:bg-slate-800 rounded-3xl shadow-float max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">visibility</span>
             </div>
             <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{title || 'Label Preview'}</h3>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Compliance Visualizer</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 lg:p-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 relative">
           <div className="relative group transition-transform duration-500 hover:scale-[1.02]">
             <LabelPreview elements={elements} meta={meta} scale={1} />
           </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3 bg-white dark:bg-slate-800 shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
