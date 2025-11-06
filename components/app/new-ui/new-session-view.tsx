'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useRoomContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSection } from '@/components/app/new-ui/agent-section';
import { CardsSection } from '@/components/app/new-ui/cards-section';

// TypeScript interfaces for RPC payload
export interface Card {
  id: string | number;
  title: string;
  description: string;
  [key: string]: any; // Allow additional fields from backend
}

interface CardsPayload {
  action: 'show' | 'hide';
  cards: any[]; // Accept any backend schema
}

// Normalize different backend schemas to unified Card interface
const normalizeCard = (rawCard: any): Card => {
  // Detect schema type by checking which fields exist
  const isProject = 'project_name_ar' in rawCard;
  const isSponsorship = 'category' in rawCard && 'monthly_amount_qar' in rawCard;
  const isSadaqah = 'suggested_amount_qar' in rawCard;

  // Extract title (name) from appropriate field
  const title = rawCard.project_name_ar || rawCard.name_ar || 'Untitled';

  // Extract description from appropriate field
  const description =
    rawCard.project_description_ar || rawCard.additional_info_ar || rawCard.description_ar || '';

  // Return normalized card with all original fields preserved
  return {
    id: rawCard.id,
    title,
    description,
    ...rawCard, // Keep all original fields for flexibility
  };
};

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

  // Register RPC handlers for receiving cards and modal control from agent
  useEffect(() => {
    const handleDisplayCards = async (data: any): Promise<string> => {
      try {
        console.log('📨 Received displayCards RPC:', data);

        // Parse payload (might be string or object)
        const payload: CardsPayload =
          typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;

        if (payload.action === 'show') {
          // Normalize cards from different backend schemas
          const normalizedCards = payload.cards.map(normalizeCard);

          setCards(normalizedCards);
          setIsCardsVisible(true);
          setSelectedCardId(null); // Close any open modal when showing new cards
          console.log(`✅ Displaying ${normalizedCards.length} cards`);

          // Return structured response with card IDs and titles
          return JSON.stringify({
            status: 'success',
            cards: normalizedCards.map((card) => ({
              id: card.id,
              title: card.title,
            })),
          });
        } else if (payload.action === 'hide') {
          setIsCardsVisible(false);
          setSelectedCardId(null); // Reset selection when hiding
          console.log('👋 Hiding cards');

          return JSON.stringify({
            status: 'success',
          });
        }

        // Invalid action
        return JSON.stringify({
          status: 'error',
          message: 'Invalid action. Use "show" or "hide"',
        });
      } catch (error) {
        console.error('❌ Error processing displayCards:', error);
        return JSON.stringify({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    };

    const handleControlCardModal = async (data: any): Promise<string> => {
      try {
        console.log('📨 Received controlCardModal RPC:', data);

        // Parse payload (might be string or object)
        const payload: { action: 'open' | 'close'; cardId?: string } =
          typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;

        if (payload.action === 'open') {
          // Validate cardId is provided
          if (!payload.cardId) {
            console.warn('⚠️ Cannot open modal: cardId is required');
            return JSON.stringify({
              status: 'error',
              message: 'cardId is required for open action',
            });
          }

          // Validate cards are loaded
          if (cards.length === 0) {
            console.warn('⚠️ Cannot open modal: No cards available');
            return JSON.stringify({
              status: 'error',
              message: 'No cards available',
            });
          }

          // Validate card exists
          const cardExists = cards.some((card) => card.id === payload.cardId);
          if (!cardExists) {
            console.warn(`⚠️ Cannot open modal: Card "${payload.cardId}" not found`);
            return JSON.stringify({
              status: 'error',
              message: 'Card not found',
            });
          }

          // Open modal (auto-closes any existing modal)
          setSelectedCardId(payload.cardId);
          console.log(`✅ Opening modal for card: ${payload.cardId}`);

          return JSON.stringify({
            status: 'success',
            cardId: payload.cardId,
          });
        } else if (payload.action === 'close') {
          // Close modal (idempotent - no error if already closed)
          setSelectedCardId(null);
          console.log('✅ Closing modal');

          return JSON.stringify({
            status: 'success',
          });
        }

        // Invalid action
        return JSON.stringify({
          status: 'error',
          message: 'Invalid action. Use "open" or "close"',
        });
      } catch (error) {
        console.error('❌ Error processing controlCardModal:', error);
        return JSON.stringify({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Register the RPC methods
    room.localParticipant.registerRpcMethod('client.displayCards', handleDisplayCards);
    room.localParticipant.registerRpcMethod('client.controlCardModal', handleControlCardModal);

    console.log('🔌 Registered RPC methods: client.displayCards, client.controlCardModal');

    // Cleanup on unmount
    return () => {
      console.log('🔌 Unregistering RPC methods: client.displayCards, client.controlCardModal');
      room.localParticipant.unregisterRpcMethod('client.displayCards');
      room.localParticipant.unregisterRpcMethod('client.controlCardModal');
    };
  }, [room, cards]);

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
