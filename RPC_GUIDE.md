# RPC Implementation Guide for LiveKit Agents

## Table of Contents
- [Introduction](#introduction)
- [RPC Contract](#rpc-contract)
- [Agent Side (Backend)](#agent-side-backend)
  - [Prerequisites & Setup](#prerequisites--setup)
  - [Sending RPC Calls to Frontend](#sending-rpc-calls-to-frontend)
  - [Receiving RPC Calls from Frontend](#receiving-rpc-calls-from-frontend)
  - [Listening to Function Call Events](#listening-to-function-call-events)
  - [Best Practices](#best-practices)
  - [Implementation Checklist](#implementation-checklist)
- [Frontend Side](#frontend-side)
- [Reference Implementation](#reference-implementation)

---

## Introduction

This guide teaches you how to implement **bidirectional RPC (Remote Procedure Call)** communication between a LiveKit voice agent (backend) and a web UI (frontend).

### What is RPC?

RPC enables real-time, bidirectional communication:

- **Backend → Frontend (Outgoing)**: Agent controls UI elements by calling functions on the frontend
- **Frontend → Backend (Incoming)**: User interactions notify the agent to trigger responses

### When to Use RPC

**Use RPC when you need to:**
- Display dynamic UI elements based on agent decisions (cards, modals, notifications)
- Control frontend state from the backend (show/hide panels, update displays)
- Notify the agent of user interactions (clicks, selections, form submissions)
- Synchronize real-time data between backend and frontend

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Browser)                       │
│              LiveKit Client + RPC Handlers                   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
    Sends RPC  │                              │  Receives RPC
    agent.*    │                              │  client.*
               │                              │
┌──────────────▼──────────────────────────────▼───────────────┐
│                    LIVEKIT ROOM                              │
│          (Manages WebRTC + RPC Routing)                      │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
   Incoming    │                              │  Outgoing
   RPC Handler │                              │  RPC Calls
               │                              │
┌──────────────▼──────────────────────────────▼───────────────┐
│               BACKEND (Voice Agent)                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         agent.py (Main Entry Point)                 │   │
│  │  - AgentSession                                     │   │
│  │  - Register RPC handlers                            │   │
│  │  - Listen for function events                       │   │
│  └───────────────┬─────────────────┬───────────────────┘   │
│                  │                 │                         │
│    ┌─────────────▼─────────┐     ┌▼────────────────────┐  │
│    │  RPC Handlers          │     │ Event Listeners     │  │
│    │                        │     │                     │  │
│    │ Outgoing (Tools):      │     │ Function call       │  │
│    │ - display_items()      │◄────┤ detection and       │  │
│    │ - control_modal()      │     │ result extraction   │  │
│    │                        │     │                     │  │
│    │ Incoming (Handlers):   │     └─────────────────────┘  │
│    │ - handle_selection()   │                              │
│    └────────────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Concepts

- **`perform_rpc()`**: Send RPC calls from backend to frontend
- **`register_rpc_method()`**: Register handlers to receive RPC calls from frontend
- **`@function_tool()`**: Decorator to make functions available to the agent's LLM
- **`session.interrupt()`**: Stop current agent speech
- **`session.generate_reply()`**: Make the agent speak/respond
- **`@session.agent.on("event")`**: Listen for agent events (e.g., function execution)

---

## RPC Contract

### Why You Need an RPC Contract

An **RPC Contract** is a documented agreement between frontend and backend defining:
- Method names
- Request payload schemas
- Response payload schemas
- Error formats

**Benefits:**
- ✅ Prevents schema mismatches
- ✅ Enables independent development (frontend/backend teams)
- ✅ Serves as API documentation
- ✅ Facilitates testing and validation
- ✅ Version control for API changes

### Creating an RPC Contract

Create a file `RPC_CONTRACT.md` in your project root:


# RPC Contract

### Version: 1.0.0
---
## Backend → Frontend RPCs

### client.displayItems

**Purpose**: Display or hide items in the UI

**Request Payload:**

``` json
{
  "action": "show" | "hide",
  "items": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      // ... other fields
    }
  ]
}
```

**Success Response:**
```json
{
  "status": "success",
  "items": [
    {"id": "string", "title": "string"}
  ]
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description"
}
```

---

### client.controlModal

**Purpose**: Open or close a modal dialog

**Request Payload:**
```json
{
  "action": "open" | "close",
  "itemId": "string"  // Required for "open"
}
```

**Success Response:**
```json
{
  "status": "success",
  "itemId": "string"  // For "open" action
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description"
}
```

---

## Frontend → Backend RPCs

### agent.selectItem

**Purpose**: Notify agent that user selected an item

**Request Payload:**
```json
{
  "itemId": "string",
  "action": "select" | "view" | "other"
}
```

**Response:**
- Success: `"success"`
- Error: `"error: <message>"`

---

### agent.buttonClick

**Purpose**: Notify agent of button interactions

**Request Payload:**
```json
{
  "buttonId": "string",
  "metadata": {}  // Optional
}
```

**Response:**
- Success: `"success"`
- Error: `"error: <message>"`


### Contract Best Practices

1. **Version your contract**: Increment version on breaking changes
2. **Document all fields**: Include types, required/optional, descriptions
3. **Define error formats**: Standardize error responses
4. **Include examples**: Show real request/response examples
5. **Keep it updated**: Update contract before implementing changes

---

## Agent Side (Backend)

### Prerequisites & Setup

#### 1. Dependencies

```toml
[tool.poetry.dependencies]
python = "^3.10"
livekit-agents = "^1.2"
livekit-plugins-openai = ">=1.2.14"
livekit = ">=1.0.16"
python-dotenv = "^1.0.0"
```

#### 2. Environment Variables

```bash
# LiveKit Configuration
LIVEKIT_URL=wss://your-instance.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...
```

#### 3. Project Structure

```
your-agent-project/
├── agent.py                    # Main entry point
├── rpc_handlers/
│   ├── __init__.py            # Export handlers
│   └── your_handlers.py       # RPC handler implementations
├── RPC_CONTRACT.md            # API contract
├── .env                        # Environment variables
└── pyproject.toml             # Dependencies
```

---

### Sending RPC Calls to Frontend

Use this pattern when the **agent needs to control the frontend** (e.g., display data, open modals).

#### Pattern: Function Tool

**Step 1: Create the function with `@function_tool()` decorator**

```python
import json
import logging
from typing import Optional, List, Dict
from livekit.agents import function_tool, RunContext, get_job_context

logger = logging.getLogger(__name__)

@function_tool()
async def display_items(
    context: RunContext,
    action: str = "show",
    items: Optional[List[Dict]] = None
) -> str:
    """
    Display or hide items in the UI.

    Call this function when you need to show data to the user in the UI.

    Args:
        action: "show" to display items, "hide" to remove them
        items: List of item objects to display (required for "show")

    Returns:
        Frontend response as JSON string or error message if RPC fails
    """
    # Validate inputs
    if action not in ["show", "hide"]:
        return "Error: action must be 'show' or 'hide'"

    if action == "show" and not items:
        return "Error: items required for show action"

    try:
        # Get room and participant
        room = get_job_context().room
        participant_identity = next(iter(room.remote_participants))

        # Prepare payload according to RPC contract
        payload = {
            "action": action,
            "items": items if action == "show" else []
        }

        # Send RPC to frontend
        response = await room.local_participant.perform_rpc(
            destination_identity=participant_identity,
            method="client.displayItems",  # Must match RPC contract
            payload=json.dumps(payload)
        )

        # Return frontend response as-is - let agent parse it
        logger.info(f"RPC completed: client.displayItems")
        return response

    except Exception as e:
        # Only catch actual RPC failures (timeout, network error)
        logger.error(f"RPC call failed: {e}")
        return f"Error: RPC call failed - {str(e)}"
```

**Step 2: Register the tool with your agent**

```python
# In agent.py
from rpc_handlers.your_handlers import display_items, control_modal

agent = YourAgentClass(
    instructions=instructions,
    tools=[display_items, control_modal],  # Add your functions here
)
```

**Step 3: Agent uses it automatically**

The agent's LLM will call your function based on:
- The function's docstring
- The conversation context
- User requests

---

### Receiving RPC Calls from Frontend

Use this pattern when the **frontend needs to notify the agent** (e.g., user clicked something).

#### Pattern: RPC Handler

**Step 1: Create the handler function**

```python
from livekit.agents import AgentSession

async def handle_item_selection(session: AgentSession, data):
    """
    Handle item selection from user.

    Args:
        session: AgentSession for controlling agent responses
        data: RPC data containing payload from frontend

    Returns:
        String response to send back to frontend
    """
    try:
        # Parse payload
        payload = json.loads(data.payload)
        item_id = payload.get("itemId")
        action = payload.get("action", "select")

        # Validate required fields
        if not item_id:
            logger.error("Missing itemId in payload")
            return "error: missing itemId"

        logger.info(f"User {action} item: {item_id}")

        # CRITICAL PATTERN: Interrupt current speech and respond
        await session.interrupt()  # Stop any current speech

        # Generate reply WITHOUT await (prevents frontend timeout)
        session.generate_reply(
            user_input=f"System: The user {action} item {item_id}. Respond appropriately."
        )

        # Return immediately to frontend
        return "success"

    except Exception as e:
        logger.error(f"Error handling selection: {e}")
        return f"error: {str(e)}"
```

**Step 2: Create registration function**

```python
from livekit.agents import JobContext

def register_item_handlers(ctx: JobContext, session: AgentSession) -> None:
    """Register all item-related RPC handlers."""

    @ctx.room.local_participant.register_rpc_method("agent.selectItem")
    async def _handle_selection(data):
        return await handle_item_selection(session, data)

    logger.info("Registered RPC method: agent.selectItem")
```

**Step 3: Register handlers in main entry point**

```python
# In agent.py, after session.start()
from rpc_handlers import register_item_handlers

await session.start(agent=agent, room=ctx.room)

# Register RPC handlers
register_item_handlers(ctx, session)

logger.info("RPC handlers registered successfully")
```

#### Critical Pattern Explained

When handling user interactions, **always use this exact pattern:**

```python
# 1. Interrupt any current speech
await session.interrupt()

# 2. Generate reply WITHOUT await
session.generate_reply(
    user_input=f"System: [message]"
)

# 3. Return immediately
return "success"
```

**Why this pattern?**
- ✅ **`await session.interrupt()`**: Stops current speech for immediate, consistent responses
- ✅ **No `await` on `generate_reply()`**: Prevents frontend timeout by returning quickly
- ✅ **`user_input` (not `instructions`)**: Appears in context, preventing agent from losing track when multiple replies are cancelled
- ✅ **`"System:"` tag**: Distinguishes system messages from actual user input

❌ **Common Mistakes:**
```python
# DON'T: Use instructions (doesn't appear in context)
await session.generate_reply(instructions="...")

# DON'T: Await generate_reply (causes timeout)
await session.generate_reply(user_input="...")

# DON'T: Skip interrupt (causes overlapping speech)
session.generate_reply(user_input="...")
```

---

### Listening to Function Call Events

Use event listeners to detect when functions complete and extract their results.

#### Use Cases

- Cache function results for later use
- Chain function calls (Function A completes → call Function B)
- Update state based on function execution
- Log function usage and results

#### Pattern: Function Execution Listener

```python
# In agent.py

# Storage for function results
_function_results_cache = {}

@session.agent.on("function_tools_executed")
def on_function_executed(evt):
    """
    Listen for function tool execution completion.

    This fires whenever the agent calls a function tool.

    Event object contains:
    - evt.tool_name: Name of the function that executed
    - evt.result: Return value from the function
    - evt.arguments: Arguments passed to the function
    """

    logger.info(f"Function executed: {evt.tool_name}")

    # Example 1: Cache specific function results
    if evt.tool_name == "query_database":
        try:
            # Parse the result
            result_data = json.loads(evt.result)

            # Store in cache for other functions to use
            _function_results_cache["last_query"] = result_data

            logger.info(f"Cached query results: {len(result_data)} items")

        except Exception as e:
            logger.error(f"Failed to cache query results: {e}")

    # Example 2: Chain function calls
    elif evt.tool_name == "search_items":
        # When search completes, automatically display results
        result_count = len(json.loads(evt.result))

        if result_count > 0:
            logger.info(f"Search found {result_count} items, triggering display")
            # The agent can now call display_items() with cached results

    # Example 3: Log all function usage
    logger.info(f"Function: {evt.tool_name}, Args: {evt.arguments}, Result length: {len(evt.result)}")
```

#### Extracting and Using Results

**Scenario**: Query external API → Cache results → Display in UI

```python
# Global cache
_cached_data = None

# 1. Create a query function
@function_tool()
async def query_external_api(context: RunContext, search_term: str) -> str:
    """Query external API for data."""
    # Call external API
    results = await external_api.search(search_term)
    return json.dumps(results)

# 2. Create a display function that uses cached data
@function_tool()
async def display_results(context: RunContext, action: str = "show") -> str:
    """Display cached query results in UI."""
    global _cached_data

    if action == "show":
        if not _cached_data:
            return "Error: No data available. Query first."

        items = _cached_data
    else:
        items = []

    # Send to frontend via RPC
    room = get_job_context().room
    participant_identity = next(iter(room.remote_participants))

    response = await room.local_participant.perform_rpc(
        destination_identity=participant_identity,
        method="client.displayItems",
        payload=json.dumps({"action": action, "items": items})
    )

    return response

# 3. Listen for query completion and cache results
@session.agent.on("function_tools_executed")
def on_function_executed(evt):
    global _cached_data

    if evt.tool_name == "query_external_api":
        try:
            # Extract and cache results
            results = json.loads(evt.result)
            _cached_data = results

            logger.info(f"Cached {len(results)} results from API")
        except Exception as e:
            logger.error(f"Failed to cache results: {e}")
```

**Flow:**
```
1. Agent calls query_external_api("laptops")
   ↓
2. Function executes and returns results
   ↓
3. Event listener fires: on_function_executed
   ↓
4. Listener extracts results and caches them
   ↓
5. Agent calls display_results("show")
   ↓
6. display_results uses _cached_data
   ↓
7. Frontend displays items
```

#### Available Events

```python
# Function tool execution (what we've been using)
@session.agent.on("function_tools_executed")
def on_function_executed(evt):
    # evt.tool_name, evt.result, evt.arguments
    pass

# Agent state changes
@session.agent.on("agent_state_changed")
def on_state_changed(evt):
    # evt.state: "initializing", "listening", "thinking", "speaking"
    pass

# User speech
@session.agent.on("user_speech_committed")
def on_user_speech(evt):
    # evt.transcript: What the user said
    pass
```

---

### Best Practices

#### 1. Naming Conventions

- **Outgoing RPC methods**: Prefix with `client.` (e.g., `client.displayItems`)
- **Incoming RPC methods**: Prefix with `agent.` (e.g., `agent.selectItem`)
- **Function tools**: Use descriptive names (e.g., `display_items`, `control_modal`)
- **Handlers**: Prefix with `handle_` (e.g., `handle_item_selection`)

#### 2. RPC Contract Adherence

**Always match your RPC contract:**

```python
# ✅ Good: Matches contract exactly
response = await room.local_participant.perform_rpc(
    destination_identity=participant_identity,
    method="client.displayItems",  # Matches contract
    payload=json.dumps({
        "action": "show",
        "items": items
    })
)

# ❌ Bad: Doesn't match contract
response = await room.local_participant.perform_rpc(
    method="showItems",  # Wrong method name
    payload=json.dumps({
        "action": "show",
        "data": items  # Wrong field name
    })
)
```

#### 3. Error Handling

**Simplified approach: Only catch RPC failures**

```python
try:
    response = await room.local_participant.perform_rpc(...)

    # Return response as-is - let agent parse it
    return response

except Exception as e:
    # Only catch actual RPC failures
    logger.error(f"RPC call failed: {e}")
    return f"Error: RPC call failed - {str(e)}"
```

**Why:**
- Agent receives full context from frontend
- Frontend responses contain rich information
- Agent's LLM can reason about status and messages

#### 4. State Management

**Best Practice: Let frontend manage UI state**

```python
# ✅ Good: Cache external data only
_cached_api_results = None

# ❌ Avoid: Tracking UI state that frontend manages
# _displayed_items = []  # Frontend already knows this
```

**Why:** Frontend responses provide complete UI state context. Duplicating state creates synchronization issues.

#### 5. Agent Response Pattern (CRITICAL)

**For user interactions, always use this pattern:**

```python
# ✅ Correct
await session.interrupt()
session.generate_reply(user_input="System: ...")
return "success"

# ❌ Wrong
await session.generate_reply(instructions="...")
await session.generate_reply(user_input="...")
session.generate_reply(user_input="...")  # Missing interrupt
```

#### 6. Logging

Log all RPC operations for debugging:

```python
logger.info(f"Sending RPC: {method}")
logger.info(f"Received RPC: agent.{method_name}")
logger.error(f"RPC failed: {error}")
```

#### 7. Async/Await

```python
# ✅ Correct
async def my_handler():
    await room.local_participant.perform_rpc(...)
    await session.interrupt()  # Await this
    session.generate_reply(user_input="...")  # Don't await this in handlers

# ❌ Incorrect
def my_handler():  # Missing async
    response = room.local_participant.perform_rpc(...)  # Missing await
```

#### 8. Validate Inputs Before RPC

```python
# Validate action parameters
if action not in ["show", "hide"]:
    return "Error: action must be 'show' or 'hide'"

# Validate required fields
if action == "open" and not item_id:
    return "Error: item_id required for open action"

# Validate data availability
if action == "show" and not _cached_data:
    return "Error: No data available"
```

#### 9. Return Frontend Responses As-Is

```python
# ✅ Good: Return complete response
response = await room.local_participant.perform_rpc(...)
return response  # {"status": "success", "items": [...]}

# ❌ Avoid: Replacing with generic messages
# if response_data.get("status") == "success":
#     return "Success"  # Loses context!
```

**Why:** Agent's LLM can parse JSON and extract relevant information.

#### 10. Event Listeners for Chaining

Use event listeners to chain function calls:

```python
@session.agent.on("function_tools_executed")
def on_function_executed(evt):
    if evt.tool_name == "search_data":
        # Automatically cache results
        _cached_data = json.loads(evt.result)
        logger.info(f"Auto-cached search results")
```

---

### Implementation Checklist

#### Adding Outgoing RPC (Backend → Frontend)

- [ ] Define method in RPC_CONTRACT.md with request/response schemas
- [ ] Create function with `@function_tool()` decorator
- [ ] Write clear docstring for the LLM
- [ ] Validate inputs before RPC call
- [ ] Get room and participant: `room = get_job_context().room`
- [ ] Build payload according to RPC contract
- [ ] Call `await room.local_participant.perform_rpc()`
- [ ] Return frontend response as-is
- [ ] Only catch RPC failures in try/except
- [ ] Add function to tools list in agent
- [ ] Test with actual frontend

#### Adding Incoming RPC (Frontend → Backend)

- [ ] Define method in RPC_CONTRACT.md with request/response schemas
- [ ] Create async handler function `async def handle_xyz(session, data)`
- [ ] Parse payload: `json.loads(data.payload)`
- [ ] Validate required fields
- [ ] Call `await session.interrupt()` to stop current speech
- [ ] Call `session.generate_reply(user_input="System: ...")` WITHOUT await
- [ ] Return string response immediately
- [ ] Create registration function `def register_xyz_handlers(ctx, session)`
- [ ] Use `@ctx.room.local_participant.register_rpc_method("agent.methodName")`
- [ ] Call registration function in agent.py after session.start()
- [ ] Test with actual frontend

#### Adding Event Listener

- [ ] Identify which function completion you need to detect
- [ ] Create event listener: `@session.agent.on("function_tools_executed")`
- [ ] Check `evt.tool_name` to identify specific function
- [ ] Extract result: `json.loads(evt.result)`
- [ ] Store or process the result as needed
- [ ] Add error handling for parsing failures
- [ ] Log event for debugging
- [ ] Test that listener fires correctly

---

## Frontend Side

This section provides comprehensive guidance for implementing RPC in a React frontend using LiveKit's React SDK.

---

### Prerequisites & Setup

#### 1. Dependencies

Install the required LiveKit packages:

```bash
npm install @livekit/components-react livekit-client
# or
yarn add @livekit/components-react livekit-client
# or
pnpm add @livekit/components-react livekit-client
```

**Minimum versions**:
- `@livekit/components-react`: ^2.0.0
- `livekit-client`: ^2.0.0

#### 2. Required Hooks

LiveKit React SDK provides essential hooks for RPC:

```typescript
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';

function YourComponent() {
  // Access the LiveKit room instance
  const room = useRoomContext();

  // Access the voice agent participant
  const { agent } = useVoiceAssistant();

  // Now you can register RPC handlers and send RPC calls
}
```

#### 3. TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

#### 4. Environment Setup

No special environment variables required for frontend RPC. The LiveKit room connection handles all RPC routing automatically.

---

### Implementing RPC Method Handlers

RPC method handlers allow the **agent to control your frontend** (e.g., display data, open modals, update UI).

#### Registration Pattern

Use React's `useEffect` hook to register and clean up RPC handlers:

```typescript
import { useEffect } from 'react';
import { useRoomContext } from '@livekit/components-react';

function YourComponent() {
  const room = useRoomContext();

  useEffect(() => {
    // Define handler function
    const handleYourMethod = async (data: any): Promise<string> => {
      try {
        // 1. Parse payload (may be string or object)
        const payload = typeof data.payload === 'string'
          ? JSON.parse(data.payload)
          : data.payload;

        // 2. Validate required fields
        if (!payload.requiredField) {
          return JSON.stringify({
            status: 'error',
            message: 'requiredField is missing',
          });
        }

        // 3. Update UI state
        // ... your state updates

        // 4. Return success response
        return JSON.stringify({
          status: 'success',
          data: { /* optional context */ },
        });
      } catch (error) {
        console.error('RPC handler error:', error);
        return JSON.stringify({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Register the RPC method
    room.localParticipant.registerRpcMethod(
      'client.yourMethod',
      handleYourMethod
    );

    console.log('Registered RPC method: client.yourMethod');

    // Cleanup: Unregister when component unmounts
    return () => {
      room.localParticipant.unregisterRpcMethod('client.yourMethod');
      console.log('Unregistered RPC method: client.yourMethod');
    };
  }, [room]); // Include all dependencies used in handlers

  return <div>Your UI</div>;
}
```

#### Critical Patterns

1. **Handler Signature**: Always `async (data: any): Promise<string>`
2. **Dual Payload Parsing**: Handle both string and object payloads
3. **JSON String Responses**: Always return `JSON.stringify({ ... })`
4. **Error Handling**: Wrap in try/catch and return structured errors
5. **Cleanup**: Always unregister in useEffect cleanup function

---

#### Example 1: Display Cards Handler

**RPC Method**: `client.displayCards` (from this project)

This handler receives cards from the agent and displays them in the UI.

**Location**: `components/app/new-ui/new-session-view.tsx:60-107`

```typescript
const handleDisplayCards = async (data: any): Promise<string> => {
  try {
    console.log('📨 Received displayCards RPC:', data);

    // Parse payload (handles both string and object)
    const payload: CardsPayload =
      typeof data.payload === 'string'
        ? JSON.parse(data.payload)
        : data.payload;

    if (payload.action === 'show') {
      // Normalize cards from different backend schemas
      const normalizedCards = payload.cards.map(normalizeCard);

      setCards(normalizedCards);
      setIsCardsVisible(true);
      setSelectedCardId(null); // Close any open modal when showing new cards

      console.log(`✅ Displaying ${normalizedCards.length} cards`);

      // Return structured response with card IDs and titles
      return JSON.stringify({
        status: 'success',
        cards: normalizedCards.map((card) => ({
          id: card.id,
          title: card.title,
        })),
      });
    } else if (payload.action === 'hide') {
      setIsCardsVisible(false);
      setSelectedCardId(null); // Reset selection when hiding

      console.log('👋 Hiding cards');

      return JSON.stringify({
        status: 'success',
      });
    }

    // Invalid action
    return JSON.stringify({
      status: 'error',
      message: 'Invalid action. Use "show" or "hide"',
    });
  } catch (error) {
    console.error('❌ Error processing displayCards:', error);
    return JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

// Register in useEffect
useEffect(() => {
  room.localParticipant.registerRpcMethod('client.displayCards', handleDisplayCards);

  return () => {
    room.localParticipant.unregisterRpcMethod('client.displayCards');
  };
}, [room, cards]); // Include dependencies!
```

**Key Points**:
- Handles both "show" and "hide" actions
- Normalizes card data from different schemas
- Returns rich context (list of IDs and titles)
- Auto-closes modal when new cards arrive
- Validates action before processing

---

#### Example 2: Control Modal Handler

**RPC Method**: `client.controlCardModal` (from this project)

This handler opens/closes a modal based on agent commands.

**Location**: `components/app/new-ui/new-session-view.tsx:109-176`

```typescript
const handleControlCardModal = async (data: any): Promise<string> => {
  try {
    console.log('📨 Received controlCardModal RPC:', data);

    // Parse payload
    const payload: { action: 'open' | 'close'; cardId?: string | number } =
      typeof data.payload === 'string'
        ? JSON.parse(data.payload)
        : data.payload;

    if (payload.action === 'open') {
      // Validation chain
      if (!payload.cardId) {
        console.warn('⚠️ Cannot open modal: cardId is required');
        return JSON.stringify({
          status: 'error',
          message: 'cardId is required for open action',
        });
      }

      if (cards.length === 0) {
        console.warn('⚠️ Cannot open modal: No cards available');
        return JSON.stringify({
          status: 'error',
          message: 'No cards available',
        });
      }

      // Validate card exists (handle both string and number IDs)
      const cardExists = cards.some((card) =>
        String(card.id) === String(payload.cardId)
      );

      if (!cardExists) {
        console.warn(`⚠️ Cannot open modal: Card "${payload.cardId}" not found`);
        return JSON.stringify({
          status: 'error',
          message: 'Card not found',
        });
      }

      // Open modal (auto-closes any existing modal)
      setSelectedCardId(payload.cardId);
      console.log(`✅ Opening modal for card: ${payload.cardId}`);

      return JSON.stringify({
        status: 'success',
        cardId: payload.cardId,
      });
    } else if (payload.action === 'close') {
      // Close modal (idempotent - no error if already closed)
      setSelectedCardId(null);
      console.log('✅ Closing modal');

      return JSON.stringify({
        status: 'success',
      });
    }

    // Invalid action
    return JSON.stringify({
      status: 'error',
      message: 'Invalid action. Use "open" or "close"',
    });
  } catch (error) {
    console.error('❌ Error processing controlCardModal:', error);
    return JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

// Register in useEffect
useEffect(() => {
  room.localParticipant.registerRpcMethod('client.controlCardModal', handleControlCardModal);

  return () => {
    room.localParticipant.unregisterRpcMethod('client.controlCardModal');
  };
}, [room, cards]); // Include 'cards' dependency
```

**Key Points**:
- Comprehensive validation before state changes
- Handles both string and number ID comparisons using `String()` conversion
- Idempotent "close" action
- Rich error messages for debugging
- Includes dependencies in useEffect array

---

### Sending RPC to Agent

Sending RPC allows the **frontend to notify the agent** of user interactions (clicks, selections, form submissions).

#### Calling Pattern

```typescript
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';

function InteractiveComponent() {
  const room = useRoomContext();
  const { agent } = useVoiceAssistant();

  const handleUserAction = async (actionData: any) => {
    console.log('🖱️ User action:', actionData);

    // 1. Validate agent is available
    if (!agent) {
      console.warn('⚠️ No agent available to send RPC');
      return;
    }

    try {
      // 2. Send RPC call
      const result = await room.localParticipant.performRpc({
        destinationIdentity: agent.identity,
        method: 'agent.yourMethod',
        payload: JSON.stringify({
          key: 'value',
          data: actionData,
        }),
      });

      console.log('✅ Agent acknowledged:', result);

    } catch (error) {
      console.error('❌ Failed to send RPC:', error);
      // Don't throw - UI should continue working
    }
  };

  return (
    <button onClick={() => handleUserAction({ id: 123 })}>
      Click Me
    </button>
  );
}
```

#### Critical Patterns

1. **Check Agent Availability**: Always verify `agent` exists
2. **Use agent.identity**: Destination for RPC calls
3. **JSON String Payload**: Always use `JSON.stringify()`
4. **Non-Blocking**: Don't block UI on RPC failures
5. **Optimistic Updates**: Update UI before/during RPC call

---

#### Example: Send Card Selection to Agent

**RPC Method**: `agent.selectCard` (from this project)

This example shows how to notify the agent when a user selects a card.

**Location**: `components/app/new-ui/cards-section.tsx:29-55`

```typescript
const handleCardClick = async (cardId: string | number) => {
  console.log(`🖱️ User clicked card: ${cardId}`);

  // 1. Update UI immediately (optimistic update)
  onCardSelect(cardId);

  // 2. Send RPC to agent (non-blocking)
  if (!agent) {
    console.warn('⚠️ No agent available to send selection');
    return;
  }

  try {
    const result = await room.localParticipant.performRpc({
      destinationIdentity: agent.identity,
      method: 'agent.selectCard',
      payload: JSON.stringify({
        cardId: cardId,  // Preserves type (string | number)
        action: 'select',
      }),
    });

    console.log('✅ Agent acknowledged selection:', result);

  } catch (error) {
    console.error('❌ Failed to send card selection:', error);
    // Don't throw - modal is already open, user experience continues
  }
};
```

**Key Points**:
- **Optimistic update**: UI changes immediately (calls `onCardSelect` first)
- **Non-blocking**: If RPC fails, UI still works
- **Type preservation**: `cardId` keeps its original type (string | number) in JSON
- **Error handling**: Logs errors but doesn't throw
- **User experience**: Modal opens instantly, agent notified in background

---

### State Management with RPC

Coordinate React state across multiple RPC handlers.

#### Pattern: Shared State

```typescript
function MainView() {
  const room = useRoomContext();

  // Shared state
  const [cards, setCards] = useState<Card[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | number | null>(null);

  useEffect(() => {
    // Handler 1: Display cards
    const handleDisplayCards = async (data: any): Promise<string> => {
      // ...
      if (payload.action === 'show') {
        setCards(payload.cards);
        setIsVisible(true);
        setSelectedCardId(null); // ⚠️ Auto-close modal when new cards arrive
      }
      // ...
    };

    // Handler 2: Control modal
    const handleControlModal = async (data: any): Promise<string> => {
      // ...
      if (payload.action === 'open') {
        // Validate card exists in current cards state
        const cardExists = cards.some(card =>
          String(card.id) === String(payload.cardId)
        );
        if (!cardExists) {
          return JSON.stringify({ status: 'error', message: 'Card not found' });
        }
        setSelectedCardId(payload.cardId);
      }
      // ...
    };

    // Register both handlers
    room.localParticipant.registerRpcMethod('client.displayCards', handleDisplayCards);
    room.localParticipant.registerRpcMethod('client.controlModal', handleControlModal);

    return () => {
      room.localParticipant.unregisterRpcMethod('client.displayCards');
      room.localParticipant.unregisterRpcMethod('client.controlModal');
    };
  }, [room, cards]); // ⚠️ Include 'cards' in dependencies!

  return (
    <div>
      {isVisible && <CardsGrid cards={cards} />}
      {selectedCardId && <CardModal cardId={selectedCardId} />}
    </div>
  );
}
```

#### State Coordination Best Practices

1. **Auto-close modals on new data**: When displaying new cards, reset `selectedCardId`
2. **Validate against current state**: Check if card exists before opening modal
3. **Include dependencies**: Add state used in handlers to useEffect deps array
4. **Single source of truth**: Don't duplicate state—share it across handlers

---

### TypeScript Types & Payload Structures

Define types from this project:

```typescript
// Card interface with flexible schema support
export interface Card {
  id: string | number;  // Support both types from backend
  title: string;
  description: string;
  [key: string]: any;  // Allow additional fields from backend
}

// Payload interfaces for incoming RPC
interface CardsPayload {
  action: 'show' | 'hide';
  cards: any[];  // Accept any backend schema
}

interface ModalPayload {
  action: 'open' | 'close';
  cardId?: string | number;  // Required for 'open'
}

// Schema normalization (from new-session-view.tsx:24-44)
const normalizeCard = (rawCard: any): Card => {
  // Detect schema type by checking which fields exist
  const isProject = 'project_name_ar' in rawCard;
  const isSponsorship = 'category' in rawCard && 'monthly_amount_qar' in rawCard;
  const isSadaqah = 'suggested_amount_qar' in rawCard;

  // Extract title from appropriate field
  const title = rawCard.project_name_ar || rawCard.name_ar || 'Untitled';

  // Extract description from appropriate field
  const description =
    rawCard.project_description_ar || rawCard.additional_info_ar || rawCard.description_ar || '';

  // Return normalized card with all original fields preserved
  return {
    id: rawCard.id,  // Preserves original type (string | number)
    title,
    description,
    ...rawCard, // Keep all original fields for flexibility
  };
};
```

---

### Best Practices

#### ✅ DO

1. **Always parse payloads defensively**
   ```typescript
   const payload = typeof data.payload === 'string'
     ? JSON.parse(data.payload)
     : data.payload;
   ```

2. **Return structured JSON responses**
   ```typescript
   return JSON.stringify({
     status: 'success',
     data: { /* context */ }
   });
   ```

3. **Validate before state updates**
   ```typescript
   const cardExists = cards.some(card =>
     String(card.id) === String(payload.cardId)
   );
   if (!cardExists) {
     return JSON.stringify({ status: 'error', message: 'Not found' });
   }
   ```

4. **Clean up RPC registrations**
   ```typescript
   return () => {
     room.localParticipant.unregisterRpcMethod('client.method');
   };
   ```

5. **Include dependencies in useEffect**
   ```typescript
   useEffect(() => {
     // Handler uses 'cards' state
   }, [room, cards]); // Include both!
   ```

6. **Update UI optimistically**
   ```typescript
   const handleClick = () => {
     updateUI();  // Instant
     sendRpc();   // Background
   };
   ```

7. **Handle both string and number IDs**
   ```typescript
   const match = cards.find(card =>
     String(card.id) === String(selectedId)
   );
   ```

#### ❌ DON'T

1. **Don't forget cleanup** → Memory leaks
2. **Don't assume payload type** → Parse errors
3. **Don't block UI on RPC failures** → Poor UX
4. **Don't skip validation** → Runtime errors
5. **Don't use plain strings for responses** → Hard to parse
6. **Don't duplicate state** → Sync issues
7. **Don't ignore agent availability** → Errors

---

### Common Pitfalls

#### 1. Forgetting Cleanup

```typescript
// ❌ WRONG
useEffect(() => {
  room.localParticipant.registerRpcMethod('client.method', handler);
}, [room]);

// ✅ CORRECT
useEffect(() => {
  room.localParticipant.registerRpcMethod('client.method', handler);
  return () => {
    room.localParticipant.unregisterRpcMethod('client.method');
  };
}, [room]);
```

#### 2. Not Handling Both Payload Types

```typescript
// ❌ WRONG
const payload = JSON.parse(data.payload);

// ✅ CORRECT
const payload = typeof data.payload === 'string'
  ? JSON.parse(data.payload)
  : data.payload;
```

#### 3. Type Mismatches (String vs Number IDs)

```typescript
// ❌ WRONG
const cardExists = cards.some(card => card.id === payload.cardId);
// Fails if one is number and other is string!

// ✅ CORRECT
const cardExists = cards.some(card =>
  String(card.id) === String(payload.cardId)
);
```

#### 4. Missing Dependencies in useEffect

```typescript
// ❌ WRONG
useEffect(() => {
  const handler = async (data: any) => {
    const exists = cards.some(...);  // Uses 'cards'
  };
  room.localParticipant.registerRpcMethod('client.method', handler);
  return () => room.localParticipant.unregisterRpcMethod('client.method');
}, [room]); // Missing 'cards'!

// ✅ CORRECT
useEffect(() => {
  const handler = async (data: any) => {
    const exists = cards.some(...);
  };
  room.localParticipant.registerRpcMethod('client.method', handler);
  return () => room.localParticipant.unregisterRpcMethod('client.method');
}, [room, cards]); // Include 'cards'
```

---

### Troubleshooting

#### Issue: RPC Handler Not Firing

**Symptoms**: Agent sends RPC but handler never executes.

**Solutions**:
```typescript
// 1. Check method names match RPC_CONTRACT.md exactly
room.localParticipant.registerRpcMethod('client.displayCards', handler);
// Backend must call: "client.displayCards" (exact match!)

// 2. Log registration
console.log('🔌 Registered: client.displayCards');

// 3. Verify room is connected
if (!room || room.state !== 'connected') {
  console.warn('Room not connected yet');
}
```

---

#### Issue: "Payload is not defined" Error

**Cause**: Not handling both string and object payloads.

**Solution**:
```typescript
const payload = typeof data.payload === 'string'
  ? JSON.parse(data.payload)
  : data.payload;
```

---

#### Issue: Modal Opens with Wrong Card

**Cause**: Type mismatch in ID comparison (string vs number).

**Solution**:
```typescript
const selectedCard = cards.find(card =>
  String(card.id) === String(selectedCardId)
);
```

---

#### Issue: Memory Leak Warning

**Cause**: Not unregistering RPC methods.

**Solution**:
```typescript
useEffect(() => {
  room.localParticipant.registerRpcMethod('client.method', handler);

  // CRITICAL: Must return cleanup function
  return () => {
    room.localParticipant.unregisterRpcMethod('client.method');
  };
}, [room]);
```

---

#### Issue: Stale State in RPC Handlers

**Cause**: Missing dependencies in useEffect.

**Solution**:
```typescript
// Include ALL state used in handlers
useEffect(() => {
  const handler = async (data: any) => {
    const exists = cards.some(...);  // Uses 'cards'
    if (selectedId) { ... }          // Uses 'selectedId'
  };

  room.localParticipant.registerRpcMethod('client.method', handler);

  return () => {
    room.localParticipant.unregisterRpcMethod('client.method');
  };
}, [room, cards, selectedId]); // Include ALL dependencies
```

---

### Implementation Checklist

#### Adding RPC Handler (Receiving from Agent)

- [ ] Define RPC method in RPC_CONTRACT.md
- [ ] Create async handler function: `async (data: any): Promise<string>`
- [ ] Parse payload defensively (handle string | object)
- [ ] Validate all required fields
- [ ] Update React state
- [ ] Return structured JSON response
- [ ] Wrap in try/catch
- [ ] Register in useEffect with `room.localParticipant.registerRpcMethod()`
- [ ] Include cleanup function with `unregisterRpcMethod()`
- [ ] Add all used state to useEffect dependencies
- [ ] Test with real agent

#### Sending RPC to Agent

- [ ] Define RPC method in RPC_CONTRACT.md
- [ ] Get room with `useRoomContext()`
- [ ] Get agent with `useVoiceAssistant()`
- [ ] Check agent availability before calling
- [ ] Update UI optimistically (before RPC)
- [ ] Call `room.localParticipant.performRpc()`
- [ ] Use `agent.identity` as destination
- [ ] Use `JSON.stringify()` for payload
- [ ] Wrap in try/catch
- [ ] Don't throw errors (log instead)
- [ ] Test with real agent

---

**For complete, working examples, see the project files:**
- `components/app/new-ui/new-session-view.tsx` - RPC handler registration (lines 59-190)
- `components/app/new-ui/cards-section.tsx` - Sending RPC to agent (lines 29-55)
- `components/app/new-ui/card-grid.tsx` - UI components
- `components/app/new-ui/card-modal.tsx` - Modal component

---

## Reference Implementation

This section contains the actual implementation from the QCharity voice agent project as a working example.

### Project Context

The reference implementation demonstrates:
- Voice agent for charity donation assistance
- MCP (Model Context Protocol) integration for database queries
- Card-based UI for displaying charity projects
- Modal control for detailed charity information

### File Structure

```
Qcharity-voice-agent/
├── agent.py                          # Main entry (lines 126-354)
├── rpc_handlers/
│   ├── __init__.py
│   └── card_handlers.py              # RPC implementations
├── RPC_CONTRACT.md                   # Actual contract used
└── prompts/
    └── assistant_description.py      # Agent instructions
```

### Example 1: Outgoing RPC - display_cards

**Location**: `rpc_handlers/card_handlers.py:19-78`

This function displays charity project cards in the UI using cached MCP query results.

```python
@function_tool()
async def display_cards(context: RunContext, action: str = "show") -> str:
    """
    Display or hide interactive cards using cached database results.

    Args:
        action: Action to perform - 'show' or 'hide' (default: 'show')

    Returns:
        Frontend response as-is (JSON string) or error message if RPC call fails
    """
    global _cached_mcp_results

    # Validate action
    if action not in ["show", "hide"]:
        return "Error: action must be 'show' or 'hide'"

    # For show action, use cached MCP data
    if action == "show":
        if _cached_mcp_results is None:
            return "Error: No data available. Please search the database first."

        if len(_cached_mcp_results) == 0:
            return "Error: Your search returned no results."

        cards = _cached_mcp_results
    else:
        cards = []

    try:
        room = get_job_context().room
        participant_identity = next(iter(room.remote_participants))

        # Convert card IDs to strings for frontend compatibility
        cards_payload = [
            {**card, 'id': str(card['id'])} for card in cards
        ] if action == "show" else []

        # Send RPC to frontend
        response = await room.local_participant.perform_rpc(
            destination_identity=participant_identity,
            method="client.displayCards",
            payload=json.dumps({"action": action, "cards": cards_payload})
        )

        # Return frontend response as-is
        logger.info(f"Display cards RPC completed")
        return response

    except Exception as e:
        logger.error(f"RPC call failed: {e}")
        return f"Error: RPC call failed - {str(e)}"
```

### Example 2: Incoming RPC - handle_card_selection

**Location**: `rpc_handlers/card_handlers.py:126-158`

This handler receives card selection events from the frontend.

```python
async def handle_card_selection(session: AgentSession, data):
    """Handle card selection from the user."""
    try:
        payload = json.loads(data.payload)
        card_id = payload.get("cardId")
        action = payload.get("action", "select")

        if not card_id:
            logger.error("No cardId in selection payload")
            return "error: missing cardId"

        logger.info(f"User selected card: {card_id} (action: {action})")

        # Interrupt current speech and respond
        await session.interrupt()
        session.generate_reply(
            user_input=f"System: The user selected card {card_id}. confirm the card id and title"
        )

        return "success"
    except Exception as e:
        logger.error(f"Error handling card selection: {e}")
        return f"error: {str(e)}"


def register_card_handlers(ctx: JobContext, session: AgentSession) -> None:
    """Register all card-related RPC handlers."""

    @ctx.room.local_participant.register_rpc_method("agent.selectCard")
    async def _handle_selection(data):
        return await handle_card_selection(session, data)

    logger.info("Registered RPC method: agent.selectCard")
```

### Example 3: Event Listener - MCP Result Caching

**Location**: `agent.py:304-342`

This event listener detects when MCP database queries complete and caches results.

```python
# Global cache in rpc_handlers/card_handlers.py
_cached_mcp_results = None

# Event listener in agent.py
@session.agent.on("function_tools_executed")
def on_function_tools_executed(evt):
    """Cache MCP results when database queries complete."""

    if evt.tool_name == "queryQCharityDatabase":
        try:
            # MCP returns nested JSON - requires double parsing
            first_parse = json.loads(evt.result)

            # Extract text field and parse again
            mcp_response = json.loads(first_parse["text"])

            # Get results array
            results = mcp_response.get("results", [])

            # Cache results globally for display_cards to use
            card_handlers._cached_mcp_results = results

            logger.info(f"Cached {len(results)} MCP results for display")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse MCP result: {e}")
        except Exception as e:
            logger.error(f"Error caching MCP results: {e}")
```

**Flow:**
```
1. User: "Show me charity projects in Cairo"
   ↓
2. Agent calls: queryQCharityDatabase(location="Cairo")
   ↓
3. MCP tool executes and returns charity data
   ↓
4. Event listener fires: on_function_tools_executed
   ↓
5. Listener extracts and caches results
   ↓
6. Agent decides to display and calls: display_cards('show')
   ↓
7. display_cards uses _cached_mcp_results
   ↓
8. RPC sends cards to frontend
   ↓
9. Frontend displays cards
   ↓
10. Agent speaks confirmation
```

### Advanced Pattern: MCP Integration

**MCP (Model Context Protocol)** allows agents to access external tools like databases. If you're using MCP:

**Double JSON Parsing Required:**
```python
# MCP tools return nested JSON
first_parse = json.loads(mcp_result)        # Parse outer wrapper
mcp_response = json.loads(first_parse["text"])  # Parse text field
results = mcp_response.get("results", [])    # Extract actual data
```

**Cache and Use Pattern:**
```python
# 1. Event listener caches MCP results
@session.agent.on("function_tools_executed")
def on_function_executed(evt):
    if evt.tool_name == "queryDatabase":
        results = json.loads(json.loads(evt.result)["text"])["results"]
        your_module._cached_results = results

# 2. Display function uses cached results
@function_tool()
async def display_data(context: RunContext) -> str:
    if not your_module._cached_results:
        return "Error: No data"

    # Send cached results to frontend via RPC
    ...
```

### RPC Contract from Reference Implementation

See `RPC_CONTRACT.md` in the project root for the complete contract including:
- `client.displayCards`
- `client.controlCardModal`
- `agent.selectCard`

---

## Summary

### Key Takeaways

1. **Always create an RPC_CONTRACT.md** - Define schemas before implementing
2. **Return frontend responses as-is** - Let agent parse and reason about full context
3. **Use the critical pattern for user interactions**:
   ```python
   await session.interrupt()
   session.generate_reply(user_input="System: ...")
   return "success"
   ```
4. **Use event listeners** to detect function completion and chain operations
5. **Let frontend manage UI state** - Don't duplicate state in backend
6. **Follow naming conventions** - `client.*` for outgoing, `agent.*` for incoming

### Next Steps

1. Review the [Reference Implementation](#reference-implementation) for working examples
2. Create your `RPC_CONTRACT.md` defining your methods
3. Implement outgoing RPC functions using the patterns shown
4. Implement incoming RPC handlers using the critical pattern
5. Add event listeners for function chaining if needed
6. Test with your frontend team using the contract

---

**Document Version**: 2.0.0
**Last Updated**: Generic rewrite for reusability
**License**: Use freely in your LiveKit agent projects
