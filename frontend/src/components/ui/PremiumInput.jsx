import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Input Component
 * Glass style with focus glow effects
 */
export default function PremiumInput({ 
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  icon,
  error,
  className = '',
  ...props 
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            {icon}
          </span>
        )}
        <motion.input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`
            input-premium
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          `}
          whileFocus={{ 
            scale: 1.01,
            boxShadow: '0 0 0 3px rgba(99,102,241,0.14), 0 0 20px rgba(99,102,241,0.1)'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          {...props}
        />
      </div>
      {error && (
        <motion.span 
          className="text-[10px] text-red-500 font-medium"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.span>
      )}
    </div>
  );
}
