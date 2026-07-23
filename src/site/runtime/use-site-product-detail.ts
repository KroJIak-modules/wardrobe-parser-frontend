import { useEffect, useMemo, useRef, useState } from "react";
import type { SiteProduct } from "../features/storefront/site-storefront-contracts";
import { useSiteMediaQuery } from "./use-site-media-query";
import type {
  SiteProductDetailItem,
  SiteProductDetailSourceVariant,
} from "./site-product-detail";
import {
  siteApiJson,
  type SiteApiCatalogProductsResponse,
  type SiteApiProductResponse,
} from "./site-public-api";
import { optimizeImageUrl } from "../../shared/product-image";

const SITE_RECOMMENDATIONS_LIMIT = 8;
const SITE_RECOMMENDATIONS_MOBILE_QUERY = "(max-width: 640px)";
const SITE_RECOMMENDATIONS_TABLET_QUERY = "(max-width: 1120px)";

type RecommendationAttempt = { gender: boolean; section: boolean; designer: boolean };
type RecommendationItems = SiteApiCatalogProductsResponse["items"];

const RECOMMENDATION_ATTEMPTS: readonly RecommendationAttempt[] = [
  { gender: true, section: true, designer: true },
  { gender: true, section: false, designer: true },
  { gender: true, section: true, designer: false },
  { gender: true, section: false, designer: false },
  { gender: false, section: true, designer: true },
  { gender: false, section: false, designer: true },
  { gender: false, section: true, designer: false },
  { gender: false, section: false, designer: false },
];

type RecommendationCache = {
  productId: number;
  attempts: Map<number, Promise<RecommendationItems>>;
};

function statusLabel(status: "in_stock" | "preorder" | "sold_out") {
  if (status === "in_stock") {
    return "В наличии";
  }
  if (status === "sold_out") {
    return "Продано";
  }
  return "Под заказ";
}

function statusCode(status: "in_stock" | "preorder" | "sold_out"): "in-stock" | "preorder" | "sold-out" {
  if (status === "in_stock") {
    return "in-stock";
  }
  if (status === "sold_out") {
    return "sold-out";
  }
  return "preorder";
}

function groupVariants(raw: SiteApiProductResponse["variants"]): SiteProductDetailSourceVariant[] {
  const groups = new Map<string, SiteProductDetailSourceVariant>();

  for (const variant of raw) {
    const size = variant.size.trim() || "ONE SIZE";
    const key = size.toLowerCase();
    const existing = groups.get(key);
    const sourceItem = {
      id: `${variant.source.id}-${variant.id}`,
      label: variant.source.name,
      priceRub: variant.price_rub ?? 0,
      url: variant.source.url ?? "#",
      logoSrc: variant.source.logo_url ?? undefined,
    };

    if (existing) {
      existing.sources = [...existing.sources, sourceItem];
      continue;
    }

    groups.set(key, {
      id: `size-${key}`,
      size,
      sources: [sourceItem],
    });
  }

  return [...groups.values()];
}

function adaptProduct(payload: SiteApiProductResponse): SiteProductDetailItem {
  const description = payload.description?.content ?? "";
  const sourceVariants = groupVariants(payload.variants);
  const defaultPrice = payload.variants.find((variant) => variant.price_rub !== null)?.price_rub ?? 0;
  const firstPhoto = payload.photos[0] ?? null;
  const mainImage = optimizeImageUrl(firstPhoto, { width: 1280, quality: 80 }) ?? firstPhoto;

  return {
    id: String(payload.id),
    path: payload.path,
    brand: payload.brand.name,
    designerId: payload.brand.slug ?? undefined,
    name: payload.name,
    priceRub: defaultPrice,
    availability: statusLabel(payload.status),
    availabilityCode: statusCode(payload.status),
    imageSrc: mainImage,
    imageAlt: "",
    genders: payload.recommendation_context.gender ? [payload.recommendation_context.gender] : [],
    sectionIds: payload.recommendation_context.section_slug ? [payload.recommendation_context.section_slug] : [],
    description,
    sourceUrl: payload.primary_source_url,
    sizes: sourceVariants.map((variant) => variant.size),
    sourceVariants,
    gallery: payload.photos.map((photo, index) => {
      // Keep memory under control on product detail.
      // Visual box is ~577x770. Requesting 480px is plenty sharp.
      // Far slides get a thumbnail so Chrome doesn't decode 10 full bitmaps.
      const main = optimizeImageUrl(photo, { width: 480, quality: 65 }) ?? photo;
      const thumb = optimizeImageUrl(photo, { width: 80, quality: 55 }) ?? photo;
      return {
        id: `photo-${index + 1}`,
        imageSrc: main,
        thumbSrc: thumb,
        thumbWidth: 95,
        thumbHeight: 126,
        alt: "",
      };
    }),
  };
}

function adaptRecommendation(item: SiteApiCatalogProductsResponse["items"][number]): SiteProduct {
  return {
    id: String(item.id),
    path: item.path,
    brand: item.brand.name,
    designerId: item.brand.slug ?? undefined,
    name: item.name,
    priceRub: item.price_rub ?? 0,
    availability: statusLabel(item.status),
    imageSrc: item.image_url,
    imageAlt: "",
  };
}

async function fetchRecommendationCandidates(
  payload: SiteApiProductResponse,
  minimumCount: number,
  cache: RecommendationCache,
): Promise<RecommendationItems> {
  const gender = String(payload.recommendation_context.gender || "").trim();

  for (const [attemptIndex, attempt] of RECOMMENDATION_ATTEMPTS.entries()) {
    if (attempt.gender && !gender) {
      continue;
    }

    let candidates = cache.attempts.get(attemptIndex);
    if (!candidates) {
      const params = new URLSearchParams();
      // Request one extra item because the current product may be part of the
      // matching catalog result and must not occupy a recommendation slot.
      params.set("limit", String(SITE_RECOMMENDATIONS_LIMIT + 1));
      params.set("offset", "0");
      if (attempt.gender) {
        params.set("gender", gender);
      }
      if (attempt.section && payload.recommendation_context.section_slug) {
        params.set("section", payload.recommendation_context.section_slug);
      }
      if (attempt.designer && payload.recommendation_context.designer_slug) {
        params.set("designer", payload.recommendation_context.designer_slug);
      }

      candidates = siteApiJson<SiteApiCatalogProductsResponse>(
        `/site/catalog/products?${params.toString()}`,
      )
        .then((response) => response.items.filter((item) => item.id !== payload.id))
        .catch(() => []);
      cache.attempts.set(attemptIndex, candidates);
    }

    const filteredItems = await candidates;
    if (filteredItems.length >= minimumCount) {
      return filteredItems.slice(0, SITE_RECOMMENDATIONS_LIMIT);
    }
  }

  return [];
}

export function useSiteProductDetail(productPath?: string) {
  const isMobileRecommendationsLayout = useSiteMediaQuery(SITE_RECOMMENDATIONS_MOBILE_QUERY);
  const isTabletRecommendationsLayout = useSiteMediaQuery(SITE_RECOMMENDATIONS_TABLET_QUERY);
  const recommendationMinimum = isMobileRecommendationsLayout ? 2 : isTabletRecommendationsLayout ? 3 : 4;
  const [product, setProduct] = useState<SiteProductDetailItem | null>(null);
  const [recommendationPayload, setRecommendationPayload] = useState<SiteApiProductResponse | null>(null);
  const [recommendations, setRecommendations] = useState<SiteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);
  const [loadedProductPath, setLoadedProductPath] = useState<string | null>(null);
  const recommendationCacheRef = useRef<RecommendationCache | null>(null);

  useEffect(() => {
    if (!productPath) {
      setProduct(null);
      setRecommendationPayload(null);
      setRecommendations([]);
      setIsLoading(false);
      setIsRecommendationsLoading(false);
      setLoadedProductPath(null);
      return;
    }

    let isDisposed = false;
    setIsLoading(true);
    setIsRecommendationsLoading(false);
    setLoadedProductPath(null);
    setRecommendationPayload(null);
    setRecommendations([]);

    siteApiJson<SiteApiProductResponse>(`/site/products/${productPath}`)
      .then(async (payload) => {
        if (isDisposed) {
          return;
        }
        const nextProduct = adaptProduct(payload);
        setProduct(nextProduct);
        setLoadedProductPath(productPath);
        setIsLoading(false);
        recommendationCacheRef.current = { productId: payload.id, attempts: new Map() };
        setRecommendationPayload(payload);
      })
      .catch(() => {
        if (!isDisposed) {
          setProduct(null);
          setRecommendationPayload(null);
          setRecommendations([]);
          setIsLoading(false);
          setIsRecommendationsLoading(false);
          setLoadedProductPath(null);
        }
      });

    return () => {
      isDisposed = true;
    };
  }, [productPath]);

  useEffect(() => {
    if (!recommendationPayload) {
      return;
    }

    const cache = recommendationCacheRef.current;
    if (!cache || cache.productId !== recommendationPayload.id) {
      return;
    }

    let isDisposed = false;
    setIsRecommendationsLoading(true);

    fetchRecommendationCandidates(recommendationPayload, recommendationMinimum, cache)
      .then((items) => {
        if (!isDisposed) {
          setRecommendations(items.map(adaptRecommendation));
          setIsRecommendationsLoading(false);
        }
      })
      .catch(() => {
        if (!isDisposed) {
          setRecommendations([]);
          setIsRecommendationsLoading(false);
        }
      });

    return () => {
      isDisposed = true;
    };
  }, [recommendationMinimum, recommendationPayload]);

  return useMemo(
    () => ({
      product,
      recommendations,
      isLoading,
      isRecommendationsLoading,
      loadedProductPath,
      isEmpty: product === null,
    }),
    [isLoading, isRecommendationsLoading, loadedProductPath, product, recommendations],
  );
}
