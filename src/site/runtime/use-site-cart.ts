import { useCallback, useEffect, useMemo, useState } from "react";
import type { SiteNavItem } from "../features/storefront/site-storefront-contracts";
import { siteApiJson, type SiteApiCartQuoteRequest, type SiteApiCartQuoteResponse } from "./site-public-api";

export type SiteCartItemSnapshot = {
  productId: string;
  designerId: string;
  brand: string;
  name: string;
  imageSrc: string | null;
  imageAlt: string;
  availabilityLabel: string;
  availabilityCode: "in-stock" | "preorder";
  priceRub: number;
  size: string;
  sourceUrl: string;
  productUrl: string;
};

/** The persisted basket stores buying intent separately from display-only data. */
export type SiteCartItem = {
  id: string;
  variantId: number;
  quantity: number;
  snapshot: SiteCartItemSnapshot;
};

export type SiteCartQuoteTier = {
  id: string;
  minRub: number;
  maxRub: number | null;
  isApplied: boolean;
};

export type SiteCartQuoteProgress = {
  preorderSubtotalRub: number;
  nextThresholdRub: number | null;
  amountToNextThresholdRub: number | null;
  percent: number;
  tiers: SiteCartQuoteTier[];
};

export type SiteCartQuote = {
  originalTotalRub: number;
  finalTotalRub: number;
  items: SiteApiCartQuoteResponse["items"];
  svcProgress: SiteCartQuoteProgress | null;
};

export type SiteCartQuoteStatus = "idle" | "loading" | "ready" | "error";

const SITE_CART_STORAGE_KEY = "site-cart-intent-basket-v2";
const SITE_CART_CHANGE_EVENT = "site-cart-change";
export const SITE_CART_ITEM_ADDED_EVENT = "site-cart-item-added";
export type SiteCartItemAddedDetail = {
  backdropImageSrc: string | null;
};

type SiteCartBasket = {
  version: 2;
  items: SiteCartItem[];
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSiteCartItem(value: unknown): value is SiteCartItem {
  if (!isRecord(value) || !isRecord(value.snapshot)) {
    return false;
  }

  const snapshot = value.snapshot;
  return (
    typeof value.id === "string" &&
    typeof value.variantId === "number" &&
    Number.isInteger(value.variantId) &&
    value.variantId > 0 &&
    typeof value.quantity === "number" &&
    value.quantity > 0 &&
    typeof snapshot.productId === "string" &&
    typeof snapshot.designerId === "string" &&
    typeof snapshot.brand === "string" &&
    typeof snapshot.name === "string" &&
    (typeof snapshot.imageSrc === "string" || snapshot.imageSrc === null) &&
    typeof snapshot.imageAlt === "string" &&
    typeof snapshot.availabilityLabel === "string" &&
    (snapshot.availabilityCode === "in-stock" || snapshot.availabilityCode === "preorder") &&
    typeof snapshot.priceRub === "number" &&
    typeof snapshot.size === "string" &&
    typeof snapshot.sourceUrl === "string" &&
    typeof snapshot.productUrl === "string"
  );
}

function normalizeSiteCartItems(items: readonly unknown[]): SiteCartItem[] {
  return items
    .filter(isSiteCartItem)
    .map((item) => ({
      ...item,
      quantity: Math.max(1, Math.floor(item.quantity)),
    }));
}

function readSiteCartItems(): SiteCartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(SITE_CART_STORAGE_KEY);
  if (rawValue === null) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);
    // Deliberately do not read the old v1 array. V2 is an API-valid intent basket.
    if (!isRecord(parsed) || parsed.version !== 2 || !Array.isArray(parsed.items)) {
      return [];
    }
    return normalizeSiteCartItems(parsed.items);
  } catch {
    return [];
  }
}

function writeSiteCartItems(items: readonly SiteCartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  const basket: SiteCartBasket = { version: 2, items: [...items] };
  window.localStorage.setItem(SITE_CART_STORAGE_KEY, JSON.stringify(basket));
  window.dispatchEvent(new CustomEvent(SITE_CART_CHANGE_EVENT));
}

function normalizeQuoteProgress(response: SiteApiCartQuoteResponse): SiteCartQuoteProgress {
  const tiers = response.svc_tiers.map((tier, index) => ({
    id: `svc-tier-${index}-${tier.min_rub}`,
    minRub: tier.min_rub,
    maxRub: tier.max_rub,
    isApplied: tier.is_applied,
  }));
  const preorderSubtotalRub = response.svc_progress.preorder_subtotal_rub;
  const nextThresholdRub = response.svc_progress.next_threshold_rub;
  const firstThresholdRub = tiers[0]?.minRub ?? null;
  const amountToNextThresholdRub = nextThresholdRub !== null
    ? Math.max(0, nextThresholdRub - preorderSubtotalRub)
    : firstThresholdRub !== null && preorderSubtotalRub < firstThresholdRub
      ? firstThresholdRub - preorderSubtotalRub
      : null;
  const terminalThresholdRub = tiers.at(-1)?.minRub ?? 0;
  const percent = terminalThresholdRub > 0
    ? Math.min(100, Math.max(0, (preorderSubtotalRub / terminalThresholdRub) * 100))
    : 0;

  return { preorderSubtotalRub, nextThresholdRub, amountToNextThresholdRub, percent, tiers };
}

function normalizeQuote(response: SiteApiCartQuoteResponse): SiteCartQuote {
  return {
    originalTotalRub: response.original_total_rub,
    finalTotalRub: response.final_total_rub,
    items: response.items,
    svcProgress: normalizeQuoteProgress(response),
  };
}

export function useSiteCart() {
  const [items, setItems] = useState<SiteCartItem[]>(() => readSiteCartItems());
  const [quote, setQuote] = useState<SiteCartQuote | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<SiteCartQuoteStatus>("idle");

  useEffect(() => {
    const syncFromStorage = () => {
      setItems(readSiteCartItems());
    };

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(SITE_CART_CHANGE_EVENT, syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(SITE_CART_CHANGE_EVENT, syncFromStorage);
    };
  }, []);

  const totalPriceRub = useMemo(
    () => items.reduce((sum, item) => sum + item.snapshot.priceRub * item.quantity, 0),
    [items]
  );

  useEffect(() => {
    if (items.length === 0) {
      setQuote(null);
      setQuoteStatus("idle");
      return;
    }

    const controller = new AbortController();
    setQuoteStatus("loading");
    const request: SiteApiCartQuoteRequest = {
      items: items.map(({ variantId, quantity }) => ({ variant_id: variantId, quantity })),
    };

    siteApiJson<SiteApiCartQuoteResponse>("/site/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    })
      .then((response) => {
        if (!controller.signal.aborted) {
          setQuote(normalizeQuote(response));
          setQuoteStatus("ready");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setQuote(null);
          setQuoteStatus("error");
        }
      });

    return () => controller.abort();
  }, [items]);

  const persistItems = useCallback((nextItems: readonly SiteCartItem[]) => {
    const normalized = normalizeSiteCartItems(nextItems);
    writeSiteCartItems(normalized);
    setItems(normalized);
  }, []);

  const updateQuantity = useCallback(
    (itemId: string, nextQuantity: number) => {
      if (nextQuantity <= 0) {
        persistItems(items.filter((item) => item.id !== itemId));
        return;
      }
      persistItems(items.map((item) => (item.id === itemId ? { ...item, quantity: nextQuantity } : item)));
    },
    [items, persistItems]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      persistItems(items.filter((item) => item.id !== itemId));
    },
    [items, persistItems]
  );

  const addItem = useCallback(
    (nextItem: SiteCartItem, detail: SiteCartItemAddedDetail = { backdropImageSrc: null }) => {
      const existing = items.find((item) => item.variantId === nextItem.variantId);
      persistItems(
        existing
          ? items.map((item) => (item.variantId === existing.variantId ? { ...item, quantity: item.quantity + nextItem.quantity } : item))
          : [...items, nextItem]
      );
      window.dispatchEvent(new CustomEvent<SiteCartItemAddedDetail>(SITE_CART_ITEM_ADDED_EVENT, { detail }));
    },
    [items, persistItems]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  return {
    items,
    totalPriceRub,
    totalItems,
    hasItems: items.length > 0,
    quote,
    quoteStatus,
    updateQuantity,
    removeItem,
    addItem,
    persistItems,
  };
}

export function useSiteActionItems(): SiteNavItem[] {
  const { hasItems, totalItems } = useSiteCart();
  const cartCountLabel = totalItems >= 10 ? "9+" : `${totalItems}`;
  const cartLabel = hasItems ? `Корзина (${cartCountLabel})` : "Корзина";

  return useMemo(
    () => [{ label: "Поиск" }, { label: cartLabel, to: hasItems ? "/cart" : undefined }],
    [cartLabel, hasItems]
  );
}
