import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { GitUrlImport } from '~/components/git/GitUrlImport.client';
import { UnifiedHeader } from '~/components/header/UnifiedHeader';

export const meta: MetaFunction = () => {
  return [{ title: 'Starsky' }, { name: 'description', content: 'Talk with Starsky, an advanced AI assistant' }];
};

export async function loader(args: LoaderFunctionArgs) {
  return json({ url: args.params.url });
}

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full bg-monzed-elements-background-depth-1">
      <UnifiedHeader variant="chat" />
      <ClientOnly fallback={<BaseChat />}>{() => <GitUrlImport />}</ClientOnly>
    </div>
  );
}
