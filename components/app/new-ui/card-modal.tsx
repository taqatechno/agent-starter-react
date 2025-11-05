'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, X } from '@phosphor-icons/react';
import type { Card } from '@/components/app/new-ui/new-session-view';
import { cn } from '@/lib/utils';

// Extended card interface with product details (mock data)
interface ProductCard extends Card {
  imageUrl: string;
  price: string;
  fullDescription: string;
  category: string;
}

// Mock product data - in real app, this would come from backend
const MOCK_PRODUCT_DATA: Record<string, Omit<ProductCard, keyof Card>> = {
  'card-1': {
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
    price: '$299.00',
    fullDescription:
      'Premium wireless headphones with active noise cancellation, crystal-clear audio, and up to 30 hours of battery life. Perfect for music lovers and professionals alike.',
    category: 'Electronics',
  },
  'card-2': {
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
    price: '$149.00',
    fullDescription:
      'Stylish and comfortable running shoes designed for performance. Features advanced cushioning technology and breathable materials for maximum comfort during your workouts.',
    category: 'Footwear',
  },
  'card-3': {
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
    price: '$89.00',
    fullDescription:
      'Elegant wristwatch combining classic design with modern functionality. Water-resistant and perfect for both casual and formal occasions.',
    category: 'Accessories',
  },
  'card-4': {
    imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=300&fit=crop',
    price: '$199.00',
    fullDescription:
      'Smartwatch with fitness tracking, heart rate monitoring, and smartphone notifications. Stay connected and monitor your health throughout the day.',
    category: 'Electronics',
  },
  'card-5': {
    imageUrl: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=300&fit=crop',
    price: '$79.00',
    fullDescription:
      'Premium backpack with multiple compartments, laptop sleeve, and water-resistant material. Perfect for daily commutes, travel, or outdoor adventures.',
    category: 'Bags',
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2,
    },
  },
};

interface CardModalProps {
  card: Card;
  onClose: () => void;
}

export function CardModal({ card, onClose }: CardModalProps) {
  // Get full product data with mock details
  const mockData = MOCK_PRODUCT_DATA[card.id] || MOCK_PRODUCT_DATA['card-1'];
  const productCard: ProductCard = {
    ...card,
    ...mockData,
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-6"
      >
        <div
          className={cn(
            'pointer-events-auto',
            'bg-background border-border rounded-xl border',
            'shadow-2xl',
            'w-full max-w-md',
            'overflow-hidden'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <div className="absolute top-3 right-3 z-10">
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'rounded-full p-2',
                'bg-background/90 backdrop-blur-sm',
                'border-border border',
                'text-muted-foreground hover:text-foreground',
                'transition-colors',
                'shadow-md'
              )}
              aria-label="Close modal"
            >
              <X className="h-5 w-5" weight="bold" />
            </motion.button>
          </div>

          {/* Product Image */}
          <div className="bg-muted relative aspect-[4/3] w-full">
            <img
              src={productCard.imageUrl}
              alt={productCard.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <span className="bg-background/90 text-foreground border-border inline-block rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm">
                {productCard.category}
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-4 p-6">
            {/* Title and Price */}
            <div>
              <h2 className="text-foreground mb-2 text-2xl font-bold">{productCard.title}</h2>
              <p className="text-primary text-3xl font-bold">{productCard.price}</p>
            </div>

            {/* Full Description */}
            <div className="border-border border-t pt-2">
              <h3 className="text-foreground mb-2 text-sm font-semibold">Description</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {productCard.fullDescription}
              </p>
            </div>

            {/* Action Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full rounded-lg px-4 py-3',
                'bg-primary text-primary-foreground',
                'text-sm font-semibold',
                'flex items-center justify-center gap-2',
                'hover:bg-primary/90 transition-colors',
                'shadow-md'
              )}
            >
              <ShoppingCart className="h-5 w-5" weight="bold" />
              Learn More
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
