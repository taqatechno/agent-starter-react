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
    type: 'cards' | 'orders' | null;
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
            // All others use details.nameAr (sponsorship, project, charity, atonement)
            return card.details?.nameAr || card.details?.nameEn || card.name?.ar || card.name || 'Untitled';
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

  // Register RPC handler for client.displayOrders
  useEffect(() => {
    const handleDisplayOrders = async (data: any): Promise<string> => {
      try {
        console.log('📨 Received displayOrders RPC:', data);

        // Parse payload
        const payload: {
          action: 'show' | 'hide';
          donations: any[];
          sponsorships: any[];
        } = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;

        // Validate action field
        if (payload.action !== 'show' && payload.action !== 'hide') {
          console.error('❌ Invalid action:', payload.action);
          return JSON.stringify({
            status: 'error',
            message: 'Invalid action. Use "show" or "hide"',
          });
        }

        if (payload.action === 'show') {
          // Validate arrays exist
          if (!Array.isArray(payload.donations) || !Array.isArray(payload.sponsorships)) {
            console.error('❌ Invalid orders payload');
            return JSON.stringify({
              status: 'error',
              message: 'donations and sponsorships arrays are required',
            });
          }

          // Set content section data
          setContentSection({
            isVisible: true,
            type: 'orders',
            data: {
              donations: payload.donations,
              sponsorships: payload.sponsorships,
            },
          });

          console.log(
            `✅ Displaying ${payload.donations.length} donations and ${payload.sponsorships.length} sponsorships`
          );

          // Helper: Extract title from donation item
          const extractDonationTitle = (donation: any): string => {
            const item = donation.donation_item;
            if (!item) return 'غير محدد';
            if (item.type === 'general') return 'تبرع عام';
            // Extract from details.nameAr (for project, charity, atonement)
            return item.details?.nameAr || item.details?.nameEn || 'غير محدد';
          };

          // Helper: Extract title from sponsorship item
          const extractSponsorshipTitle = (sponsorship: any): string => {
            const item = sponsorship.sponsorship_item;
            if (!item) return 'غير محدد';
            // Extract from details.nameAr
            return item.details?.nameAr || item.details?.nameEn || 'غير محدد';
          };

          // Return success with extracted IDs and titles
          return JSON.stringify({
            status: 'success',
            donations: payload.donations.map((donation) => ({
              id: donation.id,
              title: extractDonationTitle(donation),
            })),
            sponsorships: payload.sponsorships.map((sponsorship) => ({
              id: sponsorship.id,
              title: extractSponsorshipTitle(sponsorship),
            })),
          });
        } else if (payload.action === 'hide') {
          // Hide orders section
          setContentSection({
            isVisible: false,
            type: null,
            data: null,
          });

          console.log('👋 Hiding orders');

          return JSON.stringify({
            status: 'success',
          });
        }

        return JSON.stringify({
          status: 'error',
          message: 'Unknown action',
        });
      } catch (error) {
        console.error('❌ Error processing displayOrders:', error);
        return JSON.stringify({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Register the RPC method
    room.localParticipant.registerRpcMethod('client.displayOrders', handleDisplayOrders);
    console.log('🔌 Registered RPC method: client.displayOrders');

    // Cleanup on unmount
    return () => {
      room.localParticipant.unregisterRpcMethod('client.displayOrders');
      console.log('🔌 Unregistered RPC method: client.displayOrders');
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
