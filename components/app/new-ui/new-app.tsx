'use client';

import { RoomAudioRenderer, StartAudio } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { NewViewController } from '@/components/app/new-ui/new-view-controller';
import { SessionProvider } from '@/components/app/session-provider';
import { Toaster } from '@/components/livekit/toaster';
import { DataListener } from '@/components/app/data-listener';

interface NewAppProps {
  appConfig: AppConfig;
}

export function NewApp({ appConfig }: NewAppProps) {
  return (
    <SessionProvider appConfig={appConfig}>
      <DataListener />
      <main className="h-svh w-full overflow-hidden">
        <NewViewController />
      </main>
      <StartAudio label="Start Audio" />
      <RoomAudioRenderer />
      <Toaster />
    </SessionProvider>
  );
}
