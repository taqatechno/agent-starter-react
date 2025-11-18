'use client';

import { useState, useEffect } from 'react';
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

// Helper function to extract title based on entity type
const extractTitle = (card: any, type: string): string => {
  if (type === 'faq') {
    // FAQ uses question.ar
    return card.question?.ar || card.question || 'Untitled FAQ';
  }
  // All others use details.nameAr (sponsorship, project, charity, atonement)
  return card.details?.nameAr || card.details?.nameEn || card.name?.ar || card.name || 'Untitled';
};

export function CardsView({ cards, entityType }: CardsViewProps) {
  const room = useRoomContext();
  const { agent } = useVoiceAssistant();
  const [selectedCardId, setSelectedCardId] = useState<string | number | null>(null);

  // Close modal when cards data changes (triggered by display RPC)
  useEffect(() => {
    setSelectedCardId(null);
  }, [cards]);

  // Register RPC handler for client.controlCardModal
  useEffect(() => {
    const handleControlCardModal = async (data: any): Promise<string> => {
      try {
        console.log('📨 Received controlCardModal RPC:', data);

        // Parse payload (handles both string and object)
        const payload: { action: 'open' | 'close'; cardId?: string | number } =
          typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;

        // Validate action field
        if (payload.action !== 'open' && payload.action !== 'close') {
          console.error('❌ Invalid action:', payload.action);
          return JSON.stringify({
            status: 'error',
            message: "Invalid action. Use 'open' or 'close'",
          });
        }

        if (payload.action === 'open') {
          // Validate cardId is provided
          if (payload.cardId === undefined || payload.cardId === null) {
            console.error('❌ Missing cardId for open action');
            return JSON.stringify({
              status: 'error',
              message: "cardId is required for 'open' action",
            });
          }

          // Find the card to validate it exists
          const card = cards.find((c) => String(c.id) === String(payload.cardId));

          if (!card) {
            console.error(`❌ Card not found: ${payload.cardId}`);
            return JSON.stringify({
              status: 'error',
              message: `no card with id ${payload.cardId}`,
            });
          }

          // Open the modal
          setSelectedCardId(payload.cardId);
          console.log(`✅ Opened modal for card: ${payload.cardId}`);

          // Extract title for response
          const title = extractTitle(card, entityType);

          // Return success response
          return JSON.stringify({
            status: 'success',
            cardId: payload.cardId,
            message: `card ${payload.cardId}, ${title} is open`,
          });
        } else if (payload.action === 'close') {
          // Close the modal
          setSelectedCardId(null);
          console.log('✅ Closed card modal');

          // Return success response
          return JSON.stringify({
            status: 'success',
          });
        }

        // Should never reach here due to validation
        return JSON.stringify({
          status: 'error',
          message: 'Unknown action',
        });
      } catch (error) {
        console.error('❌ Error processing controlCardModal:', error);
        return JSON.stringify({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Register the RPC method
    room.localParticipant.registerRpcMethod('client.controlCardModal', handleControlCardModal);
    console.log('🔌 Registered RPC method: client.controlCardModal');

    // Cleanup on unmount
    return () => {
      room.localParticipant.unregisterRpcMethod('client.controlCardModal');
      console.log('🔌 Unregistered RPC method: client.controlCardModal');
    };
  }, [room, cards, entityType]); // Include dependencies

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
      // Extract title based on entity type
      const title = extractTitle(card, entityType);

      const result = await room.localParticipant.performRpc({
        destinationIdentity: agent.identity,
        method: 'agent.selectCard',
        payload: JSON.stringify({
          cardId: cardId,
          title: title,
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
