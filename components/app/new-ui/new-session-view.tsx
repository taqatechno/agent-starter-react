'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useRoomContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSection } from '@/components/app/new-ui/agent-section';
import { CardsSection } from '@/components/app/new-ui/cards-section';

// Card interface for UI components
export interface Card {
  id: string | number;
  title: string;
  description: string;
  [key: string]: any; // Allow additional fields from backend
}

interface NewSessionViewProps {
  appConfig: AppConfig;
  onAnimationComplete?: () => void;
}

export function NewSessionView({ appConfig, onAnimationComplete }: NewSessionViewProps) {
  const room = useRoomContext();
  const [cards, setCards] = useState<Card[]>([]);
  const [isCardsVisible, setIsCardsVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Register RPC handler for client.displayCards
  useEffect(() => {
    const handleDisplayCards = async (data: any): Promise<string> => {
      try {
        console.log('📨 Received displayCards RPC:', data);

        // Parse payload (handles both string and object - best practice)
        const payload: { action: 'show' | 'hide'; cards: any[] } =
          typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;

        // Validate action field
        if (payload.action !== 'show' && payload.action !== 'hide') {
          console.error('❌ Invalid action:', payload.action);
          return JSON.stringify({
            status: 'error',
            message: 'Invalid action. Use "show" or "hide"',
          });
        }

        if (payload.action === 'show') {
          // Validate cards array exists
          if (!payload.cards || !Array.isArray(payload.cards)) {
            console.error('❌ Invalid cards payload');
            return JSON.stringify({
              status: 'error',
              message: 'cards array is required',
            });
          }

          // Set cards and make visible
          setCards(payload.cards);
          setIsCardsVisible(true);
          setSelectedCardId(null); // Auto-close any open modal

          console.log(`✅ Displaying ${payload.cards.length} cards`);

          // Return success response per contract
          return JSON.stringify({
            status: 'success',
            cards: payload.cards.map((card) => ({
              id: card.id,
              title: card.title,
            })),
          });
        } else if (payload.action === 'hide') {
          // Hide cards section
          setIsCardsVisible(false);
          setSelectedCardId(null); // Reset selection

          console.log('👋 Hiding cards');

          // Return success response per contract
          return JSON.stringify({
            status: 'success, cards are hidden',
          });
        }

        // Should never reach here due to validation above
        return JSON.stringify({
          status: 'error',
          message: 'Unknown action',
        });
      } catch (error) {
        console.error('❌ Error processing displayCards:', error);
        return JSON.stringify({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Register the RPC method
    room.localParticipant.registerRpcMethod('client.displayCards', handleDisplayCards);
    console.log('🔌 Registered RPC method: client.displayCards');

    // Cleanup on unmount
    return () => {
      room.localParticipant.unregisterRpcMethod('client.displayCards');
      console.log('🔌 Unregistered RPC method: client.displayCards');
    };
  }, [room, cards]); // Include dependencies

  // Handle card selection
  const handleCardSelect = (cardId: string) => {
    setSelectedCardId(cardId);
  };

  // Handle modal close
  const handleModalClose = () => {
    setSelectedCardId(null);
  };

  // Handle closing entire cards section
  const handleCloseCards = () => {
    setIsCardsVisible(false);
    setSelectedCardId(null); // Also close any open modal
  };

  return (
    <div className="bg-background relative flex h-full w-full flex-row overflow-hidden">
      {/* Logo - fixed at top-left */}
      <div className="fixed top-6 left-6 z-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={appConfig.logo}
          alt={`${appConfig.companyName} Logo`}
          className="h-12 w-auto rounded-full shadow-md transition-transform duration-300 hover:scale-110"
        />
      </div>

      {/* Agent Section - animates width between 100% and 40% */}
      <motion.div
        className="relative h-full"
        initial={{ width: '100%' }}
        animate={{ width: isCardsVisible ? '40%' : '100%' }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 25,
        }}
      >
        <AgentSection
          isChatOpen={isChatOpen}
          onChatToggle={() => setIsChatOpen(!isChatOpen)}
          appConfig={appConfig}
        />
      </motion.div>

      {/* Cards Section - slides in from right */}
      {isCardsVisible && (
        <motion.div
          className="relative h-full"
          initial={{ width: '0%', opacity: 0 }}
          animate={{ width: '60%', opacity: 1 }}
          exit={{ width: '0%', opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 25,
          }}
        >
          <CardsSection
            cards={cards}
            selectedCardId={selectedCardId}
            onCardSelect={handleCardSelect}
            onModalClose={handleModalClose}
            onClose={handleCloseCards}
          />
        </motion.div>
      )}
    </div>
  );
}
