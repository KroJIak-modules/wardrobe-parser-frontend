import { useEffect, useMemo, useState } from "react";
import type { SiteNavItem } from "../features/storefront/site-storefront-contracts";
import { siteApiJson, type SiteApiNavigation } from "./site-public-api";
import type { SiteHeaderDropdownMenu } from "../features/header/site-header-data";
import { buildHrefFromTarget, buildSiteDesktopDropdownMenus, getSiteDesktopMenuItems } from "./site-desktop-navigation";

export function useSiteNavigation() {
  const [payload, setPayload] = useState<SiteApiNavigation | null>(null);

  useEffect(() => {
    let isDisposed = false;

    siteApiJson<SiteApiNavigation>("/site/navigation").then((navigation) => {
      if (isDisposed) {
        return;
      }

      setPayload(navigation);
    }).catch(() => {
      if (isDisposed) {
        return;
      }
      setPayload({
        top_sections: [],
        desktop_menus: {},
        mobile_menu: { root_groups: [] },
        catalog_contexts: { designers: [], custom_catalogs: [] },
      });
    });

    return () => {
      isDisposed = true;
    };
  }, []);

  const menuItems = useMemo<SiteNavItem[]>(() => [...getSiteDesktopMenuItems()], []);

  const dropdownMenus = useMemo<Record<string, SiteHeaderDropdownMenu>>(
    () => buildSiteDesktopDropdownMenus(payload),
    [payload],
  );

  return {
    payload,
    menuItems,
    dropdownMenus,
  };
}

export { buildHrefFromTarget };
