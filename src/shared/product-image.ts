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

type OptimizeImageOptions = {
  width?: number;
  height?: number;
  quality?: number;
};

const withSearchParams = (
  input: URL,
  updater: (params: URLSearchParams) => void
): string => {
  const next = new URL(input.toString());
  updater(next.searchParams);
  return next.toString();
};

export function optimizeImageUrl(
  url: string | null | undefined,
  options: OptimizeImageOptions = {}
): string | null {
  const normalized = normalizeImageSourceUrl(url);
  if (!normalized) {
    return null;
  }
  const width = Math.max(1, Math.floor(options.width ?? 240));
  const height = Math.max(1, Math.floor(options.height ?? 240));
  const quality = Math.max(1, Math.min(100, Math.floor(options.quality ?? 55)));
  try {
    const parsed = new URL(normalized, window.location.origin);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("cdn.shopify.com")) {
      return withSearchParams(parsed, (params) => {
        params.set("width", String(width));
      });
    }
    if (host.includes("images.ctfassets.net") || host.includes("images.prismic.io")) {
      return withSearchParams(parsed, (params) => {
        params.set("w", String(width));
        params.set("h", String(height));
        params.set("q", String(quality));
      });
    }
    if (host.includes("cloudinary.com") || parsed.pathname.includes("/image/upload/")) {
      return normalized;
    }
    if (host.includes("vinted.net")) {
      // Vinted image URLs are signed and can break when arbitrary params are appended.
      return normalized;
    }
    return withSearchParams(parsed, (params) => {
      params.set("w", String(width));
      params.set("h", String(height));
      params.set("q", String(quality));
    });
  } catch {
    return normalized;
  }
}

export function getProductPrimaryImageUrl(
  product: {
    image_urls?: string[] | null;
  }
,
  options?: OptimizeImageOptions
): string | null {
  return optimizeImageUrl(product.image_urls?.[0], options);
}
