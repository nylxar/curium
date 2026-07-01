import { useEffect, useCallback } from "react";
import { gsap } from "gsap";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const overlayRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    gsap.fromTo(node, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" });
  }, []);

  const panelRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    gsap.fromTo(node, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.15, ease: "power2.out" });
  }, []);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
  }, [onCancel]);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="confirm-overlay"
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        className="confirm-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-title">{title}</div>
        <div className="confirm-message">{message}</div>
        <div className="confirm-actions">
          <button className="btn" onClick={onCancel}>{cancelLabel}</button>
          <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
