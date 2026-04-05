import React, { useRef } from 'react';

const FormattingToolbar = ({ onCommand, activeStates = {} }) => {
  const savedRangeRef = useRef(null);

  const commands = [
    { cmd: 'bold', icon: 'format_bold', label: 'Bold' },
    { cmd: 'italic', icon: 'format_italic', label: 'Italic' },
    { cmd: 'underline', icon: 'format_underlined', label: 'Underline' },
    { cmd: 'strikeThrough', icon: 'strikethrough_s', label: 'Strike' },
    { cmd: 'superscript', icon: 'superscript', label: 'Superscript' },
    { cmd: 'subscript', icon: 'subscript', label: 'Subscript' },
    { cmd: 'justifyLeft', icon: 'format_align_left', label: 'Align Left' },
    { cmd: 'justifyCenter', icon: 'format_align_center', label: 'Align Center' },
    { cmd: 'justifyRight', icon: 'format_align_right', label: 'Align Right' },
    { cmd: 'removeFormat', icon: 'format_clear', label: 'Clear' },
  ];

  // Save selection whenever mouse enters the toolbar — before any click steals focus
  const captureSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const handleCommand = (e, cmd, value = null) => {
    e.preventDefault();
    e.stopPropagation();
    // Use the range captured on mouseenter or mousedown (whichever is most recent)
    const sel = window.getSelection();
    let freshRange = null;
    if (sel && sel.rangeCount > 0) {
      freshRange = sel.getRangeAt(0).cloneRange();
    }
    const rangeToUse = freshRange || savedRangeRef.current;
    onCommand(cmd, value, rangeToUse);
  };

  return (
    <div
      className="flex items-center gap-1 bg-white/40 backdrop-blur-md border border-white/40 rounded-xl p-1 shadow-md animate-in fade-in slide-in-from-top-2 duration-300"
      onMouseEnter={captureSelection}
    >
      {commands.map((c) => (
        <button
          key={c.cmd}
          onMouseDown={(e) => handleCommand(e, c.cmd)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 transition-all active:scale-95 ${activeStates[c.cmd] ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]' : 'hover:bg-white hover:text-[var(--color-primary)]'}`}
          title={c.label}
        >
          <span className="material-symbols-outlined text-[18px]">{c.icon}</span>
        </button>
      ))}
      
      <div className="w-[1px] h-4 bg-slate-300 mx-1.5" />
      
      {/* Color Pickers */}
      <div className="relative group flex items-center gap-1.5">
        <div className="flex flex-col items-center gap-0.5">
          <input 
            type="color" 
            className="w-5 h-5 rounded-md border-none cursor-pointer bg-transparent"
            onMouseDown={(e) => {
              e.stopPropagation();
              captureSelection(); // save selection before native picker steals it
            }}
            onChange={(e) => onCommand('foreColor', e.target.value, savedRangeRef.current)}
            title="Text Color"
          />
          <span className="text-[7px] font-black uppercase text-slate-400">Text</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <input 
            type="color" 
            defaultValue="#FFFF00"
            className="w-5 h-5 rounded-md border-none cursor-pointer bg-transparent"
            onMouseDown={(e) => {
              e.stopPropagation();
              captureSelection(); // save selection before native picker steals it
            }}
            onChange={(e) => onCommand('hiliteColor', e.target.value, savedRangeRef.current)}
            title="Highlight Color"
          />
          <span className="text-[7px] font-black uppercase text-slate-400">High</span>
        </div>
      </div>
    </div>
  );
};


export default FormattingToolbar;
