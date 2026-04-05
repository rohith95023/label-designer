import React, { useState, useEffect } from 'react';
import { LABEL_PRESETS, useLabel } from '../../context/LabelContext';

export default function LabelSizeModal({ onConfirm, onCancel, onSkip, currentSize, isEditMode = false }) {
  const { meta, fromPx, toPx, UNITS } = useLabel();
  const unit = meta.unit || UNITS.MM;

  const initialPreset = LABEL_PRESETS.find(p => p.w === currentSize?.w && p.h === currentSize?.h)?.id || 'custom';

  const [selected, setSelected] = useState(initialPreset);
  
  // State for inputs should be in the current user-facing unit
  const [inputW, setInputW] = useState(currentSize ? Number(fromPx(currentSize.w, unit).toFixed(2)) : 100);
  const [inputH, setInputH] = useState(currentSize ? Number(fromPx(currentSize.h, unit).toFixed(2)) : 100);

  // Sync inputs if unit changes or currentSize changes
  useEffect(() => {
    if (currentSize) {
      setInputW(Number(fromPx(currentSize.w, unit).toFixed(2)));
      setInputH(Number(fromPx(currentSize.h, unit).toFixed(2)));
    }
  }, [unit, currentSize]);

  const handleConfirm = () => {
    if (selected === 'custom') {
      // Convert back to pixels for the context
      onConfirm(toPx(inputW, unit), toPx(inputH, unit));
    } else {
      const preset = LABEL_PRESETS.find(p => p.id === selected);
      onConfirm(preset.w, preset.h);
    }
  };

  const preset = LABEL_PRESETS.find(p => p.id === selected);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] p-8 flex flex-col gap-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">aspect_ratio</span>
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 tracking-tight leading-none mb-1">{isEditMode ? 'Edit Label Size' : 'Choose Label Size'}</h2>
            <p className="text-[11px] text-slate-500">{isEditMode ? 'Resize the artboard area for your design.' : 'Sets the artboard area for your design.'}</p>
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
              {p.id === 'custom' ? (
                <p className="text-[9px] text-slate-400 mt-0.5">{inputW}×{inputH}{unit}</p>
              ) : (
                <p className="text-[9px] text-slate-400 mt-0.5">{fromPx(p.w, unit).toFixed(1)}×{fromPx(p.h, unit).toFixed(1)}{unit}</p>
              )}
            </button>
          ))}
        </div>

        {selected === 'custom' && (
          <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
            <div className="flex-1">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Width ({unit})</label>
              <input
                type="number" step="0.1"
                value={inputW}
                onChange={e => setInputW(parseFloat(e.target.value) || 0)}
                className="w-full border border-outline-variant/40 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-primary outline-none"
              />
            </div>
            <span className="text-slate-400 font-bold mt-4">×</span>
            <div className="flex-1">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Height ({unit})</label>
              <input
                type="number" step="0.1"
                value={inputH}
                onChange={e => setInputH(parseFloat(e.target.value) || 0)}
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
              <span className="font-mono text-primary">{fromPx(preset.w, unit).toFixed(2)}×{fromPx(preset.h, unit).toFixed(2)}{unit}</span>.
              All elements will be constrained inside this area.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <div className="flex gap-3 justify-center">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-8 py-2.5 rounded-xl border border-outline-variant/40 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleConfirm}
              className="px-12 py-2.5 rounded-xl btn-gradient text-white text-sm font-bold active:scale-95 transition-all"
            >
              {isEditMode ? 'Apply Size' : 'Set New Size →'}
            </button>
          </div>

          {onSkip && !isEditMode && (
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
