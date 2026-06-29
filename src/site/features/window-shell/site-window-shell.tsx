import { resolveSitePublicAssetUrl } from "../../app/site-public-asset";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import "./site-window-shell.css";

type SiteWindowShellProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  frameClassName?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function SiteWindowShell<T extends ElementType = "div">({
  as,
  children,
  className = "",
  frameClassName = "",
  ...restProps
}: SiteWindowShellProps<T>) {
  const Component = as ?? "div";

  return (
    <Component className={`site-window-shell${className ? ` ${className}` : ""}`.trim()} {...restProps}>
      <div className={`site-window-shell__frame${frameClassName ? ` ${frameClassName}` : ""}`.trim()}>{children}</div>
    </Component>
  );
}

export function SiteWindowTitlebar({
  title,
  titleId,
  className = "",
  titleClassName = "",
  closeButton,
}: {
  title: ReactNode;
  titleId?: string;
  className?: string;
  titleClassName?: string;
  closeButton?: ReactNode;
}) {
  return (
    <div className={`site-window-titlebar${className ? ` ${className}` : ""}`.trim()}>
      <p id={titleId} className={`site-window-titlebar__label${titleClassName ? ` ${titleClassName}` : ""}`.trim()}>
        {title}
      </p>
      {closeButton}
    </div>
  );
}

export function SiteWindowCloseButton({
  onClick,
  ariaLabel,
  className = "",
  iconSrc = "/site-mock/product-detail/sources-modal/close-icon.svg",
  rotateIcon = true,
}: {
  onClick: () => void;
  ariaLabel: string;
  className?: string;
  iconSrc?: string;
  rotateIcon?: boolean;
}) {
  return (
    <button
      type="button"
      className={`site-window-titlebar__close${className ? ` ${className}` : ""}`.trim()}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <img
        src={resolveSitePublicAssetUrl(iconSrc)}
        alt=""
        aria-hidden="true"
        className={
          rotateIcon
            ? "site-window-titlebar__close-icon site-window-titlebar__close-icon--rotated"
            : "site-window-titlebar__close-icon"
        }
      />
    </button>
  );
}
