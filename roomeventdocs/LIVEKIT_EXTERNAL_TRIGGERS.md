# LiveKit External Triggers Research

## Executive Summary

**Yes, LiveKit has webhooks, BUT they work in the opposite direction** - they're for **receiving notifications FROM LiveKit**, not sending commands TO your agent.

However, the **perfect solution** exists: LiveKit's **Server API `send_data()` method** combined with a **`data_received` event listener** in your agent.

---

## LiveKit Webhooks: What They Actually Do

### Available Webhook Events (FROM LiveKit → TO Your Server)

LiveKit sends HTTP POST notifications to your backend when these events occur:

| Event Type | Description |
|------------|-------------|
| `room_started` | Room is created |
| `room_finished` | Room closes |
| `participant_joined` | User enters room |
| `participant_left` | User exits room |
| `participant_connection_aborted` | Connection failure |
| `track_published` | Media stream starts |
| `track_unpublished` | Media stream stops |
| `egress_started/ended` | Recording lifecycle |
| `ingress_started/ended` | Stream import lifecycle |

### Configuration

**LiveKit Cloud:**
- Configure in project dashboard → Settings section

**Our credentials (from .env):**
```
LIVEKIT_URL=wss://avatar-0eg4ebl6.livekit.cloud
LIVEKIT_API_KEY=APIAGZCpCQCeTH4
LIVEKIT_API_SECRET=sJc6EJk3uA4A0RPiMFW7jkfALCyMNhaPzeMeeihM9XLD
```

### Why Webhooks DON'T Solve the Trigger Problem

❌ **Webhooks are one-way notifications** - LiveKit tells you "something happened"
❌ **You can't use webhooks to send commands** to specific rooms/sessions
❌ **They're for reactive monitoring**, not proactive triggering

---

## ✅ THE SOLUTION: Server API `send_data()` + Agent Listener

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│   External System (Webhook receiver, Admin panel, etc)  │
│                                                          │
│   - Receives external event (new donation, etc.)        │
│   - Calls LiveKit Server API                            │
└─────────────────┬────────────────────────────────────────┘
                  │
                  │ send_data(room, message)
                  │
┌─────────────────▼────────────────────────────────────────┐
│              LIVEKIT CLOUD                                │
│                                                          │
│   - Receives data packet from server                     │
│   - Routes to specified room                             │
└─────────────────┬────────────────────────────────────────┘
                  │
                  │ data_received event
                  │
┌─────────────────▼────────────────────────────────────────┐
│         YOUR AGENT (agent.py)                            │
│                                                          │
│   @ctx.room.on("data_received")                         │
│   def on_data(packet):                                  │
│       message = json.loads(packet.data)                 │
│       session.generate_reply(...)  # ← TRIGGERED!      │
└──────────────────────────────────────────────────────────┘
```

### Advantages

✅ **No room joining required** - Server API bypasses WebRTC
✅ **Scales to unlimited rooms** - Target any room by name
✅ **Works from any external system** - HTTP/Python/Node.js/etc.
✅ **No "ghost participants"** - Server messages don't appear as users
✅ **Built-in authentication** - Uses your LiveKit credentials
✅ **Already fixed in SDK** - Previous bugs (Issue #404) are resolved

---

## Implementation

### Required Package

```bash
pip install livekit-api
```

### External Trigger Script

```python
#!/usr/bin/env python3
"""
External script to trigger agent replies in any room.
Can be called from webhooks, cron jobs, admin panels, etc.
"""

import asyncio
import json
import os
import datetime
from livekit import api
from livekit.protocol.room import DataPacket

async def trigger_agent_reply(room_name: str, message: str, topic: str = "external_trigger"):
    """
    Send a message to the agent in a specific room.

    Args:
        room_name: The LiveKit room name (e.g., "room-123")
        message: The message to send to the agent
        topic: Optional topic for filtering (default: "external_trigger")
    """
    # Initialize API with credentials from environment
    lkapi = api.LiveKitAPI(
        url=os.getenv("LIVEKIT_URL"),
        api_key=os.getenv("LIVEKIT_API_KEY"),
        api_secret=os.getenv("LIVEKIT_API_SECRET"),
    )

    # Prepare the message payload
    payload = json.dumps({
        "action": "trigger_reply",
        "message": message,
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat()
    })

    # Send data to the room
    await lkapi.room.send_data(
        api.SendDataRequest(
            room=room_name,
            data=payload.encode('utf-8'),
            kind=DataPacket.Kind.RELIABLE,  # Guaranteed delivery
            topic=topic,
            # destination_identities=[]  # Empty = broadcast to all participants
        )
    )

    print(f"✓ Sent trigger to room '{room_name}'")

    await lkapi.aclose()

# Example usage
if __name__ == "__main__":
    import sys
    from dotenv import load_dotenv

    load_dotenv()

    if len(sys.argv) < 3:
        print("Usage: python external_trigger.py <room_name> <message>")
        sys.exit(1)

    room_name = sys.argv[1]
    message = sys.argv[2]

    asyncio.run(trigger_agent_reply(room_name, message))
```

### Agent Listener (Add to agent.py)

```python
# Add after registering RPC handlers (around line 246)

@ctx.room.on("data_received")
def on_data_received(data_packet: rtc.DataPacket):
    """Handle external trigger messages from server."""
    # Check if this is a server-sent message (not from another participant)
    if data_packet.participant is None:
        logger.info(f"Received server data on topic: {data_packet.topic}")

        try:
            # Decode the message
            payload = json.loads(data_packet.data.decode('utf-8'))

            # Check if this is an external trigger
            if payload.get("action") == "trigger_reply":
                message = payload.get("message", "")
                logger.info(f"External trigger received: {message}")

                # Trigger the agent to speak
                session.interrupt()  # Stop current speech if any
                session.generate_reply(user_input=f"System: {message}")

        except Exception as e:
            logger.error(f"Error processing external data: {e}")

logger.info("External trigger listener registered")
```

Required imports:
```python
import json
from livekit import rtc
```

---

## Usage Examples

### Command Line
```bash
python external_trigger.py "room-123" "A new donation of $100 was received!"
```

### From Webhook Receiver (Flask)
```python
from flask import Flask, request
import asyncio

app = Flask(__name__)

@app.post("/webhook/new-donation")
async def handle_donation_webhook():
    data = request.json
    room_name = data['user_room_id']
    amount = data['donation_amount']

    message = f"Great news! A new donation of ${amount} was just received."

    await trigger_agent_reply(room_name, message)

    return {"status": "triggered"}
```

### From Scheduled Job
```python
import asyncio

async def send_daily_reminders():
    active_rooms = await get_active_rooms()  # Your logic

    for room in active_rooms:
        await trigger_agent_reply(
            room.name,
            "This is your daily reminder to check your sponsorships."
        )

asyncio.run(send_daily_reminders())
```

---

## Data Packet API Details

### Server SDK Method

```python
await lkapi.room.send_data(
    api.SendDataRequest(
        room="room-name",           # Target room
        data=b"bytes data",         # Binary payload
        kind=DataPacket.Kind.RELIABLE,  # or LOSSY
        destination_identities=[],  # Empty = broadcast
        topic="optional-topic"      # For filtering
    )
)
```

### Delivery Modes

- **RELIABLE**: Guaranteed delivery, max 15 KiB, delivered in order
- **LOSSY**: Best-effort, max 1300 bytes recommended, faster

### Agent Listener Event

```python
@room.on("data_received")
def on_data(packet: rtc.DataPacket):
    packet.data            # bytes: The payload
    packet.participant     # RemoteParticipant or None (server-sent)
    packet.kind            # RELIABLE or LOSSY
    packet.topic           # str: Optional topic
```

---

## Security Considerations

1. **Authentication**: Uses LiveKit API credentials
2. **Message Validation**: Add signature verification for HTTP endpoints
3. **Rate Limiting**: Implement limits to prevent abuse
4. **Topic Filtering**: Use topics to separate trigger types

---

## Comparison with Other Approaches

| Approach | Room Joining | Multi-User | Implementation | Scalability |
|----------|-------------|------------|----------------|-------------|
| **Server API + data_received** | ❌ No | ✅ Yes | Medium | ⭐⭐⭐⭐⭐ |
| RPC Method | ✅ Yes | ❌ No | Easy | ⭐⭐ |
| HTTP Endpoint | ❌ No | ✅ Yes | Hard | ⭐⭐⭐⭐ |
| Webhooks (LiveKit) | N/A | N/A | N/A | ❌ Wrong direction |

---

## References

- [LiveKit Webhooks Documentation](https://docs.livekit.io/home/server/webhooks/)
- [Server APIs Documentation](https://docs.livekit.io/reference/server/server-apis/)
- [Data Packets Documentation](https://docs.livekit.io/home/client/data/packets/)
- [Python SDK Room Service](https://docs.livekit.io/reference/python/v1/livekit/api/room_service.html)
- [Issue #404 - Fixed data_received bug](https://github.com/livekit/agents/issues/404)
- [Issue #532 - data_received feature confirmation](https://github.com/livekit/agents/issues/532)

---

## Known Issues (Resolved)

- **Issue #404**: `KeyError` when receiving server-sent data - **FIXED** in python-sdks#215
- **Issue #532**: Feature request for data_received - **ALREADY EXISTS** via `@ctx.room.on("data_received")`

Make sure to use updated SDK versions:
```bash
pip install --upgrade livekit-api livekit
```
