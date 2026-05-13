export function toImageGatewayUrl(
  imageId: number | null | undefined,
  opts?: { w?: number; h?: number; q?: number }
) {
  if (!imageId || imageId <= 0) {
    return null;
  }
  const params = new URLSearchParams();
  if (opts?.w && Number.isFinite(opts.w)) {
    params.set("w", String(Math.max(16, Math.round(opts.w))));
  }
  if (opts?.h && Number.isFinite(opts.h)) {
    params.set("h", String(Math.max(16, Math.round(opts.h))));
  }
  if (opts?.q && Number.isFinite(opts.q)) {
    params.set("q", String(Math.max(25, Math.min(95, Math.round(opts.q)))));
  }
  const query = params.toString();
  return query ? `/api/v1/images/${imageId}?${query}` : `/api/v1/images/${imageId}`;
}

export function normalizeImageSourceUrl(url: string | null | undefined): string | null {
  const raw = (url || "").trim();
  if (!raw) {
    return null;
  }
  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")) {
    return raw;
  }
  return null;
}

export function getProductPrimaryImageUrl(
  product: {
    image_ids?: number[] | null;
    image_urls?: string[] | null;
  },
  opts?: { w?: number; h?: number; q?: number }
): string | null {
  const byId = toImageGatewayUrl(product.image_ids?.[0], opts);
  if (byId) {
    return byId;
  }
  return normalizeImageSourceUrl(product.image_urls?.[0]);
}
