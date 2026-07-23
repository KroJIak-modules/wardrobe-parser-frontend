import { useEffect, useMemo, useState } from "react";
import type { SiteShowcaseMedia, SiteShowcaseMediaAsset } from "../features/storefront/site-storefront-contracts";
import {
  siteApiJson,
  type SiteApiMediaAsset,
} from "./site-public-api";

function preloadImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    image.src = src;
  });
}

function toSlide(asset: SiteApiMediaAsset) {
  return {
    id: String(asset.id),
    imageSrc: asset.url,
    mediaKind: asset.media_kind,
    mimeType: asset.mime_type,
    alt: "",
  };
}

function toAsset(asset: SiteApiMediaAsset | null): SiteShowcaseMediaAsset | null {
  if (!asset) {
    return null;
  }
  return {
    id: String(asset.id),
    url: asset.url,
    mediaKind: asset.media_kind,
    mimeType: asset.mime_type,
    widthPx: asset.width_px,
    heightPx: asset.height_px,
  };
}

export function useSiteShowcaseMedia({
  preloadCarousel = false,
}: {
  preloadCarousel?: boolean;
} = {}) {
  const [media, setMedia] = useState<SiteShowcaseMedia>({
    heroDesktop: null,
    heroMobile: null,
    carouselSlidesDesktop: [],
    carouselSlidesMobile: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCarouselResolved, setIsCarouselResolved] = useState(false);
  const [isCarouselReady, setIsCarouselReady] = useState(false);

  useEffect(() => {
    let isDisposed = false;
    setLoading(true);
    setError(null);

    Promise.all([
      siteApiJson<{ viewport: "desktop" | "mobile"; asset: SiteApiMediaAsset | null }>("/site/home/hero?viewport=desktop"),
      siteApiJson<{ viewport: "desktop" | "mobile"; asset: SiteApiMediaAsset | null }>("/site/home/hero?viewport=mobile"),
    ])
      .then(([desktopHero, mobileHero]) => {
        if (isDisposed) {
          return;
        }
        setMedia((current) => ({
          ...current,
          heroDesktop: toAsset(desktopHero.asset),
          heroMobile: toAsset(mobileHero.asset) ?? toAsset(desktopHero.asset),
        }));
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (isDisposed) {
          return;
        }
        setLoading(false);
        setError(error instanceof Error ? error.message : "Не удалось загрузить витрину");
      });

    Promise.all([
      siteApiJson<{ viewport: "desktop" | "mobile"; items: SiteApiMediaAsset[] }>("/site/home/carousel?viewport=desktop"),
      siteApiJson<{ viewport: "desktop" | "mobile"; items: SiteApiMediaAsset[] }>("/site/home/carousel?viewport=mobile"),
    ])
      .then(([desktopCarousel, mobileCarousel]) => {
        if (isDisposed) {
          return;
        }
        setMedia((current) => ({
          ...current,
          carouselSlidesDesktop: desktopCarousel.items.map(toSlide),
          carouselSlidesMobile: mobileCarousel.items.map(toSlide),
        }));
        setIsCarouselResolved(true);
      })
      .catch(() => {
        if (!isDisposed) {
          setIsCarouselResolved(true);
        }
      });

    return () => {
      isDisposed = true;
    };
  }, []);

  const carouselSources = useMemo(() => {
    const uniqueSources = new Set<string>();
    for (const slide of media.carouselSlidesDesktop) {
      if (slide.mediaKind !== "video") {
        uniqueSources.add(slide.imageSrc);
      }
    }
    for (const slide of media.carouselSlidesMobile ?? []) {
      if (slide.mediaKind !== "video") {
        uniqueSources.add(slide.imageSrc);
      }
    }
    return Array.from(uniqueSources);
  }, [media.carouselSlidesDesktop, media.carouselSlidesMobile]);

  useEffect(() => {
    if (!preloadCarousel || !isCarouselResolved) {
      setIsCarouselReady(false);
      return;
    }

    if (carouselSources.length === 0) {
      setIsCarouselReady(true);
      return;
    }

    let isDisposed = false;
    setIsCarouselReady(false);

    Promise.all(carouselSources.map((src) => preloadImage(src)))
      .then(() => {
        if (!isDisposed) {
          setIsCarouselReady(true);
        }
      })
      .catch(() => {
        if (!isDisposed) {
          setIsCarouselReady(false);
        }
      });

    return () => {
      isDisposed = true;
    };
  }, [carouselSources, isCarouselResolved, preloadCarousel]);

  return {
    media,
    loading,
    error,
    isCarouselResolved,
    isCarouselReady,
  };
}
