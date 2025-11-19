'use client';

import { useEffect } from 'react';
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { toastAlert } from '@/components/livekit/alert-toast';

interface ServerDataPayload {
  message: string;
  timestamp: string;
}

export function DataListener() {
  const room = useRoomContext();
  const { agent } = useVoiceAssistant();

  useEffect(() => {
    console.log('🔌 DataListener mounted');
    console.log('🔌 Room state:', {
      name: room.name,
      state: room.state,
      isConnected: room.state === 'connected',
      numParticipants: room.remoteParticipants.size,
      hasAgent: !!agent,
    });

    const handleDataReceived = async (
      payload: Uint8Array,
      participant?: any,
      kind?: any,
      topic?: string
    ) => {
      console.log('📨 DataReceived event fired!', {
        hasParticipant: !!participant,
        participantIdentity: participant?.identity,
        payloadSize: payload.length,
        kind,
        topic
      });

      // Only process server-sent data (participant is undefined)
      if (participant === undefined) {
        try {
          // Decode Uint8Array to string
          const decoder = new TextDecoder();
          const jsonString = decoder.decode(payload);

          console.log('📨 Raw data received:', jsonString);

          // Parse JSON
          const data: ServerDataPayload = JSON.parse(jsonString);

          console.log('✅ Parsed server data:', {
            message: data.message,
            timestamp: data.timestamp,
            topic: topic || 'none'
          });

          // Show a toast notification
          if (data.message) {
            toastAlert({
              title: 'Server Message',
              description: data.message,
            });
          }

          // Send data to agent via RPC
          if (agent) {
            try {
              console.log('📤 Sending external data to agent via RPC...');

              const response = await room.localParticipant.performRpc({
                destinationIdentity: agent.identity,
                method: 'agent.receiveExternalData',
                payload: JSON.stringify({
                  message: data.message,
                  timestamp: data.timestamp,
                  topic: topic || 'default',
                }),
              });

              console.log('✅ Agent acknowledged external data:', response);
            } catch (rpcError) {
              console.error('❌ Failed to send RPC to agent:', rpcError);
              // Don't throw - continue processing
            }
          } else {
            console.warn('⚠️ No agent available to receive external data');
          }

          // Dispatch custom event for other components
          window.dispatchEvent(
            new CustomEvent('livekit-server-data', {
              detail: {
                message: data.message,
                timestamp: data.timestamp,
                topic
              }
            })
          );
        } catch (error) {
          console.error('❌ Error processing data packet:', error);
        }
      } else {
        // This is participant-sent data, not server data
        console.log('📨 Participant data received (ignored):', {
          from: participant?.identity,
          topic
        });
      }
    };

    const handleConnectionStateChanged = (state: any) => {
      console.log('🔌 Room connection state changed:', state);
    };

    console.log('🔌 Registering DataReceived listener');
    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Unregistering DataReceived listener');
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    };
  }, [room, agent]);

  // This component doesn't render anything
  return null;
}
