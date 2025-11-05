# RPC Setup Guide - Qatar Charity Voice Agent

## 🎯 Overview & Purpose

### What We're Building
This guide establishes the **bidirectional RPC (Remote Procedure Call) communication** between the Python backend agent and the React frontend for displaying interactive cards in the Qatar Charity voice agent application.

### The Goal
When a user asks about charitable opportunities (projects, sponsorships, etc.), the agent should:
1. **Display visual cards** in the UI showing the results
2. **Know which card the user clicks** to provide contextual responses
3. **Enable interactive exploration** of charitable opportunities

### Why Start with Dummy Data?
We're implementing this in phases:
- **Phase 1** (This Guide): Establish RPC communication with simple dummy cards
- **Phase 2** (Later): Replace dummy data with actual database results
- **Phase 3** (Polish): Add card types, layouts, and real-world features

This approach allows us to:
✅ Prove the RPC communication works independently
✅ Debug connection issues without data complexity
✅ Provide a working foundation for both teams

---

## 🏗️ Architecture Overview

### Communication Flow

```
┌─────────────────────────────────────────────────────┐
│ AGENT (Python Backend)                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 1. Agent tool: display_cards(count=5)              │
│    └─> Generates 5 dummy cards                     │
│                                                     │
│ 2. Sends RPC call:                                  │
│    method: "client.displayCards"                    │
│    payload: {cards: [...5 cards...]}                │
│                                                     │
│ 3. RPC handler: "agent.selectCard"                  │
│    └─> Receives user selection                     │
│    └─> Stores selected card                        │
│    └─> Calls session.generate_reply()              │
│    └─> Agent responds via voice                    │
│                                                     │
└─────────────────────────────────────────────────────┘
                    ↕ LiveKit RPC
┌─────────────────────────────────────────────────────┐
│ FRONTEND (React)                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 1. RPC handler: "client.displayCards"               │
│    └─> Receives card data                          │
│    └─> Renders cards in UI                         │
│                                                     │
│ 2. User clicks a card                               │
│    └─> onClick handler triggered                   │
│                                                     │
│ 3. Sends RPC call:                                  │
│    method: "agent.selectCard"                       │
│    payload: {cardId: "card-3", action: "select"}    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Complete Interaction Sequence

```
User: "Show me 5 options" (voice input)
   ↓
Agent calls: display_cards(count=5)
   ↓
RPC sent: client.displayCards → Frontend
   ↓
Frontend displays: 5 interactive cards
   ↓
User clicks: Card #3 (no voice, just clicks)
   ↓
RPC sent: agent.selectCard → Agent
   ↓
Agent receives: {cardId: "card-3"}
   ↓
Agent calls: session.generate_reply(user_input="Tell me more about Item 3")
   ↓
Agent responds: "Item 3 is a great choice! Let me tell you more..." (voice output)
```

---

## 📋 RPC Methods Specification

### Method 1: `client.displayCards` (Agent → Frontend)

**Direction**: Backend sends to Frontend
**Purpose**: Display cards in the UI
**Trigger**: Agent tool `display_cards()` is called

**Payload Structure**:
```json
{
  "action": "show",
  "cards": [
    {
      "id": "card-1",
      "title": "Item 1",
      "description": "This is the first card"
    },
    {
      "id": "card-2",
      "title": "Item 2",
      "description": "This is the second card"
    }
  ]
}
```

**Response**: String - "success" or error message

---

### Method 2: `agent.selectCard` (Frontend → Agent)

**Direction**: Frontend sends to Backend
**Purpose**: Notify agent when user interacts with a card
**Trigger**: User clicks/selects a card in the UI

**Payload Structure**:
```json
{
  "cardId": "card-3",
  "action": "select"
}
```

**Optional Actions** (Frontend developer can add more):
- `"select"` - User selected/clicked the card
- `"expand"` - User wants to see more details
- `"close"` - User dismissed the card
- Custom actions as needed

**Response**: String - "success" or error message

---

## 🐍 Backend Implementation (Python)

### Step 1: Add State Management

First, ensure you have a `UserData` class to store state. This should be added near the top of your agent file:

```python
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

@dataclass
class UserData:
    """Session state management"""
    ctx: Optional[Any] = None  # JobContext
    last_displayed_cards: List[Dict] = field(default_factory=list)
    selected_card: Optional[Dict] = None
```

---

### Step 2: Create the Display Tool

Add this tool function to your agent. This is what the agent will call to display cards:

```python
import json
from livekit.agents import llm

# Tool that the agent can call
@ctx.llm.function()
async def display_cards(count: int):
    """
    Display interactive cards in the UI for the user to browse.

    Args:
        count: Number of cards to display (1-10)

    Returns:
        Success message
    """
    # Validate input
    if count < 1 or count > 10:
        return "Error: count must be between 1 and 10"

    # Generate dummy cards
    cards = [
        {
            "id": f"card-{i}",
            "title": f"Item {i}",
            "description": f"This is card number {i}"
        }
        for i in range(1, count + 1)
    ]

    # Store cards in session state
    userdata.last_displayed_cards = cards

    # Prepare RPC payload
    payload = {
        "action": "show",
        "cards": cards
    }

    # Get the user participant
    room = ctx.room
    participant = next(iter(room.remote_participants.values()), None)

    if not participant:
        return "Error: No user connected"

    # Send RPC call to frontend
    try:
        await room.local_participant.perform_rpc(
            destination_identity=participant.identity,
            method="client.displayCards",
            payload=json.dumps(payload)
        )

        logger.info(f"Displayed {count} cards to user")
        return f"Successfully displayed {count} cards to the user"

    except Exception as e:
        logger.error(f"Failed to display cards: {e}")
        return f"Error displaying cards: {str(e)}"
```

**Explanation**:
- The `@ctx.llm.function()` decorator makes this available as a tool for the agent
- The agent can call `display_cards(count=5)` to show 5 cards
- Cards are generated with simple IDs, titles, and descriptions
- The data is stored in `userdata.last_displayed_cards` for reference
- RPC call sends the data to the frontend via LiveKit

---

### Step 3: Register RPC Handler for User Selection

Add this handler to receive card selections from the frontend. Place this in your agent initialization code (typically inside an async function that sets up the session):

```python
# RPC handler for receiving card selections from frontend
async def handle_card_selection(rpc_data):
    """
    Handle card selection from the user.
    This is called when the user clicks a card in the UI.
    """
    try:
        # Parse the payload
        payload_str = rpc_data.payload
        payload_data = json.loads(payload_str)

        card_id = payload_data.get("cardId")
        action = payload_data.get("action", "select")

        if not card_id:
            logger.error("No cardId provided in selection")
            return "error: missing cardId"

        # Find the selected card from stored data
        selected_card = None
        for card in userdata.last_displayed_cards:
            if card["id"] == card_id:
                selected_card = card
                break

        if not selected_card:
            logger.warning(f"Card {card_id} not found in displayed cards")
            return "error: card not found"

        # Store the selection
        userdata.selected_card = selected_card

        logger.info(f"User selected card: {card_id} (action: {action})")
        logger.info(f"Selected card data: {selected_card}")

        # Make the agent respond to the selection
        # This triggers the LLM to generate a natural response
        await session.generate_reply(
            user_input=f"Tell me more about {selected_card['title']}"
        )

        return "success"

    except Exception as e:
        logger.error(f"Error handling card selection: {e}")
        return f"error: {str(e)}"

# Register the RPC method
# Place this where you have access to ctx.room (typically in your agent setup)
ctx.room.local_participant.register_rpc_method(
    "agent.selectCard",
    handle_card_selection
)

logger.info("Registered RPC method: agent.selectCard")
```

**Explanation**:
- `register_rpc_method()` tells LiveKit to call this function when frontend sends `agent.selectCard`
- The handler parses the card ID from the payload
- It looks up the card details from the stored list
- Stores the selection in `userdata.selected_card`
- Calls `session.generate_reply()` to make the agent respond naturally
- The `user_input` parameter adds the message to chat history as if the user spoke it
- Works with both STT-LLM-TTS pipeline and OpenAI Realtime (speech-to-speech) models
- Returns "success" to acknowledge receipt

---

### Understanding `session.generate_reply()` for Card Selection

The `session.generate_reply()` method is key to making the agent aware of card selections. Here are the two ways to use it:

#### Option 1: `user_input` (Recommended for Card Selection)

This approach simulates the user asking about the selected card:

```python
await session.generate_reply(
    user_input=f"Tell me more about {selected_card['title']}"
)
```

**What happens**:
- The input is added to chat history as a user message
- The agent generates a natural response
- Conversation flows as if the user spoke after clicking
- **Best for**: Immediate, natural responses to selections

**Example flow**:
```
User: "Show me 5 options" (voice)
Agent: "Here are 5 options for you" (displays cards)
User: [clicks Card #3] (no voice)
→ Chat history receives: "Tell me more about Item 3"
Agent: "Item 3 is a great choice! Here's what you should know..." (voice)
```

---

#### Option 2: `instructions` (Alternative Approach)

This approach gives the agent instructions without adding to user history:

```python
await session.generate_reply(
    instructions=f"Tell the user about {selected_card['title']} that they just selected"
)
```

**What happens**:
- The instruction guides the agent's response
- The instruction itself is NOT added to chat history
- Only the agent's response is recorded
- **Best for**: When you want the agent to react without explicit user input

**Example flow**:
```
User: "Show me options" (voice)
Agent: "Here are 5 options" (displays cards)
User: [clicks Card #3] (no voice)
→ Agent receives instruction (not in history)
Agent: "You've selected Item 3. Let me explain..." (voice)
```

---

#### Which to Choose?

| Use Case | Use `user_input` | Use `instructions` |
|----------|------------------|-------------------|
| Natural conversation flow | ✅ | |
| User explicitly wants info | ✅ | |
| Silent selection with agent response | | ✅ |
| Don't pollute chat history | | ✅ |

**For this implementation**, we recommend `user_input` because it creates the most natural conversation flow where clicking a card feels like the user asked about it.

---

#### Compatibility Note

✅ **Works with OpenAI Realtime**: This method works perfectly with speech-to-speech models (OpenAI Realtime API) that don't have a separate TTS step.

✅ **Works with STT-LLM-TTS Pipeline**: Also works with traditional pipeline models using separate STT, LLM, and TTS components.

❌ **Don't use `session.say()`**: The older `session.say()` method requires a TTS plugin and won't work with realtime models. Always use `session.generate_reply()` for dynamic responses.

---

### Step 4: Agent Instructions

Add instructions to your agent's system prompt so it knows when to use the tool:

```python
instructions = """
You are a helpful voice assistant for Qatar Charity.

When users ask to see options, projects, or want to browse charitable opportunities,
use the display_cards() tool to show them interactive cards.

Examples:
- User: "Show me some options" → Call display_cards(count=5)
- User: "Let me see 3 projects" → Call display_cards(count=3)

When a user selects a card, you will be notified automatically. You can then
provide more information about their selection.
"""
```

---

### Complete Backend Setup Checklist

✅ Add `UserData` class with card storage
✅ Create `display_cards(count: int)` tool function
✅ Register RPC handler for `agent.selectCard`
✅ Update agent instructions to use the tool
✅ Test that RPC registration happens on agent start

---

## ⚛️ Frontend Implementation (React/TypeScript)

### Step 1: Create the Cards Container Component

Create a new component file (e.g., `components/CardsContainer.tsx`):

```typescript
import { useState, useEffect } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';

interface Card {
  id: string;
  title: string;
  description: string;
}

interface CardsPayload {
  action: string;
  cards: Card[];
}

export function CardsContainer() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [cards, setCards] = useState<Card[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [agent, setAgent] = useState<any>(null);

  useEffect(() => {
    // Find the agent participant
    const agentParticipant = Array.from(room.remoteParticipants.values()).find(
      (p) => p.name === 'Agent' || p.kind === 'agent'
    );
    setAgent(agentParticipant);

    // Register RPC handler for receiving cards from agent
    const handleDisplayCards = async (data: any): Promise<string> => {
      try {
        console.log("Received displayCards RPC:", data);

        // Parse payload (might be string or object)
        const payload: CardsPayload =
          typeof data.payload === 'string'
            ? JSON.parse(data.payload)
            : data.payload;

        if (payload.action === "show") {
          setCards(payload.cards);
          setIsVisible(true);
          console.log(`Displaying ${payload.cards.length} cards`);
        } else if (payload.action === "hide") {
          setIsVisible(false);
        }

        return "success";
      } catch (error) {
        console.error("Error processing displayCards:", error);
        return "error: " + (error instanceof Error ? error.message : String(error));
      }
    };

    // Register the RPC method
    room.localParticipant.registerRpcMethod(
      "client.displayCards",
      handleDisplayCards
    );

    console.log("Registered RPC method: client.displayCards");

    // Cleanup
    return () => {
      // Note: LiveKit doesn't provide unregister, but component unmount handles this
    };
  }, [room]);

  // Handle card selection
  const handleCardClick = async (cardId: string) => {
    if (!agent) {
      console.warn("No agent available to send selection");
      return;
    }

    try {
      console.log(`User clicked card: ${cardId}`);

      // Send RPC to agent
      const result = await room.localParticipant.performRpc({
        destinationIdentity: agent.identity,
        method: "agent.selectCard",
        payload: JSON.stringify({
          cardId: cardId,
          action: "select"
        })
      });

      console.log("Agent acknowledged selection:", result);
    } catch (error) {
      console.error("Failed to send card selection:", error);
    }
  };

  if (!isVisible || cards.length === 0) {
    return null;
  }

  return (
    <div className="cards-container">
      <h3>Select an option:</h3>
      <div className="cards-grid">
        {cards.map((card) => (
          <div
            key={card.id}
            className="card"
            onClick={() => handleCardClick(card.id)}
          >
            <h4>{card.title}</h4>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Explanation**:
- `useRoomContext()` gives access to the LiveKit room
- `registerRpcMethod()` sets up the handler for incoming `client.displayCards` calls
- `handleDisplayCards()` receives card data and updates state
- `handleCardClick()` sends `agent.selectCard` RPC when user clicks
- The component handles show/hide based on payload action

---

### Step 2: Add Basic Styling

Add some basic CSS to make the cards visible (customize as needed):

```css
/* Add to your global CSS or create CardsContainer.module.css */

.cards-container {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  width: 90%;
  z-index: 1000;
}

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.card {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.card:hover {
  background: #f5f5f5;
  border-color: #666;
  transform: translateY(-2px);
}

.card h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.card p {
  margin: 0;
  font-size: 14px;
  color: #666;
}
```

**Note**: The UI design, layout, animations, and interactions are entirely up to the frontend developer. This is just a minimal starting point.

---

### Step 3: Add to Your Main Page

Import and add the component to your main page (e.g., `app/page.tsx`):

```typescript
import { CardsContainer } from '@/components/CardsContainer';

export default function Page() {
  return (
    <LiveKitRoom>
      {/* Your existing components */}
      <AgentVisualizer />
      <TranscriptionView />

      {/* Add the cards container */}
      <CardsContainer />

      <ControlBar />
    </LiveKitRoom>
  );
}
```

---

### Complete Frontend Setup Checklist

✅ Create `CardsContainer` component
✅ Register RPC handler for `client.displayCards`
✅ Implement `performRpc` call for `agent.selectCard`
✅ Add component to main page
✅ Add basic styling (or custom UI)
✅ Test that RPC methods are registered on mount

---

## ✅ Testing the Integration

### Step-by-Step Verification

#### 1. **Backend Test: Check RPC Registration**
Start your agent and look for this log:
```
INFO: Registered RPC method: agent.selectCard
```

#### 2. **Frontend Test: Check RPC Registration**
Open browser console and look for:
```
Registered RPC method: client.displayCards
```

#### 3. **Test Agent → Frontend (Display Cards)**
In your voice agent, say or type:
```
"Show me 5 options"
```

**Expected behavior**:
- Agent calls `display_cards(count=5)`
- Backend log: `Displayed 5 cards to user`
- Frontend log: `Received displayCards RPC: {...}`
- Frontend log: `Displaying 5 cards`
- UI shows 5 cards on screen ✅

#### 4. **Test Frontend → Agent (Card Selection)**
Click on any card in the UI.

**Expected behavior**:
- Frontend log: `User clicked card: card-3`
- Frontend log: `Agent acknowledged selection: success`
- Backend log: `User selected card: card-3 (action: select)`
- Backend log: `Selected card data: {id: "card-3", title: "Item 3", ...}`
- Agent speaks: "Item 3 is a great choice! Here's what you should know..." (or similar) ✅
- Agent has referenced the selected card in its response ✅

---

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "No user connected" error | Check that frontend participant is in the room before agent calls display_cards() |
| RPC not registered | Ensure registration happens in the right lifecycle (after room is connected) |
| Payload is undefined | Check that JSON.stringify() and JSON.parse() are used consistently |
| Cards don't appear | Check browser console for errors; verify CSS doesn't hide the container |
| Agent doesn't receive clicks | Verify agent participant identity is found correctly |

---

### Debug Checklist

**Backend**:
```python
# Add debug logs
logger.info(f"Room participants: {list(room.remote_participants.keys())}")
logger.info(f"Sending RPC to: {participant.identity}")
logger.info(f"Payload: {payload}")
```

**Frontend**:
```typescript
// Add debug logs
console.log("Agent participant:", agent);
console.log("Sending RPC with payload:", payload);
console.log("Room connected:", room.state);
```

---

## 🚀 Next Steps

Once you have the basic RPC working with dummy cards, here's how to extend it:

### Phase 2: Connect Real Database

**Backend changes**:
```python
# Instead of generating dummy cards:
db_result = await fetch_from_database()  # Your MCP tool
cards = [map_db_item_to_card(item) for item in db_result["results"]]

# Rest of the code stays the same!
```

**Frontend changes**:
- No changes needed! The RPC handler already accepts any card structure
- Update UI to show real fields (name, amount, description, etc.)

---

### Phase 3: Add Card Types

**Backend**:
```python
def map_sponsorship_to_card(item):
    return {
        "id": str(item["id"]),
        "type": "sponsorship",
        "title": item["name_en"],
        "amount": f"{item['monthly_amount_qar']} QAR/month",
        "description": item["additional_info_en"]
    }

def map_project_to_card(item):
    return {
        "id": str(item["id"]),
        "type": "project",
        "title": item["project_name_en"],
        "progress": calculate_progress(item),
        "description": item["project_description_en"]
    }
```

**Frontend**:
```typescript
interface Card {
  id: string;
  type: "sponsorship" | "project";
  title: string;
  // ... type-specific fields
}

// Render different components based on type
{card.type === "sponsorship" ? (
  <SponsorshipCard data={card} />
) : (
  <ProjectCard data={card} />
)}
```

---

### Extension Points

**More RPC Methods**:
- `client.updateCard` - Update card data dynamically
- `client.hideCards` - Dismiss all cards
- `agent.expandCard` - Request more details for a specific card

**More Actions**:
- `"donate"` - User wants to donate to this item
- `"save"` - User saves for later
- `"share"` - User wants to share

**State Management**:
- Track which cards have been viewed
- Remember user preferences
- Show "recently viewed" cards

---

## 📚 Reference

### LiveKit RPC Documentation
- [Official RPC Docs](https://docs.livekit.io/home/client/data/rpc/)
- Method name limit: 64 bytes
- Payload limit: 15 KiB
- Default timeout: 10 seconds

### Key LiveKit APIs

**Backend (Python)**:
```python
# Send RPC
await room.local_participant.perform_rpc(
    destination_identity=str,
    method=str,
    payload=str
)

# Register RPC handler
room.local_participant.register_rpc_method(
    method=str,
    handler=async_function
)
```

**Frontend (TypeScript)**:
```typescript
// Send RPC
await room.localParticipant.performRpc({
  destinationIdentity: string,
  method: string,
  payload: string
})

// Register RPC handler
room.localParticipant.registerRpcMethod(
  method: string,
  handler: async (data: any) => Promise<string>
)
```

---

## 🎯 Success Criteria

You'll know the setup is working when:

✅ Agent can call `display_cards(5)` and 5 cards appear in the UI
✅ User can click any card and agent logs the selection
✅ Agent has access to selected card data in `userdata.selected_card`
✅ No errors in backend or frontend console
✅ Communication is bidirectional and reliable

---

## 📞 Support

If you encounter issues:
1. Check the Debug Checklist above
2. Verify both RPC methods are registered (check logs)
3. Test with minimal payload first (single card)
4. Ensure LiveKit room is connected before RPC calls

---

**Document Version**: 1.1
**Last Updated**: 2025-01-04
**For**: Qatar Charity Voice Agent - RPC Implementation Phase 1

**Changelog**:
- v1.1: Updated to use `session.generate_reply()` for card selection responses (compatible with OpenAI Realtime)
- v1.0: Initial version
