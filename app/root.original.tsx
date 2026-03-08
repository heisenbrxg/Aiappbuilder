import { useStore } from '@nanostores/react';
import type { LinksFunction, MetaFunction } from '@remix-run/cloudflare';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useMatches } from '@remix-run/react';
import tailwindReset from '@unocss/reset/tailwind-compat.css?url';
import { themeStore } from './lib/stores/theme';
import { stripIndents } from './utils/stripIndent';
import { createHead } from 'remix-island';
import { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ClientOnly } from 'remix-utils/client-only';

import reactToastifyStyles from 'react-toastify/dist/ReactToastify.css?url';
import globalStyles from './styles/index.scss?url';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';

import 'virtual:uno.css';

export const meta: MetaFunction = () => {
  return [
    { title: 'Starsky - Advanced AI Assistant' },
    { name: 'description', content: 'Create amazing applications with AI assistance. Starsky helps you build, debug, and deploy your projects instantly.' },
    { name: 'keywords', content: 'AI, assistant, coding, development, programming, AI coding assistant' },
    { name: 'author', content: 'Starsky Team' },
    { property: 'og:title', content: 'Starsky - Advanced AI Assistant' },
    { property: 'og:description', content: 'Create amazing applications with AI assistance. Starsky helps you build, debug, and deploy your projects instantly.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: '/images/og-image.png' },
    { property: 'og:site_name', content: 'Starsky' },
    { property: 'og:locale', content: 'en_US' },
    { property: 'twitter:card', content: 'summary_large_image' },
    { property: 'twitter:title', content: 'Starsky - Advanced AI Assistant' },
    { property: 'twitter:description', content: 'Create amazing applications with AI assistance. Starsky helps you build, debug, and deploy your projects instantly.' },
    { property: 'twitter:image', content: '/images/og-image.png' },
    { name: 'theme-color', content: '#ef4444' },
    { name: 'robots', content: 'index, follow' },
  ];
};

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/favicon.svg',
    type: 'image/svg+xml',
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
    href: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap',
  },
];

const inlineThemeCode = stripIndents`
  setTutorialKitTheme();

  function setTutorialKitTheme() {
    let theme = localStorage.getItem('bolt_theme');

    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
    <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
    
    {/* Structured Data for Rich Results */}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Starsky",
        "description": "Advanced AI assistant for building applications",
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "author": {
          "@type": "Organization",
          "name": "Starsky Team",
          "url": "https://sharelock.cc"
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
      <Scripts />
    </>
  );
}

import { logStore } from './lib/stores/logs';
import { AuthProvider } from './components/auth/AuthProvider';
import { AuthModal } from './components/auth/AuthModal';
import { useAuth } from './components/auth/AuthProvider';

function AppContent() {
  return (
    <>
      <Layout>
        <Outlet />
      </Layout>
      <ClientOnly>
        {() => <AuthModalWrapper />}
      </ClientOnly>
    </>
  );
}

function AuthModalWrapper() {
  const { showAuthModal, setShowAuthModal } = useAuth();

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}

export default function App() {
  const theme = useStore(themeStore);

  useEffect(() => {
    logStore.logSystem('Application initialized', {
      theme,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <ClientOnly fallback={<Layout><Outlet /></Layout>}>
      {() => (
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      )}
    </ClientOnly>
  );
}
