import type { ProductPriceSummary, ProductVariant, ServiceProduct } from "./live-data-types";

function toFiniteNumber(value: unknown): number | null {
  const numeric = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeCurrency(value: unknown): string | null {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized || null;
}

function amountsDiffer(left: number | null, right: number | null): boolean {
  if (left === null || right === null) {
    return left !== right;
  }
  return Math.abs(left - right) >= 0.01;
}

function sortKey(variant: ProductVariant) {
  const finalPrice = toFiniteNumber(variant.final_price);
  const sourcePrice = toFiniteNumber(variant.price);
  return [
    variant.available ? 0 : 1,
    finalPrice ?? Number.POSITIVE_INFINITY,
    sourcePrice ?? Number.POSITIVE_INFINITY,
    Number(variant.listing_id || 0),
    Number(variant.source_ref_id ? 0 : 1),
  ] as const;
}

// Admin "from price" rule: compare only orderable variants; if none are orderable,
// fall back to all priced variants so fully blocked products can still show a range.
function pickRangeCandidates(variants: ProductVariant[], priceKind: "final_price" | "price"): ProductVariant[] {
  const available = variants.filter((variant) => variant.available && toFiniteNumber(variant[priceKind]) !== null);
  if (available.length > 0) {
    return available;
  }
  const priced = variants.filter((variant) => toFiniteNumber(variant[priceKind]) !== null);
  if (priced.length > 0) {
    return priced;
  }
  return [];
}

export function buildProductPriceSummaryFromVariants(variants: ProductVariant[] | null | undefined): ProductPriceSummary | null {
  if (!Array.isArray(variants) || variants.length === 0) {
    return null;
  }
  const finalCandidates = pickRangeCandidates(variants, "final_price");
  const sourceCandidates = pickRangeCandidates(variants, "price");
  const representativePool = finalCandidates.length > 0 ? finalCandidates : sourceCandidates;
  if (representativePool.length === 0) {
    return null;
  }

  const representative = [...representativePool].sort((left, right) => {
    const leftKey = sortKey(left);
    const rightKey = sortKey(right);
    for (let index = 0; index < leftKey.length; index += 1) {
      if (leftKey[index] === rightKey[index]) {
        continue;
      }
      return leftKey[index] < rightKey[index] ? -1 : 1;
    }
    return 0;
  })[0];

  const finalHasRange = finalCandidates.length > 1
    ? finalCandidates
        .slice(1)
        .some((variant) => amountsDiffer(toFiniteNumber(finalCandidates[0].final_price), toFiniteNumber(variant.final_price)))
    : false;

  const sourceHasRange = sourceCandidates.length > 1
    ? sourceCandidates.slice(1).some((variant) => (
        normalizeCurrency(sourceCandidates[0].currency) !== normalizeCurrency(variant.currency)
        || amountsDiffer(toFiniteNumber(sourceCandidates[0].price), toFiniteNumber(variant.price))
      ))
    : false;

  const finalDisplayPrice = toFiniteNumber(representative.final_price);
  const finalCompareAtPrice = toFiniteNumber(representative.final_compare_at_price);

  return {
    source_display_price: toFiniteNumber(representative.price),
    source_currency: normalizeCurrency(representative.currency),
    source_compare_at_price: toFiniteNumber(representative.compare_at_price),
    source_has_range: sourceHasRange,
    final_display_price: finalDisplayPrice,
    final_currency: normalizeCurrency(representative.final_currency),
    final_compare_at_price:
      finalDisplayPrice !== null
      && finalCompareAtPrice !== null
      && finalCompareAtPrice > finalDisplayPrice
        ? finalCompareAtPrice
        : null,
    final_has_range: finalHasRange,
    pricing_manual_required: Boolean(representative.pricing_manual_required),
    pricing_reason: String(representative.pricing_reason || "").trim() || null,
    representative_variant_id: representative.id ?? null,
    representative_listing_id: representative.listing_id ?? null,
    representative_source_ref_id: representative.source_ref_id ?? null,
  };
}

export function getProductPriceSummary(
  product: Pick<ServiceProduct, "price_summary" | "variants"> | null | undefined,
): ProductPriceSummary | null {
  if (!product) {
    return null;
  }
  if (product.price_summary) {
    return product.price_summary;
  }
  return buildProductPriceSummaryFromVariants(product.variants);
}

export function withPriceRangePrefix(value: string, hasRange: boolean): string {
  if (value === "—" || value === "-" || !hasRange) {
    return value;
  }
  return `От ${value}`;
}

export type ProductPriceDisplay = {
  sourcePrice: number | null;
  sourceCurrency: string | null;
  sourceHasRange: boolean;
  sourceCompareAtPrice: number | null;
  finalPrice: number | null;
  finalCurrency: string | null;
  finalHasRange: boolean;
  finalCompareAtPrice: number | null;
  pricingManualRequired: boolean;
  pricingReason: string | null;
};

export function buildProductPriceDisplay(
  summary: ProductPriceSummary | null | undefined,
  variant?: ProductVariant | null,
): ProductPriceDisplay {
  const summaryValue = summary ?? null;
  const chosenVariant = variant ?? null;
  const sourcePrice = chosenVariant ? toFiniteNumber(chosenVariant.price) : (summaryValue?.source_display_price ?? null);
  const sourceCurrency = chosenVariant
    ? (
        normalizeCurrency(chosenVariant.currency)
        ?? normalizeCurrency(chosenVariant.final_currency)
        ?? summaryValue?.source_currency
        ?? summaryValue?.final_currency
        ?? null
      )
    : (summaryValue?.source_currency ?? null);
  const variantSourceCompareAt = chosenVariant ? toFiniteNumber(chosenVariant.compare_at_price) : null;
  const sourceCompareAtPrice = chosenVariant
    ? (
        variantSourceCompareAt !== null
          ? variantSourceCompareAt
          : (
              toFiniteNumber(chosenVariant.final_compare_at_price)
              ?? summaryValue?.source_compare_at_price
              ?? null
            )
      )
    : (summaryValue?.source_compare_at_price ?? null);
  const finalPrice = chosenVariant ? toFiniteNumber(chosenVariant.final_price) : (summaryValue?.final_display_price ?? null);
  const finalCurrency = chosenVariant
    ? (
        normalizeCurrency(chosenVariant.final_currency)
        ?? normalizeCurrency(chosenVariant.currency)
        ?? summaryValue?.final_currency
        ?? summaryValue?.source_currency
        ?? null
      )
    : (summaryValue?.final_currency ?? null);
  const variantFinalCompareAt = chosenVariant ? toFiniteNumber(chosenVariant.final_compare_at_price) : null;
  const finalCompareAtPrice = variantFinalCompareAt !== null
    ? (finalPrice !== null && variantFinalCompareAt > finalPrice ? variantFinalCompareAt : null)
    : (summaryValue?.final_compare_at_price ?? null);

  return {
    sourcePrice,
    sourceCurrency,
    sourceHasRange: chosenVariant ? false : Boolean(summaryValue?.source_has_range),
    sourceCompareAtPrice,
    finalPrice,
    finalCurrency,
    finalHasRange: chosenVariant ? false : Boolean(summaryValue?.final_has_range),
    finalCompareAtPrice,
    pricingManualRequired: chosenVariant ? Boolean(chosenVariant.pricing_manual_required) : Boolean(summaryValue?.pricing_manual_required),
    pricingReason: chosenVariant
      ? String(chosenVariant.pricing_reason || "").trim() || null
      : (String(summaryValue?.pricing_reason || "").trim() || null),
  };
}
