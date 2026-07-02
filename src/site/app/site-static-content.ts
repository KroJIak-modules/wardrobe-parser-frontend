import type { SiteFooterColumn } from "../features/storefront/site-storefront-contracts";

export const landingHeroButtonLabel = "НАЖМИТЕ ЧТОБЫ ВОЙТИ";

export const siteFooterColumns: SiteFooterColumn[] = [
  {
    id: "social",
    title: "Социальные сети",
    links: [
      { label: "Telegram", href: "https://t.me/antonshellog" },
      { label: "VK", href: "https://vk.ru/shellog" },
    ],
  },
  {
    id: "info",
    title: "Полезная информация",
    links: [
      { label: "Обо мне", to: "/about" },
      { label: "Отзывы", href: "https://vk.ru/wall468554546_234" },
      { label: "Вопросы", to: "/questions" },
      { label: "Публичная оферта" },
    ],
  },
];
