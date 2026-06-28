import type { SiteCartItem } from "./site-cart-mock";
import type { SiteProduct } from "../features/storefront/site-storefront-contracts";

type SiteProductAvailabilityCode = "in-stock" | "preorder";
type SiteProductGender = "men" | "women";

export type SiteProductDetailGalleryItem = {
  id: string;
  imageSrc: string;
  thumbSrc: string;
  thumbWidth: number;
  thumbHeight: number;
  alt: string;
};

export type SiteProductDetailSourceItem = {
  id: string;
  label: string;
  priceRub: number;
  url: string;
  logoSrc?: string;
  logoAlt?: string;
  logoWidth?: number;
  logoHeight?: number;
  logoImageWidthPercent?: number;
  logoImageHeightPercent?: number;
  logoImageLeftPercent?: number;
  logoImageTopPercent?: number;
};

export type SiteProductDetailSourceVariant = {
  id: string;
  size: string;
  sources: readonly SiteProductDetailSourceItem[];
};

export type SiteProductDetailItem = SiteProduct & {
  availabilityCode: SiteProductAvailabilityCode;
  genders: readonly SiteProductGender[];
  sectionIds: readonly string[];
  description: string;
  descriptionPreview?: string;
  sourceUrl: string | null;
  sizes: readonly string[];
  sourceVariants?: readonly SiteProductDetailSourceVariant[];
  gallery: readonly SiteProductDetailGalleryItem[];
};

const SITE_PRODUCT_DETAILS: readonly SiteProductDetailItem[] = [
  {
    id: "product-trucker",
    brand: "Nofaithstudios",
    designerId: "nofaithstudios",
    name: "Japanese Dust Selvedge Trucker Jacket",
    priceRub: 19990,
    availability: "В наличии",
    availabilityCode: "in-stock",
    imageSrc: "/site-mock/product-detail/main.jpg",
    imageAlt: "Japanese Dust Selvedge Trucker Jacket",
    genders: ["men"],
    sectionIds: ["outerwear"],
    description:
      "Красивая джинсовка от NFS выполнена из плотного японского selvedge-denim. По всему изделию имеется характерный дистресс и красивое напыление, имитирующее грязь. Вытачки на задней части и защипы на передней образовывают мешковатую посадку. Помогу с размером каждому индивидуально.\n\nМодель держит форму, красиво садится поверх худи и в реальности выглядит сложнее, чем на обычных каталожных фотографиях. За счет плотности ткани и посадки это сильная верхняя вещь на каждый день, особенно если нужен washed-силуэт без потери структуры.",
    descriptionPreview:
      "Красивая джинсовка от NFS выполнена из плотного японского selvedge-denim. По всему изделию имеется характерный дистресс и красивое напыление, имитирующее грязь. Вытачки на задней части и защипы на передней образовывают мешковатую посадку. Помогу с размером каждому индивидуально.",
    sourceUrl: "https://nofaithstudios.com/products/dust-trucker-jacket-1",
    sizes: ["S", "M", "L", "XL"],
    sourceVariants: [
      {
        id: "trucker-size-s",
        size: "S",
        sources: [
          {
            id: "s-nofaithstudios",
            label: "NO/FAITH STUDIOS",
            priceRub: 18990,
            url: "https://nofaithstudios.com/products/dust-trucker-jacket-1",
            logoSrc: "/site-mock/product-detail/source-logos/no-faith-studios.png",
            logoAlt: "No Faith Studios",
            logoWidth: 111,
            logoHeight: 14,
            logoImageWidthPercent: 178.82,
            logoImageHeightPercent: 1116.28,
            logoImageLeftPercent: -39.41,
            logoImageTopPercent: -520.93,
          },
        ],
      },
      {
        id: "trucker-size-m",
        size: "M",
        sources: [
          {
            id: "m-farfetch",
            label: "FARFETCH",
            priceRub: 18990,
            url: "https://www.farfetch.com/ru/shopping/men/no-faith-studios-item-00000001.aspx",
            logoSrc: "/site-mock/product-detail/source-logos/farfetch.png",
            logoAlt: "Farfetch",
            logoWidth: 94,
            logoHeight: 12,
            logoImageWidthPercent: 147.23,
            logoImageHeightPercent: 823.08,
            logoImageLeftPercent: -23.62,
            logoImageTopPercent: -361.54,
          },
        ],
      },
      {
        id: "trucker-size-l",
        size: "L",
        sources: [
          {
            id: "l-farfetch",
            label: "FARFETCH",
            priceRub: 19990,
            url: "https://www.farfetch.com/ru/shopping/men/no-faith-studios-item-00000002.aspx",
            logoSrc: "/site-mock/product-detail/source-logos/farfetch.png",
            logoAlt: "Farfetch",
            logoWidth: 94,
            logoHeight: 12,
            logoImageWidthPercent: 147.23,
            logoImageHeightPercent: 823.08,
            logoImageLeftPercent: -23.62,
            logoImageTopPercent: -361.54,
          },
          {
            id: "l-nofaithstudios",
            label: "NO/FAITH STUDIOS",
            priceRub: 779990,
            url: "https://nofaithstudios.com/products/dust-trucker-jacket-1",
            logoSrc: "/site-mock/product-detail/source-logos/no-faith-studios.png",
            logoAlt: "No Faith Studios",
            logoWidth: 111,
            logoHeight: 14,
            logoImageWidthPercent: 178.82,
            logoImageHeightPercent: 1116.28,
            logoImageLeftPercent: -39.41,
            logoImageTopPercent: -520.93,
          },
        ],
      },
      {
        id: "trucker-size-xl",
        size: "XL",
        sources: [
          {
            id: "xl-nofaithstudios",
            label: "NO/FAITH STUDIOS",
            priceRub: 799990,
            url: "https://nofaithstudios.com/products/dust-trucker-jacket-1",
            logoSrc: "/site-mock/product-detail/source-logos/no-faith-studios.png",
            logoAlt: "No Faith Studios",
            logoWidth: 111,
            logoHeight: 14,
            logoImageWidthPercent: 178.82,
            logoImageHeightPercent: 1116.28,
            logoImageLeftPercent: -39.41,
            logoImageTopPercent: -520.93,
          },
        ],
      },
    ],
    gallery: [
      {
        id: "trucker-front",
        imageSrc: "/site-mock/product-detail/main.jpg",
        thumbSrc: "/site-mock/product-detail/thumb-1.png",
        thumbWidth: 95,
        thumbHeight: 127,
        alt: "Japanese Dust Selvedge Trucker Jacket front view",
      },
      {
        id: "trucker-alt-1",
        imageSrc: "/site-mock/product-detail/thumb-2.jpg",
        thumbSrc: "/site-mock/product-detail/thumb-2.png",
        thumbWidth: 95,
        thumbHeight: 126,
        alt: "Japanese Dust Selvedge Trucker Jacket alternate view 1",
      },
      {
        id: "trucker-alt-2",
        imageSrc: "/site-mock/product-detail/thumb-3.jpg",
        thumbSrc: "/site-mock/product-detail/thumb-3.png",
        thumbWidth: 95,
        thumbHeight: 126,
        alt: "Japanese Dust Selvedge Trucker Jacket alternate view 2",
      },
      {
        id: "trucker-alt-3",
        imageSrc: "/site-mock/product-detail/thumb-4.jpg",
        thumbSrc: "/site-mock/product-detail/thumb-4.png",
        thumbWidth: 95,
        thumbHeight: 126,
        alt: "Japanese Dust Selvedge Trucker Jacket alternate view 3",
      },
    ],
  },
  {
    id: "product-trucker-blue-wash",
    brand: "Nofaithstudios",
    designerId: "nofaithstudios",
    name: "Blue Dust Trucker Jacket",
    priceRub: 20990,
    availability: "В наличии",
    availabilityCode: "in-stock",
    imageSrc: "/site-mock/product-detail/main.jpg",
    imageAlt: "Blue Dust Trucker Jacket",
    genders: ["men"],
    sectionIds: ["outerwear"],
    description: "Короткая washed-джинсовка с плотной посадкой по плечам и объемом в корпусе.",
    sourceUrl: null,
    sizes: ["M", "L"],
    gallery: [
      {
        id: "blue-trucker-front",
        imageSrc: "/site-mock/product-detail/main.jpg",
        thumbSrc: "/site-mock/product-detail/thumb-1.png",
        thumbWidth: 95,
        thumbHeight: 127,
        alt: "Blue Dust Trucker Jacket",
      },
    ],
  },
  {
    id: "product-trucker-stock",
    brand: "Nofaithstudios",
    designerId: "nofaithstudios",
    name: "Japanese Dust Selvedge Trucker Jacket",
    priceRub: 19990,
    availability: "В наличии",
    availabilityCode: "in-stock",
    imageSrc: "/site-mock/product-detail/main.jpg",
    imageAlt: "Japanese Dust Selvedge Trucker Jacket",
    genders: ["men"],
    sectionIds: ["outerwear"],
    description: "Визуальный дубль карточки из Figma для блока рекомендаций.",
    sourceUrl: null,
    sizes: ["S", "M", "L", "XL"],
    gallery: [
      {
        id: "trucker-stock-front",
        imageSrc: "/site-mock/product-detail/main.jpg",
        thumbSrc: "/site-mock/product-detail/thumb-1.png",
        thumbWidth: 95,
        thumbHeight: 127,
        alt: "Japanese Dust Selvedge Trucker Jacket in stock",
      },
    ],
  },
  {
    id: "product-lake-used-dune",
    brand: "Nofaithstudios",
    designerId: "nofaithstudios",
    name: "Lake Used Dune Denim",
    priceRub: 19990,
    availability: "В наличии",
    availabilityCode: "in-stock",
    imageSrc: "/site-mock/product-detail/reco-2.jpg",
    imageAlt: "Lake Used Dune Denim",
    genders: ["men"],
    sectionIds: ["outerwear"],
    description: "Плотный washed-denim с художественным напылением и тяжелой фактурой.",
    sourceUrl: null,
    sizes: ["M", "L", "XL"],
    gallery: [
      {
        id: "lake-used-dune",
        imageSrc: "/site-mock/product-detail/reco-2.jpg",
        thumbSrc: "/site-mock/product-detail/reco-2.jpg",
        thumbWidth: 95,
        thumbHeight: 127,
        alt: "Lake Used Dune Denim",
      },
    ],
  },
  {
    id: "product-heavy-flight-shearling",
    brand: "Nofaithstudios",
    designerId: "nofaithstudios",
    name: "Heavy Flight Double Layer Shearling Zip Hoodie Washed Black With Distressed Thermal Panels",
    priceRub: 26990,
    availability: "Под заказ",
    availabilityCode: "preorder",
    imageSrc: "/site-mock/product-detail/reco-3.jpg",
    imageAlt: "Heavy Flight Double Layer Shearling Zip Hoodie Washed Black With Distressed Thermal Panels",
    genders: ["men"],
    sectionIds: ["outerwear"],
    description: "Тяжелая верхняя вещь с объемным капюшоном и плотным силуэтом.",
    sourceUrl: "https://nofaithstudios.com/",
    sizes: ["M", "L"],
    gallery: [
      {
        id: "heavy-flight-shearling",
        imageSrc: "/site-mock/product-detail/reco-3.jpg",
        thumbSrc: "/site-mock/product-detail/reco-3.jpg",
        thumbWidth: 95,
        thumbHeight: 127,
        alt: "Heavy Flight Double Layer Shearling Zip Hoodie Washed Black With Distressed Thermal Panels",
      },
    ],
  },
  {
    id: "product-saarland-grey",
    brand: "Nofaithstudios",
    designerId: "nofaithstudios",
    name: "Saarland Zipper Used Grey",
    priceRub: 21990,
    availability: "В наличии",
    availabilityCode: "in-stock",
    imageSrc: "/site-mock/product-detail/reco-4.jpg",
    imageAlt: "Saarland Zipper Used Grey",
    genders: ["men"],
    sectionIds: ["outerwear"],
    description: "Серый zip-up с сильным washed-эффектом и мягкой объемной посадкой.",
    sourceUrl: null,
    sizes: ["S", "M", "L"],
    gallery: [
      {
        id: "saarland-grey",
        imageSrc: "/site-mock/product-detail/reco-4.jpg",
        thumbSrc: "/site-mock/product-detail/reco-4.jpg",
        thumbWidth: 95,
        thumbHeight: 127,
        alt: "Saarland Zipper Used Grey",
      },
    ],
  },
  {
    id: "product-moto-couture",
    brand: "Alice Hollywood",
    designerId: "alice-hollywood",
    name: "Moto Couture Gloves Blackout",
    priceRub: 10990,
    availability: "В наличии",
    availabilityCode: "in-stock",
    imageSrc: "/site-mock/product-detail/reco-5.jpg",
    imageAlt: "Moto Couture Gloves Blackout",
    genders: ["men"],
    sectionIds: ["outerwear"],
    description: "Стилизованный accessory-item, который в этом mock-пуле участвует в блоке рекомендаций.",
    sourceUrl: null,
    sizes: ["OS"],
    gallery: [
      {
        id: "moto-couture",
        imageSrc: "/site-mock/product-detail/reco-5.jpg",
        thumbSrc: "/site-mock/product-detail/reco-5.jpg",
        thumbWidth: 95,
        thumbHeight: 127,
        alt: "Moto Couture Gloves Blackout",
      },
    ],
  },
  {
    id: "product-slim-low-waist",
    brand: "Racer Worldwide",
    designerId: "racer-worldwide",
    name: "Slim Low-Waist Denim",
    priceRub: 19990,
    availability: "Под заказ",
    availabilityCode: "preorder",
    imageSrc: "/site-mock/product-detail/reco-6.jpg",
    imageAlt: "Slim Low-Waist Denim",
    genders: ["men"],
    sectionIds: ["outerwear"],
    description: "Удлиненный washed-item в духе low-rise стилизации.",
    sourceUrl: "https://racerworldwide.net/",
    sizes: ["M", "L"],
    gallery: [
      {
        id: "slim-low-waist",
        imageSrc: "/site-mock/product-detail/reco-6.jpg",
        thumbSrc: "/site-mock/product-detail/reco-6.jpg",
        thumbWidth: 95,
        thumbHeight: 127,
        alt: "Slim Low-Waist Denim",
      },
    ],
  },
  {
    id: "product-colossous-camo",
    brand: "Jaded London",
    designerId: "jaded-london",
    name: "Colossous Pants Camo Suit Baggy Fit",
    priceRub: 9990,
    availability: "Под заказ",
    availabilityCode: "preorder",
    imageSrc: "/site-mock/product-detail/reco-7.jpg",
    imageAlt: "Colossous Pants Camo Suit Baggy Fit",
    genders: ["men"],
    sectionIds: ["outerwear"],
    description: "Темный baggy-item из подборки рекомендаций.",
    sourceUrl: "https://jadedldn.com/",
    sizes: ["M", "L", "XL"],
    gallery: [
      {
        id: "colossous-camo",
        imageSrc: "/site-mock/product-detail/reco-7.jpg",
        thumbSrc: "/site-mock/product-detail/reco-7.jpg",
        thumbWidth: 95,
        thumbHeight: 127,
        alt: "Colossous Pants Camo Suit Baggy Fit",
      },
    ],
  },
  {
    id: "product-swarovski-belt",
    brand: "Alice Hollywood",
    designerId: "alice-hollywood",
    name: "Swarovski Belt Classic",
    priceRub: 19990,
    availability: "Под заказ",
    availabilityCode: "preorder",
    imageSrc: "/site-mock/product-detail/reco-8.jpg",
    imageAlt: "Swarovski Belt Classic",
    genders: ["men"],
    sectionIds: ["outerwear"],
    description: "Графичный accessory-item из подборки рекомендаций.",
    sourceUrl: "https://alice-hollywood.com/",
    sizes: ["OS"],
    gallery: [
      {
        id: "swarovski-belt",
        imageSrc: "/site-mock/product-detail/reco-8.jpg",
        thumbSrc: "/site-mock/product-detail/reco-8.jpg",
        thumbWidth: 95,
        thumbHeight: 127,
        alt: "Swarovski Belt Classic",
      },
    ],
  },
  {
    id: "product-dust-workwear",
    brand: "Nofaithstudios",
    designerId: "nofaithstudios",
    name: "Dust Workwear Trucker Blue",
    priceRub: 22990,
    availability: "Под заказ",
    availabilityCode: "preorder",
    imageSrc: "/site-mock/product-detail/thumb-2.jpg",
    imageAlt: "Dust Workwear Trucker Blue",
    genders: ["men"],
    sectionIds: ["outerwear"],
    description: "Альтернативная версия trucker-модели с темной washed-фактурой.",
    sourceUrl: "https://nofaithstudios.com/",
    sizes: ["M", "L", "XL"],
    gallery: [
      {
        id: "dust-workwear",
        imageSrc: "/site-mock/product-detail/thumb-2.jpg",
        thumbSrc: "/site-mock/product-detail/thumb-2.png",
        thumbWidth: 95,
        thumbHeight: 126,
        alt: "Dust Workwear Trucker Blue",
      },
    ],
  },
  {
    id: "product-broken-denim-jacket",
    brand: "Nofaithstudios",
    designerId: "nofaithstudios",
    name: "Broken Denim Folded Jacket",
    priceRub: 18490,
    availability: "В наличии",
    availabilityCode: "in-stock",
    imageSrc: "/site-mock/product-detail/thumb-3.jpg",
    imageAlt: "Broken Denim Folded Jacket",
    genders: ["men"],
    sectionIds: ["outerwear"],
    description: "Сложенный denim-item с сильной distressed-фактурой.",
    sourceUrl: null,
    sizes: ["S", "M"],
    gallery: [
      {
        id: "broken-denim",
        imageSrc: "/site-mock/product-detail/thumb-3.jpg",
        thumbSrc: "/site-mock/product-detail/thumb-3.png",
        thumbWidth: 95,
        thumbHeight: 126,
        alt: "Broken Denim Folded Jacket",
      },
    ],
  },
  {
    id: "product-bagged-denim-jacket",
    brand: "Nofaithstudios",
    designerId: "nofaithstudios",
    name: "Bagged Selvedge Denim Fold",
    priceRub: 18990,
    availability: "Под заказ",
    availabilityCode: "preorder",
    imageSrc: "/site-mock/product-detail/thumb-4.jpg",
    imageAlt: "Bagged Selvedge Denim Fold",
    genders: ["men"],
    sectionIds: ["outerwear"],
    description: "Еще один folded denim-item для recommendation-пула.",
    sourceUrl: "https://nofaithstudios.com/",
    sizes: ["M", "L"],
    gallery: [
      {
        id: "bagged-selvedge",
        imageSrc: "/site-mock/product-detail/thumb-4.jpg",
        thumbSrc: "/site-mock/product-detail/thumb-4.png",
        thumbWidth: 95,
        thumbHeight: 126,
        alt: "Bagged Selvedge Denim Fold",
      },
    ],
  },
];

function seededScore(seed: string, value: string) {
  let hash = 0;
  const input = `${seed}:${value}`;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getSiteProductDetailById(productId: string) {
  return SITE_PRODUCT_DETAILS.find((product) => product.id === productId) ?? null;
}

export function getDefaultSiteProductDetail() {
  return SITE_PRODUCT_DETAILS[0] ?? null;
}

export function getSiteProductRecommendations(product: SiteProductDetailItem, limit = 8) {
  const figmaRecommendationsByProductId: Record<string, readonly string[]> = {
    "product-trucker": [
      "product-trucker-stock",
      "product-lake-used-dune",
      "product-trucker-stock",
      "product-lake-used-dune",
      "product-trucker-stock",
      "product-lake-used-dune",
      "product-trucker-stock",
      "product-lake-used-dune",
    ],
  };

  const figmaRecommendationIds = figmaRecommendationsByProductId[product.id];
  if (figmaRecommendationIds) {
    return figmaRecommendationIds
      .map((recommendationId) => SITE_PRODUCT_DETAILS.find((candidate) => candidate.id === recommendationId) ?? null)
      .filter((candidate): candidate is SiteProductDetailItem => candidate !== null)
      .slice(0, limit);
  }

  return [...SITE_PRODUCT_DETAILS]
    .filter((candidate) => candidate.id !== product.id)
    .filter((candidate) => candidate.sectionIds.some((sectionId) => product.sectionIds.includes(sectionId)))
    .filter((candidate) => candidate.genders.some((gender) => product.genders.includes(gender)))
    .sort((left, right) => seededScore(product.id, left.id) - seededScore(product.id, right.id))
    .slice(0, limit);
}

export function resolveSiteProductDetailSourceVariant(product: SiteProductDetailItem, size: string | null) {
  if (!product.sourceVariants || product.sourceVariants.length === 0) {
    return null;
  }

  if (size) {
    const matchingVariant = product.sourceVariants.find((variant) => variant.size === size);
    if (matchingVariant) {
      return matchingVariant;
    }
  }

  return product.sourceVariants[0] ?? null;
}

export function resolveSiteProductDetailInitialSourceVariant(product: SiteProductDetailItem, size: string | null) {
  if (!product.sourceVariants || product.sourceVariants.length === 0) {
    return null;
  }

  if (size) {
    return resolveSiteProductDetailSourceVariant(product, size);
  }

  return product.sourceVariants.find((variant) => variant.sources.length > 1) ?? product.sourceVariants[0] ?? null;
}

export function resolveSiteProductDetailSourceUrl(
  product: SiteProductDetailItem,
  size: string | null,
  preferredSourceId?: string | null
) {
  const variant = resolveSiteProductDetailSourceVariant(product, size);
  if (variant) {
    if (preferredSourceId) {
      const matchingSource = variant.sources.find((source) => source.id === preferredSourceId);
      if (matchingSource) {
        return matchingSource.url;
      }
    }

    return variant.sources[0]?.url ?? product.sourceUrl;
  }

  return product.sourceUrl;
}

export function buildSiteCartItemFromProduct(
  product: SiteProductDetailItem,
  size: string,
  preferredSourceId?: string | null
): SiteCartItem {
  const productPath = `/show/${product.id}`;
  const productUrl =
    typeof window === "undefined" ? productPath : new URL(productPath, window.location.origin).toString();
  const variant = resolveSiteProductDetailSourceVariant(product, size);
  const preferredSource = preferredSourceId ? variant?.sources.find((source) => source.id === preferredSourceId) ?? null : null;
  const fallbackSource = variant?.sources[0] ?? null;
  const effectiveSource = preferredSource ?? fallbackSource;

  return {
    id: `cart-${product.id}-${size.toLowerCase()}${preferredSourceId ? `-${preferredSourceId}` : ""}`,
    productId: product.id,
    designerId: product.designerId,
    brand: product.brand,
    name: product.name,
    imageSrc: product.imageSrc,
    imageAlt: product.imageAlt,
    availabilityLabel: product.availability,
    availabilityCode: product.availabilityCode,
    priceRub: effectiveSource?.priceRub ?? product.priceRub,
    size,
    quantity: 1,
    sourceUrl: effectiveSource?.url ?? resolveSiteProductDetailSourceUrl(product, size, preferredSourceId) ?? productUrl,
    productUrl,
  };
}
