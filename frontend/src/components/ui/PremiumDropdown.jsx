import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Premium Dropdown Component
 * Smooth open animation with glass effect
 */
export default function PremiumDropdown({ 
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Select...',
  className = '',
  ...props 
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </label>
      )}
      <div className="relative">
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-2.5 text-sm rounded-xl 
            bg-surface-container-low border border-outline-variant
            text-left flex items-center justify-between
            transition-all duration-200
            ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'hover:border-slate-300'}
          `}
          whileTap={{ scale: 0.98 }}
        >
          <span className={selectedOption ? 'text-on-surface' : 'text-slate-400'}>
            {selectedOption?.label || placeholder}
          </span>
          <motion.span 
            className="material-symbols-outlined text-slate-400 text-[18px]"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            expand_more
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
              />
              
              {/* Dropdown Menu */}
              <motion.div
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-xl shadow-soft border border-outline-variant overflow-hidden"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {options.map((option, index) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={`
                        w-full px-4 py-2.5 text-sm text-left
                        flex items-center gap-3
                        transition-colors duration-150
                        ${value === option.value 
                          ? 'bg-primary/10 text-primary font-semibold' 
                          : 'text-on-surface hover:bg-surface-container-low'
                        }
                      `}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ x: 4 }}
                    >
                      {value === option.value && (
                        <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                      )}
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
