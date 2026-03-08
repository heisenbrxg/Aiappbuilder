import { json, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useState, useCallback, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { UnifiedHeader } from '~/components/header/UnifiedHeader';
import { LoadingSpinner } from '~/components/ui/LoadingSpinner';
// BackgroundRays removed for performance

import { useAuth } from '~/components/auth/AuthProvider';
import type { Project } from '~/lib/types';

export const meta: MetaFunction = () => {
  return [
    { title: 'Workspace - Starsky' },
    { name: 'description', content: 'Your AI-powered workspace for building complete online businesses with Starsky' },
    { name: 'keywords', content: 'AI workspace, business builder, online business, Starsky workspace, business creation' },
    { property: 'og:title', content: 'Workspace - Starsky' },
    { property: 'og:description', content: 'Your AI-powered workspace for building complete online businesses with Starsky' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: '/logo-white.png' },
    { name: 'robots', content: 'noindex, nofollow' }, // Private workspace should not be indexed
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
 * Workspace component - shows the "From idea to app" interface with project templates
 * This is the main workspace page for authenticated users before they start a chat
 */
interface LoaderData {
  projects: Project[];
  hasMore: boolean;
  totalProjects: number;
}

export default function Workspace() {
  const loaderData = useLoaderData<LoaderData>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>(loaderData.projects || []);
  const [hasMore, setHasMore] = useState<boolean>(loaderData.hasMore);
  const [totalProjects, setTotalProjects] = useState<number>(loaderData.totalProjects || 0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  // Removed auth redirect

  // Fetch projects when workspace loads
  const fetchProjects = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json() as LoaderData;

      setProjects(data.projects || []);
      setHasMore(data.hasMore || false);
      setTotalProjects(data.totalProjects || 0);
      setPage(1);
      setProjectsLoaded(true);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
      setHasMore(false);
      setTotalProjects(0);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Load projects when workspace mounts
  useEffect(() => {
    if (!authLoading && !projectsLoaded) {
      fetchProjects();
    }
  }, [authLoading, projectsLoaded, fetchProjects]);

  const loadMoreProjects = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = page + 1;

    try {
      const response = await fetch(`/api/projects?page=${nextPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json() as LoaderData;

      setProjects((prevProjects) => [...prevProjects, ...data.projects]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to load more projects:', error);
      // Optionally, show a toast notification for the error
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page]);

  // Show loading state while checking authentication
  if (authLoading) {
    return <LoadingSpinner message="Loading workspace..." fullPage />;
  }

  // Removing auth redirect check

  return (
    <div className="flex flex-col h-screen w-full monzed-bg-primary overflow-hidden">
      <div className="absolute inset-0 monzed-grid-bg opacity-30"></div>
      {/* Gradient backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-b from-monzed-accent/5 via-transparent to-transparent dark:from-monzed-accent/10 dark:via-transparent dark:to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-monzed-glow/5 to-transparent dark:via-monzed-glow/10 pointer-events-none"></div>
      <UnifiedHeader variant="workspace" showNavigation={true} />
      <div className="flex-1 min-h-0 relative z-10">
        <ClientOnly fallback={<BaseChat />}>{() => <Chat projects={projects} hasMore={hasMore} totalProjects={totalProjects} />}</ClientOnly>
      </div>
    </div>
  );
}
