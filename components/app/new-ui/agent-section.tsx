'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BarVisualizer, VideoTrack, useVoiceAssistant } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { AgentControlBar } from '@/components/app/new-ui/agent-control-bar';
import { LoadingIndicator } from '@/components/app/new-ui/loading-indicator';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { ScrollArea } from '@/components/livekit/scroll-area/scroll-area';
import { useChatMessages } from '@/hooks/useChatMessages';
import { cn } from '@/lib/utils';

const MotionContainer = motion.create('div');

const ANIMATION_TRANSITION = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

interface AgentSectionProps {
  isChatOpen: boolean;
  onChatToggle: () => void;
  appConfig: AppConfig;
}

export function AgentSection({ isChatOpen, onChatToggle, appConfig }: AgentSectionProps) {
  const {
    state: agentState,
    audioTrack: agentAudioTrack,
    videoTrack: agentVideoTrack,
  } = useVoiceAssistant();

  const messages = useChatMessages();
  const isAvatar = agentVideoTrack !== undefined;
  const videoWidth = agentVideoTrack?.publication.dimensions?.width ?? 0;
  const videoHeight = agentVideoTrack?.publication.dimensions?.height ?? 0;
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const animationDelay = isChatOpen ? 0 : 0.15;

  // Loading state for search indicator
  const [isLoading, setIsLoading] = useState(false);

  // Listen for loading status events from data-listener
  useEffect(() => {
    const handleLoadingStatus = (event: Event) => {
      const customEvent = event as CustomEvent<{ status: boolean }>;
      const { status } = customEvent.detail;

      // Idempotent: only update if different
      setIsLoading((prev) => (prev !== status ? status : prev));

      console.log('🔄 Loading status updated:', status);
    };

    window.addEventListener('livekit-loading-status', handleLoadingStatus);
    console.log('🔌 Registered loading status listener');

    return () => {
      window.removeEventListener('livekit-loading-status', handleLoadingStatus);
      console.log('🔌 Unregistered loading status listener');
    };
  }, []);

  // Auto-scroll chat transcript to bottom
  useEffect(() => {
    if (scrollAreaRef.current && isChatOpen) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  return (
    <div className="bg-background relative flex h-full w-full flex-col">
      {/* Main content area - avatar and chat */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-hidden px-3 md:px-4">
        {/* Avatar/Voice Visualizer - centered, scales down when chat opens */}
        <div className="mb-2 flex items-center justify-center md:mb-4">
          <AnimatePresence mode="popLayout">
            {!isAvatar && (
              // Audio Agent - Voice Visualizer
              <MotionContainer
                key="agent"
                layoutId="agent"
                initial={{
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  opacity: 1,
                  scale: isChatOpen ? 1 : 2,
                }}
                transition={{
                  ...ANIMATION_TRANSITION,
                  delay: animationDelay,
                }}
                className={cn(
                  'relative bg-background aspect-square h-[100px] rounded-2xl border border-transparent transition-[border,drop-shadow] md:h-[120px] lg:animate-[scale_1s_ease-in-out]',
                  isChatOpen && 'border-input/50 drop-shadow-lg/10 delay-200'
                )}
              >
                <LoadingIndicator isLoading={isLoading} isChatOpen={isChatOpen} />
                <BarVisualizer
                  barCount={5}
                  state={agentState}
                  options={{ minHeight: 5 }}
                  trackRef={agentAudioTrack}
                  className={cn('flex h-full items-center justify-center gap-1.5')}
                >
                  <span
                    className={cn([
                      'bg-muted min-h-3 w-3 rounded-full',
                      'origin-center transition-colors duration-250 ease-linear',
                      'data-[lk-highlighted=true]:bg-primary data-[lk-muted=true]:bg-muted',
                    ])}
                  />
                </BarVisualizer>
              </MotionContainer>
            )}

            {isAvatar && (
              // Avatar Agent - Video (responsive sizing)
              <MotionContainer
                key="avatar"
                layoutId="avatar"
                initial={{
                  scale: 1,
                  opacity: 1,
                  maskImage:
                    'radial-gradient(circle, rgba(0, 0, 0, 1) 0, rgba(0, 0, 0, 1) 20px, transparent 20px)',
                  filter: 'blur(20px)',
                }}
                animate={{
                  scale: isChatOpen ? 0.6 : 1,
                  maskImage:
                    'radial-gradient(circle, rgba(0, 0, 0, 1) 0, rgba(0, 0, 0, 1) 500px, transparent 500px)',
                  filter: 'blur(0px)',
                  borderRadius: isChatOpen ? 12 : 24,
                }}
                transition={{
                  ...ANIMATION_TRANSITION,
                  delay: animationDelay,
                  maskImage: {
                    duration: 1,
                  },
                  filter: {
                    duration: 1,
                  },
                }}
                className={cn(
                  'relative overflow-hidden bg-black drop-shadow-xl/80',
                  // Responsive avatar sizes
                  isChatOpen
                    ? 'h-[120px] w-[120px] sm:h-[140px] sm:w-[140px] md:h-[160px] md:w-[160px]'
                    : 'h-[280px] w-[280px] sm:h-[350px] sm:w-[350px] md:h-[450px] md:w-[450px] lg:h-[600px] lg:w-[600px]'
                )}
              >
                <LoadingIndicator isLoading={isLoading} isChatOpen={isChatOpen} />
                <VideoTrack
                  width={videoWidth}
                  height={videoHeight}
                  trackRef={agentVideoTrack}
                  className="h-full w-full object-cover"
                />
              </MotionContainer>
            )}
          </AnimatePresence>
        </div>

        {/* Chat Transcript - appears below avatar when chat is open */}
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-full flex-1 overflow-hidden md:max-w-2xl"
          >
            <ScrollArea ref={scrollAreaRef} className="h-full px-2 md:px-4">
              {messages.length === 0 ? (
                <PreConnectMessage />
              ) : (
                <ChatTranscript hidden={false} messages={messages} className="space-y-2 md:space-y-3" />
              )}
            </ScrollArea>
          </motion.div>
        )}
      </div>

      {/* Control Bar - fixed at bottom with responsive spacing */}
      <div className="relative z-10 mx-auto w-full max-w-full px-3 pb-4 md:max-w-2xl md:px-4 md:pb-6">
        <AgentControlBar
          isChatOpen={isChatOpen}
          onChatToggle={onChatToggle}
          appConfig={appConfig}
        />
      </div>
    </div>
  );
}
