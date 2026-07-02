export type SiteNavItem = {
  label: string;
  to?: string;
};

export type SiteCarouselSlide = {
  id: string;
  imageSrc: string;
  mediaKind?: "image" | "video";
  mimeType?: string | null;
  alt: string;
};

export type SiteShowcaseMediaAsset = {
  id: string;
  url: string;
  mediaKind: "image" | "video";
  mimeType?: string | null;
};

export type SiteProduct = {
  id: string;
  path?: string;
  brand: string;
  designerId?: string;
  name: string;
  priceRub: number;
  availability: string;
  imageSrc: string | null;
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
