import React from 'react';

const FormattingToolbar = ({ onCommand }) => {
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

  const handleCommand = (e, cmd, value = null) => {
    console.log(`[FormattingToolbar] Command: ${cmd}, Value: ${value}`);
    console.log(`[FormattingToolbar] Focused Element:`, document.activeElement);
    e.preventDefault();
    e.stopPropagation();
    onCommand(cmd, value);
  };

  return (
    <div className="flex items-center gap-1 bg-white/40 backdrop-blur-md border border-white/40 rounded-xl p-1 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
      {commands.map((c) => (
        <button
          key={c.cmd}
          onMouseDown={(e) => handleCommand(e, c.cmd)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white text-slate-700 hover:text-[var(--color-primary)] transition-all active:scale-95"
          title={c.label}
        >
          <span className="material-symbols-outlined text-[18px]">{c.icon}</span>
        </button>
      ))}
      
      <div className="w-[1px] h-4 bg-slate-300 mx-1.5" />
      
      {/* Color Picker Shorthand (Basic) */}
      <div className="relative group flex items-center gap-1.5">
        <div className="flex flex-col items-center gap-0.5">
          <input 
            type="color" 
            className="w-5 h-5 rounded-md border-none cursor-pointer bg-transparent"
            onInput={(e) => onCommand('foreColor', e.target.value)}
            onMouseDown={(e) => e.stopPropagation()} /* Allow native picker */
            title="Text Color"
          />
          <span className="text-[7px] font-black uppercase text-slate-400">Text</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <input 
            type="color" 
            defaultValue="#FFFF00"
            className="w-5 h-5 rounded-md border-none cursor-pointer bg-transparent"
            onInput={(e) => onCommand('hiliteColor', e.target.value)}
            onMouseDown={(e) => e.stopPropagation()} /* Allow native picker */
            title="Highlight Color"
          />
          <span className="text-[7px] font-black uppercase text-slate-400">High</span>
        </div>
      </div>
    </div>
  );
};


export default FormattingToolbar;
