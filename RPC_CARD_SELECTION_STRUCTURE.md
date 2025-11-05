# Frontend → Agent RPC Payload Structure

## RPC Method: `agent.selectCard`

**Direction**: Frontend → Agent (Backend)

---

## Outgoing Payload

```json
{
  "cardId": "card-3",
  "action": "select"
}
```

---

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `cardId` | `string` | Unique identifier of the selected card (e.g., `"card-1"`, `"card-2"`) |
| `action` | `string` | Action performed by user (currently `"select"`, extensible for future actions) |

---

## Possible Action Values

| Action | Description |
|--------|-------------|
| `"select"` | User clicked/selected the card to view details |
| `"expand"` | *(Future)* User wants to see more details |
| `"close"` | *(Future)* User dismissed the card |
| Custom | Frontend can define additional actions as needed |

---

## Expected Response

The backend handler should return:
- **Success**: `"success"`
- **Error**: `"error: <message>"`

---

## Example Handler Registration (Frontend - TypeScript)

```typescript
const handleCardClick = async (cardId: string) => {
  if (!agent) {
    console.warn("No agent available");
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
    console.log("Agent acknowledged:", result);
  } catch (error) {
    console.error("Failed to send selection:", error);
  }
};
```

---

## Backend Handler Example (Python)

```python
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
        await session.generate_reply(
            user_input=f"Tell me more about {selected_card['title']}"
        )

        return "success"

    except Exception as e:
        logger.error(f"Error handling card selection: {e}")
        return f"error: {str(e)}"

# Register the RPC method
ctx.room.local_participant.register_rpc_method(
    "agent.selectCard",
    handle_card_selection
)

logger.info("Registered RPC method: agent.selectCard")
```

---

## Complete Interaction Flow

```
1. User clicks card in UI
   ↓
2. Frontend: handleCardClick("card-3") executed
   ↓
3. Frontend: Shows product detail view
   ↓
4. Frontend: Sends RPC to agent
   Method: "agent.selectCard"
   Payload: {"cardId": "card-3", "action": "select"}
   ↓
5. Backend: handle_card_selection() receives RPC
   ↓
6. Backend: Finds card in userdata.last_displayed_cards
   ↓
7. Backend: Stores in userdata.selected_card
   ↓
8. Backend: Calls session.generate_reply()
   ↓
9. Agent: Responds via voice about selected card
   Example: "Item 3 is a great choice! Let me tell you more..."
   ↓
10. Backend: Returns "success" to frontend
   ↓
11. Frontend: Logs success message
```

---

## Error Handling

### Frontend Errors

| Error | Cause | User Experience |
|-------|-------|-----------------|
| No agent participant | Agent not connected to room | Detail view still shows, warning logged |
| RPC timeout | Backend not responding | Detail view still shows, error logged |
| RPC failure | Network/connection issue | Detail view still shows, error logged |

**Important**: Frontend continues to show the detail view even if RPC fails. The RPC is for agent context only and shouldn't block the UI.

### Backend Errors

| Error | Response | Agent Behavior |
|-------|----------|----------------|
| Missing cardId | `"error: missing cardId"` | No response generated |
| Card not found | `"error: card not found"` | No response generated |
| Exception | `"error: <exception message>"` | No response generated |

---

## Integration Notes

### Frontend Requirements
- Agent participant must be identified and stored
- RPC call should not block UI rendering
- Graceful degradation if agent is unavailable

### Backend Requirements
- Must have `userdata.last_displayed_cards` populated from previous `display_cards()` call
- Must have `session.generate_reply()` available
- Should validate cardId exists in stored cards

---

## Testing

### Frontend Testing
```javascript
// Console logs to verify:
console.log("🖱️ User clicked card: card-3");      // Card clicked
console.log("✅ Agent acknowledged selection: success"); // RPC succeeded
// OR
console.log("⚠️ No agent available to send selection");  // No agent
console.log("❌ Failed to send card selection:", error); // RPC failed
```

### Backend Testing
```python
# Logs to verify:
logger.info("User selected card: card-3 (action: select)")
logger.info("Selected card data: {id: 'card-3', title: 'Item 3', ...}")
# Agent should speak about the selected card
```

---

**Document Version**: 1.0
**Last Updated**: 2025-01-04
**For**: Qatar Charity Voice Agent - Card Selection RPC
