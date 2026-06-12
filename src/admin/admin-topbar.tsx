import { SiteHeader } from "../shared/site-header";
import { LogOut } from "lucide-react";

type AdminTopbarProps = {
  onLogout: () => void;
};

export function AdminTopbar({ onLogout }: AdminTopbarProps) {
  return (
    <SiteHeader
      actions={[
        { label: "Витрина", to: "/", variant: "primary" },
        { ariaLabel: "Выйти", icon: <LogOut size={16} />, onClick: onLogout, variant: "default" },
      ]}
    />
  );
}
