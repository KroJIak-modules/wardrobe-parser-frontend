import { forwardRef, type ReactNode } from "react";

import "./site-mobile-drawer-shell.css";

type SiteMobileDrawerShellProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  isClosing?: boolean;
  onClose: () => void;
  onCloseAnimationEnd?: () => void;
};

export const SiteMobileDrawerShell = forwardRef<HTMLDivElement, SiteMobileDrawerShellProps>(
  function SiteMobileDrawerShell(
    {
      ariaLabel,
      children,
      className,
      isClosing = false,
      onClose,
      onCloseAnimationEnd,
    },
    ref,
  ) {
    const drawerClassName = [
      "site-mobile-drawer-shell",
      isClosing ? "site-mobile-drawer-shell--closing" : null,
      className,
    ]
      .filter(Boolean)
      .join(" ");

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
        >
          <div aria-hidden="true" className="site-mobile-drawer-shell__surface" />
          {children}
        </div>
      </>
    );
  },
);
