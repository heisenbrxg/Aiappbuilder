import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { applySecurityMiddleware } from '~/lib/security/middleware';

/**
 * Catch-all route to handle requests for non-existent routes,
 * with comprehensive security protection against sensitive file access.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { pathname } = new URL(request.url);

  // Apply security middleware
  const securityCheck = applySecurityMiddleware(request, {
    blockSensitiveFiles: true,
    logSecurityEvents: true,
  });

  // If security middleware blocked the request, return 404
  if (securityCheck.blocked) {
    return json(
      { 
        error: 'Not Found',
        message: 'The requested resource could not be found.',
        status: 404 
      }, 
      { 
        status: 404,
        headers: securityCheck.headers || {}
      }
    );
  }

  // A list of known paths requested by developer tools that we can safely ignore.
  const knownDevToolsPaths = [
    '/.well-known/appspecific/com.chrome.devtools.json',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ];

  if (knownDevToolsPaths.includes(pathname)) {
    console.log(`Ignoring known DevTools path: ${pathname}`);
    return json({ message: 'Not Found' }, { status: 404 });
  }

  // Log other unmatched routes to help with debugging real issues.
  console.warn(`No route matched URL: ${pathname}`);
  return json(
    { 
      error: 'Not Found',
      message: 'The requested page could not be found.',
      status: 404 
    }, 
    { status: 404 }
  );
}

// This component will render a user-friendly 404 page
export default function NotFound() {
  return (
    <div className="min-h-screen monzed-bg-primary monzed-text-primary flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-xl mx-auto">
        {/* 404 Number */}
        <div className="text-9xl font-bold text-monzed-accent mb-6">
          404
        </div>
        
        {/* Error Title */}
        <h1 className="text-3xl font-bold monzed-text-primary mb-4">
          Page Not Found
        </h1>
        
        {/* Error Message */}
        <p className="text-lg monzed-text-secondary mb-8">
          The page you're looking for doesn't exist.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="px-6 py-3 bg-monzed-accent hover:bg-monzed-glow text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <div className="i-ph:house w-5 h-5" />
            Go Home
          </a>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border-2 border-monzed-accent text-monzed-accent hover:bg-monzed-accent hover:text-black rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <div className="i-ph:arrow-left w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
