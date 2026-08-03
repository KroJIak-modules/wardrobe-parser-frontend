import { forwardRef, useEffect, useState, type CSSProperties, type ReactNode } from "react";

import "./site-mobile-drawer-shell.css";

/* The tablet window is a proportional presentation of the established 355×625
 * mobile dialog, with the Figma tablet target measured at 527×928. */
const MOBILE_DRAWER_REFERENCE = {
  width: 355,
  height: 625,
} as const;

const TABLET_DRAWER_REFERENCE = {
  width: 527,
  height: 928,
  inset: 23,
} as const;

const TABLET_DRAWER_SCALE = TABLET_DRAWER_REFERENCE.width / MOBILE_DRAWER_REFERENCE.width;

type SiteMobileDrawerShellProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  isClosing?: boolean;
  presentation?: "mobile" | "tablet";
  onClose: () => void;
  onCloseAnimationEnd?: () => void;
};

function getTabletDrawerScale() {
  const availableWidth = window.innerWidth - TABLET_DRAWER_REFERENCE.inset * 2;
  const availableHeight = window.innerHeight - TABLET_DRAWER_REFERENCE.inset * 2;

  return Math.min(
    TABLET_DRAWER_SCALE,
    availableWidth / MOBILE_DRAWER_REFERENCE.width,
    availableHeight / MOBILE_DRAWER_REFERENCE.height,
  );
}

export const SiteMobileDrawerShell = forwardRef<HTMLDivElement, SiteMobileDrawerShellProps>(
  function SiteMobileDrawerShell(
    {
      ariaLabel,
      children,
      className,
      isClosing = false,
      presentation = "mobile",
      onClose,
      onCloseAnimationEnd,
    },
    ref,
  ) {
    const [tabletScale, setTabletScale] = useState(() => (presentation === "tablet" ? getTabletDrawerScale() : 1));

    useEffect(() => {
      if (presentation !== "tablet") {
        setTabletScale(1);
        return;
      }

      const updateScale = () => setTabletScale(getTabletDrawerScale());
      updateScale();
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    }, [presentation]);

    useEffect(() => {
      const closeOnEscape = (event: KeyboardEvent) => {
        if (event.key !== "Escape" || isClosing) {
          return;
        }

        event.preventDefault();
        onClose();
      };

      window.addEventListener("keydown", closeOnEscape);
      return () => window.removeEventListener("keydown", closeOnEscape);
    }, [isClosing, onClose]);

    const drawerClassName = [
      "site-mobile-drawer-shell",
      `site-mobile-drawer-shell--${presentation}`,
      isClosing ? "site-mobile-drawer-shell--closing" : null,
    ]
      .filter(Boolean)
      .join(" ");
    const contentClassName = ["site-mobile-drawer-shell__content", className].filter(Boolean).join(" ");
    const drawerStyle = presentation === "tablet"
      ? ({ "--site-mobile-drawer-scale": tabletScale } as CSSProperties)
      : undefined;

    return (
      <>
        <button
          aria-label="Закрыть панель"
          className="site-mobile-drawer-shell__backdrop"
          onClick={onClose}
          type="button"
        />
        <div
          aria-label={ariaLabel}
          aria-modal="true"
          className={drawerClassName}
          onAnimationEnd={isClosing ? onCloseAnimationEnd : undefined}
          ref={ref}
          role="dialog"
          style={drawerStyle}
        >
          <div aria-hidden="true" className="site-mobile-drawer-shell__surface" />
          <div className={contentClassName}>{children}</div>
        </div>
      </>
    );
  },
);
