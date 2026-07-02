import { useEffect, useMemo, useState } from "react";
import type { SiteProduct } from "../features/storefront/site-storefront-contracts";
import type {
  SiteProductDetailItem,
  SiteProductDetailSourceVariant,
} from "./site-product-detail";
import {
  siteApiJson,
  type SiteApiCatalogProductsResponse,
  type SiteApiProductResponse,
} from "./site-public-api";

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

function buildDescriptionPreview(description: string) {
  return description.split(/\n\s*\n/, 1)[0]?.trim() ?? description;
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
  return {
    id: String(payload.id),
    path: payload.path,
    brand: payload.brand.name,
    designerId: payload.brand.slug ?? undefined,
    name: payload.name,
    priceRub: defaultPrice,
    availability: statusLabel(payload.status),
    availabilityCode: statusCode(payload.status),
    imageSrc: payload.photos[0] ?? null,
    imageAlt: "",
    genders: payload.recommendation_context.gender ? [payload.recommendation_context.gender] : [],
    sectionIds: payload.recommendation_context.section_slug ? [payload.recommendation_context.section_slug] : [],
    description,
    descriptionPreview: buildDescriptionPreview(description),
    sourceUrl: payload.primary_source_url,
    sizes: sourceVariants.map((variant) => variant.size),
    sourceVariants,
    gallery: payload.photos.map((photo, index) => ({
      id: `photo-${index + 1}`,
      imageSrc: photo,
      thumbSrc: photo,
      thumbWidth: 95,
      thumbHeight: 126,
      alt: "",
    })),
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

export function useSiteProductDetail(productPath?: string) {
  const [product, setProduct] = useState<SiteProductDetailItem | null>(null);
  const [recommendations, setRecommendations] = useState<SiteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!productPath) {
      setProduct(null);
      setRecommendations([]);
      setIsLoading(false);
      return;
    }

    let isDisposed = false;
    setIsLoading(true);

    siteApiJson<SiteApiProductResponse>(`/site/products/${productPath}`)
      .then(async (payload) => {
        if (isDisposed) {
          return;
        }
        const nextProduct = adaptProduct(payload);
        setProduct(nextProduct);

        const params = new URLSearchParams();
        params.set("limit", "8");
        params.set("offset", "0");
        if (payload.recommendation_context.section_slug) {
          params.set("section", payload.recommendation_context.section_slug);
        }
        if (payload.recommendation_context.designer_slug) {
          params.set("designer", payload.recommendation_context.designer_slug);
        }
        if (payload.recommendation_context.gender) {
          params.set("gender", payload.recommendation_context.gender);
        }

        const recommendationPayload = await siteApiJson<SiteApiCatalogProductsResponse>(
          `/site/catalog/products?${params.toString()}`,
        ).catch(() => ({ items: [], total: 0, limit: 8, offset: 0 }));
        if (isDisposed) {
          return;
        }
        setRecommendations(
          recommendationPayload.items
            .filter((item) => item.id !== payload.id)
            .slice(0, 8)
            .map(adaptRecommendation),
        );
        setIsLoading(false);
      })
      .catch(() => {
        if (!isDisposed) {
          setProduct(null);
          setRecommendations([]);
          setIsLoading(false);
        }
      });

    return () => {
      isDisposed = true;
    };
  }, [productPath]);

  return useMemo(
    () => ({
      product,
      recommendations,
      isLoading,
      isEmpty: product === null,
    }),
    [isLoading, product, recommendations],
  );
}
