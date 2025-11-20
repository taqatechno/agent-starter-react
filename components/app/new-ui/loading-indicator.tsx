'use client';

import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface LoadingIndicatorProps {
  isLoading: boolean;
  isChatOpen: boolean;
}

const pillVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, y: -10, scale: 0.9, transition: { duration: 0.2 } },
};

export function LoadingIndicator({ isLoading, isChatOpen }: LoadingIndicatorProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          variants={pillVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'absolute top-2 left-1/2 -translate-x-1/2 z-30',
            'flex items-center rounded-full',
            'bg-background border border-border shadow-lg',
            'pointer-events-none',
            // Responsive sizing based on chat state
            isChatOpen
              ? 'gap-1 px-2 py-0.5 text-xs' // Smaller when chat open
              : 'gap-1.5 px-2 py-1 text-xs sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm md:gap-2.5 md:px-4 md:py-2 md:text-base' // Larger when closed
          )}
          aria-live="polite"
          aria-busy="true"
          role="status"
        >
          {/* Circular Spinner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
            className={cn(
              'rounded-full border-2 border-primary/20 border-t-primary',
              isChatOpen ? 'h-3 w-3' : 'h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5'
            )}
          />

          {/* Loading Text (Arabic) */}
          <span className="text-foreground font-medium whitespace-nowrap" dir="rtl">
            جاري البحث
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
