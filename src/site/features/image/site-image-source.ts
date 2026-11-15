import { getShopifyImageSrcSet, optimizeImageUrl } from "../../../shared/product-image";

/**
 * Ширины, которые сайт запрашивает у источника картинок.
 *
 * CDN Shopify умеет отдавать картинку любой ширины (?width=), поэтому мы
 * запрашиваем вариант под реальный размер отображения с учётом devicePixelRatio.
 * Раньше здесь были жёсткие 480/80 px — на экранах с dpr > 1 картинка
 * растягивалась и мылилась.
 */
export const SITE_IMAGE_WIDTHS = {
  // Главное фото товара: бокс 577x770 css px на десктопе.
  galleryMain: [640, 960, 1280, 1920],
  // Превью товара: бокс 97x129 css px на десктопе.
  galleryThumb: [160, 240, 320],
  // Карточка каталога: колонка до 325 css px.
  catalogTile: [320, 480, 640, 960],
  // Титульный экран: картинка во весь экран.
  showcaseHero: [960, 1440, 1920, 2560],
  // Слайд карусели: 808x543 css px на десктопе.
  showcaseSlide: [480, 808, 1200, 1616],
} as const;

/** Заявленные размеры отображения — нужны браузеру для выбора варианта из srcset. */
export const SITE_IMAGE_SIZES = {
  galleryMain: "(max-width: 640px) 100vw, 577px",
  galleryThumb: "(max-width: 640px) 47px, 97px",
  catalogTile: "(max-width: 760px) 100vw, (max-width: 1360px) 33vw, 325px",
  showcaseHero: "100vw",
  showcaseSlide: "(max-width: 640px) 100vw, 808px",
} as const;

/** Вариант, который грузится, если браузер не поддерживает srcset. */
export const SITE_IMAGE_FALLBACK_WIDTHS = {
  galleryMain: 1280,
  galleryThumb: 320,
  catalogTile: 640,
  showcaseHero: 1920,
  showcaseSlide: 1200,
} as const;

export type SiteImageKind = keyof typeof SITE_IMAGE_WIDTHS;

export type SiteImageSource = {
  src: string | null;
  srcSet: string | null;
  sizes: string;
};

const SITE_MEDIA_PATH_RE = /^\/api\/v1\/site\/media\/\d+\/file$/;

/** Наш собственный эндпоинт медиа — умеет отдавать уменьшенную копию (?w=). */
function isSiteMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return SITE_MEDIA_PATH_RE.test(parsed.pathname);
  } catch {
    return false;
  }
}

function withSiteMediaWidth(url: string, width: number): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}w=${width}`;
}

function buildSiteMediaSrcSet(url: string, widths: number[]): string {
  return widths.map((width) => `${withSiteMediaWidth(url, width)} ${width}w`).join(", ");
}

/**
 * Маленькая копия картинки для сэмплирования цвета (canvas).
 * Оригинал грузить не нужно — цвета уменьшенной копии те же.
 */
export function buildSiteImageProbeUrl(url: string | null | undefined): string | null {
  const normalized = (url || "").trim();
  if (!normalized) {
    return null;
  }
  if (isSiteMediaUrl(normalized)) {
    return withSiteMediaWidth(normalized, 320);
  }
  return normalized;
}

/**
 * Собирает src/srcset для изображения.
 *
 * Для Shopify-источников и для собственных медиа отдаём адаптивный набор
 * вариантов, для остальных (подписанные URL, чужие CDN) — исходный URL.
 */
export function buildSiteImageSource(
  url: string | null | undefined,
  kind: SiteImageKind,
): SiteImageSource {
  const normalized = (url || "").trim();
  const sizes = SITE_IMAGE_SIZES[kind];
  if (!normalized) {
    return { src: null, srcSet: null, sizes };
  }

  const widths = [...SITE_IMAGE_WIDTHS[kind]];
  const fallbackWidth = SITE_IMAGE_FALLBACK_WIDTHS[kind];

  if (isSiteMediaUrl(normalized)) {
    return {
      src: withSiteMediaWidth(normalized, fallbackWidth),
      srcSet: buildSiteMediaSrcSet(normalized, widths),
      sizes,
    };
  }

  const srcSet = getShopifyImageSrcSet(normalized, { widths }) ?? null;
  const src = srcSet
    ? optimizeImageUrl(normalized, { width: fallbackWidth }) ?? normalized
    : normalized;
  return { src, srcSet, sizes };
}
