import { AlertCircle, CheckCircle2, Settings2, X } from "lucide-react";
import type { ToastState } from "@/app-types";
import type { Locale } from "@/lib/copy";
import { translateMessage } from "@/lib/copy";

interface ToastRegionProps {
  locale: Locale;
  closeLabel: string;
  toast: ToastState | null;
  onClose: () => void;
}

export function ToastRegion({ locale, closeLabel, toast, onClose }: ToastRegionProps) {
  if (!toast) {
    return null;
  }

  return (
    <div className="toast-region" role="status" aria-live="polite">
      <div className="surface-card toast-card">
        <div className="status-card-icon">
          {toast.tone === "error" ? (
            <AlertCircle className="toast-icon toast-icon--error" />
          ) : toast.tone === "success" ? (
            <CheckCircle2 className="toast-icon toast-icon--success" />
          ) : (
            <Settings2 className="toast-icon" />
          )}
        </div>
        <p className="toast-message">{translateMessage(locale, toast.message)}</p>
        <button type="button" className="ghost-icon-button" onClick={onClose} aria-label={closeLabel}>
          <X className="ghost-icon-button__icon" />
        </button>
      </div>
    </div>
  );
}
