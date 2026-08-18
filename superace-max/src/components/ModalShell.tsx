/**
 * ModalShell — shared wrapper for all modal dialogs.
 *
 * Provides: backdrop blur, click-outside-to-close, AnimatePresence,
 * consistent sizing/scrolling, and a close button.
 *
 * Usage:
 *   <ModalShell isOpen={isOpen} onClose={close} maxWidth="max-w-lg">
 *     <div>Modal content</div>
 *   </ModalShell>
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  maxWidth?: string;
  children: React.ReactNode;
  /** Skip the close X button (e.g. for celebration overlays). */
  hideClose?: boolean;
  /** Extra classes on the inner content wrapper. */
  contentClassName?: string;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  maxWidth = 'max-w-md',
  children,
  hideClose = false,
  contentClassName = '',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className={`relative ${maxWidth} w-full bg-gradient-to-b from-[#1a081a] to-[#0d040f] border border-[#f6d47844] rounded-2xl shadow-2xl overflow-hidden ${contentClassName}`}
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {!hideClose && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
