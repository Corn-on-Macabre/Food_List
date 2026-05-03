import { useEffect } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, visible, onHide }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onHide, 2500);
    return () => clearTimeout(timer);
  }, [visible, onHide]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed z-50 px-4 py-2 rounded-lg bg-stone-800 text-white text-sm font-medium shadow-lg transition-opacity duration-300 bottom-[calc(70vh+1rem)] left-1/2 -translate-x-1/2 md:bottom-6 md:right-6 md:left-auto md:translate-x-0 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {message}
    </div>
  );
}
