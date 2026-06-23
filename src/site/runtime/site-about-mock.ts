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
  textPanels: readonly [SiteAboutTextPanel, SiteAboutTextPanel];
};

export type SiteAboutTextPanelViewModel = {
  id: string;
  displayText: string;
  maxLength: number;
};

function normalizeTextForAbout(rawText: string, maxLength: number) {
  return rawText.trim().slice(0, maxLength).trimEnd();
}

export function buildSiteAboutTextPanelViewModel(panel: SiteAboutTextPanel): SiteAboutTextPanelViewModel {
  const maxLength = panel.maxLength ?? SITE_ABOUT_TEXT_MAX_LENGTH;
  const normalized = normalizeTextForAbout(panel.rawText, maxLength);

  return {
    id: panel.id,
    displayText: normalized,
    maxLength,
  };
}

export const siteAboutMockPayload: SiteAboutPayload = {
  title: "ОБО МНЕ",
  photoSlides: [
    {
      id: "about-photo-1",
      imageSrc: "/site-mock/about-photo-cropped.png",
      alt: "Anton Shell в интерьере",
    },
    {
      id: "about-photo-2",
      imageSrc: "/site-mock/about-photo-cropped.png",
      alt: "Anton Shell в интерьере, второй кадр",
    },
    {
      id: "about-photo-3",
      imageSrc: "/site-mock/about-photo-cropped.png",
      alt: "Anton Shell в интерьере, третий кадр",
    },
  ],
  textPanels: [
    {
      id: "about-left",
      rawText:
        "Anton Shell — молодой байер из Москвы, превращающий продажи в искусство.\n\nНачиная свой путь с китайских платформ в 15 лет, он быстро понял разницу между массовым рынком и настоящим стилем. Теперь доставляет вещи из Европы, США и Великобритании, собирая гардеробы, которые говорят громче слов.\n\nВизуал — его оружие. Продуманная стилизация, сильные промо-съемки, точный вкус.\n\nЗа два года работы Антон успел посотрудничать с многими брендами: Jaded London, Racer Worldwide, Alice Hollywood, Nofaithstudios, Project gr, Yori Sport и другие.\n\nАнтон не просто продает одежду — он продает образ жизни.\n\nsdakff\n\nadawpfdwfkwfwofkwf",
    },
    {
      id: "about-right",
      rawText:
        "Anton Shell — молодой байер из Москвы, превращающий продажи в искусство.\n\nНачиная свой путь с китайских платформ в 15 лет, он быстро понял разницу между массовым рынком и настоящим стилем. Теперь доставляет вещи из Европы, США и Великобритании, собирая гардеробы, которые говорят громче слов.\n\nВизуал — его оружие. Продуманная стилизация, сильные промо-съемки, точный вкус.\n\nЗа два года работы Антон успел посотрудничать с многими брендами: Jaded London, Racer Worldwide, Alice Hollywood, Nofaithstudios, Project gr, Yori Sport и другие.\n\nАнтон не просто продает одежду — он продает образ жизни.",
    },
  ],
};
