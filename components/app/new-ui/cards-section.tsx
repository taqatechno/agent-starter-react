'use client';

import { AnimatePresence, motion } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { CardGrid } from '@/components/app/new-ui/card-grid';
import { CardModal } from '@/components/app/new-ui/card-modal';
import type { Card } from '@/components/app/new-ui/new-session-view';
import { cn } from '@/lib/utils';

interface CardsSectionProps {
  cards: Card[];
  selectedCardId: string | null;
  onCardSelect: (cardId: string) => void;
  onModalClose: () => void;
  onClose: () => void;
}

export function CardsSection({
  cards,
  selectedCardId,
  onCardSelect,
  onModalClose,
  onClose,
}: CardsSectionProps) {
  // Handle card click - show modal (RPC notification removed)
  const handleCardClick = (cardId: string) => {
    console.log(`🖱️ User clicked card: ${cardId}`);
    onCardSelect(cardId);
  };

  const selectedCard = selectedCardId !== null ? cards.find((c) => c.id === selectedCardId) : null;

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
        aria-label="Close cards section"
      >
        <X className="h-5 w-5" weight="bold" />
      </motion.button>

      {/* Background layer - reduced opacity when modal is open */}
      <motion.div
        className={cn('absolute inset-0 flex items-center justify-center p-6')}
        animate={{
          opacity: selectedCardId !== null ? 0.3 : 1,
          filter: selectedCardId !== null ? 'blur(4px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.2 }}
      >
        <CardGrid cards={cards} onCardClick={handleCardClick} />
      </motion.div>

      {/* Modal layer - floating above */}
      <AnimatePresence>
        {selectedCard && <CardModal card={selectedCard} onClose={onModalClose} />}
      </AnimatePresence>
    </div>
  );
}
