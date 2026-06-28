export type SiteNavItem = {
  label: string;
  to?: string;
};

export type SiteCarouselSlide = {
  id: string;
  imageSrc: string;
  alt: string;
};

export type SiteProduct = {
  id: string;
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
  heroImageSrcDesktop: string | null;
  heroImageSrcMobile: string | null;
  carouselSlidesDesktop: SiteCarouselSlide[];
  carouselSlidesMobile?: SiteCarouselSlide[];
};
