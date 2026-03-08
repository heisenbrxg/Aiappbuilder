import type { AppLoadContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';
import { themeStore } from '~/lib/stores/theme';

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

  // Check if stream is already locked
  let streamToUse = readable;
  try {
    if ((readable as any).locked) {
      console.warn('Main render stream is locked, creating alternative stream');
      // Create an alternative path for locked streams
      const { readable: newReadable } = new TransformStream();
      streamToUse = newReadable;
    }
  } catch (error) {
    console.error('Error checking stream lock:', error);
  }

  const body = new ReadableStream({
    start(controller) {
      const head = renderHeadToString({ request, remixContext, Head });

      controller.enqueue(
        new Uint8Array(
          new TextEncoder().encode(
            `<!DOCTYPE html><html lang="en" data-theme="${themeStore.value}"><head>${head}</head><body><div id="root" class="w-full h-full">`,
          ),
        ),
      );

      // Safely get a reader or handle locked stream
      let reader: ReadableStreamDefaultReader;
      try {
        reader = streamToUse.getReader();
      } catch (error) {
        console.error('Error getting reader:', error);
        // Fallback if we can't get a reader
        controller.enqueue(new Uint8Array(new TextEncoder().encode('<div>Error loading content</div></div></body></html>')));
        controller.close();
        return;
      }

      function read() {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              controller.enqueue(new Uint8Array(new TextEncoder().encode('</div></body></html>')));
              controller.close();
              return;
            }

            controller.enqueue(value);
            read();
          })
          .catch((error) => {
            console.error('Stream reading error:', error);
            // Try to gracefully handle the error
            controller.enqueue(new Uint8Array(new TextEncoder().encode('<div>Error loading content</div></div></body></html>')));
            controller.close();
            try {
              readable.cancel();
            } catch (e) {
              console.warn('Error cancelling stream:', e);
            }
          });
      }
      read();
    },

    cancel() {
      try {
        readable.cancel();
      } catch (e) {
        console.warn('Error cancelling stream on cancel:', e);
      }
    },
  });

  if (isbot(request.headers.get('user-agent') || '')) {
    await (readable as any).allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');

  responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
  responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
