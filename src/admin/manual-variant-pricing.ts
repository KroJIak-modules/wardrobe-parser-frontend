export type ManualVariantCurrency = "RUB" | "USD" | "EUR" | "GBP" | "JPY";
export type ManualVariantPricingMode = "source" | "fixed_final_rub";
export const MAX_MANUAL_VARIANT_AMOUNT = 9_999_999_999.99;
export const MAX_MANUAL_VARIANT_AMOUNT_LABEL = "9 999 999 999.99";

export const MANUAL_VARIANT_CURRENCY_OPTIONS: Array<{
  value: ManualVariantCurrency;
  label: string;
}> = [
  { value: "RUB", label: "RUB" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "JPY", label: "JPY" },
];

export function normalizeManualVariantCurrency(
  value: unknown,
  fallback: ManualVariantCurrency = "USD",
): ManualVariantCurrency {
  const normalized = String(value || "").trim().toUpperCase();
  return MANUAL_VARIANT_CURRENCY_OPTIONS.some((option) => option.value === normalized)
    ? (normalized as ManualVariantCurrency)
    : fallback;
}

export function resolveManualVariantPricingMode(
  currency: string | null | undefined,
): ManualVariantPricingMode {
  return normalizeManualVariantCurrency(currency, "USD") === "RUB"
    ? "fixed_final_rub"
    : "source";
}

export function hasManualVariantPrice(
  value: string | number | null | undefined,
): boolean {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return false;
}

export function isManualVariantCompareAtEnabled(params: {
  price: string | number | null | undefined;
  currency: string | null | undefined;
}): boolean {
  void params.currency;
  return hasManualVariantPrice(params.price);
}

export function normalizeManualVariantCompareAtValue(params: {
  compareAtPrice: string;
  price: string | number | null | undefined;
  currency: string | null | undefined;
}): string {
  return isManualVariantCompareAtEnabled(params) ? params.compareAtPrice : "";
}

export function isManualVariantAmountTooLarge(
  value: number | null | undefined,
): boolean {
  return value !== null && value !== undefined && Number.isFinite(value) && value > MAX_MANUAL_VARIANT_AMOUNT;
}
