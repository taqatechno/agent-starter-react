'use client';

import { useCallback, useEffect, useState } from 'react';
import { Track } from 'livekit-client';
import { useRemoteParticipants } from '@livekit/components-react';
import {
  ChatTextIcon,
  MonitorIcon,
  MoonIcon,
  PhoneDisconnectIcon,
  SunIcon,
} from '@phosphor-icons/react';
import type { AppConfig } from '@/app-config';
import { useSession } from '@/components/app/session-provider';
import { useInputControls } from '@/components/livekit/agent-control-bar/hooks/use-input-controls';
import { usePublishPermissions } from '@/components/livekit/agent-control-bar/hooks/use-publish-permissions';
import { TrackSelector } from '@/components/livekit/agent-control-bar/track-selector';
import { TrackToggle } from '@/components/livekit/agent-control-bar/track-toggle';
import { Button } from '@/components/livekit/button';
import { Toggle } from '@/components/livekit/toggle';
import { THEME_MEDIA_QUERY, THEME_STORAGE_KEY, cn } from '@/lib/utils';

type ThemeMode = 'dark' | 'light' | 'system';

function applyTheme(theme: ThemeMode) {
  const doc = document.documentElement;

  doc.classList.remove('dark', 'light');
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  if (theme === 'system') {
    if (window.matchMedia(THEME_MEDIA_QUERY).matches) {
      doc.classList.add('dark');
    } else {
      doc.classList.add('light');
    }
  } else {
    doc.classList.add(theme);
  }
}

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
  const participants = useRemoteParticipants();
  const publishPermissions = usePublishPermissions();
  const { isSessionActive, endSession } = useSession();
  const [theme, setTheme] = useState<ThemeMode | undefined>(undefined);

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

  // Load theme on mount
  useEffect(() => {
    const storedTheme = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode) ?? 'system';
    setTheme(storedTheme);
  }, []);

  const handleThemeChange = useCallback((newTheme: ThemeMode) => {
    applyTheme(newTheme);
    setTheme(newTheme);
  }, []);

  const handleDisconnect = useCallback(async () => {
    endSession();
  }, [endSession]);

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
        'flex items-center justify-between gap-3',
        'rounded-full border px-4 py-3',
        'drop-shadow-lg'
      )}
    >
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

      {/* Center - Chat & Theme toggles */}
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

        {/* Theme Toggle */}
        <div
          className={cn(
            'flex items-center divide-x overflow-hidden rounded-full',
            'border-input bg-background border'
          )}
        >
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className="hover:bg-muted/50 cursor-pointer p-2 transition-colors"
            aria-label="Dark theme"
          >
            <MoonIcon size={16} weight="bold" className={cn(theme !== 'dark' && 'opacity-25')} />
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className="hover:bg-muted/50 cursor-pointer p-2 transition-colors"
            aria-label="Light theme"
          >
            <SunIcon size={16} weight="bold" className={cn(theme !== 'light' && 'opacity-25')} />
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            className="hover:bg-muted/50 cursor-pointer p-2 transition-colors"
            aria-label="System theme"
          >
            <MonitorIcon
              size={16}
              weight="bold"
              className={cn(theme !== 'system' && 'opacity-25')}
            />
          </button>
        </div>
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
  );
}
