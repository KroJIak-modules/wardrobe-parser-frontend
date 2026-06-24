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
