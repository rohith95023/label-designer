import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Button Component
 * Gradient background with glow effects and smooth animations
 */
export default function PremiumButton({ 
  children, 
  variant = 'primary', // 'primary' | 'ghost' | 'gradient' | 'pill'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon,
  iconPosition = 'left',
  disabled = false,
  className = '',
  onClick,
  ...props 
}) {
  const baseClasses = `
    inline-flex items-center justify-center gap-2 
    font-bold transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-primary/30
  `;

  const variants = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    gradient: 'btn-gradient',
    pill: 'btn-pill bg-white/80 border border-primary/20 text-primary hover:bg-primary hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-5 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  return (
    <motion.button
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { 
        scale: 1.03,
        boxShadow: variant === 'gradient' 
          ? '0 4px 24px rgba(99,102,241,0.45), 0 0 0 3px rgba(99,102,241,0.15)'
          : '0 4px 16px rgba(99,102,241,0.25)'
      } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 17 
      }}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
    </motion.button>
  );
}
