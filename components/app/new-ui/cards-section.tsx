'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';
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
  const room = useRoomContext();
  const { agent } = useVoiceAssistant();

  // Handle card click - show modal and send RPC to agent
  const handleCardClick = async (cardId: string) => {
    console.log(`🖱️ User clicked card: ${cardId}`);

    // Show modal immediately
    onCardSelect(cardId);

    // Send RPC call to agent
    if (!agent) {
      console.warn('⚠️ No agent available to send selection');
      return;
    }

    try {
      const result = await room.localParticipant.performRpc({
        destinationIdentity: agent.identity,
        method: 'agent.selectCard',
        payload: JSON.stringify({
          cardId: cardId,
          action: 'select',
        }),
      });
      console.log('✅ Agent acknowledged selection:', result);
    } catch (error) {
      console.error('❌ Failed to send card selection:', error);
    }
  };

  const selectedCard = selectedCardId ? cards.find((c) => c.id === selectedCardId) : null;

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
          opacity: selectedCardId ? 0.3 : 1,
          filter: selectedCardId ? 'blur(4px)' : 'blur(0px)',
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
