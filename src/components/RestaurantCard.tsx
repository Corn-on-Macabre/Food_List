import { useState } from "react";
import type { Restaurant } from "../types";
import { formatPriceLevel } from "../utils/priceLevel";
import { isOpenNow, localNowMinutes, todayHours, metroTimezone } from "../utils/openNow";
import { splitNotes, formatVisitDate } from "../utils/visitNotes";
import { BobbyPickBadge } from "./BobbyPickBadge";
import { TierBadge } from "./TierBadge";
import { BTN_ICON, BTN_PRIMARY } from "./styles";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onDismiss: () => void;
  onShareSuccess: () => void;
  filterBarHeight: number;
}

// Guard against javascript: protocol injection — only allow http(s) URLs
function getSafeHref(url: string): string {
  return url.startsWith("http://") || url.startsWith("https://") ? url : "#";
}

export function RestaurantCard({ restaurant, onDismiss, onShareSuccess, filterBarHeight }: RestaurantCardProps) {
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
  const formattedPrice = formatPriceLevel(restaurant.priceLevel);

  const timezone = metroTimezone(restaurant.city);
  const openNow = restaurant.openingHours
    ? isOpenNow(restaurant.openingHours, localNowMinutes(timezone))
    : null;
  const hoursToday = todayHours(restaurant.openingHours, timezone);
  const { note, visits } = splitNotes(restaurant.notes);

  const photoUrl =
    restaurant.photoRef && !photoError
      ? `https://places.googleapis.com/v1/${restaurant.photoRef}/media?maxHeightPx=1200&maxWidthPx=1600&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      : undefined;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed z-40 bg-white shadow-lg animate-card-in md:animate-panel-in motion-reduce:animate-none bottom-0 left-0 right-0 rounded-t-2xl border-t border-brand-border-light max-h-[70vh] overflow-y-auto md:max-h-none md:overflow-y-auto md:bottom-auto md:top-0 md:left-auto md:right-0 md:w-[360px] md:h-dvh md:rounded-none md:border-t-0 md:border-l md:border-brand-border-light"
    >
      {/* Spacer to push content below the fixed filter bar on desktop */}
      <div className="hidden md:block md:shrink-0" style={{ height: filterBarHeight }} />
      {photoUrl && (
        <div className="relative">
          <img
            src={photoUrl}
            alt={restaurant.name}
            loading="lazy"
            onError={() => setPhotoError(true)}
            className="w-full aspect-[16/10] object-cover rounded-t-2xl md:rounded-none"
          />
          {/* Soft top scrim keeps the overlaid controls legible on busy photos */}
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-16 rounded-t-2xl md:rounded-none bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
          <div className="absolute top-3 left-0 right-0 mx-auto w-9 h-1 rounded-full bg-white/70 md:hidden" />
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={handleShare}
              aria-label="Share restaurant"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm shadow-md text-stone-600 hover:text-brand-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.474l6.733-3.367A2.52 2.52 0 0 1 13 4.5Z" />
              </svg>
            </button>
            <button
              onClick={onDismiss}
              aria-label="Close restaurant card"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm shadow-md text-stone-600 hover:text-stone-900 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* No photo: drag handle (mobile only) + action buttons in a header row */}
      {!photoUrl && (
      <div className="flex items-center px-5 pt-4 pb-2">
        <div className="mx-auto w-9 h-1 rounded-full bg-stone-200 md:hidden" />
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={handleShare}
            aria-label="Share restaurant"
            className={`${BTN_ICON} hover:text-brand-accent`}
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
            className={BTN_ICON}
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
      )}

      <div className={photoUrl ? "px-5 pt-4 pb-5" : "px-5 pb-5"}>
        <h2 className="font-display text-[22px] font-bold text-stone-900 leading-tight">
          {restaurant.name}
        </h2>

        <div className="mt-1">
          <TierBadge tier={restaurant.tier} />
        </div>

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

        {openNow !== null && (
          <div className="mt-2 text-sm">
            <span className={openNow ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
              {openNow ? "Open now" : "Closed"}
            </span>
            {hoursToday && (
              <span className="text-stone-500"> &middot; {hoursToday.replace(/^[A-Za-z]+: /, "")} today</span>
            )}
            {restaurant.openingHours && restaurant.openingHours.weekdayDescriptions.length === 7 && (
              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-stone-400 hover:text-stone-600 select-none">
                  All hours
                </summary>
                <ul className="mt-1 space-y-0.5 text-xs text-stone-500">
                  {restaurant.openingHours.weekdayDescriptions.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {restaurant.address && (
          <p className="mt-2 text-xs text-stone-400">{restaurant.address}</p>
        )}

        {(restaurant.phone || restaurant.website) && (
          <div className="mt-1 flex items-center gap-3 text-xs">
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone.replace(/[^+\d]/g, "")}`} className="text-brand-accent hover:text-brand-accent-hover underline underline-offset-2">
                {restaurant.phone}
              </a>
            )}
            {restaurant.website && (
              <a
                href={getSafeHref(restaurant.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-accent hover:text-brand-accent-hover underline underline-offset-2 truncate max-w-[180px]"
              >
                {restaurant.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              </a>
            )}
          </div>
        )}

        {restaurant.tags && restaurant.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {restaurant.tags.map((tag) => (
              <span key={tag} className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                {tag}
              </span>
            ))}
          </div>
        )}

        {restaurant.dishes && restaurant.dishes.length > 0 && (
          <div className="mt-2.5">
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400">
              Get the
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {restaurant.dishes.map((dish) => (
                <span
                  key={dish}
                  className="inline-block rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800"
                >
                  {dish}
                </span>
              ))}
            </div>
          </div>
        )}

        {restaurant.suggested_by && (
          <div className="mt-2 flex items-center gap-1.5">
            {restaurant.suggested_by_avatar ? (
              <img
                src={restaurant.suggested_by_avatar}
                alt=""
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-200 text-stone-500 text-xs font-bold">
                {restaurant.suggested_by.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-xs text-stone-400">
              Suggested by {restaurant.suggested_by}
            </span>
          </div>
        )}

        {(note || visits.length > 0) && (
          <div className="mt-3 pt-3 border-t border-brand-border-light">
            {note && (
              <>
                <p className="text-sm text-stone-500 italic leading-relaxed">
                  <span
                    aria-hidden="true"
                    className="font-display text-2xl text-brand-chip/50 leading-none align-[-0.3em] mr-1"
                  >
                    &ldquo;
                  </span>
                  {note}
                </p>
                <p className="mt-1 font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400">
                  &mdash; Bobby
                </p>
              </>
            )}
            {visits.length > 0 && (
              <div className={note ? "mt-3 space-y-2.5" : "space-y-2.5"}>
                {visits.map((visit) => (
                  <div key={`${visit.date}-${visit.text.slice(0, 20)}`} className="flex items-baseline gap-2">
                    <span className="shrink-0 font-sans text-[11px] font-bold uppercase tracking-wide text-amber-700">
                      {formatVisitDate(visit.date)}
                    </span>
                    <p className="text-sm text-stone-500 leading-relaxed">{visit.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {restaurant.source && !restaurant.suggested_by && (
          <p className="mt-2 text-xs text-stone-400">
            Source: {restaurant.source}
          </p>
        )}
        {restaurant.source && restaurant.suggested_by && (
          <p className="mt-1 text-xs text-stone-400">
            via {restaurant.source}
          </p>
        )}

        <a
          href={getSafeHref(restaurant.googleMapsUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${BTN_PRIMARY} w-full px-4 py-2.5 mt-4`}
        >
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}
