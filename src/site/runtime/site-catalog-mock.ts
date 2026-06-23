import type {
  SiteCatalogCustomCatalog,
  SiteCatalogDesigner,
  SiteCatalogDropdownMenuMap,
  SiteCatalogFilterGroup,
  SiteCatalogMenuConfig,
  SiteCatalogMultiFilter,
  SiteCatalogProduct,
  SiteCatalogSection,
  SiteCatalogTopKey,
} from "../features/catalog/site-catalog-contracts";
import { buildCatalogHref } from "../features/catalog/site-catalog-query";

const SOCIAL_CATALOG_URL = "https://t.me/antonshellog";

export const siteCatalogDesigners: readonly SiteCatalogDesigner[] = [
  { id: "guidi", label: "Guidi", description: null },
  { id: "protocol-index", label: "Protocol Index", description: null },
  { id: "ann-demeulemeester", label: "Ann Demeulemeester", description: null },
  {
    id: "nofaithstudios",
    label: "Nofaithstudios",
    description:
      "Nofaithstudios — немецкий авангардный бренд, работающий на стыке washed-денима, тяжелого трикотажа и индустриального силуэта. Их вещи легко узнаются по сложной обработке ткани, дистрессу, пыльным оттенкам и объемной, но при этом собранной посадке. Бренд не пытается быть декоративным ради декоративности: каждая вещь ощущается как законченный объект с характером, фактурой и очень точным настроением. В основе марки лежит интерес к изношенной поверхности, тяжелой фурнитуре и вещам, которые выглядят так, будто уже прожили свою собственную историю до встречи с владельцем.",
  },
  { id: "alice-hollywood", label: "Alice Hollywood", description: null },
  { id: "racer-worldwide", label: "Racer Worldwide", description: null },
  { id: "enfants-riches-deprimes", label: "Enfants Riches Deprimes", description: null },
  { id: "424", label: "424", description: null },
  { id: "raf-simons", label: "Raf Simons", description: null },
  { id: "balenciaga", label: "Balenciaga", description: null },
  { id: "14th-addiction", label: "14th Addiction", description: null },
  {
    id: "rick-owens",
    label: "Rick Owens",
    description: "Культовый dark-luxury дизайнер с вытянутыми пропорциями, архитектурным кроем и драматичным денимом.",
  },
  { id: "jaded-london", label: "Jaded London", description: null },
  { id: "a-paper-kid", label: "A Paper Kid", description: null },
  { id: "a-cold-wall", label: "A-COLD-WALL", description: null },
  { id: "a-p-c", label: "A.P.C.", description: null },
  { id: "brain-dead", label: "Brain Dead", description: null },
  { id: "breechka-magazine", label: "Breechka Magazine", description: null },
  { id: "bruler-d-amour", label: "Bruler d'Amour", description: null },
  { id: "d-heygere", label: "D'heygere", description: null },
  { id: "comme-des-garcons-junya-watanabe", label: "Comme Des Garcons Junya Watanabe", description: null },
  { id: "easy-peasy", label: "Easy Peasy", description: null },
  { id: "evisen", label: "Evisen", description: null },
  { id: "fear-of-god", label: "Fear Of God", description: null },
  { id: "heliot-emil", label: "Heliot Emil", description: null },
  { id: "issey-miyake", label: "Issey Miyake", description: null },
  { id: "kapital", label: "Kapital", description: null },
  { id: "lemaire", label: "Lemaire", description: null },
  { id: "marni", label: "Marni", description: null },
  { id: "our-legacy", label: "Our Legacy", description: null },
  { id: "qasimi", label: "Qasimi", description: null },
];

export const siteCatalogSections: readonly SiteCatalogSection[] = [
  { id: "tees-longsleeves", label: "Футболки и лонгсливы", menuTopKeys: ["new"], multiFilterIds: ["clothing", "top"] },
  { id: "sneakers", label: "Кроссовки и кеды", menuTopKeys: ["new"], multiFilterIds: ["shoes"] },
  { id: "shorts", label: "Шорты", menuTopKeys: ["new"], multiFilterIds: ["clothing", "bottom"] },
  { id: "shirts-blouses", label: "Рубашки и блузы", menuTopKeys: ["new"], multiFilterIds: ["clothing", "top"] },
  { id: "hoodies", label: "Свитшоты и худи", menuTopKeys: ["new"], multiFilterIds: ["clothing", "top"] },
  { id: "dresses", label: "Платья", menuTopKeys: ["new"], multiFilterIds: ["clothing"] },
  { id: "tees-tops", label: "Футболки и топы", menuTopKeys: ["new"], multiFilterIds: ["clothing", "top"] },
  { id: "outerwear", label: "Верхняя одежда", menuTopKeys: ["new"], multiFilterIds: ["clothing", "top"] },
  { id: "boots", label: "Ботинки и сапоги", menuTopKeys: ["new"], multiFilterIds: ["shoes"] },
  { id: "denim-trousers", label: "Джинсы и штаны", menuTopKeys: ["new"], multiFilterIds: ["clothing", "bottom"] },
  { id: "shorts-skirts", label: "Шорты и юбки", menuTopKeys: ["new"], multiFilterIds: ["clothing", "bottom"] },
  { id: "heels", label: "Туфли", menuTopKeys: ["new"], multiFilterIds: ["shoes"] },
  { id: "jewelry", label: "Украшения", menuTopKeys: ["new"], multiFilterIds: ["accessories"] },
  { id: "bags", label: "Сумки", menuTopKeys: ["new"], multiFilterIds: ["accessories"] },
  { id: "shirts-polo", label: "Рубашки и поло", menuTopKeys: ["new"], multiFilterIds: ["clothing", "top"] },
  { id: "belts", label: "Ремни", menuTopKeys: ["new"], multiFilterIds: ["accessories"] },
  { id: "headwear", label: "Головные уборы", menuTopKeys: ["new"], multiFilterIds: ["accessories", "top"] },
  { id: "glasses", label: "Очки", menuTopKeys: ["new"], multiFilterIds: ["accessories"] },
  { id: "other", label: "Другое", menuTopKeys: ["new"], multiFilterIds: ["accessories"] },
];

export const siteCatalogMultiFilters: readonly SiteCatalogMultiFilter[] = [
  { id: "clothing", label: "Одежда" },
  { id: "shoes", label: "Обувь" },
  { id: "accessories", label: "Аксессуары" },
  { id: "top", label: "Верх" },
  { id: "bottom", label: "Низ" },
];

export const siteCatalogCustomCatalogs: readonly SiteCatalogCustomCatalog[] = [
  {
    id: "my-choice",
    label: "Мой выбор",
    description:
      "Личная подборка Anton Shell из сезонных вещей, которые лучше всего раскрывают настроение текущей витрины. Здесь собраны позиции, которые я бы в первую очередь советовал тем, кто хочет собрать сильный образ без случайных компромиссов по силуэту, фактуре и общему ощущению вещи в реальной носке. Это не просто список понравившихся товаров, а короткий маршрут по тем предметам, с которых проще всего начать знакомство с эстетикой магазина и собрать цельный гардеробный акцент.",
    productIds: ["product-trucker", "product-gloves", "product-belt", "product-low-waist"],
  },
];

const siteCatalogProductTemplates: readonly SiteCatalogProduct[] = [
  {
    id: "product-trucker",
    brand: "Nofaithstudios",
    name: "Japanese Dust Selvedge Trucker Jacket",
    priceRub: 19990,
    availability: "В наличии",
    availabilityCode: "in-stock",
    imageSrc: "/site-mock/product-trucker.jpg",
    imageAlt: "Japanese Dust Selvedge Trucker Jacket",
    designerId: "nofaithstudios",
    genders: ["men"],
    sectionIds: ["outerwear"],
    customCatalogIds: ["my-choice"],
    isSale: false,
  },
  {
    id: "product-denim",
    brand: "Nofaithstudios",
    name: "Lake Used Dune Denim",
    priceRub: 19990,
    availability: "В наличии",
    availabilityCode: "in-stock",
    imageSrc: "/site-mock/product-denim.jpg",
    imageAlt: "Lake Used Dune Denim",
    designerId: "nofaithstudios",
    genders: ["women"],
    sectionIds: ["denim-trousers"],
    customCatalogIds: [],
    isSale: false,
  },
  {
    id: "product-hoodie",
    brand: "Nofaithstudios",
    name: "Heavy Flight Shearling Hoodie Black",
    priceRub: 26990,
    availability: "Под заказ",
    availabilityCode: "preorder",
    imageSrc: "/site-mock/product-hoodie.jpg",
    imageAlt: "Heavy Flight Shearling Hoodie Black",
    designerId: "nofaithstudios",
    genders: ["men", "women"],
    sectionIds: ["hoodies"],
    customCatalogIds: [],
    isSale: false,
  },
  {
    id: "product-grey-zip",
    brand: "Nofaithstudios",
    name: "Saarland Zipper Used Grey",
    priceRub: 21990,
    availability: "В наличии",
    availabilityCode: "in-stock",
    imageSrc: "/site-mock/product-grey-zip.jpg",
    imageAlt: "Saarland Zipper Used Grey",
    designerId: "nofaithstudios",
    genders: ["women"],
    sectionIds: ["hoodies"],
    customCatalogIds: [],
    isSale: false,
  },
  {
    id: "product-gloves",
    brand: "Alice Hollywood",
    name: "Moto Couture Gloves Blackout",
    priceRub: 10990,
    availability: "В наличии",
    availabilityCode: "in-stock",
    imageSrc: "/site-mock/product-gloves.jpg",
    imageAlt: "Moto Couture Gloves Blackout",
    designerId: "alice-hollywood",
    genders: ["men", "women"],
    sectionIds: ["other"],
    customCatalogIds: ["my-choice"],
    isSale: false,
  },
  {
    id: "product-low-waist",
    brand: "Racer Worldwide",
    name: "Slim Low-Waist Denim",
    priceRub: 19990,
    availability: "Под заказ",
    availabilityCode: "preorder",
    imageSrc: "/site-mock/product-low-waist.jpg",
    imageAlt: "Slim Low-Waist Denim",
    designerId: "racer-worldwide",
    genders: ["women"],
    sectionIds: ["denim-trousers"],
    customCatalogIds: ["my-choice"],
    isSale: false,
  },
  {
    id: "product-camo-pants",
    brand: "Jaded London",
    name: "Colossous Pants Camo Suit Baggy Fit",
    priceRub: 9990,
    availability: "Под заказ",
    availabilityCode: "preorder",
    imageSrc: "/site-mock/product-camo-pants.jpg",
    imageAlt: "Colossous Pants Camo Suit Baggy Fit",
    designerId: "jaded-london",
    genders: ["men"],
    sectionIds: ["denim-trousers"],
    customCatalogIds: [],
    isSale: false,
  },
  {
    id: "product-belt",
    brand: "Alice Hollywood",
    name: "Swarowski Belt Classic",
    priceRub: 19990,
    availability: "Под заказ",
    availabilityCode: "preorder",
    imageSrc: "/site-mock/product-belt.jpg",
    imageAlt: "Swarowski Belt Classic",
    designerId: "alice-hollywood",
    genders: ["men", "women"],
    sectionIds: ["belts"],
    customCatalogIds: ["my-choice"],
    isSale: false,
  },
  {
    id: "product-trucker-repeat",
    brand: "Nofaithstudios",
    name: "Japanese Dust Selvedge Trucker Jacket",
    priceRub: 19990,
    availability: "В наличии",
    availabilityCode: "in-stock",
    imageSrc: "/site-mock/product-trucker.jpg",
    imageAlt: "Japanese Dust Selvedge Trucker Jacket",
    designerId: "nofaithstudios",
    genders: ["men"],
    sectionIds: ["outerwear"],
    customCatalogIds: [],
    isSale: false,
  },
  {
    id: "product-denim-repeat",
    brand: "Nofaithstudios",
    name: "Lake Used Dune Denim",
    priceRub: 19990,
    availability: "В наличии",
    availabilityCode: "in-stock",
    imageSrc: "/site-mock/product-denim.jpg",
    imageAlt: "Lake Used Dune Denim",
    designerId: "nofaithstudios",
    genders: ["women"],
    sectionIds: ["denim-trousers"],
    customCatalogIds: [],
    isSale: false,
  },
  {
    id: "product-hoodie-repeat",
    brand: "Nofaithstudios",
    name: "Heavy Flight Shearling Hoodie Black",
    priceRub: 26990,
    availability: "Под заказ",
    availabilityCode: "preorder",
    imageSrc: "/site-mock/product-hoodie.jpg",
    imageAlt: "Heavy Flight Shearling Hoodie Black",
    designerId: "nofaithstudios",
    genders: ["men", "women"],
    sectionIds: ["hoodies"],
    customCatalogIds: [],
    isSale: false,
  },
  {
    id: "product-grey-zip-repeat",
    brand: "Nofaithstudios",
    name: "Saarland Zipper Used Grey",
    priceRub: 21990,
    availability: "В наличии",
    availabilityCode: "in-stock",
    imageSrc: "/site-mock/product-grey-zip.jpg",
    imageAlt: "Saarland Zipper Used Grey",
    designerId: "nofaithstudios",
    genders: ["women"],
    sectionIds: ["hoodies"],
    customCatalogIds: [],
    isSale: false,
  },
];

function buildMockCatalogProducts(templates: readonly SiteCatalogProduct[], totalCount: number): readonly SiteCatalogProduct[] {
  return Array.from({ length: totalCount }, (_, index) => {
    const template = templates[index % templates.length];
    const cycle = Math.floor(index / templates.length);

    if (cycle === 0) {
      return template;
    }

    return {
      ...template,
      id: `${template.id}-mock-${cycle + 1}`,
    };
  });
}

export const siteCatalogProducts: readonly SiteCatalogProduct[] = buildMockCatalogProducts(siteCatalogProductTemplates, 960);

export const siteCatalogFilterGroups: readonly SiteCatalogFilterGroup[] = [
  {
    key: "sort",
    label: "Сортировка",
    queryParam: "sort",
    selectionMode: "single",
    triggerWidthPx: 110,
    panelHeightPx: 65,
    panelListWidthPx: 110,
    panelFlyoutWidthPx: 134,
    panelListTopPx: 7,
    panelListHeightPx: 51,
    panelListAlign: "center",
    options: [
      { id: "sort-price-desc", label: "Сначала дороже", value: "price-desc" },
      { id: "sort-price-asc", label: "Сначала дешевле", value: "price-asc" },
      { id: "sort-featured", label: "Сначала новые", value: "featured", keepAtBottom: true },
    ],
  },
  {
    key: "availability",
    label: "Наличие",
    queryParam: "availability",
    selectionMode: "single",
    triggerWidthPx: 80,
    panelHeightPx: 46,
    panelListWidthPx: 72,
    panelFlyoutWidthPx: 134,
    panelListTopPx: 7,
    panelListHeightPx: 32,
    panelListAlign: "center",
    options: [
      { id: "availability-preorder", label: "Под заказ", value: "preorder" },
      { id: "availability-in-stock", label: "В наличии", value: "in-stock" },
    ],
  },
  {
    key: "section",
    label: "Раздел",
    queryParam: "section",
    selectionMode: "multiple",
    triggerWidthPx: 65,
    panelHeightPx: 369,
    panelListWidthPx: 117,
    panelFlyoutWidthPx: 133,
    panelListTopPx: 7,
    panelListLeftPx: 7,
    panelListHeightPx: 355,
    panelListAlign: "start",
    options: siteCatalogSections.map((section) => ({ id: section.id, label: section.label, value: section.id })),
    panelWidth: "wide",
    maxVisibleOptions: 19,
    prioritizeSelected: true,
  },
  {
    key: "designer",
    label: "Дизайнеры",
    queryParam: "designer",
    selectionMode: "multiple",
    triggerWidthPx: 105,
    panelHeightPx: 160,
    panelListWidthPx: 120,
    panelFlyoutWidthPx: 134,
    panelListTopPx: 7,
    panelListLeftPx: 7,
    panelListHeightPx: 146,
    panelListAlign: "start",
    options: [
      ...siteCatalogDesigners.slice(0, 7).map((designer) => ({
        id: designer.id,
        label: designer.label,
        value: designer.id,
      })),
      { id: "all-designers", label: "Смотреть все", value: "__all-designers" },
    ],
    panelWidth: "wide",
    maxVisibleOptions: 8,
    prioritizeSelected: true,
  },
  {
    key: "gender",
    label: "Пол",
    queryParam: "gender",
    selectionMode: "single",
    triggerWidthPx: 35,
    panelHeightPx: 46,
    panelListWidthPx: 72,
    panelFlyoutWidthPx: 134,
    panelListTopPx: 7,
    panelListHeightPx: 32,
    panelListAlign: "center",
    options: [
      { id: "gender-men", label: "Мужской", value: "men" },
      { id: "gender-women", label: "Женский", value: "women" },
    ],
  },
];

function buildSectionLink(sectionId: string) {
  return buildCatalogHref({
    top: "new",
    collection: null,
    multi: null,
    section: [sectionId],
  });
}

function buildMultiLink(top: SiteCatalogTopKey, multiId: string) {
  return buildCatalogHref({
    top,
    multi: multiId,
    collection: null,
    section: null,
  });
}

export const siteCatalogMenuConfig: SiteCatalogMenuConfig = {
  topMenuItems: [
    { label: "Новинки" },
    { label: "Дизайнеры" },
    { label: "Мужское" },
    { label: "Женское" },
    { label: "Скидки", to: "/sale" },
  ],
  dropdownMenus: {
    "Новинки": [
      {
        title: "Коллекции",
        items: [
          { label: "В наличии", to: buildCatalogHref({ top: "new", collection: "in-stock", availability: "in-stock" }) },
          { label: "Под заказ", to: buildCatalogHref({ top: "new", collection: "preorder", availability: "preorder" }) },
          { label: "Мой выбор", to: buildCatalogHref({ top: "new", collection: "my-choice" }) },
          { label: "Все товары", to: buildCatalogHref({ top: "new", collection: "all-products" }) },
        ],
      },
      {
        title: "Разделы",
        items: siteCatalogSections.map((section) => ({ label: section.label, to: buildSectionLink(section.id) })),
      },
    ],
    "Дизайнеры": [
      {
        title: "Каталог дизайнеров",
        items: [
          { label: "Все дизайнеры", to: buildCatalogHref({ top: "designers" }) },
          ...siteCatalogDesigners.map((designer) => ({
            label: designer.label,
            to: buildCatalogHref({ top: "designers", designer: [designer.id] }),
          })),
        ],
      },
    ],
    "Мужское": [
      {
        title: "Мультифильтры",
        items: siteCatalogMultiFilters.map((item) => ({
          label: item.label,
          to: buildMultiLink("men", item.id),
        })),
      },
    ],
    "Женское": [
      {
        title: "Мультифильтры",
        items: siteCatalogMultiFilters.map((item) => ({
          label: item.label,
          to: buildMultiLink("women", item.id),
        })),
      },
    ],
    "Скидки": [
      {
        title: "Коллекция",
        items: [{ label: "Все скидки", to: buildCatalogHref({ top: "sale" }) }],
      },
    ],
  } satisfies SiteCatalogDropdownMenuMap,
};

export const siteCatalogExternalLinks = {
  social: SOCIAL_CATALOG_URL,
} as const;
