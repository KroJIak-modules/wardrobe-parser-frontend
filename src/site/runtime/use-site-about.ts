import { useMemo } from "react";
import {
  buildSiteAboutTextPanelViewModel,
  siteAboutMockPayload,
  type SiteAboutTextPanelViewModel,
} from "./site-about-mock";

export function useSiteAbout() {
  const textPanel = useMemo<SiteAboutTextPanelViewModel | null>(
    () => (siteAboutMockPayload.textPanel ? buildSiteAboutTextPanelViewModel(siteAboutMockPayload.textPanel) : null),
    [],
  );

  return {
    title: siteAboutMockPayload.title,
    photoSlides: siteAboutMockPayload.photoSlides,
    textPanel,
    isEmpty: siteAboutMockPayload.photoSlides.length === 0 && (!textPanel || textPanel.displayText === ""),
  };
}
