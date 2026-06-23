import { useCallback, useEffect, useMemo, useState } from "react";
import type { SiteNavItem } from "../features/storefront/site-storefront-contracts";
import { siteCartMockItems, type SiteCartItem } from "./site-cart-mock";

const SITE_CART_STORAGE_KEY = "site-cart-items-v1";
const SITE_CART_CHANGE_EVENT = "site-cart-change";

function isSiteCartItem(value: unknown): value is SiteCartItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SiteCartItem>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.brand === "string" &&
    typeof candidate.name === "string" &&
    (typeof candidate.imageSrc === "string" || candidate.imageSrc === null) &&
    typeof candidate.imageAlt === "string" &&
    typeof candidate.availabilityLabel === "string" &&
    (candidate.availabilityCode === "in-stock" || candidate.availabilityCode === "preorder") &&
    typeof candidate.priceRub === "number" &&
    typeof candidate.size === "string" &&
    typeof candidate.quantity === "number" &&
    candidate.quantity > 0 &&
    typeof candidate.sourceUrl === "string" &&
    typeof candidate.productUrl === "string"
  );
}

function normalizeSiteCartItems(items: readonly SiteCartItem[]) {
  return items
    .filter(isSiteCartItem)
    .map((item) => ({
      ...item,
      quantity: Math.max(1, Math.floor(item.quantity)),
    }));
}

function readSiteCartItems(): SiteCartItem[] {
  if (typeof window === "undefined") {
    return [...siteCartMockItems];
  }

  const rawValue = window.localStorage.getItem(SITE_CART_STORAGE_KEY);
  if (rawValue === null) {
    const seeded = normalizeSiteCartItems(siteCartMockItems);
    window.localStorage.setItem(SITE_CART_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeSiteCartItems(parsed);
  } catch {
    return [];
  }
}

function writeSiteCartItems(items: readonly SiteCartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SITE_CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(SITE_CART_CHANGE_EVENT));
}

export function useSiteCart() {
  const [items, setItems] = useState<SiteCartItem[]>(() => readSiteCartItems());

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

      persistItems(
        items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: nextQuantity,
              }
            : item
        )
      );
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
    (nextItem: SiteCartItem) => {
      const existing = items.find((item) => item.id === nextItem.id);

      if (!existing) {
        persistItems([...items, nextItem]);
        return;
      }

      persistItems(
        items.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                quantity: item.quantity + nextItem.quantity,
              }
            : item
        )
      );
    },
    [items, persistItems]
  );

  const totalPriceRub = useMemo(
    () => items.reduce((sum, item) => sum + item.priceRub * item.quantity, 0),
    [items]
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
    updateQuantity,
    removeItem,
    addItem,
    persistItems,
  };
}

export function useSiteActionItems(): SiteNavItem[] {
  const { hasItems, totalItems } = useSiteCart();

  return useMemo(
    () => [{ label: "Поиск" }, { label: `Корзина (${totalItems})`, to: hasItems ? "/cart" : undefined }],
    [hasItems, totalItems]
  );
}
