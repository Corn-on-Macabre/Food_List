import { useState } from 'react';
import { useAdminAuth } from '../hooks';

export function AdminLogin() {
  const { login, isConfigured } = useAdminAuth();

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

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-[#E8E0D5] shadow-lg p-8">
        <h1 className="font-display text-2xl font-bold text-stone-900 text-center mb-1">
          Food List
        </h1>
        <p className="font-sans text-sm text-stone-500 text-center mb-6">
          Curator Dashboard
        </p>

        {!isConfigured && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
            Admin password not configured. Set{' '}
            <code>VITE_ADMIN_PASSWORD</code> in your <code>.env</code> file.
          </div>
        )}

        {isConfigured && (
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
