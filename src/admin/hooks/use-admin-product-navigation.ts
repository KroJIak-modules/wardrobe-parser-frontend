import type { KeyboardEvent, MouseEvent } from "react";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { ShowcaseProductNavigationState } from "../admin-showcase-layout";

export function useAdminProductNavigation() {
  const navigate = useNavigate();

  const openProductCard = useCallback((event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, productId: number) => {
    const href = `/product/${productId}`;
    const state: ShowcaseProductNavigationState = { fromControlPanel: true };
    if ("button" in event) {
      if (event.button === 1 || event.ctrlKey || event.metaKey) {
        event.preventDefault();
        // New tab cannot receive router state; open clean product URL.
        window.open(href, "_blank", "noreferrer");
        return;
      }
      if (event.button !== 0) {
        return;
      }
    }
    navigate(href, { state });
  }, [navigate]);

  return { openProductCard };
}
