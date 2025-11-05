'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';
import { CardGrid } from '@/components/app/new-ui/card-grid';
import { CardModal } from '@/components/app/new-ui/card-modal';
import type { Card } from '@/components/app/new-ui/new-session-view';
import { cn } from '@/lib/utils';

interface CardsSectionProps {
  cards: Card[];
  selectedCardId: string | null;
  onCardSelect: (cardId: string) => void;
  onModalClose: () => void;
}

export function CardsSection({
  cards,
  selectedCardId,
  onCardSelect,
  onModalClose,
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
