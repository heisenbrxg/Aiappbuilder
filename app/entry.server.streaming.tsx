import type { AppLoadContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server.browser';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';
import { themeStore } from '~/lib/stores/theme';
import { pipeStream } from '~/utils/stream-helpers';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: any,
  _loadContext: AppLoadContext,
) {
  // await initializeModelList({});

  let readable: ReadableStream;

  try {
    readable = await renderToReadableStream(<RemixServer context={remixContext} url={request.url} />, {
      signal: request.signal,
      onError(error: unknown) {
        console.error('SSR render error:', error);
        responseStatusCode = 500;
      },
    });
  } catch (error) {
    console.error('Failed to render to stream:', error);
    // Fallback response for render errors
    responseHeaders.set('Content-Type', 'text/html');
    return new Response('<!DOCTYPE html><html><body><h1>Server Error</h1><p>Unable to render page</p></body></html>', {
      status: 500,
      headers: responseHeaders,
    });
  }

  // Create a new stream to avoid locking issues
  const { readable: bodyStream, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Start the streaming process
  (async () => {
    try {
      const head = renderHeadToString({ request, remixContext, Head });

      // Write the HTML head
      await writer.write(
        new TextEncoder().encode(
          `<!DOCTYPE html><html lang="en" data-theme="${themeStore.value}"><head>${head}</head><body><div id="root" class="w-full h-full">`,
        ),
      );

      // Stream the React content using our helper
      await pipeStream(readable, writer, {
        onError: (error) => {
          console.error('Stream pipe error:', error);
          // Try to write an error message if possible
          writer.write(new TextEncoder().encode('<div>Error loading content</div>')).catch(() => { });
        },
        onComplete: async () => {
          await writer.write(new TextEncoder().encode('</div></body></html>'));
          await writer.close();
        },
      });
    } catch (error) {
      console.error('Streaming error:', error);
      try {
        // If we haven't closed the writer yet, try to complete the HTML
        if (writer.desiredSize !== null) {
          await writer.write(new TextEncoder().encode('</div></body></html>'));
        }
        await writer.abort(error);
      } catch (abortError) {
        console.error('Failed to abort writer:', abortError);
      }
    }
  })();

  if (isbot(request.headers.get('user-agent') || '')) {
    // For bots, we need to wait for the stream to be ready
    // But we can't call allReady on our new stream
    // So we'll handle this differently
    console.log('Bot detected, using standard streaming');
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
  responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

  return new Response(bodyStream, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
