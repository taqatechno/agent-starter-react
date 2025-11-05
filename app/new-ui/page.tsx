import { headers } from 'next/headers';
import { NewApp } from '@/components/app/new-ui/new-app';
import { getAppConfig } from '@/lib/utils';

export default async function NewUIPage() {
  const hdrs = await headers();
  const appConfig = await getAppConfig(hdrs);

  return <NewApp appConfig={appConfig} />;
}
