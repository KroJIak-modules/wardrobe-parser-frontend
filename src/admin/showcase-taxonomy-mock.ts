import type {
  AdminCategoryTreeNode,
  AdminCustomCatalog,
  AdminDesignerDirectoryItem,
  AdminFilterTreeNode,
  AdminFiltersCategoriesPayload,
  AdminRuleManualProduct,
} from "./admin-filters-categories-types";
import type {
  CatalogExperienceResponse,
  CatalogFilterGroup,
  CatalogViewKey,
  ShowcaseDesignersDirectoryResponse,
  ShowcaseNavigationMenuBlock,
  ShowcaseNavigationResponse,
  ShowcaseRouteTarget,
} from "./showcase-contracts";
import { readCanonicalAdminDesignersSeed } from "./admin-designers-mock";
import {
  resolveCatalogPageHeader,
  type CatalogHeaderDesignerEntry,
  type CatalogHeaderMenuFilterEntry,
} from "./showcase-catalog-header";

type CatalogMetricTemplate = {
  id: string;
  label: string;
  value: string;
};

let productLibrary: AdminRuleManualProduct[] = [
  {
    product_id: 41021,
    source_name: "LN-CC",
    source_product_url: "https://www.ln-cc.com/en/collections/the-row-camil-silk-twill-oversized-shirt-ivory-41021",
    vendor: "The Row",
    title: "Camil silk twill oversized shirt in ivory",
    image_url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=400&q=80",
    is_hidden: false,
    matched_local_categories: ["women", "shirts", "ready-to-wear"],
  },
  {
    product_id: 41022,
    source_name: "Browns",
    source_product_url: "https://www.brownsfashion.com/uk/shopping/bottega-veneta-small-andiamo-intrecciato-leather-bag-41022",
    vendor: "Bottega Veneta",
    title: "Small Andiamo intrecciato leather bag",
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
    is_hidden: false,
    matched_local_categories: ["women", "bags", "top-handle-bags"],
  },
  {
    product_id: 41023,
    source_name: "SSENSE",
    source_product_url: "https://www.ssense.com/en-us/men/product/loro-piana/windmate-cashmere-bomber-jacket-navy/41023",
    vendor: "Loro Piana",
    title: "Windmate cashmere bomber jacket in navy",
    image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80",
    is_hidden: false,
    matched_local_categories: ["men", "outerwear", "jackets"],
  },
  {
    product_id: 41024,
    source_name: "Mytheresa",
    source_product_url: "https://www.mytheresa.com/int/en/women/saint-laurent-grain-de-poudre-wool-blazer-41024",
    vendor: "Saint Laurent",
    title: "Grain de poudre wool blazer",
    image_url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80",
    is_hidden: false,
    matched_local_categories: ["women", "tailoring", "blazers"],
  },
  {
    product_id: 41025,
    source_name: "Mr Porter",
    source_product_url: "https://www.mrporter.com/en-us/mens/product/prada/brushed-leather-derby-shoes/41025",
    vendor: "Prada",
    title: "Brushed leather derby shoes",
    image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80",
    is_hidden: false,
    matched_local_categories: ["men", "shoes", "derby-shoes"],
  },
  {
    product_id: 41026,
    source_name: "Mytheresa",
    source_product_url: "https://www.mytheresa.com/int/en/women/toteme-signature-double-faced-wool-coat-41026",
    vendor: "Toteme",
    title: "Signature double-faced wool coat",
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
    is_hidden: false,
    matched_local_categories: ["women", "outerwear", "coats"],
  },
  {
    product_id: 41027,
    source_name: "Farfetch",
    source_product_url: "https://www.farfetch.com/shopping/women/miu-miu-pleated-gabardine-mini-skirt-41027",
    vendor: "Miu Miu",
    title: "Pleated gabardine mini skirt",
    image_url: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=400&q=80",
    is_hidden: false,
    matched_local_categories: ["women", "skirts", "mini-skirts"],
  },
  {
    product_id: 41028,
    source_name: "SSENSE",
    source_product_url: "https://www.ssense.com/en-us/women/product/khaite/benny-studded-leather-belt/41028",
    vendor: "Khaite",
    title: "Benny studded leather belt",
    image_url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=400&q=80",
    is_hidden: false,
    matched_local_categories: ["women", "accessories", "belts"],
  },
  {
    product_id: 41029,
    source_name: "Net-a-Porter",
    source_product_url: "https://www.net-a-porter.com/en-us/shop/product/loewe/puzzle-fold-medium-tote/41029",
    vendor: "Loewe",
    title: "Puzzle Fold medium leather tote",
    image_url: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=400&q=80",
    is_hidden: false,
    matched_local_categories: ["women", "bags", "tote-bags"],
  },
  {
    product_id: 41030,
    source_name: "Matches",
    source_product_url: "https://www.matchesfashion.com/products/balenciaga-3xl-mesh-sneakers-41030",
    vendor: "Balenciaga",
    title: "3XL mesh and rubber sneakers",
    image_url: "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=400&q=80",
    is_hidden: false,
    matched_local_categories: ["men", "shoes", "sneakers"],
  },
  {
    product_id: 41031,
    source_name: "SSENSE",
    source_product_url: "https://www.ssense.com/en-us/men/product/acne-studios/logo-hoodie-grey/41031",
    vendor: "Acne Studios",
    title: "Logo hoodie in melange grey",
    image_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80",
    is_hidden: false,
    matched_local_categories: ["men", "tops", "hoodies"],
  },
  {
    product_id: 41032,
    source_name: "Farfetch",
    source_product_url: "https://www.farfetch.com/shopping/women/alaia-embellished-choker-necklace-41032",
    vendor: "Alaia",
    title: "Crystal-embellished choker necklace",
    image_url: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=400&q=80",
    is_hidden: false,
    matched_local_categories: ["women", "accessories", "jewelry"],
  },
];

function pickProducts(...ids: number[]) {
  return ids
    .map((id) => productLibrary.find((item) => item.product_id === id))
    .filter((item): item is AdminRuleManualProduct => Boolean(item));
}

let filters: AdminFilterTreeNode[] = [
  {
    id: 102,
    slug: "clothing",
    label: "Одежда",
    display_label: "Одежда",
    is_enabled: true,
    rules: {
      local_category_keywords: ["tops", "bottoms", "outerwear"],
      title_keywords: ["hoodie", "shirt", "pants", "coat"],
      manual_products: pickProducts(41021, 41023, 41024, 41026, 41031),
    },
    children: [
      {
        id: 103,
        slug: "tops",
        label: "Верх",
        display_label: "Верх",
        is_enabled: true,
        rules: {
          local_category_keywords: ["tops", "shirts", "sweatshirts", "outerwear"],
          title_keywords: ["shirt", "tee", "hoodie", "coat", "jacket"],
          manual_products: pickProducts(41021, 41023, 41024, 41026, 41031),
        },
        children: [
          {
            id: 104,
            slug: "tees-longsleeves",
            label: "Футболки и лонгсливы",
            display_label: "Футболки и лонгсливы",
            is_enabled: true,
            rules: {
              local_category_keywords: ["t-shirts", "longsleeves", "jerseys"],
              title_keywords: ["t-shirt", "long sleeve", "jersey"],
              manual_products: pickProducts(41021),
            },
            children: [],
          },
          {
            id: 124,
            slug: "tees-tops",
            label: "Футболки и топы",
            display_label: "Футболки и топы",
            is_enabled: true,
            rules: {
              local_category_keywords: ["t-shirts", "tops"],
              title_keywords: ["t-shirt", "top"],
              manual_products: pickProducts(41021, 41024),
            },
            children: [],
          },
          {
            id: 115,
            slug: "shirts-polos",
            label: "Рубашки и поло",
            display_label: "Рубашки и поло",
            is_enabled: true,
            rules: {
              local_category_keywords: ["shirts", "polos"],
              title_keywords: ["shirt", "polo"],
              manual_products: pickProducts(41021, 41024),
            },
            children: [],
          },
          {
            id: 125,
            slug: "shirts-blouses",
            label: "Рубашки и блузы",
            display_label: "Рубашки и блузы",
            is_enabled: true,
            rules: {
              local_category_keywords: ["shirts", "blouses"],
              title_keywords: ["shirt", "blouse"],
              manual_products: pickProducts(41021, 41024),
            },
            children: [],
          },
          {
            id: 116,
            slug: "sweatshirts-hoodies",
            label: "Свитшоты и худи",
            display_label: "Свитшоты и худи",
            is_enabled: true,
            rules: {
              local_category_keywords: ["hoodies", "sweatshirts"],
              title_keywords: ["hoodie", "sweatshirt"],
              manual_products: pickProducts(41031),
            },
            children: [],
          },
          {
            id: 126,
            slug: "dresses",
            label: "Платья",
            display_label: "Платья",
            is_enabled: true,
            rules: {
              local_category_keywords: ["dresses", "gowns"],
              title_keywords: ["dress", "gown"],
              manual_products: pickProducts(41024, 41027),
            },
            children: [],
          },
          {
            id: 117,
            slug: "outerwear",
            label: "Верхняя одежда",
            display_label: "Верхняя одежда",
            is_enabled: true,
            rules: {
              local_category_keywords: ["outerwear", "coats", "jackets"],
              title_keywords: ["coat", "jacket", "parka"],
              manual_products: pickProducts(41023, 41026),
            },
            children: [],
          },
        ],
      },
      {
        id: 118,
        slug: "bottoms",
        label: "Низ",
        display_label: "Низ",
        is_enabled: true,
        rules: {
          local_category_keywords: ["bottoms", "jeans", "pants", "shorts"],
          title_keywords: ["jeans", "pants", "shorts", "trouser"],
          manual_products: pickProducts(41023, 41027),
        },
        children: [
          {
            id: 105,
            slug: "jeans-pants",
            label: "Джинсы и штаны",
            display_label: "Джинсы и штаны",
            is_enabled: true,
            rules: {
              local_category_keywords: ["jeans", "pants", "trousers"],
              title_keywords: ["jeans", "pants", "trouser"],
              manual_products: pickProducts(41023, 41027),
            },
            children: [],
          },
          {
            id: 119,
            slug: "shorts",
            label: "Шорты",
            display_label: "Шорты",
            is_enabled: true,
            rules: {
              local_category_keywords: ["shorts"],
              title_keywords: ["short"],
              manual_products: pickProducts(41027),
            },
            children: [],
          },
          {
            id: 127,
            slug: "shorts-skirts",
            label: "Шорты и юбки",
            display_label: "Шорты и юбки",
            is_enabled: true,
            rules: {
              local_category_keywords: ["shorts", "skirts"],
              title_keywords: ["short", "skirt"],
              manual_products: pickProducts(41027),
            },
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: 106,
    slug: "footwear",
    label: "Обувь",
    display_label: "Обувь",
    is_enabled: true,
    rules: {
      local_category_keywords: ["shoes", "sneakers", "boots"],
      title_keywords: ["shoe", "sneaker", "boot"],
      manual_products: pickProducts(41025, 41030),
    },
    children: [
      {
        id: 107,
        slug: "sneakers-trainers",
        label: "Кроссовки и кеды",
        display_label: "Кроссовки и кеды",
        is_enabled: true,
        rules: {
          local_category_keywords: ["sneakers", "trainers"],
          title_keywords: ["sneaker", "trainer"],
          manual_products: pickProducts(41030),
        },
        children: [],
      },
      {
        id: 120,
        slug: "boots",
        label: "Ботинки и сапоги",
        display_label: "Ботинки и сапоги",
        is_enabled: true,
        rules: {
          local_category_keywords: ["boots", "ankle-boots"],
          title_keywords: ["boot"],
          manual_products: pickProducts(41025),
        },
        children: [],
      },
      {
        id: 128,
        slug: "heels",
        label: "Туфли",
        display_label: "Туфли",
        is_enabled: true,
        rules: {
          local_category_keywords: ["heels", "pumps"],
          title_keywords: ["heel", "pump"],
          manual_products: pickProducts(41025),
        },
        children: [],
      },
    ],
  },
  {
    id: 108,
    slug: "accessories",
    label: "Аксессуары",
    display_label: "Аксессуары",
    is_enabled: true,
    rules: {
      local_category_keywords: ["bags", "jewelry", "headwear"],
      title_keywords: ["bag", "necklace", "cap", "hat"],
      manual_products: pickProducts(41022, 41028, 41029, 41032),
    },
    children: [
      {
        id: 109,
        slug: "jewelry",
        label: "Украшения",
        display_label: "Украшения",
        is_enabled: true,
        rules: {
          local_category_keywords: ["jewelry", "necklaces", "bracelets"],
          title_keywords: ["necklace", "ring", "bracelet"],
          manual_products: pickProducts(41032),
        },
        children: [],
      },
      {
        id: 110,
        slug: "bags",
        label: "Сумки",
        display_label: "Сумки",
        is_enabled: true,
        rules: {
          local_category_keywords: ["bags", "tote-bags", "top-handle-bags", "crossbody-bags"],
          title_keywords: ["bag", "tote", "andiamo", "puzzle"],
          manual_products: pickProducts(41022, 41029),
        },
        children: [],
      },
      {
        id: 111,
        slug: "belts",
        label: "Ремни",
        display_label: "Ремни",
        is_enabled: true,
        rules: {
          local_category_keywords: ["belts"],
          title_keywords: ["belt"],
          manual_products: pickProducts(41028),
        },
        children: [],
      },
      {
        id: 121,
        slug: "headwear",
        label: "Головные уборы",
        display_label: "Головные уборы",
        is_enabled: true,
        rules: {
          local_category_keywords: ["caps", "hats", "beanies"],
          title_keywords: ["cap", "hat", "beanie"],
          manual_products: pickProducts(41028),
        },
        children: [],
      },
      {
        id: 122,
        slug: "eyewear",
        label: "Очки",
        display_label: "Очки",
        is_enabled: true,
        rules: {
          local_category_keywords: ["eyewear", "sunglasses"],
          title_keywords: ["sunglasses", "glasses"],
          manual_products: pickProducts(41028),
        },
        children: [],
      },
      {
        id: 123,
        slug: "other-accessories",
        label: "Другое",
        display_label: "Другое",
        is_enabled: true,
        rules: {
          local_category_keywords: ["scarves", "small-leather-goods", "other-accessories"],
          title_keywords: ["scarf", "wallet", "cardholder"],
          manual_products: pickProducts(41022, 41028),
        },
        children: [],
      },
    ],
  },
];

let customCatalogs: AdminCustomCatalog[] = [
  {
    id: 301,
    slug: "editors-choice",
    label: "Мой выбор",
    is_hidden: false,
    manual_products: pickProducts(41021, 41022, 41029, 41032),
  },
  {
    id: 302,
    slug: "weekend-edit",
    label: "Weekend edit",
    is_hidden: false,
    manual_products: pickProducts(41024, 41026, 41030),
  },
  {
    id: 303,
    slug: "quiet-luxury",
    label: "Quiet luxury",
    is_hidden: true,
    manual_products: pickProducts(41021, 41023, 41026),
  },
];

let categories: AdminCategoryTreeNode[] = [
  {
    id: 201,
    slug: "new",
    label: "Новинки",
    behavior: "new",
    system_filter_value: null,
    attachments: [
      { id: "cat-201-catalog-301", kind: "custom_catalog", ref_id: 301, hidden_node_ids: [] },
    ],
    children: [],
  },
  {
    id: 202,
    slug: "designers",
    label: "Дизайнеры",
    behavior: "designers",
    system_filter_value: null,
    attachments: [],
    children: [],
  },
  {
    id: 203,
    slug: "men",
    label: "Мужское",
    behavior: "gender",
    system_filter_value: "men",
    attachments: [
      { id: "cat-203-filter-102", kind: "filter", ref_id: 102, hidden_node_ids: [124, 125, 126, 127] },
      { id: "cat-203-filter-106", kind: "filter", ref_id: 106, hidden_node_ids: [128] },
      { id: "cat-203-filter-108", kind: "filter", ref_id: 108, hidden_node_ids: [] },
    ],
    children: [],
  },
  {
    id: 204,
    slug: "women",
    label: "Женское",
    behavior: "gender",
    system_filter_value: "women",
    attachments: [
      { id: "cat-204-filter-102", kind: "filter", ref_id: 102, hidden_node_ids: [104, 115, 119] },
      { id: "cat-204-filter-106", kind: "filter", ref_id: 106, hidden_node_ids: [] },
      { id: "cat-204-filter-108", kind: "filter", ref_id: 108, hidden_node_ids: [] },
    ],
    children: [],
  },
  {
    id: 205,
    slug: "sale",
    label: "Скидки",
    behavior: "sale",
    system_filter_value: null,
    attachments: [],
    children: [],
  },
];

const SHOWCASE_DESIGNER_MENU_LIMIT = 14;

function readShowcaseDesignersSortedByLabel() {
  return readCanonicalAdminDesignersSeed();
}

function readShowcaseDesignersSortedByCount() {
  return [...readCanonicalAdminDesignersSeed()].sort((left, right) => {
    if (right.product_count !== left.product_count) {
      return right.product_count - left.product_count;
    }
    return left.label.localeCompare(right.label, "en", { numeric: true, sensitivity: "base" });
  });
}

function buildDesignerDirectory(): AdminDesignerDirectoryItem[] {
  return readShowcaseDesignersSortedByLabel().map((designer) => ({
    id: designer.id,
    label: designer.label,
    product_count: designer.product_count,
  }));
}

function buildDesignersDirectoryIndex() {
  return readShowcaseDesignersSortedByLabel().map((designer) => {
    const firstChar = designer.label.charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(firstChar) ? firstChar : "#";
    return {
      id: designer.id,
      label: designer.label,
      letter,
    };
  });
}

function buildPreviewMetrics(viewKey: CatalogViewKey): CatalogMetricTemplate[] {
  if (viewKey === "designers") {
    return [
      { id: "featured-designers", label: "В фокусе", value: `${Math.min(SHOWCASE_DESIGNER_MENU_LIMIT, readShowcaseDesignersSortedByCount().length)} брендов` },
      { id: "assortment", label: "Ассортимент", value: "1 096 SKU" },
      { id: "refresh-window", label: "Обновление", value: "каждые 30 минут" },
    ];
  }

  if (viewKey === "sale") {
    return [
      { id: "discounted-items", label: "Товаров со скидкой", value: "386 SKU" },
      { id: "average-discount", label: "Средняя скидка", value: "27%" },
      { id: "refresh-window", label: "Обновление", value: "раз в час" },
    ];
  }

  return [
    { id: "assortment", label: "Ассортимент", value: "2 184 SKU" },
    { id: "active-designers", label: "Дизайнеров", value: String(readShowcaseDesignersSortedByLabel().length) },
    { id: "refresh-window", label: "Обновление", value: "каждые 15 минут" },
  ];
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function flattenFilters(nodes: readonly AdminFilterTreeNode[]): AdminFilterTreeNode[] {
  const result: AdminFilterTreeNode[] = [];
  for (const node of nodes) {
    result.push(node);
    result.push(...flattenFilters(node.children));
  }
  return result;
}

function findCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug) ?? null;
}

function findFilterById(id: number) {
  return flattenFilters(filters).find((filter) => filter.id === id) ?? null;
}

function findCustomCatalogById(id: number) {
  return customCatalogs.find((catalog) => catalog.id === id) ?? null;
}

function collectLeafFilters(nodes: readonly AdminFilterTreeNode[]): AdminFilterTreeNode[] {
  const result: AdminFilterTreeNode[] = [];
  for (const node of nodes) {
    if (node.children.length === 0) {
      result.push(node);
      continue;
    }
    result.push(...collectLeafFilters(node.children));
  }
  return result;
}

function countFilterProducts(filter: AdminFilterTreeNode) {
  return filter.rules.manual_products.length;
}

function getTopNewCategoryFilters(limit = 9) {
  return collectLeafFilters(filters)
    .filter((filter) => filter.is_enabled)
    .sort((left, right) => {
      const countDiff = countFilterProducts(right) - countFilterProducts(left);
      if (countDiff !== 0) {
        return countDiff;
      }
      return left.display_label.localeCompare(right.display_label, "ru", { sensitivity: "base" });
    })
    .slice(0, limit);
}

function collectVisibleLeafFilterSlugs(filter: AdminFilterTreeNode, hiddenNodeIds: ReadonlySet<number> = new Set()): string[] {
  if (hiddenNodeIds.has(filter.id)) {
    return [];
  }

  if (filter.children.length === 0) {
    return [filter.slug];
  }

  return filter.children.flatMap((child) => collectVisibleLeafFilterSlugs(child, hiddenNodeIds));
}

function buildMenuFilterContextRef(attachmentId: string, filterId: number) {
  return `${attachmentId}:${filterId}`;
}

function buildFilterTarget(
  filter: AdminFilterTreeNode,
  patch: Record<string, string | readonly string[]> = {},
  hiddenNodeIds: ReadonlySet<number> = new Set(),
  routeContext?: {
    key: "menu_filter";
    ref: string;
  }
): ShowcaseRouteTarget {
  const selectedSections = collectVisibleLeafFilterSlugs(filter, hiddenNodeIds);
  return {
    pathname: "/catalog",
    query: {
      section: selectedSections,
      ...patch,
      ...(routeContext ? { ctx: routeContext.key, ctx_ref: routeContext.ref } : {}),
    },
  };
}

function flattenVisibleFilterDescendants(
  nodes: readonly AdminFilterTreeNode[],
  hiddenNodeIds: ReadonlySet<number>,
  hiddenByAncestor = false
): AdminFilterTreeNode[] {
  const result: AdminFilterTreeNode[] = [];
  for (const node of nodes) {
    const isHidden = hiddenByAncestor || hiddenNodeIds.has(node.id);
    if (isHidden) {
      continue;
    }
    result.push(node);
    result.push(...flattenVisibleFilterDescendants(node.children, hiddenNodeIds, isHidden));
  }
  return result;
}

function splitIntoTwoSequentialColumns<T>(items: readonly T[], measure: (item: T) => number): [T[], T[]] {
  if (items.length <= 1) {
    return [items.slice(), []];
  }

  let bestIndex = 0;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let index = 0; index < items.length; index += 1) {
    const left = items.slice(0, index + 1);
    const right = items.slice(index + 1);
    const leftHeight = left.reduce((sum, item) => sum + measure(item), 0);
    const rightHeight = right.reduce((sum, item) => sum + measure(item), 0);
    const score = Math.max(leftHeight, rightHeight);
    if (score < bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return [items.slice(0, bestIndex + 1), items.slice(bestIndex + 1)];
}

function buildNewCategoryMenuBlocks(): ShowcaseNavigationMenuBlock[] {
  const category = findCategoryBySlug("new");
  if (!category) {
    return [];
  }

  const topFilters = getTopNewCategoryFilters();

  const customCatalogItems = category.attachments
    .filter((item) => item.kind === "custom_catalog" && !item.hidden_node_ids.includes(item.ref_id))
    .flatMap((item) => {
      const catalog = findCustomCatalogById(item.ref_id);
      if (!catalog || catalog.is_hidden) {
        return [];
      }
      return [{
        id: `catalog-${catalog.id}`,
        kind: "curated_listing" as const,
        label: catalog.label,
        target: {
          pathname: "/catalog" as const,
          query: {
            collection: catalog.slug,
            ctx: "custom",
            ctx_ref: catalog.slug,
          },
        },
      }];
    })
    ;

  return [
    {
      id: "collections",
      title: "Коллекции",
      items: [
        {
          id: "in-stock",
          kind: "filter_link" as const,
          label: "В наличии",
          target: {
            pathname: "/catalog",
            query: { availability: "in-stock" },
          },
        },
        {
          id: "preorder",
          kind: "filter_link" as const,
          label: "Под заказ",
          target: {
            pathname: "/catalog",
            query: { availability: "preorder" },
          },
        },
        ...customCatalogItems,
        {
          id: "all-products",
          kind: "system_link" as const,
          label: "Все товары",
          target: {
            pathname: "/catalog",
            query: {
              ctx: "all",
            },
          },
        },
      ],
    },
    {
      id: "departments",
      title: "Разделы",
      items: topFilters.map((filter) => ({
        id: `filter-${filter.id}`,
        kind: filter.children.length > 0 ? "filter_bundle" as const : "filter_link" as const,
        label: filter.display_label,
        target: buildFilterTarget(filter),
      })),
    },
  ];
}

function buildDesignersMenuBlocks(): ShowcaseNavigationMenuBlock[] {
  const items = readShowcaseDesignersSortedByCount()
    .slice(0, SHOWCASE_DESIGNER_MENU_LIMIT)
    .map((designer) => ({
      id: `designer-${designer.id}`,
      kind: "filter_link" as const,
      label: designer.label,
      target: {
        pathname: "/catalog/designers" as const,
        query: {
          ctx: "designer",
          ctx_ref: designer.id,
          designer: designer.id,
        },
      },
    }));
  const middleIndex = Math.ceil(items.length / 2);

  return [
    {
      id: "designers-column-1",
      items: items.slice(0, middleIndex),
    },
    {
      id: "designers-column-2",
      items: items.slice(middleIndex),
    },
  ];
}

function buildCategoryColumnBlocks(categorySlug: "men" | "women"): ShowcaseNavigationMenuBlock[] {
  const category = findCategoryBySlug(categorySlug);
  if (!category) {
    return [];
  }

  const basePatch = category.system_filter_value ? { gender: category.system_filter_value } : {};
  const groups = category.attachments
    .filter((item) => item.kind === "filter" && !item.hidden_node_ids.includes(item.ref_id))
    .map((item) => ({
      attachment: item,
      filter: findFilterById(item.ref_id),
      hiddenNodeIds: new Set(item.hidden_node_ids),
    }))
    .filter(
      (
        item
      ): item is {
        attachment: AdminCategoryTreeNode["attachments"][number];
        filter: AdminFilterTreeNode;
        hiddenNodeIds: ReadonlySet<number>;
      } => Boolean(item.filter)
    )
    .map(({ attachment, filter }) => ({
      attachment,
      filter,
      hiddenNodeIds: new Set(attachment.hidden_node_ids),
      descendants: flattenVisibleFilterDescendants(filter.children, new Set(attachment.hidden_node_ids)),
    }));

  const [leftGroups, rightGroups] = splitIntoTwoSequentialColumns(groups, (group) => 1 + group.descendants.length);

  const buildColumn = (columnId: string, columnGroups: typeof groups): ShowcaseNavigationMenuBlock | null => {
    if (columnGroups.length === 0) {
      return null;
    }

    const [firstGroup, ...restGroups] = columnGroups;
    return {
      id: columnId,
      title: firstGroup.filter.display_label,
      titleTarget: buildFilterTarget(firstGroup.filter, basePatch, firstGroup.hiddenNodeIds, {
        key: "menu_filter",
        ref: buildMenuFilterContextRef(firstGroup.attachment.id, firstGroup.filter.id),
      }),
      items: [
        ...firstGroup.descendants.map((item) => ({
          id: `filter-${item.id}`,
          kind: item.children.length > 0 ? "filter_bundle" as const : "filter_link" as const,
          label: item.display_label,
          target: buildFilterTarget(
            item,
            basePatch,
            firstGroup.hiddenNodeIds,
            item.children.length > 0
              ? {
                  key: "menu_filter",
                  ref: buildMenuFilterContextRef(firstGroup.attachment.id, item.id),
                }
              : undefined
          ),
        })),
        ...restGroups.flatMap((group) => [
          {
            id: `heading-${group.filter.id}`,
            kind: "filter_bundle" as const,
            label: group.filter.display_label,
            target: buildFilterTarget(group.filter, basePatch, group.hiddenNodeIds, {
              key: "menu_filter",
              ref: buildMenuFilterContextRef(group.attachment.id, group.filter.id),
            }),
            presentation: "heading" as const,
          },
          ...group.descendants.map((item) => ({
            id: `filter-${item.id}`,
            kind: item.children.length > 0 ? "filter_bundle" as const : "filter_link" as const,
            label: item.display_label,
            target: buildFilterTarget(
              item,
              basePatch,
              group.hiddenNodeIds,
              item.children.length > 0
                ? {
                    key: "menu_filter",
                    ref: buildMenuFilterContextRef(group.attachment.id, item.id),
                  }
                : undefined
            ),
          })),
        ]),
      ],
    };
  };

  return [buildColumn(`${categorySlug}-column-1`, leftGroups), buildColumn(`${categorySlug}-column-2`, rightGroups)].filter(
    (item): item is ShowcaseNavigationMenuBlock => Boolean(item)
  );
}

function buildCategoryMenuBlocks(categorySlug: "new" | "men" | "women"): ShowcaseNavigationMenuBlock[] {
  if (categorySlug === "new") {
    return buildNewCategoryMenuBlocks();
  }

  return buildCategoryColumnBlocks(categorySlug);
}

function buildSectionFilterOptions() {
  return collectLeafFilters(filters).map((filter) => ({
    id: filter.slug,
    label: filter.display_label,
    value: filter.slug,
  }));
}

function buildDesignerOptions() {
  return readShowcaseDesignersSortedByCount().map((designer) => ({
    id: designer.id,
    label: designer.label,
    value: designer.id,
  }));
}

function buildCatalogFilterGroups(): CatalogFilterGroup[] {
  return [
    {
      key: "sort",
      label: "СОРТИРОВКА",
      queryParam: "sort",
      selectionMode: "single",
      options: [
        { id: "price-desc", label: "Сначала дороже", value: "price-desc" },
        { id: "price-asc", label: "Сначала дешевле", value: "price-asc" },
      ],
    },
    {
      key: "availability",
      label: "НАЛИЧИЕ",
      queryParam: "availability",
      selectionMode: "single",
      options: [
        { id: "preorder", label: "Под заказ", value: "preorder" },
        { id: "in-stock", label: "В наличии", value: "in-stock" },
      ],
    },
    {
      key: "section",
      label: "РАЗДЕЛ",
      queryParam: "section",
      selectionMode: "multiple",
      options: buildSectionFilterOptions(),
      panelWidth: "wide",
      maxVisibleOptions: 20,
      prioritizeSelected: true,
    },
    {
      key: "designers",
      label: "ДИЗАЙНЕРЫ",
      queryParam: "designer",
      selectionMode: "multiple",
      options: buildDesignerOptions(),
      visibleOptionsLimit: 7,
      actionItem: {
        label: "Смотреть все",
        target: {
          pathname: "/designers",
        },
        carryKeys: ["designer"],
        emphasis: "strong",
      },
      panelWidth: "wide",
      prioritizeSelected: true,
    },
    {
      key: "gender",
      label: "ПОЛ",
      queryParam: "gender",
      selectionMode: "single",
      options: [
        { id: "men", label: "Мужское", value: "men" },
        { id: "women", label: "Женское", value: "women" },
      ],
    },
  ];
}

export function readAdminFiltersCategoriesSeed(): AdminFiltersCategoriesPayload {
  return cloneJson({
    filters,
    categories,
    custom_catalogs: customCatalogs,
    designer_directory: buildDesignerDirectory(),
    product_library: productLibrary,
  });
}

export function saveAdminFiltersCategoriesSeed(payload: AdminFiltersCategoriesPayload): AdminFiltersCategoriesPayload {
  filters = cloneJson(payload.filters);
  categories = cloneJson(payload.categories);
  customCatalogs = cloneJson(payload.custom_catalogs);
  productLibrary = cloneJson(payload.product_library);
  return readAdminFiltersCategoriesSeed();
}

export function buildShowcaseNavigationSeed(): ShowcaseNavigationResponse {
  return cloneJson({
    sections: [
      {
        key: "new",
        label: "НОВИНКИ",
        target: null,
        menu: {
          id: "new-menu",
          layout: "new",
          blocks: buildCategoryMenuBlocks("new"),
        },
      },
      {
        key: "designers",
        label: "ДИЗАЙНЕРЫ",
        target: {
          pathname: "/catalog/designers",
        },
        menu: {
          id: "designers-menu",
          layout: "designers",
          blocks: buildDesignersMenuBlocks(),
          footerLink: {
            label: "Смотреть все",
            target: {
              pathname: "/designers",
            },
          },
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
        menu: {
          id: "men-menu",
          layout: "category_columns",
          blocks: buildCategoryMenuBlocks("men"),
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
        menu: {
          id: "women-menu",
          layout: "category_columns",
          blocks: buildCategoryMenuBlocks("women"),
        },
      },
      {
        key: "sale",
        label: "СКИДКИ",
        target: {
          pathname: "/catalog/sale",
          query: {
            ctx: "sale",
          },
        },
      },
    ],
  });
}

function buildCatalogHeaderDesignerRegistry(): CatalogHeaderDesignerEntry[] {
  return readShowcaseDesignersSortedByLabel().map((designer) => ({
    id: designer.id,
    label: designer.label,
    catalogTitle: designer.label,
    catalogDescription: designer.catalog_description,
  }));
}

function buildCatalogHeaderMenuFilterRegistry(): CatalogHeaderMenuFilterEntry[] {
  return categories
    .filter((category): category is AdminCategoryTreeNode & { system_filter_value: string } => category.behavior === "gender" && Boolean(category.system_filter_value))
    .flatMap((category) =>
      category.attachments
        .filter((attachment) => attachment.kind === "filter")
        .flatMap((attachment) => {
          const rootFilter = findFilterById(attachment.ref_id);
          if (!rootFilter) {
            return [];
          }
          const hiddenNodeIds = new Set(attachment.hidden_node_ids);
          const visibleDescendants = flattenVisibleFilterDescendants(rootFilter.children, hiddenNodeIds);
          const menuNodes = [rootFilter, ...visibleDescendants].filter((node) => node.children.length > 0);
          return menuNodes.map((node) => ({
            id: buildMenuFilterContextRef(attachment.id, node.id),
            label: node.display_label,
            sectionValues: collectVisibleLeafFilterSlugs(node, hiddenNodeIds),
          }));
        })
    );
}

export function buildCatalogExperienceSeed(viewKey: CatalogViewKey, searchParams: URLSearchParams = new URLSearchParams()): CatalogExperienceResponse {
  return cloneJson({
    view: {
      key: viewKey,
      header: resolveCatalogPageHeader({
        viewKey,
        searchParams,
        registry: {
          customCatalogs: customCatalogs.map((catalog) => ({
            slug: catalog.slug,
            label: catalog.label,
          })),
          menuFilters: buildCatalogHeaderMenuFilterRegistry(),
          designers: buildCatalogHeaderDesignerRegistry(),
        },
      }),
      globalConstraints: viewKey === "sale" ? ["Только товары с активной скидкой"] : undefined,
    },
    filterGroups: buildCatalogFilterGroups(),
    previewMetrics: buildPreviewMetrics(viewKey),
  });
}

export function buildShowcaseDesignersDirectorySeed(): ShowcaseDesignersDirectoryResponse {
  return cloneJson({
    alphabet: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "#"],
    entries: buildDesignersDirectoryIndex(),
  });
}
