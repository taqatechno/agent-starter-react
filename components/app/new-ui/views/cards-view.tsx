'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';
import { CardGrid } from '@/components/app/new-ui/card-grid';
import { CardModal } from '@/components/app/new-ui/card-modal';
import type { Card } from '@/components/app/new-ui/new-session-view';
import { cn } from '@/lib/utils';

interface CardsViewProps {
  cards: Card[];
  entityType: string;
}

export function CardsView({ cards, entityType }: CardsViewProps) {
  const room = useRoomContext();
  const { agent } = useVoiceAssistant();
  const [selectedCardId, setSelectedCardId] = useState<string | number | null>(null);

  // Handle card click - show modal and send RPC to backend
  const handleCardClick = async (cardId: string | number) => {
    console.log(`🖱️ User clicked card: ${cardId}`);

    // Find the card to get its title
    const card = cards.find((c) => String(c.id) === String(cardId));

    // Fail fast if card not found (should never happen - indicates bug)
    if (!card) {
      console.error('❌ CRITICAL BUG: Clicked card not found in array!', cardId);
      return; // Don't send RPC with bad data
    }

    // 1. Update UI immediately (optimistic update)
    setSelectedCardId(cardId);

    // 2. Send RPC to backend (non-blocking)
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
          title: card.title,
          action: 'select',
        }),
      });

      console.log('✅ Agent acknowledged selection:', result);
    } catch (error) {
      console.error('❌ Failed to send card selection:', error);
      // Don't throw - modal is already open, user experience continues
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setSelectedCardId(null);
  };

  const selectedCard = selectedCardId !== null ? cards.find((c) => c.id === selectedCardId) : null;

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Title Section - Cards-specific */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-4 z-20">
        <h2 className="text-xl font-bold text-foreground text-center">البطاقات</h2>
      </div>

      {/* Background layer - reduced opacity when modal is open */}
      <motion.div
        className={cn('absolute inset-0 flex items-center justify-center p-6 pt-20')}
        animate={{
          opacity: selectedCardId !== null ? 0.3 : 1,
          filter: selectedCardId !== null ? 'blur(4px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.2 }}
      >
        <CardGrid cards={cards} entityType={entityType} onCardClick={handleCardClick} />
      </motion.div>

      {/* Modal layer - floating above */}
      <AnimatePresence>
        {selectedCard && (
          <CardModal key={selectedCard.id} card={selectedCard} entityType={entityType} onClose={handleModalClose} />
        )}
      </AnimatePresence>
    </div>
  );
}
