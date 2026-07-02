import { useEffect, useState } from "react";
import type { SiteProduct } from "../features/storefront/site-storefront-contracts";
import { siteApiJson, type SiteApiCatalogProductsResponse } from "./site-public-api";

function siteStatusLabel(status: "in_stock" | "preorder" | "sold_out") {
  if (status === "in_stock") {
    return "В наличии";
  }
  if (status === "sold_out") {
    return "Продано";
  }
  return "Под заказ";
}

export function useSiteProducts(query: string, options?: { limit?: number }) {
  const limit = options?.limit ?? 48;
  const [products, setProducts] = useState<SiteProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isDisposed = false;
    setLoading(true);
    setError(null);

    const searchParams = new URLSearchParams();
    searchParams.set("limit", String(limit));
    searchParams.set("offset", "0");
    if (query.trim() !== "") {
      searchParams.set("q", query.trim());
    }

    siteApiJson<SiteApiCatalogProductsResponse>(`/site/catalog/products?${searchParams.toString()}`)
      .then((payload) => {
        if (isDisposed) {
          return;
        }
        setProducts(
          payload.items.map((item) => ({
            id: String(item.id),
            path: item.path,
            brand: item.brand.name,
            designerId: item.brand.slug ?? undefined,
            name: item.name,
            priceRub: item.price_rub ?? 0,
            availability: siteStatusLabel(item.status),
            imageSrc: item.image_url,
            imageAlt: "",
          })),
        );
        setTotal(payload.total);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (isDisposed) {
          return;
        }
        setProducts([]);
        setTotal(0);
        setLoading(false);
        setError(error instanceof Error ? error.message : "Не удалось загрузить товары");
      });

    return () => {
      isDisposed = true;
    };
  }, [limit, query]);

  return {
    products,
    total,
    loading,
    error,
  };
}
