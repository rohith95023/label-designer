import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Slider Component
 * Smooth animated slider with gradient thumb
 */
export default function PremiumSlider({ 
  label,
  value,
  onChange,
  onMouseUp,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  unit = '',
  className = '',
  ...props 
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {label}
          </label>
          {showValue && (
            <motion.span 
              className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md"
              key={value}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {value}{unit}
            </motion.span>
          )}
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          onMouseUp={onMouseUp}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #6366f1 0%, #8b5cf6 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`
          }}
          {...props}
        />
      </div>
    </div>
  );
}
