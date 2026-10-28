import { useEffect } from "react";

export function ErrorComponent({ message, onClose, duration = 2500 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50
                 flex items-center gap-3 max-w-md w-[90%]
                 bg-white border border-[#F0C9BB] rounded-xl shadow-lg
                 px-4 py-3 animate-[fadeIn_0.2s_ease-out]"
    >
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D97757]/15 text-[#D97757]
                        flex items-center justify-center text-xs font-bold">
        !
      </span>
      <p className="text-sm text-[#44413A]">{message}</p>
    </div>
  );
}