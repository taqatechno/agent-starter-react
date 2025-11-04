"use client";

import { useState, useEffect } from "react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { X } from "@phosphor-icons/react";

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

export function CardsContainer() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [cards, setCards] = useState<Card[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [agent, setAgent] = useState<any>(null);

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

  // Handle card click (Phase 2 - placeholder for now)
  const handleCardClick = async (cardId: string) => {
    console.log(`🖱️ User clicked card: ${cardId}`);

    // TODO: Phase 2 - Implement RPC call to agent
    // if (!agent) {
    //   console.warn("⚠️ No agent available to send selection");
    //   return;
    // }
    //
    // try {
    //   const result = await room.localParticipant.performRpc({
    //     destinationIdentity: agent.identity,
    //     method: "agent.selectCard",
    //     payload: JSON.stringify({
    //       cardId: cardId,
    //       action: "select"
    //     })
    //   });
    //   console.log("✅ Agent acknowledged selection:", result);
    // } catch (error) {
    //   console.error("❌ Failed to send card selection:", error);
    // }
  };

  // Handle manual close
  const handleClose = () => {
    console.log("🚪 Closing cards sidebar");
    setIsVisible(false);
  };

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
            <h3 className="text-lg font-semibold text-foreground">
              Select an option
            </h3>
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

          {/* Cards List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
          </div>

          {/* Footer hint */}
          <div className="p-4 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              Click on a card to learn more
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
