import { useEffect } from "react";
import type { NavigateFunction } from "react-router-dom";
import type { AdminTab } from "../admin-types";

export function useAdminPageLifecycle(navigate: NavigateFunction, tab: AdminTab, tabParam?: string) {
  useEffect(() => {
    if (!tabParam || tabParam !== tab) {
      navigate(`/control/${tab}`, { replace: true });
    }
  }, [navigate, tab, tabParam]);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Панель управления | Anton Shell";
    return () => {
      document.title = prevTitle;
    };
  }, []);
}
