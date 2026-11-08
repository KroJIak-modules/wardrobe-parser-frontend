const PUBLIC_SITE_LABEL_FALLBACK = "Публичный сайт";

function configuredPublicSiteUrl(): URL | null {
  const raw = String(import.meta.env.VITE_PUBLIC_SITE_URL || "").trim();
  if (!raw) return null;
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
}

export function publicSiteLabel(): string {
  return configuredPublicSiteUrl()?.hostname.replace(/^www\./i, "") || PUBLIC_SITE_LABEL_FALLBACK;
}

export function publicProductUrl(productId: number | string): string {
  const path = `/show/${encodeURIComponent(String(productId))}`;
  const base = configuredPublicSiteUrl();
  return base ? new URL(path, base).toString() : path;
}
