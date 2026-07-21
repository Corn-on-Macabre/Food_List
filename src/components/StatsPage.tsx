import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRestaurants } from '../hooks';
import { useAuth } from '../contexts/AuthContext';
import { fetchVisits } from '../api/visits';
import type { Visit } from '../types/restaurant';
import {
  visitsByMonth,
  cuisineBreakdown,
  topRestaurants,
  staleLoved,
  formatDollars,
  formatMonth,
} from '../utils/visitStats';
import { CARD_SURFACE } from './styles';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={`${CARD_SURFACE} p-4 shadow-sm`}>
      <h2 className="font-display text-lg font-bold text-stone-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${CARD_SURFACE} p-4 shadow-sm text-center`}>
      <p className="font-display text-2xl font-bold text-stone-900">{value}</p>
      <p className="font-sans text-xs text-stone-500 mt-1">{label}</p>
    </div>
  );
}

export function StatsPage() {
  // RLS on the visits table requires the admin's Supabase JWT. A legacy
  // password-only session passes ProtectedRoute but has no JWT — fail-safe
  // to a Google sign-in prompt rather than an empty page.
  const { session, signInWithGoogle } = useAuth();
  const { restaurants, loading: restaurantsLoading } = useRestaurants();
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    fetchVisits()
      .then((v) => { if (!cancelled) setVisits(v); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [session]);

  const thisYear = new Date().getFullYear().toString();
  const stats = useMemo(() => {
    if (!visits) return null;
    const yearVisits = visits.filter((v) => v.visited_on.startsWith(thisYear));
    const totalSpendCents = visits.reduce((sum, v) => sum + (v.spend_cents ?? 0), 0);
    const yearSpendCents = yearVisits.reduce((sum, v) => sum + (v.spend_cents ?? 0), 0);
    return {
      months: visitsByMonth(visits).slice(-12),
      cuisines: cuisineBreakdown(visits, restaurants),
      top: topRestaurants(visits, restaurants, 10),
      stale: staleLoved(visits, restaurants),
      yearCount: yearVisits.length,
      totalCount: visits.length,
      distinct: new Set(visits.map((v) => v.restaurant_id)).size,
      totalSpendCents,
      yearSpendCents,
    };
  }, [visits, restaurants, thisYear]);

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
        <header className="flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-900">Visit Stats</h1>
            <p className="font-sans text-xs italic text-stone-400">private — only you can see this</p>
          </div>
          <Link
            to="/"
            className="font-sans text-xs font-semibold text-brand-accent hover:text-brand-accent-hover underline underline-offset-2 transition-colors duration-150"
          >
            &larr; Map
          </Link>
        </header>

        {!session && (
          <div className={`${CARD_SURFACE} p-6 shadow-sm text-center`}>
            <p className="font-sans text-sm text-stone-500 mb-4">
              Stats reads the private visit log, which requires your Google sign-in.
            </p>
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="bg-brand-cta hover:bg-brand-cta-hover text-white font-sans text-sm font-bold rounded-lg px-6 py-2.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus"
            >
              Sign in with Google
            </button>
          </div>
        )}

        {session && error && (
          <div className={`${CARD_SURFACE} p-6 shadow-sm text-center`}>
            <p className="font-sans text-sm text-stone-500">Couldn't load visits: {error}</p>
          </div>
        )}

        {session && !error && (!stats || restaurantsLoading) && (
          <p className="font-sans text-sm text-stone-500 text-center py-8 animate-pulse">tallying the damage&hellip;</p>
        )}

        {session && stats && !restaurantsLoading && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Tile label={`visits in ${thisYear}`} value={String(stats.yearCount)} />
              <Tile label={`spend in ${thisYear}`} value={formatDollars(stats.yearSpendCents)} />
              <Tile label="visits all time" value={String(stats.totalCount)} />
              <Tile label="places visited" value={String(stats.distinct)} />
            </div>

            <Section title="By month">
              {stats.months.length === 0 ? (
                <p className="font-sans text-sm text-stone-500">No visits logged yet.</p>
              ) : (
                <table className="w-full font-sans text-sm">
                  <tbody>
                    {stats.months.map((m) => (
                      <tr key={m.month} className="border-b border-brand-border-light last:border-0">
                        <td className="py-1.5 text-stone-800">{formatMonth(m.month)}</td>
                        <td className="py-1.5 text-right text-stone-500">{m.count} visit{m.count === 1 ? '' : 's'}</td>
                        <td className="py-1.5 text-right text-stone-800 font-semibold w-28">
                          {m.spendCents > 0 ? formatDollars(m.spendCents) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            <Section title="By cuisine">
              {stats.cuisines.length === 0 ? (
                <p className="font-sans text-sm text-stone-500">No visits logged yet.</p>
              ) : (
                <table className="w-full font-sans text-sm">
                  <tbody>
                    {stats.cuisines.map((c) => (
                      <tr key={c.cuisine} className="border-b border-brand-border-light last:border-0">
                        <td className="py-1.5 text-stone-800">{c.cuisine}</td>
                        <td className="py-1.5 text-right text-stone-500">{c.count} visit{c.count === 1 ? '' : 's'}</td>
                        <td className="py-1.5 text-right text-stone-800 font-semibold w-28">
                          {c.spendCents > 0 ? formatDollars(c.spendCents) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            <Section title="Most visited">
              {stats.top.length === 0 ? (
                <p className="font-sans text-sm text-stone-500">No visits logged yet.</p>
              ) : (
                <table className="w-full font-sans text-sm">
                  <tbody>
                    {stats.top.map((r) => (
                      <tr key={r.restaurantId} className="border-b border-brand-border-light last:border-0">
                        <td className="py-1.5 text-stone-800">
                          <Link to={`/r/${r.restaurantId}`} className="hover:underline">{r.name}</Link>
                        </td>
                        <td className="py-1.5 text-right text-stone-500">{r.count}&times;</td>
                        <td className="py-1.5 text-right text-stone-500 w-28">{r.lastVisit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            <Section title="Loved, but it's been a while (6+ months)">
              {stats.stale.length === 0 ? (
                <p className="font-sans text-sm text-stone-500">You're keeping up with all your favorites. Respect.</p>
              ) : (
                <table className="w-full font-sans text-sm">
                  <tbody>
                    {stats.stale.map((e) => (
                      <tr key={e.restaurant.id} className="border-b border-brand-border-light last:border-0">
                        <td className="py-1.5 text-stone-800">
                          <Link to={`/r/${e.restaurant.id}`} className="hover:underline">{e.restaurant.name}</Link>
                        </td>
                        <td className="py-1.5 text-right text-stone-500">
                          {e.lastVisit ? `last: ${e.lastVisit}` : 'never logged'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
