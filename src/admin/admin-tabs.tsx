import type { AdminTab } from "./admin-types";

type AdminTabItem = {
  key: AdminTab;
  label: string;
};

type AdminTabsProps = {
  tabs: AdminTabItem[];
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
};

export function AdminTabs({ tabs, activeTab, onSelectTab }: AdminTabsProps) {
  return (
    <div className="tabs">
      {tabs.map((item) => (
        <button
          key={item.key}
          type="button"
          className={item.key === activeTab ? "tab tab--active" : "tab"}
          onClick={() => onSelectTab(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
