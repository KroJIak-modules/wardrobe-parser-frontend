import { useEffect, useState, type RefObject } from "react";

export function useSiteDesignersActionsOffset({
  baseBottomOffset,
  actionsRef,
  stopSelector,
  stopGap = 0,
}: {
  baseBottomOffset: number;
  actionsRef: RefObject<HTMLElement>;
  stopSelector?: string;
  stopGap?: number;
}) {
  const [actionsBottomOffset, setActionsBottomOffset] = useState(baseBottomOffset);

  useEffect(() => {
    let frameId = 0;

    const updateActionsOffset = () => {
      let nextOffset = baseBottomOffset;
      const actionsNode = actionsRef.current;

      if (actionsNode && stopSelector) {
        const stopNodes = document.querySelectorAll<HTMLElement>(stopSelector);
        const stopNode = stopNodes.item(stopNodes.length - 1);

        if (stopNode) {
          const actionsHeight = actionsNode.getBoundingClientRect().height;
          const stopViewportTop = stopNode.getBoundingClientRect().bottom + stopGap;
          nextOffset = Math.max(nextOffset, window.innerHeight - actionsHeight - stopViewportTop);
        }
      }

      const footerNode = document.querySelector<HTMLElement>(".site-footer");
      if (footerNode) {
        const footerTop = footerNode.getBoundingClientRect().top;
        nextOffset = Math.max(nextOffset, window.innerHeight - footerTop + baseBottomOffset);
      }

      setActionsBottomOffset((current) => (current === nextOffset ? current : nextOffset));
    };

    const scheduleUpdate = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateActionsOffset();
      });
    };

    updateActionsOffset();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [actionsRef, baseBottomOffset, stopGap, stopSelector]);

  return actionsBottomOffset;
}
