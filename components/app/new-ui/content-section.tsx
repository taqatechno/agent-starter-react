'use client';

import { motion } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { CardsView } from '@/components/app/new-ui/views/cards-view';
import { OrdersView } from '@/components/app/new-ui/views/orders-view';
import { cn } from '@/lib/utils';

interface ContentSectionProps {
  contentType: 'cards' | 'orders' | null;
  data: any;
  onClose: () => void;
}

export function ContentSection({ contentType, data, onClose }: ContentSectionProps) {
  return (
    <div className="bg-background border-border relative h-full w-full overflow-hidden border-l">
      {/* Close button - fixed at top-right */}
      <motion.button
        type="button"
        onClick={onClose}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'absolute top-4 right-4 z-30',
          'rounded-full p-2',
          'bg-background/90 backdrop-blur-sm',
          'border-border border',
          'text-muted-foreground hover:text-foreground',
          'transition-colors',
          'shadow-md'
        )}
        aria-label="Close content section"
      >
        <X className="h-5 w-5" weight="bold" />
      </motion.button>

      {/* Route to appropriate view - each view is self-contained */}
      {contentType === 'cards' && <CardsView {...data} />}
      {contentType === 'orders' && <OrdersView {...data} />}
      {/* Future views can be added here:
          {contentType === 'login' && <LoginView {...data} />}
      */}
    </div>
  );
}
