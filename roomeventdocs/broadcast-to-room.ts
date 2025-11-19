#!/usr/bin/env ts-node
/**
 * LiveKit Data Broadcaster
 *
 * Broadcasts a JSON message to ALL participants in a specific LiveKit room.
 * This is the simplest approach - no need to find agent identity/SID.
 *
 * Usage:
 *   npx ts-node broadcast-to-room.ts <room-name> [message]
 *
 * Example:
 *   npx ts-node broadcast-to-room.ts room-123
 *   npx ts-node broadcast-to-room.ts room-123 "Hello everyone!"
 */

import { RoomServiceClient, DataPacket_Kind } from 'livekit-server-sdk';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Broadcast a JSON message to ALL participants in a room
 */
async function broadcastToRoom(
  roomName: string,
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
  console.log(`Target room: ${roomName}\n`);

  // Initialize RoomServiceClient
  const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

  // List participants in room first (for debugging)
  console.log('Fetching room participants...');
  try {
    const participants = await roomService.listParticipants(roomName);
    console.log(`Found ${participants.length} participant(s) in room:`);
    participants.forEach(p => {
      console.log(`  - ${p.identity} (SID: ${p.sid})`);
    });
    console.log('');
  } catch (error) {
    console.warn('Could not list participants:', error instanceof Error ? error.message : error);
  }

  // Create JSON payload
  const payload = {
    message: message,
    timestamp: new Date().toISOString(),
  };

  console.log('Broadcasting payload:', JSON.stringify(payload, null, 2));

  // Convert JSON to Uint8Array (bytes)
  const jsonString = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);

  try {
    // Send data to EVERYONE in the room (empty destinationIdentities = broadcast)
    await roomService.sendData(
      roomName,
      data,
      DataPacket_Kind.RELIABLE, // Guaranteed delivery
      {}  // Empty options = broadcast to all participants
    );

    console.log(`\n✓ Successfully broadcast data to room '${roomName}'`);
    console.log(`  Data size: ${data.length} bytes`);
    console.log(`  Delivery mode: RELIABLE`);
    console.log(`  Recipients: ALL participants\n`);
  } catch (error) {
    console.error('\n✗ Failed to broadcast data:');
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

  if (args.length === 0) {
    console.error('Usage: npx ts-node broadcast-to-room.ts <room-name> [message]');
    console.error('\nExample:');
    console.error('  npx ts-node broadcast-to-room.ts room-123');
    console.error('  npx ts-node broadcast-to-room.ts room-123 "Hello everyone!"\n');
    process.exit(1);
  }

  const roomName = args[0];
  const message = args[1] || 'test'; // Default message is 'test'

  try {
    await broadcastToRoom(roomName, message);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Run main function
main();
