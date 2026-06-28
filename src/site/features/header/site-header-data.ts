import type { SiteNavItem } from "../storefront/site-storefront-contracts";
import { siteCatalogCustomCatalogs, siteCatalogSections } from "../../runtime/site-catalog-mock";
import { buildCatalogHref } from "../catalog/site-catalog-query";
import { createSiteDesignersLocationState, type SiteDesignersLocationState } from "../designers/site-designers-navigation";

export type SiteHeaderMenuEntryPresentation = "heading" | "item";

export type SiteHeaderMenuEntry = {
  id: string;
  label: string;
  presentation: SiteHeaderMenuEntryPresentation;
  to?: string;
  navigationState?: SiteDesignersLocationState;
};

export type SiteHeaderDropdownColumn = {
  id: string;
  title?: {
    label: string;
    to?: string;
    navigationState?: SiteDesignersLocationState;
  };
  align: "start" | "center";
  entries: readonly SiteHeaderMenuEntry[];
};

export type SiteHeaderDropdownMenu = {
  kind: "new" | "designers" | "men" | "women";
  columns: readonly [SiteHeaderDropdownColumn, SiteHeaderDropdownColumn];
  footerLink?: {
    label: string;
    to: string;
    navigationState?: SiteDesignersLocationState;
  };
};

export const siteHeaderTopMenuItems: SiteNavItem[] = [
  { label: "Новинки" },
  { label: "Дизайнеры" },
  { label: "Мужское" },
  { label: "Женское" },
  { label: "Скидки", to: "/sale" },
];

function normalizeDesignerId(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSectionHref(sectionLabel: string, gender?: "men" | "women") {
  const section = siteCatalogSections.find((item) => item.label === sectionLabel);
  if (!section) {
    return "/catalog";
  }

  return buildCatalogHref({
    multi: null,
    collection: null,
    section: [section.id],
    gender: gender ? [gender] : null,
  });
}

function buildAvailabilityHref(availability: "in-stock" | "preorder") {
  return buildCatalogHref({
    collection: null,
    multi: null,
    availability,
    section: null,
    designer: null,
    gender: null,
    sort: null,
    q: null,
  });
}

function buildCollectionHref(collectionId: string | null) {
  return buildCatalogHref({
    collection: collectionId,
    multi: null,
    availability: null,
    section: null,
    designer: null,
    gender: null,
    sort: null,
    q: null,
  });
}

function buildMultiHref(gender: "men" | "women", multiId: string) {
  const sectionIds = siteCatalogSections
    .filter((section) => section.multiFilterIds.includes(multiId))
    .map((section) => section.id);

  return buildCatalogHref({
    multi: multiId,
    collection: null,
    availability: null,
    section: sectionIds,
    designer: null,
    gender: [gender],
    sort: null,
    q: null,
  });
}

const myChoiceCatalog = siteCatalogCustomCatalogs.find((catalog) => catalog.id === "my-choice");

const designerLabelsByColumn = {
  left: [
    "Guidi",
    "Protocol Index",
    "Ann Demeulemeester",
    "Racer Worldwide",
    "Jaded London",
    "Guidi",
    "Alice Hollywood",
    "Enfants Riches Deprimes",
    "14th Addiction",
  ],
  right: [
    "Jaded London",
    "Protocol Index",
    "Alice Hollywood",
    "Racer Worldwide",
    "Enfants Riches Deprimes",
    "424",
    "Raf Simons",
    "Balenciaga",
    "Rick Owens",
  ],
} as const;

function createDesignerEntries(labels: readonly string[], suffix: "left" | "right") {
  return labels.map((label, index) => ({
    id: `${suffix}-${index + 1}-${normalizeDesignerId(label)}`,
    label,
    presentation: "item" as const,
    to: buildCatalogHref({
      collection: null,
      multi: null,
      availability: null,
      section: null,
      designer: [normalizeDesignerId(label)],
      gender: null,
      sort: null,
      q: null,
    }),
  }));
}

const siteHeaderDropdownMenus = {
  "Новинки": {
    kind: "new",
    columns: [
      {
        id: "new-collections",
        title: { label: "Коллекции" },
        align: "start",
        entries: [
          { id: "in-stock", label: "В наличии", presentation: "item", to: buildAvailabilityHref("in-stock") },
          { id: "preorder", label: "Под заказ", presentation: "item", to: buildAvailabilityHref("preorder") },
          {
            id: "my-choice",
            label: myChoiceCatalog?.label ?? "Мой выбор",
            presentation: "item",
            to: buildCollectionHref("my-choice"),
          },
          { id: "all-products", label: "Все товары", presentation: "item", to: "/catalog" },
        ],
      },
      {
        id: "new-sections",
        title: { label: "Разделы" },
        align: "start",
        entries: [
          { id: "tees-longsleeves", label: "Футболки и лонгсливы", presentation: "item", to: buildSectionHref("Футболки и лонгсливы") },
          { id: "hoodies", label: "Свитшоты и худи", presentation: "item", to: buildSectionHref("Свитшоты и худи") },
          { id: "denim-trousers", label: "Джинсы и штаны", presentation: "item", to: buildSectionHref("Джинсы и штаны") },
          { id: "sneakers", label: "Кроссовки и кеды", presentation: "item", to: buildSectionHref("Кроссовки и кеды") },
          { id: "belts", label: "Ремни", presentation: "item", to: buildSectionHref("Ремни") },
          { id: "jewelry", label: "Украшения", presentation: "item", to: buildSectionHref("Украшения") },
          { id: "bags", label: "Сумки", presentation: "item", to: buildSectionHref("Сумки") },
          { id: "shorts-skirts", label: "Шорты и юбки", presentation: "item", to: buildSectionHref("Шорты и юбки") },
          { id: "headwear", label: "Головные уборы", presentation: "item", to: buildSectionHref("Головные уборы") },
        ],
      },
    ] as const,
  },
  "Дизайнеры": {
    kind: "designers",
    columns: [
      {
        id: "designers-left",
        align: "center",
        entries: createDesignerEntries(designerLabelsByColumn.left, "left"),
      },
      {
        id: "designers-right",
        align: "center",
        entries: createDesignerEntries(designerLabelsByColumn.right, "right"),
      },
    ] as const,
    footerLink: {
      label: "Смотреть все",
      to: "/designers",
      navigationState: createSiteDesignersLocationState("browse"),
    },
  },
  "Мужское": {
    kind: "men",
    columns: [
      {
        id: "men-left",
        align: "start",
        entries: [
          { id: "men-clothing", label: "Одежда", presentation: "heading", to: buildMultiHref("men", "clothing") },
          { id: "men-top", label: "Верх", presentation: "item", to: buildMultiHref("men", "top") },
          {
            id: "men-tees-longsleeves",
            label: "Футболки и лонгсливы",
            presentation: "item",
            to: buildSectionHref("Футболки и лонгсливы", "men"),
          },
          {
            id: "men-shirts-polo",
            label: "Рубашки и поло",
            presentation: "item",
            to: buildSectionHref("Рубашки и поло", "men"),
          },
          { id: "men-hoodies", label: "Свитшоты и худи", presentation: "item", to: buildSectionHref("Свитшоты и худи", "men") },
          { id: "men-outerwear", label: "Верхняя одежда", presentation: "item", to: buildSectionHref("Верхняя одежда", "men") },
          { id: "men-bottom", label: "Низ", presentation: "item", to: buildMultiHref("men", "bottom") },
          {
            id: "men-denim-trousers",
            label: "Джинсы и штаны",
            presentation: "item",
            to: buildSectionHref("Джинсы и штаны", "men"),
          },
          { id: "men-shorts", label: "Шорты", presentation: "item", to: buildSectionHref("Шорты", "men") },
        ],
      },
      {
        id: "men-right",
        align: "start",
        entries: [
          { id: "men-shoes", label: "Обувь", presentation: "heading", to: buildMultiHref("men", "shoes") },
          { id: "men-sneakers", label: "Кроссовки и кеды", presentation: "item", to: buildSectionHref("Кроссовки и кеды", "men") },
          { id: "men-boots", label: "Ботинки и сапоги", presentation: "item", to: buildSectionHref("Ботинки и сапоги", "men") },
          { id: "men-accessories", label: "Аксессуары", presentation: "heading", to: buildMultiHref("men", "accessories") },
          { id: "men-jewelry", label: "Украшения", presentation: "item", to: buildSectionHref("Украшения", "men") },
          { id: "men-bags", label: "Сумки", presentation: "item", to: buildSectionHref("Сумки", "men") },
          { id: "men-belts", label: "Ремни", presentation: "item", to: buildSectionHref("Ремни", "men") },
          { id: "men-headwear", label: "Головные уборы", presentation: "item", to: buildSectionHref("Головные уборы", "men") },
          { id: "men-glasses", label: "Очки", presentation: "item", to: buildSectionHref("Очки", "men") },
          { id: "men-other", label: "Другое", presentation: "item", to: buildSectionHref("Другое", "men") },
        ],
      },
    ] as const,
  },
  "Женское": {
    kind: "women",
    columns: [
      {
        id: "women-left",
        align: "start",
        entries: [
          { id: "women-clothing", label: "Одежда", presentation: "heading", to: buildMultiHref("women", "clothing") },
          { id: "women-top", label: "Верх", presentation: "item", to: buildMultiHref("women", "top") },
          { id: "women-tees-tops", label: "Футболки и топы", presentation: "item", to: buildSectionHref("Футболки и топы", "women") },
          { id: "women-shirts-blouses", label: "Рубашки и блузы", presentation: "item", to: buildSectionHref("Рубашки и блузы", "women") },
          { id: "women-hoodies", label: "Свитшоты и худи", presentation: "item", to: buildSectionHref("Свитшоты и худи", "women") },
          { id: "women-dresses", label: "Платья", presentation: "item", to: buildSectionHref("Платья", "women") },
          { id: "women-outerwear", label: "Верхняя одежда", presentation: "item", to: buildSectionHref("Верхняя одежда", "women") },
          { id: "women-bottom", label: "Низ", presentation: "item", to: buildMultiHref("women", "bottom") },
          {
            id: "women-denim-trousers",
            label: "Джинсы и штаны",
            presentation: "item",
            to: buildSectionHref("Джинсы и штаны", "women"),
          },
          { id: "women-shorts-skirts", label: "Шорты и юбки", presentation: "item", to: buildSectionHref("Шорты и юбки", "women") },
        ],
      },
      {
        id: "women-right",
        align: "start",
        entries: [
          { id: "women-shoes", label: "Обувь", presentation: "heading", to: buildMultiHref("women", "shoes") },
          { id: "women-sneakers", label: "Кроссовки и кеды", presentation: "item", to: buildSectionHref("Кроссовки и кеды", "women") },
          { id: "women-boots", label: "Ботинки и сапоги", presentation: "item", to: buildSectionHref("Ботинки и сапоги", "women") },
          { id: "women-heels", label: "Туфли", presentation: "item", to: buildSectionHref("Туфли", "women") },
          { id: "women-accessories", label: "Аксессуары", presentation: "heading", to: buildMultiHref("women", "accessories") },
          { id: "women-jewelry", label: "Украшения", presentation: "item", to: buildSectionHref("Украшения", "women") },
          { id: "women-bags", label: "Сумки", presentation: "item", to: buildSectionHref("Сумки", "women") },
          { id: "women-belts", label: "Ремни", presentation: "item", to: buildSectionHref("Ремни", "women") },
          { id: "women-headwear", label: "Головные уборы", presentation: "item", to: buildSectionHref("Головные уборы", "women") },
          { id: "women-glasses", label: "Очки", presentation: "item", to: buildSectionHref("Очки", "women") },
          { id: "women-other", label: "Другое", presentation: "item", to: buildSectionHref("Другое", "women") },
        ],
      },
    ] as const,
  },
} satisfies Partial<Record<string, SiteHeaderDropdownMenu>>;

export function getSiteHeaderDropdownMenu(menuLabel: string): SiteHeaderDropdownMenu | null {
  return siteHeaderDropdownMenus[menuLabel] ?? null;
}
