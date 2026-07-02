import type { SiteCartItem } from "./use-site-cart";
import type { SiteProduct } from "../features/storefront/site-storefront-contracts";

export type SiteProductAvailabilityCode = "in-stock" | "preorder" | "sold-out";
export type SiteProductGender = "men" | "women";

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
  preferredSourceId?: string | null,
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
  preferredSourceId?: string | null,
): SiteCartItem {
  const productPath = `/show/${product.path ?? product.id}`;
  const productUrl = typeof window === "undefined" ? productPath : new URL(productPath, window.location.origin).toString();
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
    availabilityCode: product.availabilityCode === "sold-out" ? "preorder" : product.availabilityCode,
    priceRub: effectiveSource?.priceRub ?? product.priceRub,
    size,
    quantity: 1,
    sourceUrl: effectiveSource?.url ?? resolveSiteProductDetailSourceUrl(product, size, preferredSourceId) ?? productUrl,
    productUrl,
  };
}
