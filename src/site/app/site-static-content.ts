import type { SiteFooterColumn, SiteNavItem } from "../features/storefront/site-storefront-contracts";
import { siteCatalogMenuConfig } from "../runtime/site-catalog-mock";

export const landingHeroButtonLabel = "НАЖМИТЕ ЧТОБЫ ВОЙТИ";

export const siteMenuItems: SiteNavItem[] = [...siteCatalogMenuConfig.topMenuItems];

export const siteActionItems: SiteNavItem[] = [{ label: "Поиск" }, { label: "Корзина" }];

export const siteFooterColumns: SiteFooterColumn[] = [
  {
    title: "Социальные сети",
    links: [
      { label: "Telegram", href: "https://t.me/antonshellog" },
      { label: "VK", href: "https://vk.ru/shellog" },
    ],
  },
  {
    title: "Полезная информация",
    links: [
      { label: "Обо мне", to: "/about" },
      { label: "Отзывы" },
      { label: "Вопросы", to: "/questions" },
      { label: "Публичная оферта" },
    ],
  },
];
