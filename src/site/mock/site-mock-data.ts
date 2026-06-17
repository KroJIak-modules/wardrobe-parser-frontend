export type SiteNavItem = {
  label: string;
  to?: string;
};

export type SiteCarouselSlide = {
  id: string;
  imageSrc: string;
  alt: string;
};

export type SiteProduct = {
  id: string;
  brand: string;
  name: string;
  priceRub: number;
  availability: string;
  imageSrc: string;
  imageAlt: string;
};

export type SiteFooterColumn = {
  title: string;
  links: string[];
};

export const landingHeroImageSrc = "/site-mock/landing-hero.jpg";
export const landingHeroButtonLabel = "НАЖМИТЕ ЧТОБЫ ВОЙТИ";

export const siteMenuItems: SiteNavItem[] = [
  { label: "Новинки", to: "/catalog" },
  { label: "Дизайнеры", to: "/catalog" },
  { label: "Мужское", to: "/catalog" },
  { label: "Женское", to: "/catalog" },
  { label: "Скидки", to: "/catalog" },
];

export const siteActionItems: SiteNavItem[] = [{ label: "Поиск" }, { label: "Корзина" }];

export const siteCarouselSlides: SiteCarouselSlide[] = [
  {
    id: "carousel-left",
    imageSrc: "/site-mock/carousel-left.jpg",
    alt: "Левый кадр карусели",
  },
  {
    id: "carousel-center",
    imageSrc: "/site-mock/carousel-center.jpg",
    alt: "Центральный кадр карусели",
  },
  {
    id: "carousel-right",
    imageSrc: "/site-mock/carousel-right.jpg",
    alt: "Правый кадр карусели",
  },
];

export const siteProducts: SiteProduct[] = [
  {
    id: "trucker-jacket-a",
    brand: "Nofaithstudios",
    name: "Japanese Dust Selvedge Trucker Jacket",
    priceRub: 19990,
    availability: "В наличии",
    imageSrc: "/site-mock/product-trucker.jpg",
    imageAlt: "Джинсовая куртка Nofaithstudios",
  },
  {
    id: "lake-used-denim-a",
    brand: "Nofaithstudios",
    name: "Lake Used Denim",
    priceRub: 19990,
    availability: "В наличии",
    imageSrc: "/site-mock/product-denim.jpg",
    imageAlt: "Джинсы Nofaithstudios",
  },
  {
    id: "hoodie-black-a",
    brand: "Nofaithstudios",
    name: "Heavy Flight Shearling Hoodie Black",
    priceRub: 26990,
    availability: "Под заказ",
    imageSrc: "/site-mock/product-hoodie.jpg",
    imageAlt: "Черное худи Nofaithstudios",
  },
  {
    id: "grey-zip-a",
    brand: "Nofaithstudios",
    name: "Saarland Zipper Used Grey",
    priceRub: 21990,
    availability: "В наличии",
    imageSrc: "/site-mock/product-grey-zip.jpg",
    imageAlt: "Серое худи на молнии Nofaithstudios",
  },
  {
    id: "gloves-blackout",
    brand: "Alice Hollywood",
    name: "Moto Couture Gloves Blackout",
    priceRub: 10990,
    availability: "В наличии",
    imageSrc: "/site-mock/product-gloves.jpg",
    imageAlt: "Черные перчатки Alice Hollywood",
  },
  {
    id: "low-waist-denim",
    brand: "Racer Worldwide",
    name: "Slim Low-Waist Denim",
    priceRub: 19990,
    availability: "Под заказ",
    imageSrc: "/site-mock/product-low-waist.jpg",
    imageAlt: "Джинсы Racer Worldwide",
  },
  {
    id: "camo-suit-baggy",
    brand: "Jaded London",
    name: "Colossous Pants Camo Suit Baggy Fit",
    priceRub: 9990,
    availability: "Под заказ",
    imageSrc: "/site-mock/product-camo-pants.jpg",
    imageAlt: "Широкие камуфляжные брюки Jaded London",
  },
  {
    id: "belt-classic",
    brand: "Alice Hollywood",
    name: "Swarowski Belt Classic",
    priceRub: 19990,
    availability: "Под заказ",
    imageSrc: "/site-mock/product-belt.jpg",
    imageAlt: "Ремень Alice Hollywood",
  },
  {
    id: "trucker-jacket-b",
    brand: "Nofaithstudios",
    name: "Japanese Dust Selvedge Trucker Jacket",
    priceRub: 19990,
    availability: "В наличии",
    imageSrc: "/site-mock/product-trucker.jpg",
    imageAlt: "Джинсовая куртка Nofaithstudios",
  },
  {
    id: "lake-used-denim-b",
    brand: "Nofaithstudios",
    name: "Lake Used Denim",
    priceRub: 19990,
    availability: "В наличии",
    imageSrc: "/site-mock/product-denim.jpg",
    imageAlt: "Джинсы Nofaithstudios",
  },
  {
    id: "hoodie-black-b",
    brand: "Nofaithstudios",
    name: "Heavy Flight Shearling Hoodie Black",
    priceRub: 26990,
    availability: "Под заказ",
    imageSrc: "/site-mock/product-hoodie.jpg",
    imageAlt: "Черное худи Nofaithstudios",
  },
  {
    id: "grey-zip-b",
    brand: "Nofaithstudios",
    name: "Saarland Zipper Used Grey",
    priceRub: 21990,
    availability: "В наличии",
    imageSrc: "/site-mock/product-grey-zip.jpg",
    imageAlt: "Серое худи на молнии Nofaithstudios",
  },
];

export const siteFooterColumns: SiteFooterColumn[] = [
  {
    title: "Социальные сети",
    links: ["Telegram", "Instagram", "VK"],
  },
  {
    title: "Полезная информация",
    links: ["Обо мне", "Отзывы", "Вопросы", "Публичная оферта"],
  },
];
