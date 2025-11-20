'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useRoomContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSection } from '@/components/app/new-ui/agent-section';
import { ContentSection } from '@/components/app/new-ui/content-section';

// Hook to detect desktop breakpoint (lg: 1024px)
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');

    // Set initial value
    setIsDesktop(mediaQuery.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}

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
  const isDesktop = useIsDesktop();
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

          // Helper function to extract title based on entity type - V2 schema
          const extractTitle = (card: any, type: string): string => {
            if (type === 'faq') {
              // FAQ uses question.ar
              return card.question?.ar || card.question || 'Untitled FAQ';
            }
            // V2 schema - all others use name.ar directly (sponsorship, project, charity, atonement)
            return card.name?.ar || card.name?.en || 'Untitled';
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

          // Helper: Extract title from donation item - V2 schema
          const extractDonationTitle = (donation: any): string => {
            const item = donation.donation_item;
            if (!item) return 'غير محدد';
            if (item.type === 'general') return 'تبرع عام';
            // V2 schema - details wrapper with nested BilingualText (for project, charity, atonement)
            return item.details?.name?.ar || item.details?.name?.en || 'غير محدد';
          };

          // Helper: Extract title from sponsorship item - V2 schema
          const extractSponsorshipTitle = (sponsorship: any): string => {
            const item = sponsorship.sponsorship_item;
            if (!item) return 'غير محدد';
            // V2 schema - details wrapper with nested BilingualText
            return item.details?.name?.ar || item.details?.name?.en || 'غير محدد';
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
    <div className="bg-background relative flex h-full w-full flex-col overflow-x-hidden lg:flex-row">
      {/* Logo - fixed at top-left with responsive sizing */}
      <div className="fixed top-4 left-4 z-50 lg:top-6 lg:left-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={appConfig.logo}
          alt={`${appConfig.companyName} Logo`}
          className="h-10 w-auto rounded-full shadow-md transition-transform duration-300 hover:scale-110 lg:h-12"
        />
      </div>

      {/* Agent Section - responsive layout (vertical mobile, horizontal desktop) */}
      <motion.div
        className="relative w-full lg:h-full"
        initial={
          isDesktop
            ? { width: '100%', height: '100%' }
            : { height: '100%', width: '100%' }
        }
        animate={
          isDesktop
            ? { width: contentSection.isVisible ? '40%' : '100%', height: '100%' }
            : { height: contentSection.isVisible ? '40%' : '100%', width: '100%' }
        }
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

      {/* Content Section - slides up on mobile, slides in from right on desktop */}
      {contentSection.isVisible && (
        <motion.div
          className="relative w-full lg:h-full"
          initial={
            isDesktop
              ? { width: '0%', opacity: 0, height: '100%' }
              : { height: '0%', opacity: 0, width: '100%' }
          }
          animate={
            isDesktop
              ? { width: '60%', opacity: 1, height: '100%' }
              : { height: '60%', opacity: 1, width: '100%' }
          }
          exit={
            isDesktop
              ? { width: '0%', opacity: 0, height: '100%' }
              : { height: '0%', opacity: 0, width: '100%' }
          }
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
