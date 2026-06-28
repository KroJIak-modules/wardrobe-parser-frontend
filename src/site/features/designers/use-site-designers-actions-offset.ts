import { useEffect, useState } from "react";

export function useSiteDesignersActionsOffset(baseBottomOffset: number) {
  const [actionsBottomOffset, setActionsBottomOffset] = useState(baseBottomOffset);

  useEffect(() => {
    let frameId = 0;

    const updateActionsOffset = () => {
      const footerNode = document.querySelector<HTMLElement>(".site-footer");
      if (!footerNode) {
        return;
      }

      const footerTop = footerNode.getBoundingClientRect().top;
      const nextOffset = Math.max(baseBottomOffset, window.innerHeight - footerTop + baseBottomOffset);
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
  }, [baseBottomOffset]);

  return actionsBottomOffset;
}
