'use client';

import { useCallback } from 'react';
import { Track } from 'livekit-client';
import { useChat, useRemoteParticipants } from '@livekit/components-react';
import { ChatTextIcon, PhoneDisconnectIcon } from '@phosphor-icons/react';
import type { AppConfig } from '@/app-config';
import { useSession } from '@/components/app/session-provider';
import { ChatInput } from '@/components/livekit/agent-control-bar/chat-input';
import { useInputControls } from '@/components/livekit/agent-control-bar/hooks/use-input-controls';
import { usePublishPermissions } from '@/components/livekit/agent-control-bar/hooks/use-publish-permissions';
import { TrackSelector } from '@/components/livekit/agent-control-bar/track-selector';
import { TrackToggle } from '@/components/livekit/agent-control-bar/track-toggle';
import { Button } from '@/components/livekit/button';
import { Toggle } from '@/components/livekit/toggle';
import { cn } from '@/lib/utils';

interface AgentControlBarProps {
  isChatOpen: boolean;
  onChatToggle: () => void;
  appConfig: AppConfig;
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
}

export function AgentControlBar({
  isChatOpen,
  onChatToggle,
  appConfig,
  onDeviceError,
}: AgentControlBarProps) {
  const { send } = useChat();
  const participants = useRemoteParticipants();
  const publishPermissions = usePublishPermissions();
  const { isSessionActive, endSession } = useSession();

  const {
    micTrackRef,
    cameraToggle,
    microphoneToggle,
    screenShareToggle,
    handleAudioDeviceChange,
    handleVideoDeviceChange,
    handleMicrophoneDeviceSelectError,
    handleCameraDeviceSelectError,
  } = useInputControls({ onDeviceError, saveUserChoices: true });

  const handleDisconnect = useCallback(async () => {
    endSession();
  }, [endSession]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      await send(message);
    },
    [send]
  );

  const isAgentAvailable = participants.some((p) => p.isAgent);

  const visibleControls = {
    microphone: publishPermissions.microphone,
    screenShare: appConfig.supportsScreenShare ?? publishPermissions.screenShare,
    camera: appConfig.supportsVideoInput ?? publishPermissions.camera,
  };

  return (
    <div
      aria-label="Voice assistant controls"
      className={cn(
        'bg-background/95 border-input/50 dark:border-muted backdrop-blur-sm',
        'flex flex-col',
        'overflow-hidden rounded-3xl border',
        'drop-shadow-lg'
      )}
    >
      {/* Chat Input - appears at top when chat is open */}
      {appConfig.supportsChatInput && (
        <ChatInput
          chatOpen={isChatOpen}
          isAgentAvailable={isAgentAvailable}
          onSend={handleSendMessage}
        />
      )}

      {/* Control Bar - media controls, chat toggle, disconnect */}
      <div className="flex items-center justify-between gap-2 px-3 py-3 md:px-4">
        {/* Left side - Media controls */}
        <div className="flex items-center gap-2">
          {/* Toggle Microphone */}
          {visibleControls.microphone && (
            <TrackSelector
              kind="audioinput"
              aria-label="Toggle microphone"
              source={Track.Source.Microphone}
              pressed={microphoneToggle.enabled}
              disabled={microphoneToggle.pending}
              audioTrackRef={micTrackRef}
              onPressedChange={microphoneToggle.toggle}
              onMediaDeviceError={handleMicrophoneDeviceSelectError}
              onActiveDeviceChange={handleAudioDeviceChange}
            />
          )}

          {/* Toggle Camera */}
          {visibleControls.camera && (
            <TrackSelector
              kind="videoinput"
              aria-label="Toggle camera"
              source={Track.Source.Camera}
              pressed={cameraToggle.enabled}
              pending={cameraToggle.pending}
              disabled={cameraToggle.pending}
              onPressedChange={cameraToggle.toggle}
              onMediaDeviceError={handleCameraDeviceSelectError}
              onActiveDeviceChange={handleVideoDeviceChange}
            />
          )}

          {/* Toggle Screen Share */}
          {visibleControls.screenShare && (
            <TrackToggle
              size="icon"
              variant="secondary"
              aria-label="Toggle screen share"
              source={Track.Source.ScreenShare}
              pressed={screenShareToggle.enabled}
              disabled={screenShareToggle.pending}
              onPressedChange={screenShareToggle.toggle}
            />
          )}
        </div>

        {/* Center - Chat toggle */}
        <div className="flex items-center gap-2">
          {/* Toggle Chat/Transcript */}
          <Toggle
            size="icon"
            variant="secondary"
            aria-label="Toggle transcript"
            pressed={isChatOpen}
            onPressedChange={onChatToggle}
          >
            <ChatTextIcon weight="bold" />
          </Toggle>
        </div>

        {/* Right side - Disconnect */}
        <Button
          variant="destructive"
          onClick={handleDisconnect}
          disabled={!isSessionActive}
          className="gap-2 font-mono"
        >
          <PhoneDisconnectIcon weight="bold" />
          <span className="hidden md:inline">إنهاء المكالمة</span>
          <span className="inline md:hidden">END</span>
        </Button>
      </div>
    </div>
  );
}
