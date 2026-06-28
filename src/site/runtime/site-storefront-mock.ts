import { SITE_HERO_DESKTOP_URL, SITE_HERO_MOBILE_URL } from "../app/site-public-asset";
import type { SiteProduct, SiteShowcaseMedia } from "../features/storefront/site-storefront-contracts";

export const siteShowcaseMockMedia: SiteShowcaseMedia = {
  heroImageSrcDesktop: SITE_HERO_DESKTOP_URL,
  heroImageSrcMobile: SITE_HERO_MOBILE_URL,
  carouselSlidesDesktop: [
    {
      id: "carousel-128",
      imageSrc: "/site-mock/home-carousel/128.jpg",
      alt: "Кадр витрины Anton Shell 1",
    },
    {
      id: "carousel-129",
      imageSrc: "/site-mock/home-carousel/129.jpg",
      alt: "Кадр витрины Anton Shell 2",
    },
    {
      id: "carousel-130",
      imageSrc: "/site-mock/home-carousel/130.jpg",
      alt: "Кадр витрины Anton Shell 3",
    },
    {
      id: "carousel-127",
      imageSrc: "/site-mock/home-carousel/127.jpg",
      alt: "Кадр витрины Anton Shell 4",
    },
  ],
  carouselSlidesMobile: [
    {
      id: "carousel-mobile-01",
      imageSrc: "/site-mock/home-carousel-mobile/01.jpg",
      alt: "Мобильный кадр витрины Anton Shell 1",
    },
    {
      id: "carousel-mobile-02",
      imageSrc: "/site-mock/home-carousel-mobile/02.jpg",
      alt: "Мобильный кадр витрины Anton Shell 2",
    },
    {
      id: "carousel-mobile-03",
      imageSrc: "/site-mock/home-carousel-mobile/03.jpg",
      alt: "Мобильный кадр витрины Anton Shell 3",
    },
    {
      id: "carousel-mobile-04",
      imageSrc: "/site-mock/home-carousel-mobile/04.jpg",
      alt: "Мобильный кадр витрины Anton Shell 4",
    },
    {
      id: "carousel-mobile-05",
      imageSrc: "/site-mock/home-carousel-mobile/05.jpg",
      alt: "Мобильный кадр витрины Anton Shell 5",
    },
    {
      id: "carousel-mobile-06",
      imageSrc: "/site-mock/home-carousel-mobile/06.jpg",
      alt: "Мобильный кадр витрины Anton Shell 6",
    },
    {
      id: "carousel-mobile-07",
      imageSrc: "/site-mock/home-carousel-mobile/07.jpg",
      alt: "Мобильный кадр витрины Anton Shell 7",
    },
    {
      id: "carousel-mobile-08",
      imageSrc: "/site-mock/home-carousel-mobile/08.jpg",
      alt: "Мобильный кадр витрины Anton Shell 8",
    },
  ],
};

export const siteMockProducts: SiteProduct[] = [
  {
    id: "product-trucker",
    brand: "Nofaithstudios",
    designerId: "nofaithstudios",
    name: "Japanese Dust Selvedge Trucker Jacket",
    priceRub: 19990,
    availability: "В наличии",
    imageSrc: "/site-mock/product-trucker.jpg",
    imageAlt: "Japanese Dust Selvedge Trucker Jacket",
  },
  {
    id: "product-low-waist",
    brand: "Nofaithstudios",
    designerId: "nofaithstudios",
    name: "Lake Used Dune Denim",
    priceRub: 19990,
    availability: "В наличии",
    imageSrc: "/site-mock/product-low-waist.jpg",
    imageAlt: "Lake Used Dune Denim",
  },
  {
    id: "product-hoodie",
    brand: "Nofaithstudios",
    designerId: "nofaithstudios",
    name: "Heavy Flight Double Layer Shearling Zip Hoodie Washed Black With Distressed Thermal Panels",
    priceRub: 26990,
    availability: "Под заказ",
    imageSrc: "/site-mock/product-hoodie.jpg",
    imageAlt: "Heavy Flight Double Layer Shearling Zip Hoodie Washed Black With Distressed Thermal Panels",
  },
  {
    id: "product-grey-zip",
    brand: "Nofaithstudios",
    designerId: "nofaithstudios",
    name: "Saarland Zipper Used Grey",
    priceRub: 21990,
    availability: "В наличии",
    imageSrc: "/site-mock/product-grey-zip.jpg",
    imageAlt: "Saarland Zipper Used Grey",
  },
  {
    id: "product-denim",
    brand: "Rick Owens",
    designerId: "rick-owens",
    name: "Dust Washed Bolan Denim",
    priceRub: 38990,
    availability: "Под заказ",
    imageSrc: "/site-mock/product-denim.jpg",
    imageAlt: "Dust Washed Bolan Denim",
  },
  {
    id: "product-camo-pants",
    brand: "Entire Studios",
    designerId: "jaded-london",
    name: "Camo Freight Trousers",
    priceRub: 17990,
    availability: "В наличии",
    imageSrc: "/site-mock/product-camo-pants.jpg",
    imageAlt: "Camo Freight Trousers",
  },
  {
    id: "product-gloves",
    brand: "Boris Bidjan Saberi",
    designerId: "alice-hollywood",
    name: "Leather Utility Gloves",
    priceRub: 12990,
    availability: "Под заказ",
    imageSrc: "/site-mock/product-gloves.jpg",
    imageAlt: "Leather Utility Gloves",
  },
  {
    id: "product-belt",
    brand: "Ann Demeulemeester",
    designerId: "ann-demeulemeester",
    name: "Patina Buckle Belt",
    priceRub: 14990,
    availability: "В наличии",
    imageSrc: "/site-mock/product-belt.jpg",
    imageAlt: "Patina Buckle Belt",
  },
  {
    id: "product-trucker-black",
    brand: "Nofaithstudios",
    designerId: "nofaithstudios",
    name: "Dust Fade Trucker Black",
    priceRub: 22990,
    availability: "Под заказ",
    imageSrc: "/site-mock/product-trucker.jpg",
    imageAlt: "Dust Fade Trucker Black",
  },
  {
    id: "product-hoodie-ash",
    brand: "Entire Studios",
    designerId: "jaded-london",
    name: "Washed Full Zip Ash",
    priceRub: 18990,
    availability: "В наличии",
    imageSrc: "/site-mock/product-grey-zip.jpg",
    imageAlt: "Washed Full Zip Ash",
  },
  {
    id: "product-denim-wide",
    brand: "Rick Owens",
    designerId: "rick-owens",
    name: "Wide Bolan Cut Denim",
    priceRub: 40990,
    availability: "Под заказ",
    imageSrc: "/site-mock/product-denim.jpg",
    imageAlt: "Wide Bolan Cut Denim",
  },
  {
    id: "product-camo-cargo",
    brand: "Entire Studios",
    designerId: "jaded-london",
    name: "Faded Cargo Trouser",
    priceRub: 16990,
    availability: "В наличии",
    imageSrc: "/site-mock/product-camo-pants.jpg",
    imageAlt: "Faded Cargo Trouser",
  },
];

export function filterSiteMockProducts(products: SiteProduct[], query: string): SiteProduct[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === "") {
    return products;
  }

  return products.filter((product) => {
    const searchable = [product.brand, product.name, product.availability].join(" ").toLowerCase();
    return searchable.includes(normalizedQuery);
  });
}
