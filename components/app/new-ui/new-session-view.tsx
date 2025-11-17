'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useRoomContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSection } from '@/components/app/new-ui/agent-section';
import { ContentSection } from '@/components/app/new-ui/content-section';

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [contentSection, setContentSection] = useState<{
    isVisible: boolean;
    type: 'cards' | null;
    data: any;
  }>({
    isVisible: false,
    type: null,
    data: null,
  });

  // Register RPC handler for client.displayCards
  useEffect(() => {
    const handleDisplayCards = async (data: any): Promise<string> => {
      try {
        console.log('📨 Received displayCards RPC:', data);

        // Parse payload (handles both string and object - best practice)
        const payload: { action: 'show' | 'hide'; Type: string; cards: any[] } =
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

          // Helper function to extract title based on entity type
          const extractTitle = (card: any, type: string): string => {
            if (type === 'faq') {
              // FAQ uses question.ar
              return card.question?.ar || card.question || 'Untitled FAQ';
            }
            // All others use name.ar (sponsorship, project, charity, atonement)
            return card.name?.ar || card.name || 'Untitled';
          };

          // Set content section data and make visible
          setContentSection({
            isVisible: true,
            type: 'cards',
            data: {
              cards: payload.cards,
              entityType: payload.Type || '',
            },
          });

          console.log(`✅ Displaying ${payload.cards.length} ${payload.Type} cards`);

          // Return success response per contract with extracted titles
          return JSON.stringify({
            status: 'success',
            cards: payload.cards.map((card) => ({
              id: card.id,
              title: extractTitle(card, payload.Type),
            })),
          });
        } else if (payload.action === 'hide') {
          // Hide content section
          setContentSection({
            isVisible: false,
            type: null,
            data: null,
          });

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
  }, [room, contentSection]); // Include dependencies

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

          // Find the card to validate it exists and get its title
          const cards = contentSection.data?.cards || [];
          const card = cards.find((c: Card) => String(c.id) === String(payload.cardId));

          if (!card) {
            console.error(`❌ Card not found: ${payload.cardId}`);
            return JSON.stringify({
              status: 'error',
              message: `no card with id ${payload.cardId}`,
            });
          }

          // Note: Modal opening is now handled by CardsView internally
          // We log this for tracking, but the actual modal state is in CardsView
          console.log(`✅ Request to open modal for card: ${payload.cardId}`);

          // Return success response with message
          return JSON.stringify({
            status: 'success',
            cardId: payload.cardId,
            message: `card ${payload.cardId}, ${card.title} is open`,
          });
        } else if (payload.action === 'close') {
          // Note: Modal closing is now handled by CardsView internally
          // We log this for tracking, but the actual modal state is in CardsView
          console.log('✅ Request to close modal');

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
  }, [room, contentSection]); // Include dependencies

  // Handle closing entire content section
  const handleCloseSection = () => {
    setContentSection({
      isVisible: false,
      type: null,
      data: null,
    });
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
        animate={{ width: contentSection.isVisible ? '40%' : '100%' }}
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

      {/* Content Section - slides in from right */}
      {contentSection.isVisible && (
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
          <ContentSection
            contentType={contentSection.type}
            data={contentSection.data}
            onClose={handleCloseSection}
          />
        </motion.div>
      )}
    </div>
  );
}
