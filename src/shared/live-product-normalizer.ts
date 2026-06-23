import type { ServiceProduct } from "./live-data-types";

type RawVariant = {
  title?: string | null;
  available?: boolean;
  price?: number | string | null;
  currency?: string | null;
  sku?: string | null;
  compare_at_price?: number | string | null;
};

type RawGalleryRow = {
  position?: number | null;
  origin_kind?: string | null;
  is_hidden?: boolean | null;
  url?: string | null;
  listing_image_id?: number | null;
  image_asset_id?: number | null;
};

type RawProduct = {
  id: number;
  source_id?: number | null;
  primary_listing_id?: number | null;
  source_name?: string | null;
  handle?: string | null;
  title?: string | null;
  gender?: string | null;
  designer_name?: string | null;
  source_designer_name?: string | null;
  display_designer_name?: string | null;
  source_category_name?: string | null;
  url?: string | null;
  price?: number | null;
  currency?: string | null;
  source_price?: number | null;
  source_currency?: string | null;
  final_price?: number | null;
  final_currency?: string | null;
  pricing_components?: Record<string, unknown> | null;
  visibility_status?: string | null;
  availability_mode?: string | null;
  orderability_status?: string | null;
  lifecycle_status?: string | null;
  image_urls?: string[];
  variants?: RawVariant[];
  description?: string | null;
  description_mode?: "hidden" | "text" | "html" | null;
  description_public_visible?: boolean | null;
  description_text?: string | null;
  description_html?: string | null;
  effective_weight_grams?: number | null;
  manual_weight_grams?: number | null;
  price_override?: {
    manual_price_rub?: number | null;
    manual_compare_at_price_rub?: number | null;
  } | null;
  taxonomy?: {
    filter_slugs?: string[];
    custom_catalog_slugs?: string[];
  } | null;
  internal_category_names?: string[];
  gallery?: {
    display_image_urls?: string[];
    hidden_source_image_urls?: string[];
    uploaded_image_urls?: string[];
    source_image_urls?: string[];
    rows?: RawGalleryRow[];
  } | null;
  presentation?: {
    title_override?: string | null;
    description_text?: string | null;
    description_html?: string | null;
    description_visibility?: boolean | null;
  } | null;
  listings?: Array<{
    id?: number | null;
    source_id?: number | null;
    source_name?: string | null;
    ingest_mode?: string | null;
    url?: string | null;
    handle?: string | null;
    source_title?: string | null;
    source_description_text?: string | null;
    source_description_html?: string | null;
    source_weight_grams?: number | null;
    source_designer_name?: string | null;
    source_category_name?: string | null;
    orderability_status?: string | null;
    status_reason?: string | null;
    image_urls?: string[];
    gallery?: RawProduct["gallery"];
    variants?: RawVariant[];
  }> | null;
  created_at?: string;
  updated_at?: string;
};

function normalizeStringArray(value: string[] | null | undefined): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function normalizeGalleryRows(rows: RawGalleryRow[] | null | undefined) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row, index) => {
      const url = String(row?.url || "").trim() || null;
      if (!url) {
        return null;
      }
      return {
        position: Number.isFinite(Number(row?.position)) ? Number(row?.position) : index + 1,
        origin_kind: String(row?.origin_kind || "").trim().toLowerCase() === "uploaded_asset" ? "uploaded_asset" : "source_image",
        is_hidden: Boolean(row?.is_hidden),
        url,
        listing_image_id: row?.listing_image_id === null || row?.listing_image_id === undefined ? null : Number(row.listing_image_id),
        image_asset_id: row?.image_asset_id === null || row?.image_asset_id === undefined ? null : Number(row.image_asset_id),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

function buildManualImageOrder(rows: ReturnType<typeof normalizeGalleryRows>): string[] {
  return rows
    .filter((row) => !row.is_hidden)
    .map((row) => `${row.origin_kind === "uploaded_asset" ? "m" : "s"}:${row.url}`);
}

export function normalizeServiceProduct(payload: RawProduct): ServiceProduct {
  const imageUrls = normalizeStringArray(payload.image_urls);
  const filterSlugs = normalizeStringArray(payload.taxonomy?.filter_slugs);
  const customCatalogSlugs = normalizeStringArray(payload.taxonomy?.custom_catalog_slugs);
  const galleryRows = normalizeGalleryRows(payload.gallery?.rows);
  const sourceImageUrls = normalizeStringArray(payload.gallery?.source_image_urls);
  const hiddenSourceImageUrls = normalizeStringArray(payload.gallery?.hidden_source_image_urls);
  const uploadedImageUrls = normalizeStringArray(payload.gallery?.uploaded_image_urls);
  const displayImageUrls = normalizeStringArray(payload.gallery?.display_image_urls);
  const variants = Array.isArray(payload.variants)
    ? payload.variants.map((variant) => ({
        title: String(variant.title || "").trim(),
        option1: null,
        option2: null,
        option3: null,
        available: Boolean(variant.available),
        price: variant.price ?? null,
        compare_at_price: variant.compare_at_price ?? null,
        inventory_quantity: Boolean(variant.available) ? 1 : 0,
        sku: variant.sku ?? null,
        source_id: (variant as { source_id?: number | null }).source_id ?? null,
        source_name: String((variant as { source_name?: string | null }).source_name || "").trim() || null,
        listing_id: (variant as { listing_id?: number | null }).listing_id ?? null,
        source_ref_id: String((variant as { source_ref_id?: string | null }).source_ref_id || "").trim() || null,
      }))
    : [];

  return {
    id: Number(payload.id),
    source_id: payload.source_id === null || payload.source_id === undefined ? null : Number(payload.source_id),
    primary_listing_id: payload.primary_listing_id === null || payload.primary_listing_id === undefined ? null : Number(payload.primary_listing_id),
    handle: String(payload.handle || ""),
    title: String(payload.title || ""),
    gender: String(payload.gender || "").trim() || null,
    designer_name: String(payload.designer_name || "").trim() || null,
    source_designer_name: String(payload.source_designer_name || "").trim() || null,
    display_designer_name: String(payload.display_designer_name || payload.designer_name || payload.source_designer_name || "").trim() || null,
    source_category_name: String(payload.source_category_name || "").trim() || null,
    url: String(payload.url || ""),
    price: payload.price ?? null,
    currency: String(payload.currency || payload.final_currency || payload.source_currency || "RUB"),
    source_price: payload.source_price ?? null,
    source_currency: payload.source_currency ?? null,
    final_price: payload.final_price ?? null,
    final_currency: payload.final_currency ?? null,
    pricing_manual_required: Boolean((payload.pricing_components as { manual_required?: unknown } | null | undefined)?.manual_required),
    pricing_reason: String((payload.pricing_components as { reason?: unknown } | null | undefined)?.reason || "") || null,
    pricing_components: payload.pricing_components || {},
    buyout_price_rub: null,
    visibility_status: payload.visibility_status ?? null,
    availability_mode: payload.availability_mode ?? null,
    orderability_status: payload.orderability_status ?? null,
    lifecycle_status: payload.lifecycle_status ?? null,
    image_count: imageUrls.length,
    image_urls: imageUrls,
    variants,
    internal_category_slugs: [...filterSlugs, ...customCatalogSlugs],
    internal_category_slug: filterSlugs[0] || customCatalogSlugs[0] || null,
    description: payload.description ?? null,
    description_mode: payload.description_mode ?? "text",
    description_public_visible: Boolean(payload.description_public_visible),
    description_text: payload.description_text ?? payload.description ?? null,
    description_html: payload.description_html ?? null,
    source_name: String(payload.source_name || "").trim() || null,
    weight_grams: payload.effective_weight_grams ?? null,
    manual_weight_grams: payload.manual_weight_grams ?? null,
    filter_slugs: filterSlugs,
    internal_category_names: Array.isArray(payload.internal_category_names) ? payload.internal_category_names.map((item) => String(item)) : [],
    gallery: {
      display_image_urls: displayImageUrls,
      hidden_source_image_urls: hiddenSourceImageUrls,
      uploaded_image_urls: uploadedImageUrls,
      rows: galleryRows,
      source_image_urls: sourceImageUrls,
      manual_image_urls: uploadedImageUrls,
      manual_image_order: buildManualImageOrder(galleryRows),
    },
    presentation: {
      title_override: payload.presentation?.title_override ?? null,
      description_text: payload.presentation?.description_text ?? null,
      description_html: payload.presentation?.description_html ?? null,
      description_visibility: payload.presentation?.description_visibility ?? null,
    },
    price_override: payload.price_override?.manual_price_rub === null || payload.price_override?.manual_price_rub === undefined
      ? null
      : {
          manual_price_rub: Number(payload.price_override.manual_price_rub),
          manual_compare_at_price_rub:
            payload.price_override.manual_compare_at_price_rub === null || payload.price_override.manual_compare_at_price_rub === undefined
              ? null
              : Number(payload.price_override.manual_compare_at_price_rub),
        },
    listings: Array.isArray(payload.listings)
      ? payload.listings
          .map((listing) => ({
            id: Number(listing?.id || 0),
            source_id: listing?.source_id === null || listing?.source_id === undefined ? null : Number(listing.source_id),
            source_name: String(listing?.source_name || "").trim() || null,
            ingest_mode: String(listing?.ingest_mode || "").trim(),
            url: String(listing?.url || "").trim() || null,
            handle: String(listing?.handle || "").trim() || null,
            source_title: String(listing?.source_title || "").trim(),
            source_description_text: String(listing?.source_description_text || "").trim() || null,
            source_description_html: String(listing?.source_description_html || "").trim() || null,
            source_weight_grams: listing?.source_weight_grams === null || listing?.source_weight_grams === undefined ? null : Number(listing.source_weight_grams),
            source_designer_name: String(listing?.source_designer_name || "").trim() || null,
            source_category_name: String(listing?.source_category_name || "").trim() || null,
            orderability_status: String(listing?.orderability_status || "").trim(),
            status_reason: String(listing?.status_reason || "").trim() || null,
            image_urls: normalizeStringArray(listing?.image_urls),
            gallery: {
              display_image_urls: normalizeStringArray(listing?.gallery?.display_image_urls),
              hidden_source_image_urls: normalizeStringArray(listing?.gallery?.hidden_source_image_urls),
              uploaded_image_urls: normalizeStringArray(listing?.gallery?.uploaded_image_urls),
              rows: normalizeGalleryRows(listing?.gallery?.rows),
              source_image_urls: normalizeStringArray(listing?.gallery?.source_image_urls),
              manual_image_urls: normalizeStringArray(listing?.gallery?.uploaded_image_urls),
              manual_image_order: buildManualImageOrder(normalizeGalleryRows(listing?.gallery?.rows)),
            },
            variants: Array.isArray(listing?.variants)
              ? listing.variants.map((variant) => ({
                  title: String(variant?.title || "").trim(),
                  option1: null,
                  option2: null,
                  option3: null,
                  available: Boolean(variant?.available),
                  price: variant?.price ?? null,
                  compare_at_price: variant?.compare_at_price ?? null,
                  inventory_quantity: Boolean(variant?.available) ? 1 : 0,
                  sku: variant?.sku ?? null,
                  source_id: listing?.source_id === null || listing?.source_id === undefined ? null : Number(listing.source_id),
                  source_name: String(listing?.source_name || "").trim() || null,
                  listing_id: listing?.id === null || listing?.id === undefined ? null : Number(listing.id),
                  source_ref_id: String((variant as { source_ref_id?: string | null })?.source_ref_id || "").trim() || null,
                }))
              : [],
          }))
          .filter((listing) => listing.id > 0)
      : [],
    created_at: String(payload.created_at || ""),
    updated_at: String(payload.updated_at || ""),
  };
}
