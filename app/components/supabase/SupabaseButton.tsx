import { useAuthGuard } from '~/hooks/useAuthGuard';

export function SupabaseButton() {
  const { requireAuth } = useAuthGuard();

  const openSupabaseConnection = () => {
    if (!requireAuth()) return;
    
    // Dispatch the same event that the chatbox listens for
    document.dispatchEvent(new CustomEvent('open-supabase-connection'));
  };

  return (
    <button
      onClick={openSupabaseConnection}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-black hover:bg-gray-800 text-white rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
      title="Connect to Supabase"
    >
      <img
        className="w-3.5 h-3.5"
        height="14"
        width="14"
        crossOrigin="anonymous"
        src="https://cdn.simpleicons.org/supabase"
        alt="Supabase"
      />
      <span>Supabase</span>
    </button>
  );
}
