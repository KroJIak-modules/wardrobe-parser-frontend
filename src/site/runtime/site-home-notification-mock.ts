export type SiteHomeNotificationPayload = {
  id: string;
  version: string;
  enabled: boolean;
  delayMs: number;
  windowLabel: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
};

export const siteHomeNotificationMockPayload: SiteHomeNotificationPayload = {
  id: "telegram-updates",
  version: "v1",
  enabled: true,
  delayMs: 2600,
  windowLabel: "УВЕДОМЛЕНИЕ",
  title: "ОБНОВЛЕНИЯ И НАХОДКИ",
  description: "Следите за новостями модной индустрии и любимых брендов вместе со мной",
  imageSrc: "/site-mock/about-photo-cropped.png",
  imageAlt: "Anton Shell в интерьерной съемке",
  ctaLabel: "ПЕРЕЙТИ В TELEGRAM",
  ctaHref: "https://t.me/antonshellog",
};
