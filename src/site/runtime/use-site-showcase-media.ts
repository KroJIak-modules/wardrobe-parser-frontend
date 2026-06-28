import { useEffect, useMemo, useState } from "react";
import { resolveSitePublicAssetUrl } from "../app/site-public-asset";
import { siteShowcaseMockMedia } from "./site-storefront-mock";

function preloadImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    image.src = src;
  });
}

export function useSiteShowcaseMedia({
  preloadCarousel = false,
}: {
  preloadCarousel?: boolean;
} = {}) {
  const [isCarouselReady, setIsCarouselReady] = useState(false);

  const carouselSources = useMemo(() => {
    const uniqueSources = new Set<string>();

    for (const slide of siteShowcaseMockMedia.carouselSlidesDesktop) {
      uniqueSources.add(resolveSitePublicAssetUrl(slide.imageSrc));
    }

    for (const slide of siteShowcaseMockMedia.carouselSlidesMobile ?? []) {
      uniqueSources.add(resolveSitePublicAssetUrl(slide.imageSrc));
    }

    return Array.from(uniqueSources);
  }, []);

  useEffect(() => {
    if (!preloadCarousel) {
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
  }, [carouselSources, preloadCarousel]);

  return {
    media: siteShowcaseMockMedia,
    loading: false,
    error: null,
    isCarouselReady,
  };
}
