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

export const siteHomeNotificationEmptyPayload: SiteHomeNotificationPayload = {
  id: "telegram-updates",
  version: "v0",
  enabled: false,
  delayMs: 2600,
  windowLabel: "УВЕДОМЛЕНИЕ",
  title: "",
  description: "",
  imageSrc: "",
  imageAlt: "",
  ctaLabel: "",
  ctaHref: "",
};
