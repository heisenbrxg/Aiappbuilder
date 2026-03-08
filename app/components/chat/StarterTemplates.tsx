import React from 'react';
import type { Template } from '~/types/template';
import { STARTER_TEMPLATES } from '~/utils/constants';
import { useAuthGuard } from '~/hooks/useAuthGuard';

interface FrameworkLinkProps {
  template: Template;
}

const FrameworkLink: React.FC<FrameworkLinkProps> = ({ template }) => {
  const { requireAuth } = useAuthGuard();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!requireAuth()) return;
    // If authenticated, proceed with navigation
    window.location.href = `/git?url=https://github.com/${template.githubRepo}.git`;
  };

  return (
    <div className="group relative">
      <a
        href={`/git?url=https://github.com/${template.githubRepo}.git`}
        onClick={handleClick}
        data-state="closed"
        data-discover="true"
        className="flex flex-col p-4 rounded-xl bg-monzed-elements-background-depth-1 border border-monzed-elements-borderColor/30 hover:border-[#FC7C11]/50 hover:bg-monzed-elements-background-depth-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#FC7C11]/10 min-h-[140px] w-full h-full"
        title={template.description}
      >
        {/* Icon */}
        <div className="flex justify-center mb-3">
          <div
            className={`inline-block ${template.icon} w-8 h-8 text-3xl transition-all duration-300 opacity-60 group-hover:opacity-100 group-hover:text-[#FC7C11] dark:text-white dark:opacity-70 dark:group-hover:opacity-100 dark:group-hover:text-[#FC7C11]`}
          />
        </div>

        {/* Label */}
        <h3 className="text-sm font-semibold text-monzed-elements-textPrimary group-hover:text-monzed-elements-textPrimary transition-colors duration-300 text-center leading-tight mb-2">
          {template.label}
        </h3>

        {/* Description */}
        <p className="text-xs text-monzed-elements-textSecondary group-hover:text-monzed-elements-textSecondary transition-colors duration-300 text-center leading-relaxed flex-1">
          {template.description}
        </p>

        {/* Tags */}
        {template.tags && (
          <div className="flex flex-wrap justify-center gap-1 mt-3">
            {template.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-[#FC7C11]/10 text-[#FC7C11] rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Hover effect overlay */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FC7C11]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </a>
    </div>
  );
};

const StarterTemplates: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {/* Component removed - AI Business Builder section */}
    </div>
  );
};

export default StarterTemplates;
