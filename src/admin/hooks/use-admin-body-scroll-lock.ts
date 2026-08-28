import { useEffect } from "react";

export function useAdminBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) {
      return undefined;
    }
    // The admin layout scrolls on the document element, so locking only the
    // body leaves the page scrollable behind an open modal.
    const targets = [document.documentElement, document.body];
    const previous = targets.map((element) => element.style.overflow);
    targets.forEach((element) => {
      element.style.overflow = "hidden";
    });
    return () => {
      targets.forEach((element, index) => {
        element.style.overflow = previous[index];
      });
    };
  }, [isLocked]);
}
