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
    image_urls?: string[] | null;
  }
): string | null {
  return normalizeImageSourceUrl(product.image_urls?.[0]);
}
