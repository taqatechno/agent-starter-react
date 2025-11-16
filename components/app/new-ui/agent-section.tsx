'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BarVisualizer, VideoTrack, useVoiceAssistant } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { AgentControlBar } from '@/components/app/new-ui/agent-control-bar';
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

  // Auto-scroll chat transcript to bottom
  useEffect(() => {
    if (scrollAreaRef.current && isChatOpen) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  return (
    <div className="bg-background relative flex h-full w-full flex-col">
      {/* Main content area - avatar and chat */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-hidden px-4">
        {/* Avatar/Voice Visualizer - centered, scales down when chat opens */}
        <div className="mb-4 flex items-center justify-center">
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
                  scale: isChatOpen ? 1 : 3,
                }}
                transition={{
                  ...ANIMATION_TRANSITION,
                  delay: animationDelay,
                }}
                className={cn(
                  'bg-background aspect-square h-[120px] rounded-2xl border border-transparent transition-[border,drop-shadow]',
                  isChatOpen && 'border-input/50 drop-shadow-lg/10 delay-200'
                )}
              >
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
              // Avatar Agent - Video
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
                  'overflow-hidden bg-black drop-shadow-xl/80',
                  isChatOpen ? 'h-[160px] w-[160px]' : 'h-[600px] w-[600px]'
                )}
              >
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
            className="w-full max-w-2xl flex-1 overflow-hidden"
          >
            <ScrollArea ref={scrollAreaRef} className="h-full px-4">
              {messages.length === 0 ? (
                <PreConnectMessage />
              ) : (
                <ChatTranscript hidden={false} messages={messages} className="space-y-3" />
              )}
            </ScrollArea>
          </motion.div>
        )}
      </div>

      {/* Control Bar - fixed at bottom */}
      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-6">
        <AgentControlBar
          isChatOpen={isChatOpen}
          onChatToggle={onChatToggle}
          appConfig={appConfig}
        />
      </div>
    </div>
  );
}
