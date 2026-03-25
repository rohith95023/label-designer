import React, { useState } from 'react';
import { LABEL_PRESETS } from '../../context/LabelContext';

export default function LabelSizeModal({ onConfirm, onCancel, onSkip, currentSize }) {
  const MM_TO_PX = 3.7795275591;
  const initialPreset = LABEL_PRESETS.find(p => p.w === currentSize?.w && p.h === currentSize?.h)?.id || 'custom';

  const [selected, setSelected] = useState(initialPreset);
  const [customW, setCustomW] = useState(currentSize ? Math.round(currentSize.w / MM_TO_PX) : 150);
  const [customH, setCustomH] = useState(currentSize ? Math.round(currentSize.h / MM_TO_PX) : 80);


  const handleConfirm = () => {
    if (selected === 'custom') {
      onConfirm(Math.round(customW * MM_TO_PX), Math.round(customH * MM_TO_PX));
    } else {
      const preset = LABEL_PRESETS.find(p => p.id === selected);
      onConfirm(preset.w, preset.h);
    }
  };

  const preset = LABEL_PRESETS.find(p => p.id === selected);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] p-8 flex flex-col gap-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">aspect_ratio</span>
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 tracking-tight leading-none mb-1">Choose Label Size</h2>
            <p className="text-[11px] text-slate-500">Sets the artboard area for your design.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {LABEL_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                selected === p.id
                  ? 'border-primary bg-primary-fixed/20 text-primary'
                  : 'border-outline-variant/30 hover:border-primary/50 text-slate-600'
              }`}
            >
              <p className="text-[11px] font-bold">{p.name}</p>
              {p.id !== 'custom' && (
                <p className="text-[9px] text-slate-400 mt-0.5">{p.w}×{p.h}px</p>
              )}
            </button>
          ))}
        </div>

        {selected === 'custom' && (
          <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
            <div className="flex-1">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Width (mm)</label>
              <input
                type="number" min="20" max="500"
                value={customW}
                onChange={e => setCustomW(parseInt(e.target.value))}
                className="w-full border border-outline-variant/40 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-primary outline-none"
              />
            </div>
            <span className="text-slate-400 font-bold mt-4">×</span>
            <div className="flex-1">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Height (mm)</label>
              <input
                type="number" min="20" max="500"
                value={customH}
                onChange={e => setCustomH(parseInt(e.target.value))}
                className="w-full border border-outline-variant/40 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-primary outline-none"
              />
            </div>
          </div>
        )}

        {selected !== 'custom' && preset && (
          <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 text-sm">
            <span className="material-symbols-outlined text-primary text-xl">info</span>
            <p className="text-slate-600 text-xs leading-relaxed">
              <span className="font-bold text-slate-800">{preset.name}</span> — artboard will be{' '}
              <span className="font-mono text-primary">{preset.w}×{preset.h}px</span>.
              All elements will be constrained inside this area.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <div className="flex gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant/40 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl btn-gradient text-white text-sm font-bold active:scale-95 transition-all"
            >
              Set New Size →
            </button>
          </div>

          {onSkip && (
            <button
              onClick={onSkip}
              className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">fast_forward</span>
              Skip & Use Original Size
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
