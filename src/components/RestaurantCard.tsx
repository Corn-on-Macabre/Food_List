import type { Restaurant, Tier } from "../types";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const TIER_LABELS: Record<Tier, string> = {
  loved: "Loved",
  recommended: "Recommended",
  on_my_radar: "On My Radar",
};

const TIER_CLASSES: Record<Tier, string> = {
  loved: "bg-amber-100 text-amber-800",
  recommended: "bg-blue-100 text-blue-800",
  on_my_radar: "bg-emerald-100 text-emerald-800",
};

// Guard against javascript: protocol injection — only allow http(s) URLs
function getSafeHref(url: string): string {
  return url.startsWith("http://") || url.startsWith("https://") ? url : "#";
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const tierClass = TIER_CLASSES[restaurant.tier] ?? "bg-gray-100 text-gray-800";
  const tierLabel = TIER_LABELS[restaurant.tier] ?? restaurant.tier;

  return (
    <div className="rounded-lg bg-white p-4 shadow-md">
      <h2 className="text-lg font-semibold text-gray-900">{restaurant.name}</h2>

      <span
        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tierClass}`}
      >
        {tierLabel}
      </span>

      <p className="mt-2 text-sm text-gray-600">{restaurant.cuisine}</p>

      {restaurant.notes && (
        <p className="mt-2 text-sm text-gray-500">{restaurant.notes}</p>
      )}

      <a
        href={getSafeHref(restaurant.googleMapsUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full px-4 py-2 mt-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Open in Google Maps
      </a>
    </div>
  );
}
