import type { ReactNode } from "react";
import { IconInfo } from "./mono-icons";

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  compact?: boolean;
};

export function EmptyState({ title, subtitle, action, compact = false }: Props) {
  return (
    <div className={compact ? "empty-state empty-state--compact" : "empty-state"} role="status" aria-live="polite">
      <div className="empty-state__icon-wrap" aria-hidden="true">
        <IconInfo className="icon-svg empty-state__icon" />
      </div>
      <p className="empty-state__title">{title}</p>
      {subtitle ? <p className="empty-state__subtitle">{subtitle}</p> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
