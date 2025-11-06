'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, X } from '@phosphor-icons/react';
import type { Card } from '@/components/app/new-ui/new-session-view';
import { cn } from '@/lib/utils';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2,
    },
  },
};

interface CardModalProps {
  card: Card;
  onClose: () => void;
}

export function CardModal({ card, onClose }: CardModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-6"
      >
        <div
          className={cn(
            'pointer-events-auto',
            'bg-background border-border rounded-xl border',
            'shadow-2xl',
            'w-full max-w-md',
            'overflow-hidden'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <div className="absolute top-3 right-3 z-10">
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'rounded-full p-2',
                'bg-background/90 backdrop-blur-sm',
                'border-border border',
                'text-muted-foreground hover:text-foreground',
                'transition-colors',
                'shadow-md'
              )}
              aria-label="Close modal"
            >
              <X className="h-5 w-5" weight="bold" />
            </motion.button>
          </div>

          {/* Qatar Charity Logo */}
          <div className="bg-muted relative aspect-[4/3] w-full flex items-center justify-center">
            <img
              src="/qatar-charity-logo.jpg"
              alt="Qatar Charity"
              className="h-32 w-32 object-contain"
            />
          </div>

          {/* Card Info */}
          <div className="space-y-4 p-6">
            {/* Title */}
            <div>
              <h2 className="text-foreground mb-2 text-2xl font-bold">{card.title}</h2>
            </div>

            {/* Full Description */}
            <div className="border-border border-t pt-4">
              <h3 className="text-foreground mb-2 text-sm font-semibold">الوصف</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {card.description}
              </p>
            </div>

            {/* Action Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full rounded-lg px-4 py-3',
                'bg-primary text-primary-foreground',
                'text-sm font-semibold',
                'flex items-center justify-center gap-2',
                'hover:bg-primary/90 transition-colors',
                'shadow-md'
              )}
            >
              <ShoppingCart className="h-5 w-5" weight="bold" />
              تبرع الآن
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
