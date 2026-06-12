import type {
  AdminCategoryTreeNode,
  AdminFilterTreeNode,
  AdminFiltersCategoriesPayload,
  AdminRuleManualProduct,
} from "./admin-filters-categories-types";

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const productLibrary: AdminRuleManualProduct[] = [
  {
    product_id: 41021,
    source_name: "LN-CC",
    vendor: "The Row",
    title: "Camil silk twill oversized shirt in ivory",
    image_url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=400&q=80",
    matched_local_categories: ["women", "shirts", "ready-to-wear"],
  },
  {
    product_id: 41022,
    source_name: "Browns",
    vendor: "Bottega Veneta",
    title: "Small Andiamo intrecciato leather bag",
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
    matched_local_categories: ["women", "bags", "top-handle-bags"],
  },
  {
    product_id: 41023,
    source_name: "SSENSE",
    vendor: "Loro Piana",
    title: "Windmate cashmere bomber jacket in navy",
    image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80",
    matched_local_categories: ["men", "outerwear", "jackets"],
  },
  {
    product_id: 41024,
    source_name: "Mytheresa",
    vendor: "Saint Laurent",
    title: "Grain de poudre wool blazer",
    image_url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80",
    matched_local_categories: ["women", "tailoring", "blazers"],
  },
  {
    product_id: 41025,
    source_name: "Mr Porter",
    vendor: "Prada",
    title: "Brushed leather derby shoes",
    image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80",
    matched_local_categories: ["men", "shoes", "derby-shoes"],
  },
  {
    product_id: 41026,
    source_name: "Mytheresa",
    vendor: "Toteme",
    title: "Signature double-faced wool coat",
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
    matched_local_categories: ["women", "outerwear", "coats"],
  },
  {
    product_id: 41027,
    source_name: "Farfetch",
    vendor: "Miu Miu",
    title: "Pleated gabardine mini skirt",
    image_url: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=400&q=80",
    matched_local_categories: ["women", "skirts", "mini-skirts"],
  },
  {
    product_id: 41028,
    source_name: "SSENSE",
    vendor: "Khaite",
    title: "Benny studded leather belt",
    image_url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=400&q=80",
    matched_local_categories: ["women", "accessories", "belts"],
  },
];

function pickProducts(...ids: number[]) {
  return ids
    .map((id) => productLibrary.find((item) => item.product_id === id))
    .filter((item): item is AdminRuleManualProduct => Boolean(item));
}

const filters: AdminFilterTreeNode[] = [
  {
    id: 101,
    label: "Раздел",
    rules: {
      local_category_keywords: ["women", "men", "ready-to-wear", "accessories"],
      title_keywords: [],
      manual_products: [],
    },
    children: [
      {
        id: 102,
        label: "Одежда",
        rules: {
          local_category_keywords: ["shirts", "jackets", "knitwear", "skirts", "pants", "outerwear"],
          title_keywords: ["shirt", "coat", "jacket", "turtleneck"],
          manual_products: pickProducts(41021, 41023, 41024, 41026, 41027),
        },
        children: [],
      },
      {
        id: 103,
        label: "Обувь",
        rules: {
          local_category_keywords: ["shoes", "derby-shoes", "loafers", "boots", "sneakers"],
          title_keywords: ["loafer", "derby", "boot", "sneaker"],
          manual_products: pickProducts(41025),
        },
        children: [],
      },
      {
        id: 104,
        label: "Сумки",
        rules: {
          local_category_keywords: ["bags", "tote-bags", "top-handle-bags", "crossbody-bags"],
          title_keywords: ["bag", "tote", "andiamo", "puzzle"],
          manual_products: pickProducts(41022),
        },
        children: [],
      },
      {
        id: 105,
        label: "Аксессуары",
        rules: {
          local_category_keywords: ["accessories", "belts", "scarves", "hats", "sunglasses"],
          title_keywords: ["belt", "scarf", "cap"],
          manual_products: pickProducts(41028),
        },
        children: [],
      },
    ],
  },
  {
    id: 106,
    label: "Пол",
    rules: {
      local_category_keywords: ["women", "men"],
      title_keywords: [],
      manual_products: [],
    },
    children: [
      {
        id: 107,
        label: "Женское",
        rules: {
          local_category_keywords: ["women", "womenswear", "ladies"],
          title_keywords: [],
          manual_products: pickProducts(41021, 41022, 41024, 41026, 41027, 41028),
        },
        children: [],
      },
      {
        id: 108,
        label: "Мужское",
        rules: {
          local_category_keywords: ["men", "menswear", "gentlemen"],
          title_keywords: [],
          manual_products: pickProducts(41023, 41025),
        },
        children: [],
      },
    ],
  },
  {
    id: 109,
    label: "Новинки",
    rules: {
      local_category_keywords: ["new-arrivals", "latest-drop"],
      title_keywords: ["new season", "latest arrival"],
      manual_products: pickProducts(41022, 41027),
    },
    children: [],
  },
  {
    id: 110,
    label: "Дизайнеры",
    rules: {
      local_category_keywords: ["designers"],
      title_keywords: ["the row", "bottega", "saint laurent", "toteme", "miu miu", "khaite"],
      manual_products: pickProducts(41021, 41022, 41024, 41026, 41027, 41028),
    },
    children: [],
  },
];

const categories: AdminCategoryTreeNode[] = [
  {
    id: 201,
    label: "Женское",
    children: [
      {
        id: 202,
        label: "Одежда",
        children: [
          { id: 203, label: "Рубашки", children: [] },
          { id: 204, label: "Пиджаки", children: [] },
          { id: 205, label: "Юбки", children: [] },
        ],
      },
      {
        id: 206,
        label: "Сумки",
        children: [
          { id: 207, label: "Тоуты", children: [] },
          { id: 208, label: "Top Handle", children: [] },
        ],
      },
    ],
  },
  {
    id: 209,
    label: "Мужское",
    children: [
      {
        id: 210,
        label: "Верхняя одежда",
        children: [],
      },
      {
        id: 211,
        label: "Обувь",
        children: [
          { id: 212, label: "Дерби", children: [] },
          { id: 213, label: "Лоферы", children: [] },
        ],
      },
    ],
  },
  {
    id: 214,
    label: "Скидки",
    children: [],
  },
];

export async function fetchAdminFiltersCategoriesMock(): Promise<AdminFiltersCategoriesPayload> {
  await delay(250);
  return {
    filters,
    categories,
    product_library: productLibrary,
  };
}
