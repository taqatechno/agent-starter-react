'use client';

import { motion } from 'motion/react';
import { CardItem } from '@/components/app/new-ui/card-item';
import type { Card } from '@/components/app/new-ui/new-session-view';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

interface CardGridProps {
  cards: Card[];
  entityType: string;
  onCardClick: (cardId: string | number) => void;
}

export function CardGrid({ cards, entityType, onCardClick }: CardGridProps) {
  // Use CSS Grid for project and sponsorship cards, flex-wrap for others
  const useGridLayout = entityType === 'project' || entityType === 'sponsorship';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex w-full flex-col items-center p-3 md:p-4"
    >
      <div
        className={
          useGridLayout
            ? "grid w-full max-w-7xl grid-cols-1 justify-center gap-3 sm:grid-cols-[repeat(auto-fit,minmax(280px,320px))] md:gap-4"
            : "flex w-full max-w-4xl flex-row flex-wrap items-center justify-center gap-3 md:gap-4"
        }
      >
        {cards.map((card) => (
          <CardItem key={card.id} card={card} entityType={entityType} onClick={() => onCardClick(card.id)} />
        ))}
      </div>
    </motion.div>
  );
}
