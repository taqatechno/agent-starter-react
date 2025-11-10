'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
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
  const [cards, setCards] = useState<Card[]>([]);
  const [isCardsVisible, setIsCardsVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // RPC handlers removed - implement your own data fetching method here

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
