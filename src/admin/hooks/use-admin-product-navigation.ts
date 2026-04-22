import type { KeyboardEvent, MouseEvent } from "react";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useAdminProductNavigation() {
  const navigate = useNavigate();

  const openProductCard = useCallback((event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, productId: number) => {
    const href = `/product/${productId}?from=admin`;
    if ("button" in event) {
      if (event.button === 1 || event.ctrlKey || event.metaKey) {
        event.preventDefault();
        window.open(href, "_blank", "noreferrer");
        return;
      }
      if (event.button !== 0) {
        return;
      }
    }
    navigate(href);
  }, [navigate]);

  return { openProductCard };
}
