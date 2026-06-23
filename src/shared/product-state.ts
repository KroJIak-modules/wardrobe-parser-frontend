export type ProductWriteState = {
  visibility_status: "visible" | "hidden";
  availability_mode?: "in_stock" | "by_order";
  orderability_status?: "orderable" | "sold_out" | "unavailable";
};

export type ProductStateKey =
  | "orderable"
  | "by_order"
  | "sold_out"
  | "unavailable"
  | "hidden"
  | "merged";

type ProductStateInput =
  | {
      visibility_status?: string | null;
      availability_mode?: string | null;
      orderability_status?: string | null;
      lifecycle_status?: string | null;
    }
  | string
  | null
  | undefined;

function normalizeStateString(raw: string): ProductWriteState {
  if (raw === "hidden") {
    return {
      visibility_status: "hidden",
      availability_mode: "in_stock",
      orderability_status: "orderable",
    };
  }
  if (raw === "sold_out") {
    return {
      visibility_status: "visible",
      availability_mode: "in_stock",
      orderability_status: "sold_out",
    };
  }
  if (raw === "unavailable") {
    return {
      visibility_status: "visible",
      availability_mode: "in_stock",
      orderability_status: "unavailable",
    };
  }
  if (raw === "by_order") {
    return {
      visibility_status: "visible",
      availability_mode: "by_order",
      orderability_status: "orderable",
    };
  }
  return {
    visibility_status: "visible",
    availability_mode: "in_stock",
    orderability_status: "orderable",
  };
}

function variantIsAvailable(variant: unknown): boolean {
  if (!variant || typeof variant !== "object") {
    return false;
  }
  const row = variant as Record<string, unknown>;
  if (typeof row.available === "boolean") {
    return row.available;
  }
  if (row.available !== null && row.available !== undefined) {
    const normalized = String(row.available).trim().toLowerCase();
    if (["1", "true", "yes", "y", "in_stock"].includes(normalized)) {
      return true;
    }
  }
  const inventoryRaw = row.inventory_quantity;
  const inventory =
    typeof inventoryRaw === "number"
      ? inventoryRaw
      : typeof inventoryRaw === "string"
        ? Number(inventoryRaw)
        : Number.NaN;
  return Number.isFinite(inventory) && inventory > 0;
}

export function deriveProductWriteStateFromVariants(
  variants: unknown,
  availabilityMode: "in_stock" | "by_order" = "in_stock",
): ProductWriteState {
  const hasAvailable = Array.isArray(variants) && variants.length > 0
    ? variants.some((variant) => variantIsAvailable(variant))
    : true;
  return {
    visibility_status: "visible",
    availability_mode: availabilityMode,
    orderability_status: hasAvailable ? "orderable" : "sold_out",
  };
}

export function resolveProductWriteState(input: ProductStateInput): ProductWriteState {
  if (!input) {
    return normalizeStateString("orderable");
  }
  if (typeof input === "string") {
    return normalizeStateString(String(input).trim().toLowerCase());
  }
  const visibilityStatus = String(input.visibility_status || "").trim().toLowerCase();
  const availabilityMode = String(input.availability_mode || "").trim().toLowerCase();
  const orderabilityStatus = String(input.orderability_status || "").trim().toLowerCase();
  return {
    visibility_status: visibilityStatus === "hidden" ? "hidden" : "visible",
    availability_mode: availabilityMode === "by_order" ? "by_order" : "in_stock",
    orderability_status:
      orderabilityStatus === "sold_out" || orderabilityStatus === "unavailable"
        ? orderabilityStatus
        : "orderable",
  };
}

export function buildHiddenProductWriteState(input?: ProductStateInput): ProductWriteState {
  const resolved = resolveProductWriteState(input);
  return {
    ...resolved,
    visibility_status: "hidden",
  };
}

export function buildVisibleProductWriteState(input: ProductStateInput, variants?: unknown): ProductWriteState {
  const resolved = resolveProductWriteState(input);
  if (resolved.orderability_status) {
    return {
      ...resolved,
      visibility_status: "visible",
    };
  }
  const fallback = deriveProductWriteStateFromVariants(variants, resolved.availability_mode || "in_stock");
  return {
    ...fallback,
    visibility_status: "visible",
  };
}

export function getProductStateKey(input: ProductStateInput): ProductStateKey {
  if (input && typeof input !== "string") {
    const lifecycleStatus = String(input.lifecycle_status || "").trim().toLowerCase();
    if (lifecycleStatus === "merged") {
      return "merged";
    }
  }
  const resolved = resolveProductWriteState(input);
  if (resolved.visibility_status === "hidden") {
    return "hidden";
  }
  if (resolved.orderability_status === "unavailable") {
    return "unavailable";
  }
  if (resolved.orderability_status === "sold_out") {
    return "sold_out";
  }
  if (resolved.availability_mode === "by_order") {
    return "by_order";
  }
  return "orderable";
}

export function getProductStateLabel(input: ProductStateInput): string {
  const key = getProductStateKey(input);
  if (key === "merged") return "Объединен";
  if (key === "hidden") return "Скрыт";
  if (key === "unavailable") return "Недоступен";
  if (key === "sold_out") return "Распродан";
  if (key === "by_order") return "Под заказ";
  return "В наличии";
}

export function getProductStateClass(input: ProductStateInput): string {
  const key = getProductStateKey(input);
  if (key === "merged" || key === "hidden") {
    return "status-pill status-pill--muted";
  }
  if (key === "unavailable") {
    return "status-pill status-pill--bad";
  }
  if (key === "sold_out" || key === "by_order") {
    return "status-pill status-pill--warn";
  }
  return "status-pill status-pill--ok";
}
