import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { readAdminProductsReturnState } from "./admin-products-return-state";

const positions = new Map<string, number>();
const MAX_POSITIONS = 100;

export function saveAdminRouteScroll(key: string, scrollY: number): void {
  if (!key || !Number.isFinite(scrollY)) return;
  positions.delete(key);
  positions.set(key, Math.max(0, scrollY));
  if (positions.size > MAX_POSITIONS) {
    const oldest = positions.keys().next().value;
    if (oldest) positions.delete(oldest);
  }
}

export function AdminRouteScroll() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousPath = useRef<string | null>(null);

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    const pathChanged = previousPath.current !== null && previousPath.current !== location.pathname;
    previousPath.current = location.pathname;

    // The control-panel table has its own restoration for incrementally loaded rows.
    const returnState = location.pathname === "/control/products" ? readAdminProductsReturnState() : null;
    const tableWillRestore = returnState?.pending
      && returnState.href === `${location.pathname}${location.search}`;
    if (navigationType === "POP" && !tableWillRestore) {
      const saved = positions.get(location.key);
      if (saved !== undefined) window.scrollTo({ top: saved, left: 0, behavior: "instant" });
      else if (pathChanged) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } else if (pathChanged && !tableWillRestore) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    const save = () => saveAdminRouteScroll(location.key, window.scrollY);
    window.addEventListener("scroll", save, { passive: true });
    return () => {
      window.removeEventListener("scroll", save);
    };
  }, [location.key, location.pathname, navigationType]);

  return null;
}
