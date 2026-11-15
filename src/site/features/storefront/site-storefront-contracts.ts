export type SiteNavItem = {
  label: string;
  to?: string;
};

export type SiteCarouselSlide = {
  id: string;
  imageSrc: string;
  imageSrcSet?: string | null;
  imageSizes?: string;
  mediaKind?: "image" | "video";
  mimeType?: string | null;
  alt: string;
};

export type SiteShowcaseMediaAsset = {
  id: string;
  url: string;
  imageSrcSet?: string | null;
  imageSizes?: string;
  imageProbeSrc?: string | null;
  mediaKind: "image" | "video";
  mimeType?: string | null;
  widthPx?: number | null;
  heightPx?: number | null;
};

export type SiteProduct = {
  id: string;
  path?: string;
  brand: string;
  designerId?: string;
  name: string;
  priceRub: number;
  oldPriceRub?: number | null;
  priceHasRange?: boolean;
  availability: string;
  imageSrc: string | null;
  imageSrcSet?: string | null;
  imageSizes?: string;
  imageAlt: string;
};

export type SiteFooterLink = {
  label: string;
  href?: string;
  to?: string;
};

export type SiteFooterColumn = {
  id: "social" | "info";
  title: string;
  links: SiteFooterLink[];
};

export type SiteShowcaseMedia = {
  heroDesktop: SiteShowcaseMediaAsset | null;
  heroMobile: SiteShowcaseMediaAsset | null;
  carouselSlidesDesktop: SiteCarouselSlide[];
  carouselSlidesMobile?: SiteCarouselSlide[];
};
