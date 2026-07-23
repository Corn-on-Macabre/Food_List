import { useSyncExternalStore, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'food-list-theme';
const THEME_COLORS: Record<Theme, string> = { light: '#F4F2EE', dark: '#191316' };

const listeners = new Set<() => void>();

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null; // storage unavailable (private mode) — fall back to system
  }
}

function resolveTheme(): Theme {
  return storedTheme() ?? (systemPrefersDark() ? 'dark' : 'light');
}

let current: Theme = resolveTheme();

function apply(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  // After an explicit choice, the media-scoped theme-color metas from
  // index.html no longer apply — collapse them to the chosen color.
  document.querySelectorAll('meta[name="theme-color"]').forEach((el) => {
    el.setAttribute('content', THEME_COLORS[theme]);
    el.removeAttribute('media');
  });
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function setTheme(theme: Theme): void {
  current = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage unavailable — theme still applies for this session
  }
  apply(theme);
  notify();
}

// Follow OS preference changes only while the user hasn't chosen explicitly
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (storedTheme() !== null) return;
    current = e.matches ? 'dark' : 'light';
    apply(current);
    notify();
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

interface UseThemeResult {
  theme: Theme;
  toggleTheme: () => void;
}

export function useTheme(): UseThemeResult {
  const theme = useSyncExternalStore(
    subscribe,
    () => current,
    () => 'light' as Theme,
  );
  const toggleTheme = useCallback(() => {
    setTheme(current === 'dark' ? 'light' : 'dark');
  }, []);
  return { theme, toggleTheme };
}
