import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type HeaderAction = {
  label?: string;
  ariaLabel?: string;
  icon?: ReactNode;
  to?: string;
  onClick?: () => void;
  variant?: "default" | "primary";
};

type SiteHeaderProps = {
  actions?: HeaderAction[];
};

export function SiteHeader({ actions = [] }: SiteHeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand" aria-label="Anton Shell">
          <img src="/logo_anton_shell.svg" alt="Anton Shell" className="brand-logo" />
        </Link>
        <div className="topbar-actions">
          {actions.map((action, index) => {
            const cls = `topbar-cta topbar-cta--${action.variant || "default"}`;
            if (action.to) {
              return (
                <Link
                  key={`${action.ariaLabel || action.label || "action"}-${index}`}
                  to={action.to}
                  className={cls}
                  aria-label={action.ariaLabel}
                  title={action.ariaLabel || action.label}
                >
                  {action.icon ? <span className="topbar-cta-icon">{action.icon}</span> : null}
                  {action.label}
                </Link>
              );
            }
            return (
              <button
                key={`${action.ariaLabel || action.label || "action"}-${index}`}
                type="button"
                className={cls}
                onClick={action.onClick}
                aria-label={action.ariaLabel}
                title={action.ariaLabel || action.label}
              >
                {action.icon ? <span className="topbar-cta-icon">{action.icon}</span> : null}
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
