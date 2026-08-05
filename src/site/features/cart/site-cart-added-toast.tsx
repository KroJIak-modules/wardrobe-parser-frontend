import { useEffect, useRef, useState } from "react";
import { resolveSitePublicAssetUrl } from "../../app/site-public-asset";
import { useSiteBackdropTone } from "../../runtime/use-site-backdrop-tone";
import {
  SITE_CART_ITEM_ADDED_EVENT,
  SITE_CART_ITEM_UNAVAILABLE_EVENT,
  type SiteCartItemAddedDetail,
  type SiteCartItemUnavailableDetail,
} from "../../runtime/use-site-cart";
import "./site-cart-added-toast.css";

const TOAST_VISIBLE_DURATION_MS = 2_800;
const TOAST_EXIT_DURATION_MS = 260;
const TOAST_ICONS = {
  added: resolveSitePublicAssetUrl("/site-mock/cart-added/confirmation.svg"),
  unavailable: resolveSitePublicAssetUrl("/site-mock/cart-added/unavailable.svg"),
} as const;

type ToastKind = keyof typeof TOAST_ICONS;
type ToastPhase = "enter" | "visible" | "exit";
type Toast = { id: number; kind: ToastKind; label: string; phase: ToastPhase; backdropImageSrc: string | null };

export function SiteCartAddedToast() {
  const toastRef = useRef<HTMLDivElement | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const tone = useSiteBackdropTone(toastRef, toast !== null, toast?.backdropImageSrc ?? null);
  const exitTimerRef = useRef<number | null>(null);
  const removeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
      if (removeTimerRef.current !== null) window.clearTimeout(removeTimerRef.current);
    };
    const show = (kind: ToastKind, label: string, backdropImageSrc: string | null) => {
      clearTimers();
      const id = Date.now();
      setToast({ id, kind, label, phase: "enter", backdropImageSrc });
      window.requestAnimationFrame(() => setToast((current) => current?.id === id ? { ...current, phase: "visible" } : current));
      exitTimerRef.current = window.setTimeout(() => {
        setToast((current) => current?.id === id ? { ...current, phase: "exit" } : current);
        removeTimerRef.current = window.setTimeout(() => setToast((current) => current?.id === id ? null : current), TOAST_EXIT_DURATION_MS);
      }, TOAST_VISIBLE_DURATION_MS);
    };
    const showAdded = (event: Event) => {
      const detail = (event as CustomEvent<SiteCartItemAddedDetail>).detail;
      show("added", "Добавлено в корзину", detail?.backdropImageSrc ?? null);
    };
    const showUnavailable = (event: Event) => {
      const detail = (event as CustomEvent<SiteCartItemUnavailableDetail>).detail;
      const count = detail?.itemNames.length ?? 0;
      show("unavailable", count > 1 ? "Товары больше недоступны" : "Товар больше недоступен", null);
    };
    window.addEventListener(SITE_CART_ITEM_ADDED_EVENT, showAdded);
    window.addEventListener(SITE_CART_ITEM_UNAVAILABLE_EVENT, showUnavailable);
    return () => {
      clearTimers();
      window.removeEventListener(SITE_CART_ITEM_ADDED_EVENT, showAdded);
      window.removeEventListener(SITE_CART_ITEM_UNAVAILABLE_EVENT, showUnavailable);
    };
  }, []);

  if (toast === null) return null;
  return (
    <div ref={toastRef} className={`site-cart-added-toast site-cart-added-toast--${toast.phase} site-cart-added-toast--${toast.kind}`} data-tone={toast.kind === "unavailable" ? "light" : tone} role="status" aria-live="polite">
      <img className="site-cart-added-toast__icon" src={TOAST_ICONS[toast.kind]} alt="" aria-hidden="true" />
      <span className="site-cart-added-toast__label">{toast.label}</span>
    </div>
  );
}
