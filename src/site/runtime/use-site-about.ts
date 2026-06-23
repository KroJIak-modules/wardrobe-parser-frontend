import { useMemo } from "react";
import {
  buildSiteAboutTextPanelViewModel,
  siteAboutMockPayload,
  type SiteAboutTextPanelViewModel,
} from "./site-about-mock";

export function useSiteAbout() {
  const textPanels = useMemo<readonly SiteAboutTextPanelViewModel[]>(
    () => siteAboutMockPayload.textPanels.map(buildSiteAboutTextPanelViewModel),
    [],
  );

  return {
    title: siteAboutMockPayload.title,
    photoSlides: siteAboutMockPayload.photoSlides,
    textPanels,
    isEmpty: siteAboutMockPayload.photoSlides.length === 0 && textPanels.every((panel) => panel.displayText === ""),
  };
}
