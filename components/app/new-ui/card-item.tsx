'use client';

import { motion } from 'motion/react';
import type { Card } from '@/components/app/new-ui/new-session-view';
import { cn } from '@/lib/utils';

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
  hover: {
    scale: 1.05,
    y: -4,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
  },
};

interface CardItemProps {
  card: Card;
  onClick: () => void;
}

export function CardItem({ card, onClick }: CardItemProps) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={cn(
        'h-[160px] w-[200px]',
        'flex flex-col p-4',
        'bg-card border-border hover:border-primary rounded-lg border-2',
        'cursor-pointer',
        'shadow-md hover:shadow-xl',
        'transition-all duration-200'
      )}
    >
      <h3 className="text-foreground mb-2 line-clamp-2 text-base font-semibold">{card.title}</h3>
      <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
        {card.description}
      </p>
    </motion.div>
  );
}
