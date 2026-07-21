import { useNavigate } from 'react-router-dom';
import { shareUrl } from '../utils/share';

interface CollectionBannerProps {
  title: string;
  blurb?: string | null;
  count: number;
  onShareSuccess: () => void;
}

/**
 * Header strip for collection mode (/c/:slug) — rendered inside the fixed
 * filter-bar wrapper so the ResizeObserver height logic accounts for it.
 */
export function CollectionBanner({ title, blurb, count, onShareSuccess }: CollectionBannerProps) {
  const navigate = useNavigate();

  const handleShare = () => {
    void shareUrl(title, window.location.href).then((ok) => {
      if (ok) onShareSuccess();
    });
  };

  return (
    <div className="flex items-start justify-between gap-3 px-4 py-2 border-t border-brand-border-light">
      <div className="min-w-0">
        <p className="font-display text-sm font-bold text-stone-900">
          {title}{' '}
          <span className="font-sans text-xs font-normal text-stone-400">
            &middot; {count} spot{count === 1 ? '' : 's'}
          </span>
        </p>
        {blurb && <p className="font-sans text-xs italic text-stone-500">{blurb}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleShare}
          aria-label="Share this collection"
          className="text-xs font-sans font-semibold text-brand-accent hover:text-brand-accent-hover underline underline-offset-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta rounded"
        >
          Share
        </button>
        <button
          onClick={() => navigate('/')}
          aria-label="Close collection"
          className="text-sm font-sans font-semibold text-stone-400 hover:text-stone-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta rounded leading-none"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
