import React, { useState } from 'react';

export default function FileNameModal({ onConfirm, onCancel, onOpen, recentFiles, onSelectRecent }) {
  const [name, setName] = useState('');
  const valid = name.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (valid) onConfirm(name.trim());
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[420px] p-8 flex flex-col gap-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">drive_file_rename_outline</span>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-800 tracking-tight leading-none mb-1">Create or Open Label</h2>
            </div>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex items-center justify-center -mt-2 -mr-2">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>


        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Label Name <span className="text-error">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Cough Syrup 100ml Label"
              className="w-full border border-outline-variant/40 rounded-lg px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {name.length > 0 && !valid && (
              <p className="text-error text-[10px] mt-1">Name cannot be empty.</p>
            )}
          </div>

          <div className="flex pt-2 justify-center">
            <button
              type="submit"
              disabled={!valid}
              className="px-12 py-2.5 rounded-xl btn-gradient text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              Continue →
            </button>
          </div>
        </form>

        {onOpen && (
          <div className="pt-2 border-t border-outline-variant/15 flex flex-col gap-3">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-2">or</p>
            <button
              onClick={onOpen}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 text-[13px] font-bold transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              Upload
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
