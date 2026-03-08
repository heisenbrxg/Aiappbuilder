import { useStore } from '@nanostores/react';
import type { LinksFunction, MetaFunction } from '@remix-run/cloudflare';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useMatches, useLocation } from '@remix-run/react';
import tailwindReset from '@unocss/reset/tailwind-compat.css?url';
import { themeStore } from './lib/stores/theme';
import { stripIndents } from './utils/stripIndent';
import { createHead } from 'remix-island';
import { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ClientOnly } from 'remix-utils/client-only';
import { cacheManager } from './lib/utils/cacheManager';
import { ToastContainer, cssTransition } from 'react-toastify';
import { motion } from 'framer-motion';

import reactToastifyStyles from 'react-toastify/dist/ReactToastify.css?url';
import globalStyles from './styles/index.scss?url';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';
import monzedStyles from './styles/monzed-theme.css?url';
import mobileOptimizations from './styles/mobile-optimizations.css?url';
import 'virtual:uno.css';

function CanonicalLink() {
  const location = useLocation();
  const canonicalUrl = `https://sharelock.cc${location.pathname}`;
  return <link rel="canonical" href={canonicalUrl} />;
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Starsky - AI App Builder | Create Mobile Apps, Websites & Web3 DApps Instantly' },
    { name: 'description', content: 'Build full-stack applications with AI assistance. Create mobile apps, websites, web3 DApps, and more. Starsky helps you code, debug, and deploy instantly - no coding experience required.' },
    { name: 'keywords', content: 'AI app builder, AI coding assistant, mobile app builder, website builder, web3 builder, AI developer, full-stack development, react native, nextjs, blockchain, smart contracts, no-code, low-code, AI programming assistant' },
    { name: 'author', content: 'Starsky Team' },
    { property: 'og:title', content: 'Starsky - AI App Builder | Create Apps Instantly with AI' },
    { property: 'og:description', content: 'Build mobile apps, websites, web3 applications, and full-stack projects with AI assistance. Starsky turns your ideas into production-ready code instantly.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: '/images/og-image.png' },
    { property: 'og:site_name', content: 'Starsky' },
    { property: 'og:locale', content: 'en_US' },
    { property: 'twitter:card', content: 'summary_large_image' },
    { property: 'twitter:title', content: 'Starsky - AI App Builder | Create Apps Instantly' },
    { property: 'twitter:description', content: 'Build mobile apps, websites, web3 applications, and full-stack projects with AI. Turn ideas into production-ready code instantly.' },
    { property: 'twitter:image', content: '/images/og-image.png' },
    { name: 'theme-color', content: '#ef4444' },
    { name: 'robots', content: 'index, follow' },
  ];
};

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/favicon.ico',
    type: 'image/x-icon',
  },
  {
    rel: 'icon',
    href: '/favicon-32x32.png',
    sizes: '32x32',
    type: 'image/png',
  },
  {
    rel: 'icon',
    href: '/favicon-16x16.png',
    sizes: '16x16',
    type: 'image/png',
  },
  {
    rel: 'apple-touch-icon',
    href: '/apple-touch-icon.png',
    sizes: '180x180',
  },
  {
    rel: 'manifest',
    href: '/site.webmanifest',
  },
  { rel: 'stylesheet', href: reactToastifyStyles },
  { rel: 'stylesheet', href: tailwindReset },
  { rel: 'stylesheet', href: globalStyles },
  { rel: 'stylesheet', href: xtermStyles },
  { rel: 'stylesheet', href: monzedStyles },
  { rel: 'stylesheet', href: mobileOptimizations },
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
];

const inlineThemeCode = stripIndents`
  setTutorialKitTheme();

  function setTutorialKitTheme() {
    let theme = localStorage.getItem('bolt_theme');

    if (!theme) {
      // Default to dark mode if user preference is not set
      theme = 'dark';
    }

    document.querySelector('html')?.setAttribute('data-theme', theme);
  }
`;

export const Head = createHead(() => (
  <>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
    <Meta />
    <Links />
    <CanonicalLink />
    {/* Google Analytics */}
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-GJ7SQQRGL3"></script>
    <script
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-GJ7SQQRGL3', { send_page_view: false });
        `,
      }}
    />
    <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
    
    {/* Structured Data for Rich Results */}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Starsky AI App Builder",
        "description": "AI-powered application builder for creating mobile apps, websites, web3 DApps, and full-stack applications. Build production-ready code with natural language.",
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Web Browser",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "featureList": [
          "AI-powered code generation",
          "Mobile app development (React Native, Expo)",
          "Website and web app builder (React, Next.js, Astro)",
          "Web3 and blockchain DApp development",
          "Full-stack application development",
          "Instant deployment to production",
          "Real-time code preview",
          "Integrated debugging"
        ],
        "author": {
          "@type": "Organization",
          "name": "Starsky Team",
          "url": "https://sharelock.cc"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "1250"
        }
      }
    `}} />
  </>
));

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useStore(themeStore);

  useEffect(() => {
    document.querySelector('html')?.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      <ClientOnly>{() => <DndProvider backend={HTML5Backend}>{children}</DndProvider>}</ClientOnly>
      <ScrollRestoration />
<ToastContainer
        closeButton={({ closeToast }) => {
          return (
            <button className="Toastify__close-button" onClick={closeToast}>
              <div className="i-ph:x text-lg" />
            </button>
          );
        }}
        icon={({ type }) => {
          /**
           * Icons for different toast types with proper theme integration
           */
          switch (type) {
            case 'success': {
              return <div className="i-ph:check-bold text-monzed-elements-icon-success text-2xl" />;
            }
            case 'error': {
              return <div className="i-ph:warning-circle-bold text-monzed-elements-icon-error text-2xl" />;
            }
            case 'info': {
              return <div className="i-ph:info-bold text-monzed-elements-borderColorActive text-2xl" />;
            }
            case 'warning': {
              return <div className="i-ph:warning-bold text-2xl" style={{color: 'var(--color-citrus-electric, #E6FF00)'}} />;
            }
          }

          return undefined;
        }}
        position="bottom-right"
        pauseOnFocusLoss
        transition={cssTransition({ enter: 'animated fadeInRight', exit: 'animated fadeOutRight' })}
        autoClose={3000}
      />
      <Scripts />
    </>
  );
}

import { logStore } from './lib/stores/logs';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';

function AppContent() {
  const { isLoggingOut } = useAuth();

  return (
    <>
      <Layout>
        {isLoggingOut ? (
          <div className="flex items-center justify-center min-h-screen monzed-bg-primary">
            <div className="flex flex-col items-center gap-3">
              {/* Sparkle Icon */}
              <div className="i-ph:sparkle text-2xl monzed-text-secondary" />
              
              {/* Shimmer text - adapts to light and dark mode */}
              <motion.span
                className="text-base font-medium bg-gradient-to-r from-gray-400 via-gray-900 to-gray-400 dark:from-white/40 dark:via-white dark:to-white/40 bg-clip-text text-transparent"
                style={{
                  backgroundSize: '200% 100%',
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '200% 50%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                Signing out...
              </motion.span>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </Layout>
    </>
  );
}

export default function App() {
  const location = useLocation();
  const theme = useStore(themeStore);

  useEffect(() => {
    logStore.logSystem('Application initialized', {
      theme,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });

    // Initialize cache management
    const initializeCache = async () => {
      try {
        const cacheCleared = await cacheManager.checkVersionAndClearCache();
        if (cacheCleared) {
          logStore.logSystem('Cache cleared due to version change');
        }
      } catch (error) {
        console.warn('Cache initialization failed:', error);
      }
    };

    initializeCache();
    // Send initial page view and subsequent route change views to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'G-GJ7SQQRGL3', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
