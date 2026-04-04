import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Global Secondary Toolbar (Contextual Light Bar)
 * Inspired by Canva's light-mode contextual bar.
 */
export default function GlobalSecondaryToolbar({ children }) {
  return (
    <motion.div
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-[48px] bg-[var(--color-primary-light)] flex items-center px-4 gap-6 shrink-0 relative z-[100] shadow-sm border-b border-[var(--color-primary-mid)]/30"
    >
      {children}
    </motion.div>
  );
}
