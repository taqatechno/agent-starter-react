# Frontend RPC Payload Structure

## RPC Method: `client.displayCards`

**Direction**: Agent (Backend) → Frontend

---

## Incoming Payload

```json
{
  "action": "show",
  "cards": [
    {
      "id": "card-1",
      "title": "Item 1",
      "description": "This is card number 1. Click to learn more."
    },
    {
      "id": "card-2",
      "title": "Item 2",
      "description": "This is card number 2. Click to learn more."
    },
    {
      "id": "card-3",
      "title": "Item 3",
      "description": "This is card number 3. Click to learn more."
    }
  ]
}
```

---

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `action` | `string` | Action to perform: `"show"` or `"hide"` |
| `cards` | `array` | Array of card objects |
| `cards[].id` | `string` | Unique card identifier (e.g., `"card-1"`) |
| `cards[].title` | `string` | Card title |
| `cards[].description` | `string` | Card description |

---

## Expected Response

Your handler should return:
- **Success**: `"success"`
- **Error**: `"error: <message>"`

---

## Example Handler Registration (TypeScript)

```typescript
room.localParticipant.registerRpcMethod(
  "client.displayCards",
  async (data) => {
    const payload = JSON.parse(data.payload);
    // Display cards in your UI
    return "success";
  }
);
```
