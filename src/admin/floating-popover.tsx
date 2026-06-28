import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

export function FloatingPopover({
  anchorRef,
  open,
  className,
  onClose,
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  className: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) {
        return;
      }
      const margin = 12;
      const offset = 8;
      const anchorRect = anchor.getBoundingClientRect();
      const popoverWidth = Math.min(popoverRef.current?.offsetWidth ?? 320, window.innerWidth - margin * 2);
      const popoverHeight = popoverRef.current?.offsetHeight ?? 144;
      const left = Math.min(
        Math.max(margin, anchorRect.right - popoverWidth),
        Math.max(margin, window.innerWidth - popoverWidth - margin),
      );
      const fitsBelow = anchorRect.bottom + offset + popoverHeight <= window.innerHeight - margin;
      const top = fitsBelow
        ? anchorRect.bottom + offset
        : Math.max(margin, anchorRect.top - popoverHeight - offset);
      setPosition({ top, left });
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (anchorRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const firstFrame = window.requestAnimationFrame(updatePosition);
    const secondFrame = window.requestAnimationFrame(updatePosition);

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={popoverRef}
      className={className}
      role="dialog"
      aria-modal="false"
      style={
        position
          ? { top: `${position.top}px`, left: `${position.left}px`, visibility: "visible" }
          : { top: "0", left: "0", visibility: "hidden" }
      }
    >
      {children}
    </div>,
    document.body,
  );
}
