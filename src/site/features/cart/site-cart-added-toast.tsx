import { useEffect, useRef, useState } from "react";
import { resolveSitePublicAssetUrl } from "../../app/site-public-asset";
import { useSiteBackdropTone } from "../../runtime/use-site-backdrop-tone";
import { SITE_CART_ITEM_ADDED_EVENT, type SiteCartItemAddedDetail } from "../../runtime/use-site-cart";
import "./site-cart-added-toast.css";

const TOAST_VISIBLE_DURATION_MS = 2_800;
const TOAST_EXIT_DURATION_MS = 260;
const TOAST_ICON_URL = resolveSitePublicAssetUrl("/site-mock/cart-added/confirmation.svg");

type ToastPhase = "enter" | "visible" | "exit";

export function SiteCartAddedToast() {
  const toastRef = useRef<HTMLDivElement | null>(null);
  const [toast, setToast] = useState<{ id: number; phase: ToastPhase; backdropImageSrc: string | null } | null>(null);
  const tone = useSiteBackdropTone(toastRef, toast !== null, toast?.backdropImageSrc ?? null);
  const exitTimerRef = useRef<number | null>(null);
  const removeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
      if (removeTimerRef.current !== null) {
        window.clearTimeout(removeTimerRef.current);
      }
    };

    const showToast = (event: Event) => {
      clearTimers();
      const detail = (event as CustomEvent<SiteCartItemAddedDetail>).detail;
      const id = Date.now();
      setToast({ id, phase: "enter", backdropImageSrc: detail?.backdropImageSrc ?? null });
      window.requestAnimationFrame(() => {
        setToast((current) => (current?.id === id ? { ...current, phase: "visible" } : current));
      });
      exitTimerRef.current = window.setTimeout(() => {
        setToast((current) => (current?.id === id ? { ...current, phase: "exit" } : current));
        removeTimerRef.current = window.setTimeout(() => {
          setToast((current) => (current?.id === id ? null : current));
        }, TOAST_EXIT_DURATION_MS);
      }, TOAST_VISIBLE_DURATION_MS);
    };

    window.addEventListener(SITE_CART_ITEM_ADDED_EVENT, showToast);
    return () => {
      clearTimers();
      window.removeEventListener(SITE_CART_ITEM_ADDED_EVENT, showToast);
    };
  }, []);

  if (toast === null) {
    return null;
  }

  return (
    <div ref={toastRef} className={`site-cart-added-toast site-cart-added-toast--${toast.phase}`} data-tone={tone} role="status" aria-live="polite">
      <img className="site-cart-added-toast__icon" src={TOAST_ICON_URL} alt="" aria-hidden="true" />
      <span className="site-cart-added-toast__label">Добавлено в корзину</span>
    </div>
  );
}
