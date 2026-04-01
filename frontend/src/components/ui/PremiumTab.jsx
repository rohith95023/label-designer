import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Tab Component
 * Animated tab with gradient underline
 */
export default function PremiumTab({ 
  tabs = [],
  activeTab,
  onTabChange,
  className = '',
  ...props 
}) {
  return (
    <div 
      className={`flex border-b border-outline-variant/20 ${className}`}
      {...props}
    >
      {tabs.map((tab) => (
        <motion.button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`
            tab-premium relative
            ${activeTab === tab.value 
              ? 'text-primary' 
              : 'text-slate-500 hover:text-slate-700'
            }
          `}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.95 }}
        >
          {tab.icon && (
            <span className="material-symbols-outlined text-[16px] mr-1.5">{tab.icon}</span>
          )}
          {tab.label}
          {activeTab === tab.value && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary"
              layoutId="activeTab"
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
