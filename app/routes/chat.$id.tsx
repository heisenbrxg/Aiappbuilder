import { json, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useState, useCallback, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Chat } from '~/components/chat/Chat.client';
import { UnifiedHeader } from '~/components/header/UnifiedHeader';
import { LoadingSpinner } from '~/components/ui/LoadingSpinner';

import { useAuth } from '~/components/auth/AuthProvider';
import type { Project } from '~/lib/types';

export const meta: MetaFunction = () => {
  return [
    { title: 'Chat - sharelock.cc' },
    { name: 'description', content: 'AI-powered chat interface for building amazing applications with sharelock.cc' },
    { name: 'keywords', content: 'AI chat, coding assistant, Starsky chat' },
    { property: 'og:title', content: 'Chat - sharelock.cc' },
    { property: 'og:description', content: 'AI-powered chat interface for building amazing applications with sharelock.cc' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: '/logo-white.png' },
    { name: 'robots', content: 'noindex, nofollow' }, // Private chat should not be indexed
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const projectApiUrl = new URL('/api/projects', request.url);
  const response = await fetch(projectApiUrl.toString(), {
    headers: {
      // Forward cookies to the API route to maintain session
      Cookie: request.headers.get('Cookie') ?? '',
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch projects:', await response.text());
    return json({ projects: [], hasMore: false, totalProjects: 0, id: params.id });
  }

  const data = await response.json();
  // Forward the Set-Cookie header from the API route if it exists
  const headers = new Headers();
  if (response.headers.has('Set-Cookie')) {
    headers.set('Set-Cookie', response.headers.get('Set-Cookie')!);
  }

  return json({ ...(data as object), id: params.id }, { headers });
}

/**
 * Chat component - the active chat interface for specific chat sessions
 * This is used when users have started a conversation
 */
interface LoaderData {
  projects: Project[];
  hasMore: boolean;
  totalProjects: number;
  id: string;
}

export default function ChatPage() {
  const loaderData = useLoaderData<LoaderData>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>(loaderData.projects || []);
  const [hasMore, setHasMore] = useState<boolean>(loaderData.hasMore);
  const [totalProjects, setTotalProjects] = useState<number>(loaderData.totalProjects || 0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Fetch projects when user authentication changes
  const fetchProjects = useCallback(async () => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json() as Omit<LoaderData, 'id'>;

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
  }, [user, isLoading]);

  // Load projects when user logs in
  useEffect(() => {
    if (user && !authLoading && !projectsLoaded) {
      fetchProjects();
    } else if (!user && !authLoading) {
      // Clear projects when user logs out
      setProjects([]);
      setHasMore(false);
      setTotalProjects(0);
      setProjectsLoaded(false);
    }
  }, [user, authLoading, projectsLoaded, fetchProjects]);

  // Show loading state while checking authentication
  if (authLoading) {
    return <LoadingSpinner message="Loading chat..." />;
  }

  // Redirect if not authenticated
  if (!user && !authLoading) {
    return <LoadingSpinner message="Redirecting..." />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-monzed-elements-background-depth-1">
      <UnifiedHeader variant="chat" showNavigation={true} showChatActions={true} />
      <div className="flex-1 min-h-0 overflow-auto">
        <ClientOnly fallback={<div>Loading chat...</div>}>
          {() => (
            <Chat
              projects={projects}
              hasMore={hasMore}
              totalProjects={totalProjects}
            />
          )}
        </ClientOnly>
      </div>
    </div>
  );
}
