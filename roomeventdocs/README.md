# LiveKit Data Sender

TypeScript scripts to send JSON data to LiveKit rooms and agents using the Server API.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- LiveKit account with API credentials

## Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Configure credentials:**

The `.env` file should already contain your LiveKit credentials:

```env
LIVEKIT_URL=wss://avatar-0eg4ebl6.livekit.cloud
LIVEKIT_API_KEY=APIAGZCpCQCeTH4
LIVEKIT_API_SECRET=sJc6EJk3uA4A0RPiMFW7jkfALCyMNhaPzeMeeihM9XLD
```

If you need to update these, edit the `.env` file.

## Two Approaches

### Approach 1: Broadcast to All (Recommended for Testing)

**Simpler, no need to find agent identity**

```bash
npx ts-node broadcast-to-room.ts <room-name> [message]
```

Examples:
```bash
npx ts-node broadcast-to-room.ts room-123
npx ts-node broadcast-to-room.ts room-123 "Hello everyone!"
```

**Pros:**
- ✓ Simple - no need to know agent identity
- ✓ Works for all participants
- ✓ Good for testing

**Cons:**
- ✗ All participants receive the message (not just agent)

### Approach 2: Target Specific Agent

**More precise, sends only to the agent**

```bash
npx ts-node send-to-agent.ts <room-name> <agent-identity> [message]
```

Examples:
```bash
npx ts-node send-to-agent.ts room-123 my-agent
npx ts-node send-to-agent.ts room-123 my-agent "Hello agent!"
```

**Pros:**
- ✓ Only the agent receives the message
- ✓ More efficient

**Cons:**
- ✗ Requires knowing the exact agent identity
- ✗ Fails if agent identity is wrong

## Message Format

Both scripts send the same JSON structure:

```json
{
  "message": "your message here",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## Receiving Data in Your Agent

**IMPORTANT:** Add this listener to your Python agent code (`agent.py`):

```python
@ctx.room.on("data_received")
def on_data_received(data_packet: rtc.DataPacket):
    """Handle all incoming data messages."""
    try:
        # Decode the JSON payload
        payload = json.loads(data_packet.data.decode("utf-8"))
        message = payload.get("message")

        if message:
            logger.info(f"Received external message: {message}")
            session.interrupt()
            session.generate_reply(user_input=f"System: {message}")
    except Exception as e:
        logger.error(f"Error processing data: {e}")
```

**Key Points:**
- ✓ Processes ALL `data_received` events (no participant filter)
- ✓ Works with both broadcast and targeted approaches
- ✓ Add to your agent initialization code

A complete example is available in `agent-listener-example.py`.

## How It Works

1. **Server-Side Sending**: Uses `RoomServiceClient.sendData()` from the LiveKit server SDK
2. **Reliable Delivery**: Messages use `RELIABLE` mode for guaranteed delivery (up to 15 KiB)
3. **No Room Joining**: The server doesn't need to join the room as a participant
4. **Correct API Usage**: Uses `destinationIdentities` (not deprecated `destinationSids`)

## Project Structure

```
.
├── broadcast-to-room.ts        # Broadcast to all participants
├── send-to-agent.ts            # Send to specific agent
├── agent-listener-example.py   # Python agent listener code
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── .env                        # LiveKit credentials (not committed)
├── .env.example                # Template for credentials
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## Troubleshooting

**Agent not receiving data:**
1. Verify the agent has the `@ctx.room.on("data_received")` listener registered
2. Try the broadcast approach first to rule out identity issues
3. Check agent logs for any errors
4. Ensure agent is actually in the room

**"Missing LiveKit credentials" error:**
- Ensure `.env` file exists with valid credentials

**"Room not found" error:**
- Verify the room name is correct
- Make sure the room exists and is active

**"Agent not found" error (send-to-agent.ts):**
- Check the exact agent identity in the room
- Use `listParticipants` to see all identities
- Try the broadcast approach instead

**TypeScript errors:**
- Run `npm install` to ensure all dependencies are installed

## Finding Your Agent Identity

If you don't know your agent's identity, you can list all participants:

```bash
npx ts-node -e "
import { RoomServiceClient } from 'livekit-server-sdk';
import * as dotenv from 'dotenv';
dotenv.config();
const svc = new RoomServiceClient(process.env.LIVEKIT_URL, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
svc.listParticipants('room-name').then(p => console.log(p.map(x => x.identity)));
"
```

Replace `room-name` with your actual room name.

## References

- [LiveKit Server API Documentation](https://docs.livekit.io/reference/server/server-apis/)
- [LiveKit Data Packets](https://docs.livekit.io/home/client/data/packets/)
- [LiveKit Node.js SDK](https://docs.livekit.io/reference/server-sdk-js/)
