import type { LoaderFunction } from '@remix-run/cloudflare';

export const loader: LoaderFunction = async () => {
  // Chrome DevTools integration configuration
  const devToolsConfig = {
    version: "1.0",
    name: "Starsky",
    description: "Advanced AI Assistant",
    url: "https://sharelock.cc",
    devtools_page: "devtools.html",
    permissions: [
      "tabs",
      "debugger",
      "storage"
    ],
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content.js"],
        run_at: "document_start"
      }
    ],
    background: {
      scripts: ["background.js"],
      persistent: false
    },
    manifest_version: 2
  };

  return new Response(JSON.stringify(devToolsConfig, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};

// Handle OPTIONS requests for CORS
export const options: LoaderFunction = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
