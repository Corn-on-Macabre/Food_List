import { BTN_PRIMARY } from './styles';

interface Props {
  onClick: () => void;
}

export function SuggestButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Suggest a restaurant"
      className={`${BTN_PRIMARY} fixed bottom-4 right-4 z-10 rounded-full px-4 py-2.5 shadow-lg`}
    >
      Suggest a Restaurant
    </button>
  );
}
