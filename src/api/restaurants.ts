import type { Restaurant } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function authHeaders(password: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${password}`,
  };
}

export async function fetchAllRestaurants(password: string): Promise<Restaurant[]> {
  const res = await fetch(`${API_BASE}/restaurants`, { headers: authHeaders(password) });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json() as Promise<Restaurant[]>;
}

export async function addRestaurant(password: string, restaurant: Restaurant): Promise<Restaurant> {
  const res = await fetch(`${API_BASE}/restaurants`, {
    method: 'POST',
    headers: authHeaders(password),
    body: JSON.stringify(restaurant),
  });
  if (!res.ok) throw new Error(`Failed to add: ${res.status}`);
  return res.json() as Promise<Restaurant>;
}

export async function updateRestaurant(password: string, id: string, changes: Partial<Restaurant>): Promise<Restaurant> {
  const res = await fetch(`${API_BASE}/restaurants/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: authHeaders(password),
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error(`Failed to update: ${res.status}`);
  return res.json() as Promise<Restaurant>;
}

export async function deleteRestaurant(password: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/restaurants/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(password),
  });
  if (!res.ok) throw new Error(`Failed to delete: ${res.status}`);
}
