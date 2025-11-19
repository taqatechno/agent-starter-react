#!/usr/bin/env ts-node
/**
 * LiveKit Data Sender (Targeted to Specific Agent)
 *
 * Sends a JSON message to a specific agent in a LiveKit room.
 *
 * Usage:
 *   npx ts-node send-to-agent.ts <room-name> <agent-identity> [message]
 *
 * Example:
 *   npx ts-node send-to-agent.ts room-123 my-agent
 *   npx ts-node send-to-agent.ts room-123 my-agent "Hello agent!"
 */

import { RoomServiceClient, DataPacket_Kind } from 'livekit-server-sdk';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Send a JSON message to a specific agent in a room
 */
async function sendToAgent(
  roomName: string,
  agentIdentity: string,
  message: string = 'test'
): Promise<void> {
  // Validate environment variables
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    throw new Error(
      'Missing LiveKit credentials. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in .env file'
    );
  }

  console.log(`\nConnecting to LiveKit: ${livekitUrl}`);
  console.log(`Target room: ${roomName}`);
  console.log(`Target agent: ${agentIdentity}\n`);

  // Initialize RoomServiceClient
  const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

  // Get the agent participant info (optional verification)
  try {
    const agentParticipant = await roomService.getParticipant(roomName, agentIdentity);
    console.log(`Found agent: ${agentParticipant.identity} (SID: ${agentParticipant.sid})`);
  } catch (error) {
    console.warn(`Warning: Could not verify agent '${agentIdentity}' exists in room.`);
    console.warn(`Message will still be sent. If agent joins later, it won't receive it.\n`);
  }

  // Create JSON payload
  const payload = {
    message: message,
    timestamp: new Date().toISOString(),
  };

  console.log('\nSending payload:', JSON.stringify(payload, null, 2));

  // Convert JSON to Uint8Array (bytes)
  const jsonString = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);

  try {
    // Send data to the specific agent
    await roomService.sendData(
      roomName,
      data,
      DataPacket_Kind.RELIABLE, // Guaranteed delivery
      {
        destinationIdentities: [agentIdentity], // Target specific agent
      }
    );

    console.log(`\n✓ Successfully sent data to agent '${agentIdentity}' in room '${roomName}'`);
    console.log(`  Data size: ${data.length} bytes`);
    console.log(`  Delivery mode: RELIABLE`);
    console.log(`  Recipient: ${agentIdentity}\n`);
  } catch (error) {
    console.error('\n✗ Failed to send data:');
    if (error instanceof Error) {
      console.error(`  Error: ${error.message}\n`);
    } else {
      console.error(`  Error: ${String(error)}\n`);
    }
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npx ts-node send-to-agent.ts <room-name> <agent-identity> [message]');
    console.error('\nExample:');
    console.error('  npx ts-node send-to-agent.ts room-123 my-agent');
    console.error('  npx ts-node send-to-agent.ts room-123 my-agent "Hello agent!"\n');
    process.exit(1);
  }

  const roomName = args[0];
  const agentIdentity = args[1];
  const message = args[2] || 'test'; // Default message is 'test'

  try {
    await sendToAgent(roomName, agentIdentity, message);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Run main function
main();
