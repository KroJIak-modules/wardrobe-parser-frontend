import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { AdminTab } from "./admin-types";
import "./admin-tabs.css";

type AdminTabItem = {
  key: AdminTab;
  label: string;
};

type AdminTabsProps = {
  tabs: AdminTabItem[];
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
};

export function AdminTabs({ tabs, activeTab, onSelectTab, isMobileMenuOpen, onCloseMobileMenu }: AdminTabsProps) {
  const [isClosing, setIsClosing] = useState(false);
  const isOpen = isMobileMenuOpen;

  const closeMenu = useCallback(() => {
    if (!isOpen || isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      onCloseMobileMenu();
      setIsClosing(false);
    }, 220);
  }, [isClosing, isOpen, onCloseMobileMenu]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, isOpen]);

  const selectTab = (tab: AdminTab) => {
    onSelectTab(tab);
    closeMenu();
  };

  return (
    <nav className="admin-tabs-navigation" aria-label="Разделы панели управления">
      <div className="tabs admin-tabs__desktop">
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

      {isOpen ? (
        <div className={`admin-tabs__mobile-layer${isClosing ? " admin-tabs__mobile-layer--closing" : ""}`}>
          <button type="button" className="admin-tabs__backdrop" aria-label="Закрыть меню разделов" onClick={closeMenu} />
          <aside className="admin-tabs__drawer" aria-label="Разделы панели управления">
            <div className="admin-tabs__drawer-head">
              <div>
                <span className="admin-tabs__drawer-eyebrow">Панель управления</span>
                <strong>Разделы</strong>
              </div>
              <button type="button" className="admin-tabs__close" aria-label="Закрыть меню разделов" onClick={closeMenu}>
                <X size={21} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
            <div className="admin-tabs__drawer-list">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={item.key === activeTab ? "admin-tabs__drawer-item admin-tabs__drawer-item--active" : "admin-tabs__drawer-item"}
                  onClick={() => selectTab(item.key)}
                >
                  <span>{item.label}</span>
                  {item.key === activeTab ? <span className="admin-tabs__drawer-check" aria-hidden="true" /> : null}
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </nav>
  );
}
