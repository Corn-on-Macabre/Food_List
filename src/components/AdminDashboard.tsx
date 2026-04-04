import { useAdminAuth } from '../hooks';

export function AdminDashboard() {
  const { logout } = useAdminAuth();

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-[#FFFBF5] border-b border-[#E8E0D5] shadow-sm flex items-center justify-between px-5 z-50">
        <span className="font-display text-xl font-bold text-stone-900">
          Food List — Curator Dashboard
        </span>
        <button
          onClick={logout}
          aria-label="Sign out of curator dashboard"
          className="border border-[#E8E0D5] rounded-lg px-3 py-1.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        >
          Sign out
        </button>
      </header>

      {/* Main content */}
      <main className="pt-[60px] flex items-center justify-center min-h-screen">
        <p className="font-sans text-sm text-stone-400">
          Curator Dashboard — Restaurant management coming in Stories 4.2–4.6
        </p>
      </main>
    </div>
  );
}
