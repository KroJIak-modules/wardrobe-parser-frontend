import { SiteHeader } from "../shared/site-header";
import { LogOut, Menu } from "lucide-react";

type AdminTopbarProps = {
  onLogout: () => void;
  onOpenMobileMenu: () => void;
};

export function AdminTopbar({ onLogout, onOpenMobileMenu }: AdminTopbarProps) {
  return (
    <SiteHeader
      leadingAction={
        <button type="button" className="admin-mobile-menu-trigger" aria-label="Открыть разделы панели" onClick={onOpenMobileMenu}>
          <Menu size={22} strokeWidth={2} aria-hidden="true" />
        </button>
      }
      actions={[
        { label: "Витрина", to: "/", variant: "primary" },
        { ariaLabel: "Выйти", icon: <LogOut size={16} />, onClick: onLogout, variant: "default" },
      ]}
    />
  );
}
