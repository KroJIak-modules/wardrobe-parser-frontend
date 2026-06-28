const SITE_PUBLIC_ASSET_VERSION = "site-2026-06-28-2";
const SITE_PUBLIC_IMAGE_PATH_RE = /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;

const SITE_DEFAULT_HERO_URL = `/site-mock/landing-hero.jpg?v=${SITE_PUBLIC_ASSET_VERSION}`;

export const SITE_HERO_DESKTOP_URL = import.meta.env.VITE_SITE_HERO_DESKTOP_URL || SITE_DEFAULT_HERO_URL;
export const SITE_HERO_MOBILE_URL = import.meta.env.VITE_SITE_HERO_MOBILE_URL || SITE_DEFAULT_HERO_URL;
export const SITE_LOGO_URL = import.meta.env.VITE_SITE_LOGO_URL || `/logo_anton_shell.svg?v=${SITE_PUBLIC_ASSET_VERSION}`;

function splitHash(value: string) {
  const hashIndex = value.indexOf("#");
  if (hashIndex === -1) {
    return { withoutHash: value, hash: "" };
  }

  return {
    withoutHash: value.slice(0, hashIndex),
    hash: value.slice(hashIndex),
  };
}

export function isSiteVersionablePublicAssetUrl(src: string) {
  if (src === "" || !src.startsWith("/") || src.startsWith("//")) {
    return false;
  }

  if (src.startsWith("/assets/")) {
    return false;
  }

  return SITE_PUBLIC_IMAGE_PATH_RE.test(src);
}

export function resolveSitePublicAssetUrl(src: string) {
  if (!isSiteVersionablePublicAssetUrl(src)) {
    return src;
  }

  const { withoutHash, hash } = splitHash(src);
  const queryIndex = withoutHash.indexOf("?");
  const pathname = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);
  const search = queryIndex === -1 ? "" : withoutHash.slice(queryIndex + 1);
  const params = new URLSearchParams(search);

  if (params.get("v") !== SITE_PUBLIC_ASSET_VERSION) {
    params.set("v", SITE_PUBLIC_ASSET_VERSION);
  }

  const nextSearch = params.toString();
  return `${pathname}${nextSearch ? `?${nextSearch}` : ""}${hash}`;
}
