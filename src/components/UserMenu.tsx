import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function UserMenu() {
  const { isAuthenticated, user, signInWithGoogle, signOut, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Don't render anything while auth is loading — avoid layout shift
  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => { signInWithGoogle(); }}
        className="font-sans text-xs font-semibold text-stone-500 hover:text-amber-700 transition-colors duration-150 whitespace-nowrap"
      >
        Sign in
      </button>
    );
  }

  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const avatarUrl = (metadata?.avatar_url as string) ?? (metadata?.picture as string) ?? null;
  const displayName = (metadata?.full_name as string) ?? (metadata?.name as string) ?? user?.email ?? 'User';

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 rounded-full"
        aria-label="User menu"
        aria-expanded={dropdownOpen}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-stone-200"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber-100 border border-stone-200 flex items-center justify-center">
            <span className="font-sans text-xs font-bold text-amber-700">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="font-sans text-xs font-medium text-stone-700 hidden sm:inline max-w-[120px] truncate">
          {displayName}
        </span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg border border-stone-200 shadow-lg py-1 z-50">
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(false);
              signOut();
            }}
            className="w-full text-left px-4 py-2 font-sans text-xs text-stone-700 hover:bg-stone-50 transition-colors duration-150"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
