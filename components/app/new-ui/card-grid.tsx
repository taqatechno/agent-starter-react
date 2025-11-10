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
  onCardClick: (cardId: string | number) => void;
}

export function CardGrid({ cards, onCardClick }: CardGridProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex h-full w-full items-center justify-center"
    >
      <div className="flex max-w-4xl flex-row flex-wrap items-center justify-center gap-4">
        {cards.map((card) => (
          <CardItem key={card.id} card={card} onClick={() => onCardClick(card.id)} />
        ))}
      </div>
    </motion.div>
  );
}
