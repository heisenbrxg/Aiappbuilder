import { json, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData, useNavigate, useLocation } from '@remix-run/react';
import { useState, useCallback, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { UnifiedHeader } from '~/components/header/UnifiedHeader';
import { Footer } from '~/components/footer/Footer';
import { LoadingSpinner } from '~/components/ui/LoadingSpinner';
import Hero from '~/components/landing/sections/Hero';
import EcosystemExplainer from '~/components/landing/sections/EcosystemExplainer';
import Testimonials from '~/components/landing/sections/Testimonials';
import CallToAction from '~/components/landing/sections/CallToAction';

import { useAuth } from '~/components/auth/AuthProvider';
import type { Project } from '~/lib/types';

export const meta: MetaFunction = () => {
  return [
    { title: 'Starsky | AI-Powered Business Builder - Turn Ideas Into Income in Minutes' },
    { name: 'description', content: 'Starsky is your super-smart business partner that builds complete online businesses in minutes. From websites to payments to marketing – everything you need to turn ideas into income. No technical knowledge required.' },
    { name: 'keywords', content: 'AI business builder, website builder, online business, AI automation, business creation, startup builder, AI entrepreneur, digital business, business partner, income generation' },
    { property: 'og:title', content: 'Starsky | AI-Powered Business Builder' },
    { property: 'og:description', content: 'Turn your ideas into income in minutes with Starsky. Your super-smart AI business partner that builds complete online businesses automatically.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: '/logo-white.png' },
    { property: 'og:url', content: 'https://sharelock.cc/' },
    { property: 'twitter:card', content: 'summary_large_image' },
    { property: 'twitter:title', content: 'Starsky | AI-Powered Business Builder' },
    { property: 'twitter:description', content: 'Turn your ideas into income in minutes with Starsky. Your super-smart AI business partner that builds complete online businesses automatically.' },
    { property: 'twitter:image', content: '/logo-white.png' },
    { name: 'robots', content: 'index, follow, max-image-preview:large' },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const projectApiUrl = new URL('/api/projects', request.url);
  const response = await fetch(projectApiUrl.toString(), {
    headers: {
      // Forward cookies to the API route to maintain session
      Cookie: request.headers.get('Cookie') ?? '',
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch projects:', await response.text());
    return json({ projects: [], hasMore: false, totalProjects: 0 });
  }

  const data = await response.json();
  // Forward the Set-Cookie header from the API route if it exists
  const headers = new Headers();
  if (response.headers.has('Set-Cookie')) {
    headers.set('Set-Cookie', response.headers.get('Set-Cookie')!);
  }

  return json(data, { headers });
};

/**
 * Landing page component for monzed
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 * Do not add settings button/panel to this landing page as it was intentionally removed
 * to keep the UI clean and consistent with the design system.
 */
interface LoaderData {
  projects: Project[];
  hasMore: boolean;
  totalProjects: number;
}

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [projects, setProjects] = useState<Project[]>(loaderData.projects || []);
  const [hasMore, setHasMore] = useState<boolean>(loaderData.hasMore);
  const [totalProjects, setTotalProjects] = useState<number>(loaderData.totalProjects || 0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  // Redirect authenticated users to workspace
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/workspace');
    }
  }, [user, authLoading, navigate]);

  // Show loading state while checking authentication
  if (authLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  // Redirect authenticated users (show loading during redirect)
  if (user && !authLoading) {
    return <LoadingSpinner message="Redirecting to workspace..." />;
  }

  // Show landing page only for unauthenticated users
  return (
    <div className="h-screen monzed-bg-primary overflow-x-hidden overflow-y-auto modern-scrollbar">
      <UnifiedHeader variant="landing" showNavigation={true} />
      <div>
        <Hero />
        <EcosystemExplainer />
        <Testimonials />
        <CallToAction />
      </div>
      <Footer />
    </div>
  );
}
