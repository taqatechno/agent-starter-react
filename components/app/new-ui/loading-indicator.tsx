'use client';

import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface LoadingIndicatorProps {
  isLoading: boolean;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const contentVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export function LoadingIndicator({ isLoading }: LoadingIndicatorProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2 }}
          className={cn(
            'absolute inset-0 z-20',
            'flex flex-col items-center justify-center gap-3 md:gap-4',
            'bg-background/80 backdrop-blur-md',
            'pointer-events-none'
          )}
          aria-live="polite"
          aria-busy="true"
          role="status"
        >
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center gap-3 md:gap-4"
          >
            {/* Circular Spinner */}
            <div className="relative h-12 w-12 md:h-16 md:w-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className={cn(
                  'h-full w-full rounded-full',
                  'border-4 border-primary/20',
                  'border-t-primary'
                )}
              />
            </div>

            {/* Loading Text (Arabic) */}
            <p
              className={cn(
                'text-foreground text-base font-medium md:text-lg',
                'animate-pulse'
              )}
              dir="rtl"
            >
              جاري البحث
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
