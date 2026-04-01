import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Glass Card Component
 * Glassmorphism effect with smooth animations
 */
export default function GlassCard({ 
  children, 
  className = '', 
  hover = true,
  glow = false,
  onClick,
  ...props 
}) {
  return (
    <motion.div
      className={`
        glass-card 
        rounded-2xl 
        ${hover ? 'hover-lift' : ''} 
        ${glow ? 'hover-glow' : ''} 
        ${className}
      `}
      onClick={onClick}
      whileHover={hover ? { y: -2, scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
