import { useState } from "react";
import type { Restaurant, Tier } from "../types";
import { formatPriceLevel } from "../utils/priceLevel";
import { BobbyPickBadge } from "./BobbyPickBadge";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onDismiss: () => void;
  onShareSuccess: () => void;
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

export function RestaurantCard({ restaurant, onDismiss, onShareSuccess }: RestaurantCardProps) {
  const [photoError, setPhotoError] = useState(false);

  async function handleShare(): Promise<void> {
    const url = `${window.location.origin}/r/${restaurant.id}`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    try {
      if (isMobile && navigator.share) {
        await navigator.share({ title: restaurant.name, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      onShareSuccess();
    } catch {
      // User cancelled share sheet or clipboard failed — ignore
    }
  }
  const tierClass = TIER_CLASSES[restaurant.tier] ?? "bg-gray-100 text-gray-800";
  const tierLabel = TIER_LABELS[restaurant.tier] ?? restaurant.tier;
  const formattedPrice = formatPriceLevel(restaurant.priceLevel);

  const photoUrl =
    restaurant.photoRef && !photoError
      ? `https://places.googleapis.com/v1/${restaurant.photoRef}/media?maxHeightPx=600&maxWidthPx=800&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      : undefined;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed z-40 bg-white shadow-lg bottom-0 left-0 right-0 rounded-t-2xl border-t border-stone-100 max-h-[70vh] overflow-y-auto md:max-h-none md:overflow-y-auto md:bottom-auto md:top-0 md:left-auto md:right-0 md:w-[360px] md:h-dvh md:rounded-none md:border-t-0 md:border-l md:border-stone-100"
    >
      {/* Spacer to push content below the fixed filter bar on desktop */}
      <div className="hidden md:block md:h-[120px] md:shrink-0" />
      {photoUrl && (
        <img
          src={photoUrl}
          alt={restaurant.name}
          loading="lazy"
          onError={() => setPhotoError(true)}
          className="w-full h-48 object-cover rounded-t-xl md:rounded-none"
        />
      )}

      {/* Drag handle (mobile only) + action buttons */}
      <div className="flex items-center px-5 pt-4 pb-2">
        <div className="mx-auto w-9 h-1 rounded-full bg-stone-200 md:hidden" />
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={handleShare}
            aria-label="Share restaurant"
            className="p-1.5 rounded-lg border border-stone-300 text-stone-500 bg-transparent hover:bg-stone-50 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 transition-colors duration-150"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.474l6.733-3.367A2.52 2.52 0 0 1 13 4.5Z" />
            </svg>
          </button>
          <button
            onClick={onDismiss}
            aria-label="Close restaurant card"
            className="p-1.5 rounded-lg border border-stone-300 text-stone-500 bg-transparent hover:bg-stone-50 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 transition-colors duration-150"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-5 pb-5">
        <h2 className="font-display text-[22px] font-bold text-stone-900 leading-tight">
          {restaurant.name}
        </h2>

        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tierClass}`}
        >
          {tierLabel}
        </span>

        {restaurant.featured && <div className="mt-1"><BobbyPickBadge /></div>}

        {(restaurant.rating != null || formattedPrice) && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            {restaurant.rating != null && (
              <span className="text-stone-700">
                {restaurant.rating.toFixed(1)}{" "}
                <span className="text-amber-500">★</span>
                {restaurant.userRatingCount != null && (
                  <span className="text-stone-400 ml-0.5">
                    ({restaurant.userRatingCount.toLocaleString()})
                  </span>
                )}
              </span>
            )}
            {restaurant.rating != null && formattedPrice && (
              <span className="text-stone-300">·</span>
            )}
            {formattedPrice && (
              <span className="text-stone-500 font-medium">{formattedPrice}</span>
            )}
          </div>
        )}

        <p className="mt-2 text-sm text-stone-500">{restaurant.cuisine}</p>

        {restaurant.notes && (
          <p className="mt-2 text-sm text-stone-500 italic">{restaurant.notes}</p>
        )}

        <a
          href={getSafeHref(restaurant.googleMapsUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full px-4 py-2 mt-4 rounded-md bg-amber-700 text-white text-sm font-medium hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 transition-colors"
        >
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}
