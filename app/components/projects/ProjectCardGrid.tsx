import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Project } from '~/lib/types';
import { ProjectCard } from './ProjectCard';
import { useAuth } from '~/components/auth/AuthProvider';
import { toast } from 'react-toastify';
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';
import { debounce } from '~/utils/debounce';

interface ProjectCardGridProps {
  projects: Project[];
  hasMore?: boolean;
  totalProjects?: number;
}

// Current date/time component
function CurrentDateTime() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-monzed-elements-textSecondary border-b border-monzed-elements-borderColor">
      <span className="i-ph:calendar-dots h-4 w-4" />
      <span>{formatDate(currentTime)}</span>
      <span className="i-ph:clock h-4 w-4 ml-2" />
      <span>{formatTime(currentTime)}</span>
    </div>
  );
}

export function ProjectCardGrid({ projects, hasMore, totalProjects }: ProjectCardGridProps) {
  const { user } = useAuth();
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectList, setProjectList] = useState(projects);
  const [displayedCount, setDisplayedCount] = useState(6); // Initially show 6 projects
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deletedProjectIds, setDeletedProjectIds] = useState<Set<string>>(new Set());

  // Sync local state with props changes BUT exclude deleted projects
  useEffect(() => {
    // Filter out any projects that were deleted during this session
    const filteredProjects = projects.filter(p => !deletedProjectIds.has(p.id));
    setProjectList(filteredProjects);
  }, [projects, deletedProjectIds]);

  const handleRename = (project: Project) => {
    setRenamingProjectId(project.id);
  };

  const handleUpdateDescription = async (projectToUpdate: Project, newDescription: string) => {
    // Optimistically update the UI
    const originalProjects = projectList;
    setProjectList(projectList.map(p => 
      p.id === projectToUpdate.id ? { ...p, description: newDescription, updated_at: new Date().toISOString() } : p
    ));
    setRenamingProjectId(null);

    try {
      const response = await fetch(`/api/projects/${projectToUpdate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: newDescription }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename project');
      }
      toast.success('Project renamed.');
    } catch (error) {
      toast.error('Failed to rename project.');
      console.error('Rename error:', error);
      // Revert to the original state if the API call fails
      setProjectList(originalProjects);
    }
  };



  // Search functionality
  const debouncedSetSearch = useCallback(debounce(setSearchQuery, 300), []);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSetSearch(event.target.value);
    },
    [debouncedSetSearch],
  );

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projectList;
    }

    const query = searchQuery.toLowerCase();
    return projectList.filter((project) =>
      project.description.toLowerCase().includes(query)
    );
  }, [projectList, searchQuery]);

  // Get the projects to display based on current displayedCount
  const projectsToDisplay = useMemo(() => {
    return filteredProjects.slice(0, displayedCount);
  }, [filteredProjects, displayedCount]);

  // Check if there are more projects to show
  const canLoadMore = displayedCount < filteredProjects.length;

  // Load more projects function
  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    // Simulate a small delay for better UX
    setTimeout(() => {
      setDisplayedCount(prevCount => Math.min(prevCount + 6, filteredProjects.length));
      setIsLoadingMore(false);
    }, 300);
  }, [filteredProjects.length]);

  // Reset displayed count when search changes
  useEffect(() => {
    setDisplayedCount(6);
  }, [searchQuery]);

  // Selection functionality
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedItems([]);
    }
  };

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const newSelectedItems = prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id];
      return newSelectedItems;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems((prev) => {
      if (prev.length === projectsToDisplay.length) {
        return [];
      } else {
        const allDisplayedIds = projectsToDisplay.map((project) => project.id);
        return [...new Set([...prev, ...allDisplayedIds])];
      }
    });
  }, [projectsToDisplay]);

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedItems.length === 0) {
      toast.info('Select at least one project to delete');
      return;
    }

    const selectedProjects = projectList.filter((project) => selectedItems.includes(project.id));

    if (selectedProjects.length === 0) {
      toast.error('Could not find selected projects');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedProjects.length} project${selectedProjects.length > 1 ? 's' : ''}?`;
    if (window.confirm(confirmMessage)) {
      handleBulkDelete(selectedProjects);
    }
  }, [selectedItems, projectList]);

  const handleBulkDelete = async (projectsToDelete: Project[]) => {
    try {
      const deletePromises = projectsToDelete.map(async (project) => {
        const response = await fetch(`/api/projects/${project.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Failed to delete project ${project.description}`);
        }
        return project.id;
      });

      await Promise.all(deletePromises);
      
      // Mark these projects as deleted so they won't come back
      const deletedIds = projectsToDelete.map(p => p.id);
      setDeletedProjectIds(prev => {
        const newSet = new Set(prev);
        deletedIds.forEach(id => newSet.add(id));
        return newSet;
      });
      
      // Update the project list by removing deleted projects
      setProjectList(currentProjects => currentProjects.filter(p => !deletedIds.includes(p.id)));
      
      // Clear selection
      setSelectedItems([]);
      setSelectionMode(false);
      
      toast.success(`Successfully deleted ${projectsToDelete.length} project${projectsToDelete.length > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Failed to delete some projects');
      console.error('Bulk delete error:', error);
    }
  };

  const handleDelete = async (projectToDelete: Project) => {
    if (window.confirm(`Are you sure you want to delete "${projectToDelete.description}"?`)) {
      try {
        const response = await fetch(`/api/projects/${projectToDelete.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete project');
        }

        // Mark this project as deleted so it won't come back
        setDeletedProjectIds(prev => {
          const newSet = new Set(prev);
          newSet.add(projectToDelete.id);
          return newSet;
        });

        // Optimistically remove the project from the UI
        setProjectList(currentProjects => currentProjects.filter(p => p.id !== projectToDelete.id));
        toast.success('Project deleted.');
      } catch (error) {
        toast.error('Failed to delete project.');
        console.error('Delete error:', error);
      }
    }
  };
  return (
    <div className="flex flex-col h-full">
      {/* Date/Time Display */}
      <CurrentDateTime />
      
      {/* Search and Controls */}
      <div className="p-4 space-y-3 border-b border-monzed-elements-borderColor">
        <div className="relative w-full">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <div className="i-ph:magnifying-glass w-4 h-4 monzed-text-tertiary" />
          </div>
          <input
            className="w-full monzed-bg-secondary pl-9 pr-32 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-monzed-accent/50 text-sm monzed-text-primary placeholder-monzed-text-tertiary border monzed-border transition-all"
            type="search"
            placeholder="Search projects..."
            onChange={handleSearchChange}
            aria-label="Search projects"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
            <button
              onClick={toggleSelectionMode}
              className={classNames(
                'flex gap-1.5 items-center rounded-lg px-3 py-1.5 transition-all text-xs font-medium',
                selectionMode
                  ? 'bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 border border-red-500'
                  : 'monzed-bg-tertiary monzed-text-primary hover:bg-monzed-accent/10 border monzed-border hover:border-monzed-accent/30'
              )}
              aria-label={selectionMode ? 'Exit selection mode' : 'Enter selection mode'}
            >
              <span className={selectionMode ? 'i-ph:x w-3.5 h-3.5' : 'i-ph:check-square w-3.5 h-3.5'} />
              <span>{selectionMode ? 'Cancel' : 'Select'}</span>
            </button>
          </div>
        </div>
        {selectionMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBulkDeleteClick}
            className="bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 border border-red-500 w-full"
          >
            <span className="i-ph:trash h-4 w-4 mr-1" />
            Delete Selected ({selectedItems.length})
          </Button>
        )}
      </div>
      
      {/* Projects Header */}
      <div className="flex items-center justify-between text-sm px-4 py-2">
        <div className="font-medium text-gray-600 dark:text-gray-400">
          Your Projects ({filteredProjects.length})
          {projectsToDisplay.length < filteredProjects.length && (
            <span className="text-gray-500 ml-1">
              (showing {projectsToDisplay.length})
            </span>
          )}
        </div>
        {selectionMode && projectsToDisplay.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {selectedItems.length === projectsToDisplay.length ? 'Deselect all' : 'Select all'}
            </Button>
          </div>
        )}
      </div>
      
      {/* Projects Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center flex-1">
          {searchQuery.trim() ? (
            <>
              <div className="i-ph:magnifying-glass text-6xl mb-4 monzed-text-tertiary"></div>
              <h3 className="text-xl font-semibold text-monzed-elements-textPrimary mb-2">
                No projects found
              </h3>
              <p className="text-monzed-elements-textSecondary mb-6 max-w-md">
                No projects match your search for "{searchQuery.trim()}". Try a different search term.
              </p>
            </>
          ) : (
            <>
              <div className="i-ph:folder-open text-6xl mb-4 monzed-text-tertiary"></div>
              <h3 className="text-xl font-semibold text-monzed-elements-textPrimary mb-2">
                No projects yet
              </h3>
              <p className="text-monzed-elements-textSecondary mb-6 max-w-md">
                Create your first project to get started with building amazing applications.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {projectsToDisplay.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isRenaming={renamingProjectId === project.id}
                onRename={handleRename}
                onUpdateDescription={handleUpdateDescription}
                onCancelRename={() => setRenamingProjectId(null)}
                onDelete={handleDelete}
                selectionMode={selectionMode}
                isSelected={selectedItems.includes(project.id)}
                onSelectionChange={toggleItemSelection}
              />
            ))}
          </div>
          
          {/* Load More Button */}
          {canLoadMore && (
            <div className="flex justify-center pb-6">
              <Button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-8 py-3 bg-monzed-accent/10 text-monzed-accent border border-monzed-accent/20 hover:bg-monzed-accent/20 hover:border-monzed-accent/40 transition-all duration-200 rounded-xl font-medium"
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-monzed-accent"></div>
                    Loading...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Load More Projects</span>
                    <div className="i-ph:arrow-down text-sm" />
                  </div>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
