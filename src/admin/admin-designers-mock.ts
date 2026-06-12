import type { AdminDesignerCatalogPage, AdminDesignerMappingRow } from "./admin-types";

const MOCK_LATENCY_MS = 180;

export type AdminCanonicalDesigner = {
  id: string;
  label: string;
  product_count: number;
  catalog_description: string | null;
};

export type AdminDesignerMappingsPayload = {
  rows: AdminDesignerMappingRow[];
  pages: AdminDesignerCatalogPage[];
};

type InternalDesignerStore = {
  rows: AdminDesignerMappingRow[];
  pages: AdminDesignerCatalogPage[];
};

const seedRows: AdminDesignerMappingRow[] = [
  { source_brand: "0-Hide", source_product_count: 7, catalog_title: "0-Hide", catalog_description: "", include_in_designers: true },
  { source_brand: "07A", source_product_count: 4, catalog_title: "07A", catalog_description: "", include_in_designers: true },
  { source_brand: "1-100", source_product_count: 9, catalog_title: "1-100", catalog_description: "", include_in_designers: true },
  { source_brand: "1017 ALYX 9SM", source_product_count: 43, catalog_title: "1017 ALYX 9SM", catalog_description: "", include_in_designers: true },
  { source_brand: "10sei0otto", source_product_count: 6, catalog_title: "10sei0otto", catalog_description: "", include_in_designers: true },
  { source_brand: "11 by Boris Bidjan Saberi", source_product_count: 13, catalog_title: "Boris Bidjan Saberi", catalog_description: "", include_in_designers: true },
  { source_brand: "14th Addiction", source_product_count: 15, catalog_title: "14th Addiction", catalog_description: "", include_in_designers: true },
  { source_brand: "14thAddiction", source_product_count: 8, catalog_title: "14th Addiction", catalog_description: "", include_in_designers: true },
  { source_brand: "16ARLINGTON", source_product_count: 11, catalog_title: "16Arlington", catalog_description: "", include_in_designers: true },
  { source_brand: "20471120", source_product_count: 5, catalog_title: "20471120", catalog_description: "", include_in_designers: true },
  { source_brand: "291295=HOMME", source_product_count: 12, catalog_title: "291295=HOMME", catalog_description: "", include_in_designers: true },
  { source_brand: "424", source_product_count: 26, catalog_title: "424", catalog_description: "", include_in_designers: true },
  { source_brand: "424 x Hoorsenbuhs", source_product_count: 6, catalog_title: "424", catalog_description: "", include_in_designers: true },
  { source_brand: "A-COLD-WALL*", source_product_count: 21, catalog_title: "A-COLD-WALL*", catalog_description: "", include_in_designers: true },
  { source_brand: "A.P.C.", source_product_count: 34, catalog_title: "A.P.C.", catalog_description: "", include_in_designers: true },
  { source_brand: "Acne Studios", source_product_count: 58, catalog_title: "Acne Studios", catalog_description: "", include_in_designers: true },
  { source_brand: "Ann Demeulemeester", source_product_count: 67, catalog_title: "Ann Demeulemeester", catalog_description: "", include_in_designers: true },
  { source_brand: "Balenciaga", source_product_count: 74, catalog_title: "Balenciaga", catalog_description: "", include_in_designers: true },
  { source_brand: "Boris Bidjan Saberi", source_product_count: 31, catalog_title: "Boris Bidjan Saberi", catalog_description: "", include_in_designers: true },
  { source_brand: "Bottega Veneta", source_product_count: 49, catalog_title: "Bottega Veneta", catalog_description: "", include_in_designers: true },
  { source_brand: "Carol Christian Poell", source_product_count: 28, catalog_title: "Carol Christian Poell", catalog_description: "", include_in_designers: true },
  { source_brand: "CDG Homme Plus", source_product_count: 14, catalog_title: "Comme des Garcons Homme Plus", catalog_description: "", include_in_designers: true },
  { source_brand: "Comme des Garcons", source_product_count: 41, catalog_title: "Comme des Garcons", catalog_description: "", include_in_designers: true },
  { source_brand: "Craig Green", source_product_count: 23, catalog_title: "Craig Green", catalog_description: "", include_in_designers: true },
  { source_brand: "Dries Van Noten", source_product_count: 63, catalog_title: "Dries Van Noten", catalog_description: "", include_in_designers: true },
  { source_brand: "Enfants Riches Deprimes", source_product_count: 19, catalog_title: "Enfants Riches Deprimes", catalog_description: "", include_in_designers: true },
  { source_brand: "Guidi", source_product_count: 37, catalog_title: "Guidi", catalog_description: "", include_in_designers: true },
  { source_brand: "Jaded London", source_product_count: 52, catalog_title: "Jaded London", catalog_description: "", include_in_designers: true },
  { source_brand: "Jil Sander", source_product_count: 46, catalog_title: "Jil Sander", catalog_description: "", include_in_designers: true },
  { source_brand: "Maison Margiela", source_product_count: 71, catalog_title: "Maison Margiela", catalog_description: "", include_in_designers: true },
  { source_brand: "Our Legacy", source_product_count: 39, catalog_title: "Our Legacy", catalog_description: "", include_in_designers: true },
  { source_brand: "Protocol Index", source_product_count: 17, catalog_title: "Protocol Index", catalog_description: "", include_in_designers: true },
  { source_brand: "Racer Worldwide", source_product_count: 22, catalog_title: "Racer Worldwide", catalog_description: "", include_in_designers: true },
  { source_brand: "Raf Simons", source_product_count: 44, catalog_title: "Raf Simons", catalog_description: "", include_in_designers: true },
  { source_brand: "Rick Owens", source_product_count: 83, catalog_title: "Rick Owens", catalog_description: "", include_in_designers: true },
  { source_brand: "Sacai", source_product_count: 29, catalog_title: "Sacai", catalog_description: "", include_in_designers: true },
  { source_brand: "Saint Laurent", source_product_count: 54, catalog_title: "Saint Laurent", catalog_description: "", include_in_designers: true },
  { source_brand: "Takahiromiyashita TheSoloist.", source_product_count: 18, catalog_title: "Takahiromiyashita TheSoloist.", catalog_description: "", include_in_designers: true },
  { source_brand: "The Row", source_product_count: 26, catalog_title: "The Row", catalog_description: "", include_in_designers: true },
  { source_brand: "Undercover", source_product_count: 36, catalog_title: "Undercover", catalog_description: "", include_in_designers: true },
  { source_brand: "Wales Bonner", source_product_count: 24, catalog_title: "Wales Bonner", catalog_description: "", include_in_designers: true },
  { source_brand: "Yohji Yamamoto", source_product_count: 48, catalog_title: "Yohji Yamamoto", catalog_description: "", include_in_designers: true },
  { source_brand: "Ziggy Chen", source_product_count: 16, catalog_title: "Ziggy Chen", catalog_description: "", include_in_designers: true },
];

const seedPageDescriptions: Record<string, string> = {
  "0-hide": "Небольшая архивная подборка 0-Hide с редкими вещами и ограниченным количеством размеров.",
  "07a": "Компактная выборка 07A с редкими позициями и акцентом на фактурные материалы.",
  "1-100": "Каталог 1-100 с повседневной одеждой, обувью и небольшим количеством аксессуаров из актуальных поступлений.",
  "1017 alyx 9sm": "Подборка 1017 ALYX 9SM: верхняя одежда, брюки, обувь и аксессуары с фирменной индустриальной фурнитурой.",
  "10sei0otto": "Коллекция 10sei0otto с кожаными изделиями ручной обработки и обувью в темной палитре.",
  "14th addiction": "Выборка 14th Addiction с кожаными куртками, денимом и декоративными деталями в рок-эстетике.",
  "16arlington": "Подборка 16Arlington с вечерними силуэтами, отделкой перьями, платьями и акцентными комплектами.",
  "20471120": "Редкие архивные вещи 20471120: трикотаж, футболки и коллекционные позиции для нишевого спроса.",
  "291295=homme": "Каталог 291295=HOMME с японским casual-ассортиментом: брюки, рубашки, легкая верхняя одежда и трикотаж.",
  "424": "Подборка 424 с streetwear-позициями: худи, футболки, деним и сезонные куртки.",
  "a-cold-wall*": "Каталог A-COLD-WALL* с технологичными силуэтами, функциональной верхней одеждой и аксессуарами.",
  "a.p.c.": "Коллекция A.P.C. с базовым французским гардеробом: деним, трикотаж, рубашки и лаконичные аксессуары.",
  "acne studios": "Подборка Acne Studios: деним, трикотаж, верхняя одежда, обувь и аксессуары в фирменной скандинавской эстетике.",
  "ann demeulemeester": "Коллекция Ann Demeulemeester: одежда, обувь и аксессуары в фирменной темной палитре.",
  "balenciaga": "Большой каталог Balenciaga: обувь, сумки, деним, верхняя одежда и знаковые oversize-силуэты.",
  "boris bidjan saberi": "Линия Boris Bidjan Saberi с окрашенными вручную тканями, тяжелым трикотажем, обувью и более утилитарными вещами.",
  "bottega veneta": "Каталог Bottega Veneta с кожаными аксессуарами, обувью, ready-to-wear и актуальными сезонными вещами.",
  "carol christian poell": "Подборка Carol Christian Poell с редкой обувью, кожей и экспериментальными формами из нишевых поставок.",
  "comme des garcons homme plus": "Линия Comme des Garcons Homme Plus с авангардным tailoring, деконструированными жакетами и архивными образами.",
  "comme des garcons": "Смешанная подборка Comme des Garcons: рубашки, пиджаки, трикотаж и аксессуары из разных линий бренда.",
  "craig green": "Коллекция Craig Green с конструктивной верхней одеждой, жилетами, брюками и характерной рабочей эстетикой.",
  "dries van noten": "Большая выборка Dries Van Noten: принтованные рубашки, пальто, трикотаж и обувь в фирменной цветовой гамме.",
  "enfants riches deprimes": "Одежда, аксессуары и редкие позиции Enfants Riches Deprimes из актуальных поставок.",
  "guidi": "Каталог Guidi с окрашенной кожаной обувью, сумками и редкими позициями ready-to-wear.",
  "jaded london": "Подборка Jaded London с трендовым денимом, сетами для выхода и заметными повседневными вещами.",
  "jil sander": "Каталог Jil Sander с минималистичным ready-to-wear: рубашки, пальто, трикотаж и кожаные аксессуары.",
  "maison margiela": "Большая подборка Maison Margiela: обувь Tabi, трикотаж, верхняя одежда и аксессуары из разных линий бренда.",
  "our legacy": "Коллекция Our Legacy с расслабленным tailoring, денимом, трикотажем и сезонной верхней одеждой.",
  "racer worldwide": "Подборка Racer Worldwide с графичными худи, брюками, верхней одеждой и локальными капсулами.",
  "raf simons": "Каталог Raf Simons с архивным денимом, свитерами, обувью и узнаваемыми силуэтами из разных сезонов.",
  "rick owens": "Коллекция Rick Owens: мужская и женская одежда, обувь и аксессуары.",
  "sacai": "Подборка Sacai с гибридными силуэтами, layered-конструкциями, обувью и верхней одеждой.",
  "saint laurent": "Каталог Saint Laurent: кожаные куртки, ботинки, деним, рубашки и вещи в рок-эстетике бренда.",
  "takahiromiyashita thesoloist.": "Подборка Takahiromiyashita TheSoloist. с верхней одеждой, трикотажем и аксессуарами.",
  "the row": "Женская и мужская коллекция The Row: ready-to-wear, обувь, сумки и аксессуары.",
  "undercover": "Каталог Undercover с графичными принтами, авангардным денимом, куртками и вещами из коллабораций.",
  "wales bonner": "Подборка Wales Bonner с мягким tailoring, трикотажем, спортивными капсулами и аксессуарами.",
  "yohji yamamoto": "Коллекция Yohji Yamamoto: черный tailoring, асимметричные силуэты, обувь и фирменный многослойный гардероб.",
};

function cloneRows(rows: readonly AdminDesignerMappingRow[]) {
  return rows.map((row) => ({ ...row }));
}

function clonePages(pages: readonly AdminDesignerCatalogPage[]) {
  return pages.map((page) => ({ ...page }));
}

function clonePayload(payload: AdminDesignerMappingsPayload): AdminDesignerMappingsPayload {
  return {
    rows: cloneRows(payload.rows),
    pages: clonePages(payload.pages),
  };
}

function normalizeText(value: string | null | undefined) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function buildDesignerId(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSeedPages(rows: readonly AdminDesignerMappingRow[]): AdminDesignerCatalogPage[] {
  const uniqueTitles = [...new Set(rows.map((row) => normalizeText(row.catalog_title)).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, "en", { numeric: true, sensitivity: "base" })
  );

  return uniqueTitles.map((title) => ({
    id: `page-${buildDesignerId(title)}`,
    title_ref: title,
    catalog_description: seedPageDescriptions[title.toLowerCase()] || "",
  }));
}

function createUniquePageId(baseTitle: string, usedIds: Set<string>) {
  const baseId = `page-${buildDesignerId(baseTitle) || "designer"}`;
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let suffix = 2;
  while (usedIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }
  const nextId = `${baseId}-${suffix}`;
  usedIds.add(nextId);
  return nextId;
}

function normalizeDesignerRows(rows: readonly AdminDesignerMappingRow[]) {
  return cloneRows(rows).map((row) => ({
    source_brand: normalizeText(row.source_brand),
    source_product_count: Math.max(0, Math.trunc(Number(row.source_product_count) || 0)),
    catalog_title: normalizeText(row.catalog_title) || normalizeText(row.source_brand),
    catalog_description: normalizeText(row.catalog_description),
    include_in_designers: Boolean(row.include_in_designers),
  }));
}

function normalizeDesignerPages(pages: readonly AdminDesignerCatalogPage[]) {
  return clonePages(pages).map((page, index) => ({
    id: normalizeText(page.id) || `page-${index + 1}`,
    title_ref: normalizeText(page.title_ref),
    catalog_description: normalizeText(page.catalog_description),
  }));
}

function normalizeDesignerStore(nextStore: InternalDesignerStore): InternalDesignerStore {
  const rows = normalizeDesignerRows(nextStore.rows);
  const pages = normalizeDesignerPages(nextStore.pages);
  const usedPageIds = new Set<string>();
  const preparedPages = pages.map((page) => {
    const normalizedId = normalizeText(page.id);
    if (!normalizedId) {
      return {
        ...page,
        id: createUniquePageId(page.title_ref || "designer", usedPageIds),
      };
    }
    if (usedPageIds.has(normalizedId)) {
      return {
        ...page,
        id: createUniquePageId(page.title_ref || "designer", usedPageIds),
      };
    }
    usedPageIds.add(normalizedId);
    return {
      ...page,
      id: normalizedId,
    };
  });
  const pageTitleKeys = new Set(preparedPages.filter((page) => page.title_ref).map((page) => page.title_ref.toLowerCase()));
  for (const row of rows) {
    const title = normalizeText(row.catalog_title);
    if (!title) {
      continue;
    }
    const titleKey = title.toLowerCase();
    if (pageTitleKeys.has(titleKey)) {
      continue;
    }
    preparedPages.push({
      id: createUniquePageId(title, usedPageIds),
      title_ref: title,
      catalog_description: seedPageDescriptions[titleKey] || "",
    });
    pageTitleKeys.add(titleKey);
  }
  const pageDescriptionByTitle = new Map(
    preparedPages.filter((page) => page.title_ref).map((page) => [page.title_ref.toLowerCase(), page.catalog_description])
  );

  return {
    rows: rows.map((row) => ({
      ...row,
      catalog_description: pageDescriptionByTitle.get(row.catalog_title.toLowerCase()) || "",
    })),
    pages: preparedPages,
  };
}

function createSeedStore(): InternalDesignerStore {
  return normalizeDesignerStore({
    rows: seedRows,
    pages: buildSeedPages(seedRows),
  });
}

let store: InternalDesignerStore = createSeedStore();

function simulateResponse<T>(value: T, latency = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), latency);
  });
}

function buildPayload(): AdminDesignerMappingsPayload {
  store = normalizeDesignerStore(store);
  return clonePayload({
    rows: store.rows,
    pages: store.pages,
  });
}

export async function fetchAdminDesignerMappings(): Promise<AdminDesignerMappingsPayload> {
  return simulateResponse(buildPayload());
}

export async function saveAdminDesignerMappings(payload: AdminDesignerMappingsPayload): Promise<AdminDesignerMappingsPayload> {
  store = normalizeDesignerStore({
    rows: payload.rows,
    pages: payload.pages,
  });
  return simulateResponse(buildPayload(), MOCK_LATENCY_MS + 60);
}

export function readAdminDesignerMappingsSeed(): AdminDesignerMappingsPayload {
  return buildPayload();
}

export function readCanonicalAdminDesignersSeed(): AdminCanonicalDesigner[] {
  const payload = buildPayload();
  const pageDescriptionByTitle = new Map(
    payload.pages.filter((page) => page.title_ref).map((page) => [page.title_ref.toLowerCase(), page.catalog_description || null])
  );
  const aggregated = new Map<string, AdminCanonicalDesigner>();

  for (const row of payload.rows) {
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
      current.product_count += row.source_product_count;
      continue;
    }

    aggregated.set(key, {
      id: buildDesignerId(label),
      label,
      product_count: row.source_product_count,
      catalog_description: pageDescriptionByTitle.get(key) || null,
    });
  }

  return [...aggregated.values()].sort((left, right) => left.label.localeCompare(right.label, "en", { numeric: true, sensitivity: "base" }));
}
