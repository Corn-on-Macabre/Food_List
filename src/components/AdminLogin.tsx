import { useState } from 'react';
import { useAdminAuth } from '../hooks';
import { supabaseConfigured } from '../lib/supabase';

export function AdminLogin() {
  const { login, loginWithGoogle, isConfigured, loading } = useAdminAuth();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const success = login(password);
    if (!success) {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center p-4">
        <p className="text-stone-500 font-sans text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-[#E8E0D5] shadow-lg p-8">
        <h1 className="font-display text-2xl font-bold text-stone-900 text-center mb-1">
          bobby.menu
        </h1>
        <p className="font-sans text-sm text-stone-500 text-center mb-6">
          Curator Dashboard
        </p>

        {!isConfigured && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
            Authentication not configured. Set up Supabase or{' '}
            <code>VITE_ADMIN_PASSWORD</code> in your <code>.env</code> file.
          </div>
        )}

        {supabaseConfigured && (
          <>
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#E8E0D5] hover:bg-stone-50 text-stone-700 font-sans text-sm font-medium rounded-lg py-2.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 mb-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
            {error && (
              <p role="alert" className="text-red-600 text-sm font-sans mb-3">
                {error}
              </p>
            )}
          </>
        )}

        {!supabaseConfigured && isConfigured && (
          <form onSubmit={handleSubmit}>
            <label htmlFor="admin-password" className="sr-only">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              aria-label="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 mb-3"
            />
            {error && (
              <p role="alert" className="text-red-600 text-sm font-sans mb-3">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-[#B45309] hover:bg-[#92400E] text-white font-sans text-sm font-bold rounded-lg py-2.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            >
              Sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminLogin;
