import type { SiteCarouselSlide } from "../features/storefront/site-storefront-contracts";

export const SITE_ABOUT_TEXT_MAX_LENGTH = 760;

export type SiteAboutTextPanel = {
  id: string;
  rawText: string;
  maxLength?: number;
};

export type SiteAboutPayload = {
  title: string;
  photoSlides: readonly SiteCarouselSlide[];
  textPanel: SiteAboutTextPanel | null;
};

export type SiteAboutTextPanelViewModel = {
  id: string;
  displayText: string;
  maxLength: number;
  paragraphs: readonly string[];
};

function normalizeTextForAbout(rawText: string, maxLength: number) {
  return rawText.trim().slice(0, maxLength).trimEnd();
}

function splitAboutTextIntoParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");
}

export function buildSiteAboutTextPanelViewModel(panel: SiteAboutTextPanel): SiteAboutTextPanelViewModel {
  const maxLength = panel.maxLength ?? SITE_ABOUT_TEXT_MAX_LENGTH;
  const normalized = normalizeTextForAbout(panel.rawText, maxLength);

  return {
    id: panel.id,
    displayText: normalized,
    maxLength,
    paragraphs: splitAboutTextIntoParagraphs(normalized),
  };
}
