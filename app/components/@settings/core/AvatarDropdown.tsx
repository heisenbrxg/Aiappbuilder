import { useStore } from '@nanostores/react';
import { profileStore } from '~/lib/stores/profile';
import { useAuth } from '~/components/auth/AuthProvider';
import type { Profile } from './types';

interface AvatarDropdownProps {
  onSelectTab?: (tab: any) => void; // Not used anymore, kept for compatibility
}

export const AvatarDropdown = ({ onSelectTab }: AvatarDropdownProps) => {
  const profile = useStore(profileStore) as Profile;
  const { user } = useAuth();

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const initials = getInitials(profile?.username, user?.email);

  return (
    <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center">
      {profile?.avatar ? (
        <img
          src={profile.avatar}
          alt={profile?.username || 'Profile'}
          className="w-full h-full rounded-full object-cover"
          loading="eager"
          decoding="sync"
        />
      ) : (
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-r from-monzed-glow to-monzed-accent">
          <span className="text-white font-semibold text-sm">{initials}</span>
        </div>
      )}
    </div>
  );
};
