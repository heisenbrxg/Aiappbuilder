import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from '@remix-run/react';
import type { Project } from '~/lib/types';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { initializeWebContainer } from '~/lib/webcontainer/lazy-webcontainer';
import { workbenchStore } from '~/lib/stores/workbench';
import { setShowWorkbench, syncWorkbenchState } from '~/lib/stores/uiState';

interface ProjectCardProps {
  project: Project;
  isRenaming: boolean;
  onRename: (project: Project) => void;
  onUpdateDescription: (project: Project, newDescription: string) => void;
  onCancelRename: () => void;
  onDelete: (project: Project) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (id: string) => void;
}

export function ProjectCard({ project, isRenaming, onRename, onUpdateDescription, onCancelRename, onDelete, selectionMode = false, isSelected = false, onSelectionChange }: ProjectCardProps) {
  // Extract preview URL from project metadata or direct column
  const previewUrl = (project as any).metadata?.preview_url ?? (project as any).preview_url;
  const [description, setDescription] = useState(project.description);
  const [isInitializing, setIsInitializing] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  // Cleanup iframe on component unmount or navigation
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        // Clear the iframe src to prevent further errors
        iframeRef.current.src = 'about:blank';
      }
    };
  }, []);

  // Reset iframe error state when location changes
  useEffect(() => {
    setIframeError(false);
  }, [location.pathname]);

  // Handle iframe errors
  const handleIframeError = useCallback(() => {
    console.warn(`[ProjectCard] Iframe error for project ${project.id}`);
    setIframeError(true);
    
    // Clear the iframe to prevent further errors
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
    }
  }, [project.id]);

  // Handle iframe load to reset error state
  const handleIframeLoad = useCallback(() => {
    setIframeError(false);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onUpdateDescription(project, description);
    }
    if (event.key === 'Escape') {
      onCancelRename();
      setDescription(project.description); // Revert changes
    }
  };
  // A simple date formatting utility
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  const handleCardClick = async (e: React.MouseEvent) => {
    // Don't navigate if already initializing to prevent multiple boots
    if (isInitializing) {
      return;
    }

    // Don't navigate if renaming
    if (isRenaming) {
      return;
    }
    
    // Don't navigate if clicking on the dropdown menu trigger or any dropdown content
    const target = e.target as HTMLElement;
    if (target.closest('[data-radix-dropdown-menu-trigger]') || 
        target.closest('[data-radix-dropdown-menu-content]') ||
        target.closest('[data-radix-popper-content]')) {
      return;
    }
    
    // Don't navigate if clicking on the selection checkbox
    if (target.closest('[data-selection-checkbox]')) {
      return;
    }
    
    // If in selection mode, toggle selection instead of navigating
    if (selectionMode && onSelectionChange) {
      onSelectionChange(project.id);
      return;
    }
    
    try {
      setIsInitializing(true);
      
      // Show workbench immediately for smooth transition (same as sending a message)
      workbenchStore.showWorkbench.set(true);
      setShowWorkbench(true);
      syncWorkbenchState();
      
      // Navigate IMMEDIATELY to show the chat UI faster
      navigate(`/chat/${project.url_id}`);
      
      // Initialize WebContainer in the background (non-blocking)
      initializeWebContainer(project.url_id).catch((error) => {
        console.error('Failed to initialize WebContainer for project:', project.url_id, error);
      });
    } finally {
      // Reset initializing state immediately after navigation
      setIsInitializing(false);
    }
  };

  const handleSelectionChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectionChange) {
      onSelectionChange(project.id);
    }
  };

  return (
    <div 
      className={`group relative overflow-hidden cursor-pointer rounded-2xl ${
        isSelected 
          ? 'ring-2 ring-monzed-accent shadow-lg shadow-monzed-accent/25' 
          : ''
      }`}
      onClick={handleCardClick}
      onContextMenu={(e) => {
        e.preventDefault();
        // Trigger the dropdown menu programmatically
        const dropdownTrigger = e.currentTarget.querySelector('[data-radix-dropdown-menu-trigger]') as HTMLButtonElement;
        if (dropdownTrigger) {
          dropdownTrigger.click();
        }
      }}
    >
      {/* Main card container */}
      <div className="relative monzed-bg-secondary border monzed-border rounded-2xl overflow-hidden shadow-lg">
        
        {/* Selection checkbox */}
        {selectionMode && (
          <div 
            className="absolute top-4 left-4 z-20"
            data-selection-checkbox
            onClick={handleSelectionChange}
          >
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${
              isSelected 
                ? 'bg-monzed-accent border-monzed-accent shadow-lg shadow-monzed-accent/25' 
                : 'border-monzed-elements-borderColor hover:border-monzed-accent/50 monzed-bg-secondary hover:bg-monzed-accent/10'
            }`}>
              {isSelected && (
                <div className="i-ph:check text-black text-sm font-bold" />
              )}
            </div>
          </div>
        )}
        
        {/* Preview section with enhanced styling */}
        <div className="relative h-48 overflow-hidden">
          {previewUrl && !iframeError ? (
            <>
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="w-full h-full object-cover"
                sandbox="allow-scripts allow-same-origin"
                loading="lazy"
                title={`Preview of ${project.description}`}
                onError={handleIframeError}
                onLoad={handleIframeLoad}
                style={{ pointerEvents: 'none' }}
              />
              {/* Overlay gradient for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
              {/* Project placeholder image */}
              <img 
                src="/images/project_placeholder.png" 
                alt="Project Placeholder" 
                className="w-full h-full object-cover"
              />
              {/* Overlay gradient for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          )}
          
          {/* Loading overlay with modern spinner */}
          {isInitializing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="relative">
                  <div className="w-8 h-8 border-3 border-white/20 border-t-monzed-accent rounded-full animate-spin" />
                  <div className="absolute inset-0 w-8 h-8 border-3 border-transparent border-r-mint-cyber rounded-full animate-spin" style={{animationDelay: '150ms'}} />
                </div>
                <span className="text-sm font-medium">Initializing workspace...</span>
              </div>
            </div>
          )}
          
          
        </div>

        {/* Card content */}
        <div className="relative p-6">
            {isRenaming ? (
              <input
                ref={inputRef}
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  onUpdateDescription(project, description);
                }}
                className="w-full bg-transparent text-xl font-bold monzed-text-primary outline-none border-b-2 border-monzed-accent placeholder-monzed-text-tertiary pb-2"
                placeholder="Enter project name..."
              />
            ) : (
              <h3 className="text-xl font-bold monzed-text-primary mb-2 truncate">
                {project.description || 'Untitled Project'}
              </h3>
            )}
            
            <div className="flex items-center justify-between">
              <p className="text-sm monzed-text-secondary font-medium">
                Updated {formatDate(project.updated_at)}
              </p>
              
              {/* Project status badge */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs monzed-text-tertiary font-medium">Active</span>
              </div>
            </div>
        </div>
      </div>
      {/* Enhanced dropdown menu */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button 
            data-radix-dropdown-menu-trigger
            className="absolute top-4 right-4 z-20 p-2 rounded-xl monzed-bg-secondary border monzed-border hover:bg-monzed-elements-item-backgroundActive hover:border-monzed-accent/30 transition-all duration-300 opacity-0 group-hover:opacity-100 monzed-text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="i-ph:dots-three-outline-vertical-fill text-lg" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content 
            className="rounded-xl border monzed-border monzed-bg-secondary shadow-xl backdrop-blur-sm z-50 min-w-[200px] p-1.5" 
            sideOffset={8}
            data-radix-dropdown-menu-content
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu.Item 
              onSelect={(e) => {
                e?.stopPropagation?.();
                onRename(project);
              }} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left ${previewUrl ? 'rounded-t-lg rounded-b-none' : 'rounded-t-lg rounded-b-none'} hover:monzed-bg-tertiary transition-colors monzed-text-primary cursor-pointer outline-none`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="i-ph:pencil-simple-line text-lg text-monzed-accent" />
              <span className="text-sm font-medium">Rename</span>
            </DropdownMenu.Item>
            
            {previewUrl && (
              <DropdownMenu.Item
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-none hover:monzed-bg-tertiary transition-colors monzed-text-primary cursor-pointer outline-none"
                onSelect={(e) => {
                  e.preventDefault();
                  window.open(previewUrl, '_blank');
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="i-ph:arrow-square-out text-lg text-monzed-accent" />
                <span className="text-sm font-medium">Open Preview</span>
              </DropdownMenu.Item>
            )}
            
            <DropdownMenu.Item 
              onSelect={(e) => {
                e?.stopPropagation?.();
                onDelete(project);
              }} 
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-t-none rounded-b-lg hover:bg-red-500/10 transition-colors cursor-pointer outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="i-ph:trash text-lg text-red-500" />
              <span className="text-sm font-medium text-red-500">Delete</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
