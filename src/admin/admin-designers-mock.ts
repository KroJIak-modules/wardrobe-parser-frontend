import type { AdminDesignerMappingRow } from "./admin-types";

const MOCK_LATENCY_MS = 180;

export type AdminCanonicalDesigner = {
  id: string;
  label: string;
  product_count: number;
  catalog_description: string | null;
};

const seedRows: AdminDesignerMappingRow[] = [
  { source_brand: "0-Hide", source_product_count: 7, catalog_title: "0-Hide", catalog_description: "", include_in_designers: false },
  { source_brand: "07A", source_product_count: 4, catalog_title: "07A", catalog_description: "Небольшая выборка 07A с редкими архивными позициями и акцентом на фактурные материалы.", include_in_designers: false },
  { source_brand: "1-100", source_product_count: 9, catalog_title: "1-100", catalog_description: "Каталог 1-100 с повседневной одеждой, обувью и небольшим количеством аксессуаров из актуальных поступлений.", include_in_designers: false },
  { source_brand: "1017 ALYX 9SM", source_product_count: 43, catalog_title: "1017 ALYX 9SM", catalog_description: "Подборка 1017 ALYX 9SM: верхняя одежда, брюки, обувь и аксессуары с фирменной индустриальной фурнитурой.", include_in_designers: true },
  { source_brand: "10sei0otto", source_product_count: 6, catalog_title: "10sei0otto", catalog_description: "Коллекция 10sei0otto с кожаными изделиями ручной обработки и обувью в темной палитре.", include_in_designers: false },
  { source_brand: "11 by Boris Bidjan Saberi", source_product_count: 13, catalog_title: "Boris Bidjan Saberi", catalog_description: "Линия Boris Bidjan Saberi с более утилитарными вещами: худи, брюки, куртки и базовые аксессуары.", include_in_designers: true },
  { source_brand: "14th Addiction", source_product_count: 15, catalog_title: "14th Addiction", catalog_description: "Выборка 14th Addiction с кожаными куртками, денимом и декоративными деталями в рок-эстетике.", include_in_designers: true },
  { source_brand: "14thAddiction", source_product_count: 8, catalog_title: "14th Addiction", catalog_description: "Дополнительные позиции 14th Addiction из смежных поставок с обувью, аксессуарами и верхней одеждой.", include_in_designers: false },
  { source_brand: "16ARLINGTON", source_product_count: 11, catalog_title: "16Arlington", catalog_description: "Подборка 16Arlington с вечерними силуэтами, отделкой перьями, платьями и акцентными комплектами.", include_in_designers: false },
  { source_brand: "20471120", source_product_count: 5, catalog_title: "20471120", catalog_description: "Редкие архивные вещи 20471120: трикотаж, футболки и коллекционные позиции для нишевого спроса.", include_in_designers: false },
  { source_brand: "291295=HOMME", source_product_count: 12, catalog_title: "291295=HOMME", catalog_description: "Каталог 291295=HOMME с японским casual-ассортиментом: брюки, рубашки, легкая верхняя одежда и трикотаж.", include_in_designers: false },
  { source_brand: "424", source_product_count: 26, catalog_title: "424", catalog_description: "Подборка 424 с streetwear-позициями: худи, футболки, деним и сезонные куртки.", include_in_designers: true },
  { source_brand: "424 x Hoorsenbuhs", source_product_count: 6, catalog_title: "424", catalog_description: "Коллаборационные вещи 424 x Hoorsenbuhs с ограниченным тиражом и акцентом на украшения и детали.", include_in_designers: false },
  { source_brand: "A-COLD-WALL*", source_product_count: 21, catalog_title: "A-COLD-WALL*", catalog_description: "Каталог A-COLD-WALL* с технологичными силуэтами, функциональной верхней одеждой и аксессуарами.", include_in_designers: true },
  { source_brand: "A.P.C.", source_product_count: 34, catalog_title: "A.P.C.", catalog_description: "Коллекция A.P.C. с базовым французским гардеробом: деним, трикотаж, рубашки и лаконичные аксессуары.", include_in_designers: true },
  { source_brand: "Acne Studios", source_product_count: 58, catalog_title: "Acne Studios", catalog_description: "Подборка Acne Studios: деним, трикотаж, верхняя одежда, обувь и аксессуары в фирменной скандинавской эстетике.", include_in_designers: true },
  {
    source_brand: "Ann Demeulemeester",
    source_product_count: 67,
    catalog_title: "Ann Demeulemeester",
    catalog_description: "Коллекция Ann Demeulemeester: одежда, обувь и аксессуары в фирменной темной палитре.",
    include_in_designers: true,
  },
  { source_brand: "Balenciaga", source_product_count: 74, catalog_title: "Balenciaga", catalog_description: "Большой каталог Balenciaga: обувь, сумки, деним, верхняя одежда и знаковые oversize-силуэты.", include_in_designers: true },
  { source_brand: "Boris Bidjan Saberi", source_product_count: 31, catalog_title: "Boris Bidjan Saberi", catalog_description: "Основная подборка Boris Bidjan Saberi с окрашенными вручную тканями, тяжелым трикотажем и обувью.", include_in_designers: true },
  { source_brand: "Bottega Veneta", source_product_count: 49, catalog_title: "Bottega Veneta", catalog_description: "Каталог Bottega Veneta с кожаными аксессуарами, обувью, ready-to-wear и актуальными сезонными вещами.", include_in_designers: true },
  { source_brand: "Carol Christian Poell", source_product_count: 28, catalog_title: "Carol Christian Poell", catalog_description: "Подборка Carol Christian Poell с редкой обувью, кожей и экспериментальными формами из нишевых поставок.", include_in_designers: true },
  { source_brand: "CDG Homme Plus", source_product_count: 14, catalog_title: "Comme des Garcons Homme Plus", catalog_description: "Линия Comme des Garcons Homme Plus с авангардным tailoring, деконструированными жакетами и архивными образами.", include_in_designers: false },
  { source_brand: "Comme des Garcons", source_product_count: 41, catalog_title: "Comme des Garcons", catalog_description: "Смешанная подборка Comme des Garcons: рубашки, пиджаки, трикотаж и аксессуары из разных линий бренда.", include_in_designers: true },
  { source_brand: "Craig Green", source_product_count: 23, catalog_title: "Craig Green", catalog_description: "Коллекция Craig Green с конструктивной верхней одеждой, жилетами, брюками и характерной рабочей эстетикой.", include_in_designers: true },
  { source_brand: "Dries Van Noten", source_product_count: 63, catalog_title: "Dries Van Noten", catalog_description: "Большая выборка Dries Van Noten: принтованные рубашки, пальто, трикотаж и обувь в фирменной цветовой гамме.", include_in_designers: true },
  {
    source_brand: "Enfants Riches Deprimes",
    source_product_count: 19,
    catalog_title: "Enfants Riches Deprimes",
    catalog_description: "Одежда, аксессуары и редкие позиции Enfants Riches Deprimes из актуальных поставок.",
    include_in_designers: true,
  },
  { source_brand: "Guidi", source_product_count: 37, catalog_title: "Guidi", catalog_description: "Каталог Guidi с окрашенной кожаной обувью, сумками и редкими позициями ready-to-wear.", include_in_designers: true },
  { source_brand: "Jaded London", source_product_count: 52, catalog_title: "Jaded London", catalog_description: "Подборка Jaded London с трендовым денимом, сетами для выхода и заметными повседневными вещами.", include_in_designers: true },
  { source_brand: "Jil Sander", source_product_count: 46, catalog_title: "Jil Sander", catalog_description: "Каталог Jil Sander с минималистичным ready-to-wear: рубашки, пальто, трикотаж и кожаные аксессуары.", include_in_designers: true },
  { source_brand: "Maison Margiela", source_product_count: 71, catalog_title: "Maison Margiela", catalog_description: "Большая подборка Maison Margiela: обувь Tabi, трикотаж, верхняя одежда и аксессуары из разных линий бренда.", include_in_designers: true },
  { source_brand: "Our Legacy", source_product_count: 39, catalog_title: "Our Legacy", catalog_description: "Коллекция Our Legacy с расслабленным tailoring, денимом, трикотажем и сезонной верхней одеждой.", include_in_designers: true },
  { source_brand: "Protocol Index", source_product_count: 17, catalog_title: "Protocol Index", catalog_description: "", include_in_designers: true },
  { source_brand: "Racer Worldwide", source_product_count: 22, catalog_title: "Racer Worldwide", catalog_description: "Подборка Racer Worldwide с графичными худи, брюками, верхней одеждой и локальными капсулами.", include_in_designers: true },
  { source_brand: "Raf Simons", source_product_count: 44, catalog_title: "Raf Simons", catalog_description: "Каталог Raf Simons с архивным денимом, свитерами, обувью и узнаваемыми силуэтами из разных сезонов.", include_in_designers: true },
  {
    source_brand: "Rick Owens",
    source_product_count: 83,
    catalog_title: "Rick Owens",
    catalog_description: "Коллекция Rick Owens: мужская и женская одежда, обувь и аксессуары.",
    include_in_designers: true,
  },
  { source_brand: "Sacai", source_product_count: 29, catalog_title: "Sacai", catalog_description: "Подборка Sacai с гибридными силуэтами, layered-конструкциями, обувью и верхней одеждой.", include_in_designers: true },
  { source_brand: "Saint Laurent", source_product_count: 54, catalog_title: "Saint Laurent", catalog_description: "Каталог Saint Laurent: кожаные куртки, ботинки, деним, рубашки и вещи в рок-эстетике бренда.", include_in_designers: true },
  {
    source_brand: "Takahiromiyashita TheSoloist.",
    source_product_count: 18,
    catalog_title: "Takahiromiyashita TheSoloist.",
    catalog_description: "Подборка Takahiromiyashita TheSoloist. с верхней одеждой, трикотажем и аксессуарами.",
    include_in_designers: true,
  },
  {
    source_brand: "The Row",
    source_product_count: 26,
    catalog_title: "The Row",
    catalog_description: "Женская и мужская коллекция The Row: ready-to-wear, обувь, сумки и аксессуары.",
    include_in_designers: true,
  },
  { source_brand: "Undercover", source_product_count: 36, catalog_title: "Undercover", catalog_description: "Каталог Undercover с графичными принтами, авангардным денимом, куртками и вещами из коллабораций.", include_in_designers: true },
  { source_brand: "Wales Bonner", source_product_count: 24, catalog_title: "Wales Bonner", catalog_description: "Подборка Wales Bonner с мягким tailoring, трикотажем, спортивными капсулами и аксессуарами.", include_in_designers: true },
  { source_brand: "Yohji Yamamoto", source_product_count: 48, catalog_title: "Yohji Yamamoto", catalog_description: "Коллекция Yohji Yamamoto: черный tailoring, асимметричные силуэты, обувь и фирменный многослойный гардероб.", include_in_designers: true },
  { source_brand: "Ziggy Chen", source_product_count: 16, catalog_title: "Ziggy Chen", catalog_description: "", include_in_designers: true },
];

let store: AdminDesignerMappingRow[] = structuredClone(seedRows);

function cloneRows(rows: readonly AdminDesignerMappingRow[]) {
  return rows.map((row) => ({ ...row }));
}

function buildDesignerId(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeText(value: string | null | undefined) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function pickCatalogDescription(rows: readonly AdminDesignerMappingRow[], label: string) {
  const exactMatch = rows.find((row) => normalizeText(row.source_brand).toLowerCase() === label.toLowerCase());
  if (exactMatch) {
    const exactDescription = normalizeText(exactMatch.catalog_description);
    if (exactDescription) {
      return exactDescription;
    }
  }

  const firstNonEmpty = rows
    .map((row) => normalizeText(row.catalog_description))
    .find((description) => description.length > 0);

  return firstNonEmpty || null;
}

function simulateResponse<T>(value: T, latency = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), latency);
  });
}

export async function fetchAdminDesignerMappings(): Promise<AdminDesignerMappingRow[]> {
  return simulateResponse(cloneRows(store));
}

export async function saveAdminDesignerMappings(rows: readonly AdminDesignerMappingRow[]): Promise<AdminDesignerMappingRow[]> {
  store = cloneRows(rows);
  return simulateResponse(cloneRows(store), MOCK_LATENCY_MS + 60);
}

export function readAdminDesignerMappingsSeed(): AdminDesignerMappingRow[] {
  return cloneRows(store);
}

export function readCanonicalAdminDesignersSeed(): AdminCanonicalDesigner[] {
  const aggregated = new Map<
    string,
    {
      label: string;
      product_count: number;
      rows: AdminDesignerMappingRow[];
    }
  >();

  for (const row of store) {
    if (!row.include_in_designers) {
      continue;
    }

    const label = normalizeText(row.catalog_title) || normalizeText(row.source_brand);
    if (!label) {
      continue;
    }

    const key = label.toLowerCase();
    const current = aggregated.get(key);
    if (current) {
      current.product_count += Math.max(0, Math.trunc(Number(row.source_product_count) || 0));
      current.rows.push({ ...row });
      continue;
    }

    aggregated.set(key, {
      label,
      product_count: Math.max(0, Math.trunc(Number(row.source_product_count) || 0)),
      rows: [{ ...row }],
    });
  }

  return [...aggregated.values()]
    .map((entry) => ({
      id: buildDesignerId(entry.label),
      label: entry.label,
      product_count: entry.product_count,
      catalog_description: pickCatalogDescription(entry.rows, entry.label),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "en", { numeric: true, sensitivity: "base" }));
}
