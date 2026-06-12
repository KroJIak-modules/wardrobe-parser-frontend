import type {
  CatalogExperienceResponse,
  CatalogViewKey,
  ShowcaseNavigationResponse,
} from "./showcase-contracts";

const MOCK_LATENCY_MS = 140;

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function simulateResponse<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(cloneJson(value));
    }, MOCK_LATENCY_MS);
  });
}

const NAVIGATION_TEMPLATE = {
  sections: [
    {
      key: "new",
      label: "НОВИНКИ",
      target: null,
      menu: {
        id: "new-menu",
        blocks: [
          {
            id: "collections",
            title: "Коллекции",
            items: [
              {
                id: "new-arrivals",
                kind: "curated_listing",
                label: "Новые поступления",
                target: {
                  pathname: "/catalog",
                  query: {
                    collection: "new-arrivals",
                  },
                },
              },
              {
                id: "in-stock",
                kind: "filter_link",
                label: "В наличии",
                target: {
                  pathname: "/catalog",
                  query: {
                    availability: "in-stock",
                  },
                },
              },
              {
                id: "preorder",
                kind: "filter_link",
                label: "Под заказ",
                target: {
                  pathname: "/catalog",
                  query: {
                    availability: "preorder",
                  },
                },
              },
              {
                id: "editors-choice",
                kind: "curated_listing",
                label: "Мой выбор",
                target: {
                  pathname: "/catalog",
                  query: {
                    collection: "editors-choice",
                  },
                },
              },
              {
                id: "all-products",
                kind: "system_link",
                label: "Все товары",
                target: {
                  pathname: "/catalog",
                },
              },
            ],
          },
          {
            id: "departments",
            title: "Разделы",
            items: [
              {
                id: "tees-pack",
                kind: "filter_bundle",
                label: "Футболки и лонгсливы",
                target: {
                  pathname: "/catalog",
                  query: {
                    category: ["t-shirts", "longsleeves"],
                  },
                },
              },
              {
                id: "hoodies-pack",
                kind: "filter_bundle",
                label: "Свитшоты и худи",
                target: {
                  pathname: "/catalog",
                  query: {
                    category: ["sweatshirts", "hoodies"],
                  },
                },
              },
              {
                id: "pants-pack",
                kind: "filter_bundle",
                label: "Джинсы и штаны",
                target: {
                  pathname: "/catalog",
                  query: {
                    category: ["jeans", "pants"],
                  },
                },
              },
              {
                id: "sneakers-pack",
                kind: "filter_bundle",
                label: "Кроссовки и кеды",
                target: {
                  pathname: "/catalog",
                  query: {
                    category: ["sneakers", "trainers"],
                  },
                },
              },
              {
                id: "belts-pack",
                kind: "filter_bundle",
                label: "Ремни",
                target: {
                  pathname: "/catalog",
                  query: {
                    category: ["belts"],
                  },
                },
              },
              {
                id: "jewelry-pack",
                kind: "filter_bundle",
                label: "Украшения",
                target: {
                  pathname: "/catalog",
                  query: {
                    category: ["jewelry"],
                  },
                },
              },
              {
                id: "bags-pack",
                kind: "filter_bundle",
                label: "Сумки",
                target: {
                  pathname: "/catalog",
                  query: {
                    category: ["bags", "crossbody", "totes"],
                  },
                },
              },
              {
                id: "shorts-skirts-pack",
                kind: "filter_bundle",
                label: "Шорты и юбки",
                target: {
                  pathname: "/catalog",
                  query: {
                    category: ["shorts", "skirts"],
                  },
                },
              },
              {
                id: "hats-pack",
                kind: "filter_bundle",
                label: "Головные уборы",
                target: {
                  pathname: "/catalog",
                  query: {
                    category: ["caps", "hats"],
                  },
                },
              },
            ],
          },
        ],
      },
    },
    {
      key: "designers",
      label: "ДИЗАЙНЕРЫ",
      target: {
        pathname: "/catalog/designers",
      },
    },
    {
      key: "men",
      label: "МУЖСКОЕ",
      target: {
        pathname: "/catalog",
        query: {
          gender: "men",
        },
      },
    },
    {
      key: "women",
      label: "ЖЕНСКОЕ",
      target: {
        pathname: "/catalog",
        query: {
          gender: "women",
        },
      },
    },
    {
      key: "sale",
      label: "СКИДКИ",
      target: {
        pathname: "/catalog/sale",
      },
    },
  ],
} as const;

const SHARED_FILTER_GROUPS = [
  {
    key: "sort",
    label: "НОВИНКИ",
    queryParam: "sort",
    selectionMode: "single",
    indicatorMode: "selected_icon",
    options: [
      { id: "price-desc", label: "Сначала дороже", value: "price-desc", icon: "sort-desc" },
      { id: "price-asc", label: "Сначала дешевле", value: "price-asc", icon: "sort-asc" },
    ],
  },
  {
    key: "availability",
    label: "НАЛИЧИЕ",
    queryParam: "availability",
    selectionMode: "single",
    indicatorMode: "selected_icon",
    options: [
      { id: "preorder", label: "Под заказ", value: "preorder", icon: "preorder" },
      { id: "in-stock", label: "В наличии", value: "in-stock", icon: "in-stock" },
    ],
  },
  {
    key: "section",
    label: "РАЗДЕЛ",
    queryParam: "category",
    selectionMode: "multiple",
    indicatorMode: "count",
    options: [],
    emptyState: "Список разделов придет из API категорий.",
    panelWidth: "wide",
  },
  {
    key: "designers",
    label: "ДИЗАЙНЕРЫ",
    queryParam: "designer",
    selectionMode: "multiple",
    indicatorMode: "count",
    options: [],
    emptyState: "Список дизайнеров будет загружен отдельно.",
    panelWidth: "wide",
  },
  {
    key: "gender",
    label: "ПОЛ",
    queryParam: "gender",
    selectionMode: "single",
    indicatorMode: "gender_short",
    options: [
      { id: "men", label: "Мужское", value: "men" },
      { id: "women", label: "Женское", value: "women" },
    ],
  },
] as const;

const CATALOG_TEMPLATE: Record<CatalogViewKey, CatalogExperienceResponse> = {
  default: {
    view: {
      key: "default",
      title: "Каталог",
    },
    filterGroups: SHARED_FILTER_GROUPS,
    previewMetrics: [
      { id: "assortment", label: "Ассортимент", value: "2 184 SKU" },
      { id: "active-designers", label: "Дизайнеров", value: "143" },
      { id: "refresh-window", label: "Обновление", value: "каждые 15 минут" },
    ],
  },
  designers: {
    view: {
      key: "designers",
      title: "Каталог дизайнеров",
    },
    filterGroups: SHARED_FILTER_GROUPS,
    previewMetrics: [
      { id: "featured-designers", label: "В фокусе", value: "24 бренда" },
      { id: "assortment", label: "Ассортимент", value: "1 096 SKU" },
      { id: "refresh-window", label: "Обновление", value: "каждые 30 минут" },
    ],
  },
  sale: {
    view: {
      key: "sale",
      title: "Каталог скидок",
      globalConstraints: ["Только товары с активной скидкой"],
    },
    filterGroups: SHARED_FILTER_GROUPS,
    previewMetrics: [
      { id: "discounted-items", label: "Товаров со скидкой", value: "386 SKU" },
      { id: "average-discount", label: "Средняя скидка", value: "27%" },
      { id: "refresh-window", label: "Обновление", value: "раз в час" },
    ],
  },
};

export async function fetchShowcaseNavigation(): Promise<ShowcaseNavigationResponse> {
  return simulateResponse(NAVIGATION_TEMPLATE);
}

export async function fetchCatalogExperience(viewKey: CatalogViewKey): Promise<CatalogExperienceResponse> {
  const template = CATALOG_TEMPLATE[viewKey];
  return simulateResponse(template);
}

export function readShowcaseNavigationSeed(): ShowcaseNavigationResponse {
  return cloneJson(NAVIGATION_TEMPLATE);
}

export function readCatalogExperienceSeed(viewKey: CatalogViewKey): CatalogExperienceResponse {
  return cloneJson(CATALOG_TEMPLATE[viewKey]);
}
