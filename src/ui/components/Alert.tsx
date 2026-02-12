import { useEffect } from 'react';

type AlertVariant = 'success' | 'error' | 'info' | 'warning';

type Props = {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  autoCloseMs?: number; // ej: 2500
  className?: string;
};

const styles: Record<AlertVariant, string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
};

export function Alert({
  variant = 'info',
  title,
  message,
  onClose,
  autoCloseMs,
  className = '',
}: Props) {
  useEffect(() => {
    if (!autoCloseMs || !onClose) return;
    const t = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(t);
  }, [autoCloseMs, onClose]);

  return (
    <div
      className={`rounded-xl border px-3 py-2 text-sm ${styles[variant]} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {title && <div className="font-semibold">{title}</div>}
          <div className="whitespace-pre-wrap wrap-break-word">{message}</div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs font-medium hover:bg-black/5"
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
