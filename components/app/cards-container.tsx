"use client";

import { useState, useEffect } from "react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { X, ArrowLeft, ShoppingCart } from "@phosphor-icons/react";

// TypeScript interfaces for RPC payload
interface Card {
  id: string;
  title: string;
  description: string;
}

interface CardsPayload {
  action: "show" | "hide";
  cards: Card[];
}

// Extended card interface with product details (mock data)
interface ProductCard extends Card {
  imageUrl: string;
  price: string;
  fullDescription: string;
  category: string;
}

// Mock product data - in real app, this would come from backend
const MOCK_PRODUCT_DATA: Record<string, Omit<ProductCard, keyof Card>> = {
  "card-1": {
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
    price: "$299.00",
    fullDescription: "Premium wireless headphones with active noise cancellation, crystal-clear audio, and up to 30 hours of battery life. Perfect for music lovers and professionals alike.",
    category: "Electronics"
  },
  "card-2": {
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
    price: "$149.00",
    fullDescription: "Stylish and comfortable running shoes designed for performance. Features advanced cushioning technology and breathable materials for maximum comfort during your workouts.",
    category: "Footwear"
  },
  "card-3": {
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
    price: "$89.00",
    fullDescription: "Elegant wristwatch combining classic design with modern functionality. Water-resistant and perfect for both casual and formal occasions.",
    category: "Accessories"
  },
  "card-4": {
    imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=300&fit=crop",
    price: "$199.00",
    fullDescription: "Smartwatch with fitness tracking, heart rate monitoring, and smartphone notifications. Stay connected and monitor your health throughout the day.",
    category: "Electronics"
  },
  "card-5": {
    imageUrl: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=300&fit=crop",
    price: "$79.00",
    fullDescription: "Premium backpack with multiple compartments, laptop sleeve, and water-resistant material. Perfect for daily commutes, travel, or outdoor adventures.",
    category: "Bags"
  },
};

export function CardsContainer() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [cards, setCards] = useState<Card[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Debug effect to track visibility changes
  useEffect(() => {
    console.log(`👁️ CardsContainer visibility changed: ${isVisible}`);
  }, [isVisible]);

  useEffect(() => {
    // Find the agent participant
    const agentParticipant = Array.from(room.remoteParticipants.values()).find(
      (p) => p.name === "Agent" || p.kind === "agent"
    );
    setAgent(agentParticipant);

    // Register RPC handler for receiving cards from agent
    const handleDisplayCards = async (data: any): Promise<string> => {
      try {
        console.log("📨 Received displayCards RPC:", data);

        // Parse payload (might be string or object)
        const payload: CardsPayload =
          typeof data.payload === "string"
            ? JSON.parse(data.payload)
            : data.payload;

        if (payload.action === "show") {
          setCards(payload.cards);
          setIsVisible(true);
          console.log(`✅ Displaying ${payload.cards.length} cards`);
        } else if (payload.action === "hide") {
          setIsVisible(false);
          console.log("👋 Hiding cards");
        }

        return "success";
      } catch (error) {
        console.error("❌ Error processing displayCards:", error);
        return "error: " + (error instanceof Error ? error.message : String(error));
      }
    };

    // Register the RPC method
    room.localParticipant.registerRpcMethod(
      "client.displayCards",
      handleDisplayCards
    );

    console.log("🔌 Registered RPC method: client.displayCards");

    // Cleanup on unmount
    return () => {
      console.log("🔌 CardsContainer unmounted");
    };
  }, [room]);

  // Handle card click - show detail view and send RPC to agent
  const handleCardClick = async (cardId: string) => {
    console.log(`🖱️ User clicked card: ${cardId}`);

    // Show detail view immediately
    setSelectedCardId(cardId);

    // Send RPC call to agent
    if (!agent) {
      console.warn("⚠️ No agent available to send selection");
      return;
    }

    try {
      const result = await room.localParticipant.performRpc({
        destinationIdentity: agent.identity,
        method: "agent.selectCard",
        payload: JSON.stringify({
          cardId: cardId,
          action: "select"
        })
      });
      console.log("✅ Agent acknowledged selection:", result);
    } catch (error) {
      console.error("❌ Failed to send card selection:", error);
    }
  };

  // Handle back button - return to cards list
  const handleBack = () => {
    console.log("⬅️ Returning to cards list");
    setSelectedCardId(null);
  };

  // Get full product card data with mock details
  const getProductCard = (cardId: string): ProductCard | null => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return null;

    const mockData = MOCK_PRODUCT_DATA[cardId] || MOCK_PRODUCT_DATA["card-1"];
    return {
      ...card,
      ...mockData
    };
  };

  // Handle manual close
  const handleClose = () => {
    console.log("🚪 Closing cards sidebar");
    setSelectedCardId(null); // Reset selection when closing
    setIsVisible(false);
  };

  // Get selected product for detail view
  const selectedProduct = selectedCardId ? getProductCard(selectedCardId) : null;

  return (
    <AnimatePresence>
      {isVisible && cards.length > 0 && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 200
          }}
          className={cn(
            "fixed top-20 right-0 h-[calc(100vh-5rem)] z-[100]",
            "w-full md:w-[380px]",
            "bg-background border-l border-border",
            "shadow-2xl",
            "flex flex-col"
          )}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between p-4 border-b border-border">
            {selectedProduct ? (
              <motion.button
                type="button"
                onClick={handleBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex items-center gap-2",
                  "text-muted-foreground hover:text-foreground",
                  "cursor-pointer transition-colors"
                )}
                aria-label="Back to list"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </motion.button>
            ) : (
              <h3 className="text-lg font-semibold text-foreground">
                Select an option
              </h3>
            )}
            <motion.button
              type="button"
              onClick={handleClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={cn(
                "relative z-10",
                "p-2 rounded-lg",
                "cursor-pointer transition-colors",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-muted/50"
              )}
              aria-label="Close cards"
            >
              <X className="w-5 h-5 pointer-events-none" />
            </motion.button>
          </div>

          {/* Content - either Cards List or Detail View */}
          <AnimatePresence mode="wait">
            {selectedProduct ? (
              // Product Detail View
              <motion.div
                key="detail"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto"
              >
                {/* Product Image */}
                <div className="relative w-full aspect-[4/3] bg-muted">
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-background/90 text-foreground rounded">
                      {selectedProduct.category}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-4">
                  {/* Title and Price */}
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      {selectedProduct.title}
                    </h2>
                    <p className="text-2xl font-bold text-primary">
                      {selectedProduct.price}
                    </p>
                  </div>

                  {/* Short Description */}
                  <div className="pt-2 border-t border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-2">
                      Description
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedProduct.fullDescription}
                    </p>
                  </div>

                  {/* Action Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full py-3 px-4 rounded-lg",
                      "bg-primary text-primary-foreground",
                      "font-medium text-sm",
                      "flex items-center justify-center gap-2",
                      "hover:bg-primary/90 transition-colors"
                    )}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Learn More
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              // Cards List
              <motion.div
                key="list"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {cards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{
                      // Initial animation uses delay
                      y: { delay: index * 0.1, type: "spring", damping: 20, stiffness: 200 },
                      opacity: { delay: index * 0.1, duration: 0.3 },
                      // Hover/tap animations are instant
                      scale: { type: "spring", stiffness: 400, damping: 25 },
                    }}
                    onClick={() => handleCardClick(card.id)}
                    className={cn(
                      "p-4 rounded-lg border border-border",
                      "bg-card hover:bg-muted shadow-sm hover:shadow-md",
                      "cursor-pointer transition-colors duration-200"
                    )}
                  >
                    <h4 className="font-medium text-foreground mb-2">
                      {card.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {card.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer hint - only show in list view */}
          {!selectedProduct && (
            <div className="p-4 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                Click on a card to learn more
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
