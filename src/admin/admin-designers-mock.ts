import type { AdminFinalDesigner, AdminDesignerSourceRow } from "./admin-types";

const MOCK_LATENCY_MS = 180;

export type AdminCanonicalDesigner = {
  id: string;
  label: string;
  product_count: number;
  catalog_description: string | null;
};

export type AdminDesignerMappingsPayload = {
  rows: AdminDesignerSourceRow[];
  designers: AdminFinalDesigner[];
};

type InternalDesignerStore = {
  rows: AdminDesignerSourceRow[];
  designers: AdminFinalDesigner[];
};

const seedRows: AdminDesignerSourceRow[] = [
  { source_brand: "0-Hide", source_product_count: 7, designer_name: "0-Hide", include_in_designers: true },
  { source_brand: "07A", source_product_count: 4, designer_name: "07A", include_in_designers: true },
  { source_brand: "1-100", source_product_count: 9, designer_name: "1-100", include_in_designers: true },
  { source_brand: "1017 ALYX 9SM", source_product_count: 43, designer_name: "1017 ALYX 9SM", include_in_designers: true },
  { source_brand: "10sei0otto", source_product_count: 6, designer_name: "10sei0otto", include_in_designers: true },
  { source_brand: "11 by Boris Bidjan Saberi", source_product_count: 13, designer_name: "Boris Bidjan Saberi", include_in_designers: true },
  { source_brand: "14th Addiction", source_product_count: 15, designer_name: "14th Addiction", include_in_designers: true },
  { source_brand: "14thAddiction", source_product_count: 8, designer_name: "14th Addiction", include_in_designers: true },
  { source_brand: "16ARLINGTON", source_product_count: 11, designer_name: "16Arlington", include_in_designers: true },
  { source_brand: "20471120", source_product_count: 5, designer_name: "20471120", include_in_designers: true },
  { source_brand: "291295=HOMME", source_product_count: 12, designer_name: "291295=HOMME", include_in_designers: true },
  { source_brand: "424", source_product_count: 26, designer_name: "424", include_in_designers: true },
  { source_brand: "424 x Hoorsenbuhs", source_product_count: 6, designer_name: "424", include_in_designers: true },
  { source_brand: "A-COLD-WALL*", source_product_count: 21, designer_name: "A-COLD-WALL*", include_in_designers: true },
  { source_brand: "A.P.C.", source_product_count: 34, designer_name: "A.P.C.", include_in_designers: true },
  { source_brand: "Acne Studios", source_product_count: 58, designer_name: "Acne Studios", include_in_designers: true },
  { source_brand: "Ann Demeulemeester", source_product_count: 67, designer_name: "Ann Demeulemeester", include_in_designers: true },
  { source_brand: "Balenciaga", source_product_count: 74, designer_name: "Balenciaga", include_in_designers: true },
  { source_brand: "Boris Bidjan Saberi", source_product_count: 31, designer_name: "Boris Bidjan Saberi", include_in_designers: true },
  { source_brand: "Bottega Veneta", source_product_count: 49, designer_name: "Bottega Veneta", include_in_designers: true },
  { source_brand: "Carol Christian Poell", source_product_count: 28, designer_name: "Carol Christian Poell", include_in_designers: true },
  { source_brand: "CDG Homme Plus", source_product_count: 14, designer_name: "Comme des Garcons Homme Plus", include_in_designers: true },
  { source_brand: "Comme des Garcons", source_product_count: 41, designer_name: "Comme des Garcons", include_in_designers: true },
  { source_brand: "Craig Green", source_product_count: 23, designer_name: "Craig Green", include_in_designers: true },
  { source_brand: "Dries Van Noten", source_product_count: 63, designer_name: "Dries Van Noten", include_in_designers: true },
  { source_brand: "Enfants Riches Deprimes", source_product_count: 19, designer_name: "Enfants Riches Deprimes", include_in_designers: true },
  { source_brand: "Guidi", source_product_count: 37, designer_name: "Guidi", include_in_designers: true },
  { source_brand: "Jaded London", source_product_count: 52, designer_name: "Jaded London", include_in_designers: true },
  { source_brand: "Jil Sander", source_product_count: 46, designer_name: "Jil Sander", include_in_designers: true },
  { source_brand: "Maison Margiela", source_product_count: 71, designer_name: "Maison Margiela", include_in_designers: true },
  { source_brand: "Our Legacy", source_product_count: 39, designer_name: "Our Legacy", include_in_designers: true },
  { source_brand: "Protocol Index", source_product_count: 17, designer_name: "Protocol Index", include_in_designers: true },
  { source_brand: "Racer Worldwide", source_product_count: 22, designer_name: "Racer Worldwide", include_in_designers: true },
  { source_brand: "Raf Simons", source_product_count: 44, designer_name: "Raf Simons", include_in_designers: true },
  { source_brand: "Rick Owens", source_product_count: 83, designer_name: "Rick Owens", include_in_designers: true },
  { source_brand: "Sacai", source_product_count: 29, designer_name: "Sacai", include_in_designers: true },
  { source_brand: "Saint Laurent", source_product_count: 54, designer_name: "Saint Laurent", include_in_designers: true },
  { source_brand: "Takahiromiyashita TheSoloist.", source_product_count: 18, designer_name: "Takahiromiyashita TheSoloist.", include_in_designers: true },
  { source_brand: "The Row", source_product_count: 26, designer_name: "The Row", include_in_designers: true },
  { source_brand: "Undercover", source_product_count: 36, designer_name: "Undercover", include_in_designers: true },
  { source_brand: "Wales Bonner", source_product_count: 24, designer_name: "Wales Bonner", include_in_designers: true },
  { source_brand: "Yohji Yamamoto", source_product_count: 48, designer_name: "Yohji Yamamoto", include_in_designers: true },
  { source_brand: "Ziggy Chen", source_product_count: 16, designer_name: "Ziggy Chen", include_in_designers: true },
];

const seedDesignerDescriptions: Record<string, string> = {
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

function cloneRows(rows: readonly AdminDesignerSourceRow[]) {
  return rows.map((row) => ({ ...row }));
}

function cloneDesigners(designers: readonly AdminFinalDesigner[]) {
  return designers.map((designer) => ({ ...designer }));
}

function clonePayload(payload: AdminDesignerMappingsPayload): AdminDesignerMappingsPayload {
  return {
    rows: cloneRows(payload.rows),
    designers: cloneDesigners(payload.designers),
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

function buildSeedDesigners(rows: readonly AdminDesignerSourceRow[]): AdminFinalDesigner[] {
  const uniqueNames = [...new Set(rows.map((row) => normalizeText(row.designer_name)).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, "en", { numeric: true, sensitivity: "base" })
  );

  return uniqueNames.map((name) => ({
    id: `designer-${buildDesignerId(name)}`,
    name,
    description: seedDesignerDescriptions[name.toLowerCase()] || "",
  }));
}

function createUniqueDesignerId(baseName: string, usedIds: Set<string>) {
  const baseId = `designer-${buildDesignerId(baseName) || "designer"}`;
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

function normalizeDesignerRows(rows: readonly AdminDesignerSourceRow[]) {
  return cloneRows(rows).map((row) => ({
    source_brand: normalizeText(row.source_brand),
    source_product_count: Math.max(0, Math.trunc(Number(row.source_product_count) || 0)),
    designer_name: normalizeText(row.designer_name) || normalizeText(row.source_brand),
    include_in_designers: Boolean(row.include_in_designers),
  }));
}

function normalizeFinalDesigners(designers: readonly AdminFinalDesigner[]) {
  return cloneDesigners(designers).map((designer, index) => ({
    id: normalizeText(designer.id) || `designer-${index + 1}`,
    name: normalizeText(designer.name),
    description: normalizeText(designer.description),
  }));
}

function normalizeDesignerStore(nextStore: InternalDesignerStore): InternalDesignerStore {
  const rows = normalizeDesignerRows(nextStore.rows);
  const designers = normalizeFinalDesigners(nextStore.designers);
  const usedDesignerIds = new Set<string>();
  const preparedDesigners = designers.map((designer) => {
    const normalizedId = normalizeText(designer.id);
    if (!normalizedId) {
      return {
        ...designer,
        id: createUniqueDesignerId(designer.name || "designer", usedDesignerIds),
      };
    }
    if (usedDesignerIds.has(normalizedId)) {
      return {
        ...designer,
        id: createUniqueDesignerId(designer.name || "designer", usedDesignerIds),
      };
    }
    usedDesignerIds.add(normalizedId);
    return {
      ...designer,
      id: normalizedId,
    };
  });

  return {
    rows,
    designers: preparedDesigners,
  };
}

function createSeedStore(): InternalDesignerStore {
  return normalizeDesignerStore({
    rows: seedRows,
    designers: buildSeedDesigners(seedRows),
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
    designers: store.designers,
  });
}

export async function fetchAdminDesignerMappings(): Promise<AdminDesignerMappingsPayload> {
  return simulateResponse(buildPayload());
}

export async function saveAdminDesignerMappings(payload: AdminDesignerMappingsPayload): Promise<AdminDesignerMappingsPayload> {
  store = normalizeDesignerStore({
    rows: payload.rows,
    designers: payload.designers,
  });
  return simulateResponse(buildPayload(), MOCK_LATENCY_MS + 60);
}

export function readAdminDesignerMappingsSeed(): AdminDesignerMappingsPayload {
  return buildPayload();
}

export function readCanonicalAdminDesignersSeed(): AdminCanonicalDesigner[] {
  const payload = buildPayload();
  const descriptionByName = new Map(
    payload.designers.filter((designer) => designer.name).map((designer) => [designer.name.toLowerCase(), designer.description || null])
  );
  const aggregated = new Map<string, AdminCanonicalDesigner>();

  for (const row of payload.rows) {
    if (!row.include_in_designers) {
      continue;
    }

    const label = normalizeText(row.designer_name) || normalizeText(row.source_brand);
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
      catalog_description: descriptionByName.get(key) || null,
    });
  }

  return [...aggregated.values()].sort((left, right) => left.label.localeCompare(right.label, "en", { numeric: true, sensitivity: "base" }));
}
