import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildSiteImageSource } from "../image/site-image-source";
import type { SiteProductDetailGalleryItem, SiteProductDetailItem } from "../../runtime/site-product-detail";
import { resolveSiteProductDetailSource, resolveSiteProductDetailSourceVariant } from "../../runtime/site-product-detail";

const GALLERY_WHEEL_THROTTLE_MS = 240;
const GALLERY_SCROLL_GUARD_MS = 450;
const PRODUCT_GALLERY_MOBILE_MEDIA_QUERY = "(max-width: 640px)";

export function useSiteProductHeroState(product: SiteProductDetailItem) {
  const [selectedGalleryItemId, setSelectedGalleryItemId] = useState(product.gallery[0]?.id ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes.length === 1 ? (product.sizes[0] ?? null) : null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isSourcesDialogOpen, setIsSourcesDialogOpen] = useState(false);
  const mainImageViewportRef = useRef<HTMLDivElement | null>(null);
  const wheelThrottleRef = useRef<number | null>(null);
  const [isMobileGallery, setIsMobileGallery] = useState(false);
  const isProgrammaticScrollRef = useRef(false);
  const scrollGuardTimeoutRef = useRef<number | null>(null);

  const setMainImageViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      mainImageViewportRef.current = node;
    },
    [],
  );

  const activeSource = useMemo(() => {
    return resolveSiteProductDetailSource(product, selectedSize, selectedSourceId);
  }, [product, selectedSize, selectedSourceId]);

  const gallery = useMemo<readonly SiteProductDetailGalleryItem[]>(() => {
    if (!activeSource || !Array.isArray(activeSource.imageUrls)) return product.gallery;
    return activeSource.imageUrls.map((url, index) => {
      const main = buildSiteImageSource(url, "galleryMain");
      const thumb = buildSiteImageSource(url, "galleryThumb");
      return {
        id: `variant-${activeSource.id}-${index + 1}`,
        imageSrc: main.src ?? url,
        imageSrcSet: main.srcSet,
        imageSizes: main.sizes,
        thumbSrc: thumb.src ?? url,
        thumbSrcSet: thumb.srcSet,
        thumbSizes: thumb.sizes,
        thumbWidth: 97,
        thumbHeight: 129,
        alt: "",
      };
    });
  }, [activeSource, product.gallery]);

  useEffect(() => {
    setSelectedGalleryItemId((current) => (
      gallery.some((item) => item.id === current) ? current : (gallery[0]?.id ?? null)
    ));
  }, [gallery]);

  const selectedGalleryIndex = Math.max(
    0,
    gallery.findIndex((item) => item.id === selectedGalleryItemId),
  );
  const selectedGalleryItem =
    gallery.find((item) => item.id === selectedGalleryItemId) ?? gallery[0] ?? null;
  const hasMultipleSourceVariants = Boolean(product.sourceVariants?.some((variant) => variant.sources.length > 1));

  useEffect(() => {
    if (product.sizes.length === 1) {
      const onlySize = product.sizes[0] ?? null;
      setSelectedSize((current) => (current === onlySize ? current : onlySize));
      return;
    }

    setSelectedSize((current) => (current && product.sizes.includes(current) ? current : null));
  }, [product.sizes]);

  useEffect(() => {
    if (!selectedSize) {
      setSelectedSourceId(null);
      return;
    }

    const activeVariant = resolveSiteProductDetailSourceVariant(product, selectedSize);
    if (!activeVariant) {
      setSelectedSourceId(null);
      return;
    }

    setSelectedSourceId((current) =>
      current && activeVariant.sources.some((source) => source.id === current) ? current : (activeVariant.sources[0]?.id ?? null),
    );
  }, [product, selectedSize]);

  useEffect(() => {
    return () => {
      if (wheelThrottleRef.current !== null) {
        window.clearTimeout(wheelThrottleRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(PRODUCT_GALLERY_MOBILE_MEDIA_QUERY);
    const updateMobileGallery = () => setIsMobileGallery(mediaQuery.matches);

    updateMobileGallery();
    mediaQuery.addEventListener("change", updateMobileGallery);
    return () => {
      mediaQuery.removeEventListener("change", updateMobileGallery);
    };
  }, []);

  useEffect(() => {
    if (!isMobileGallery) {
      return undefined;
    }

    // Мобильная галерея листается нативным скроллом: вьюпорт — скролл-контейнер,
    // слайды примапливаются средствами браузера. Так рядом с фотографией никогда не
    // показывается край соседнего кадра, а лента не «залипает» на половине свайпа.
    const viewport = mainImageViewportRef.current;
    if (!viewport) {
      return undefined;
    }

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) {
        return;
      }

      const slideWidth = viewport.clientWidth;
      if (!slideWidth) {
        return;
      }

      const index = Math.round(viewport.scrollLeft / slideWidth);
      const item = gallery[index];
      if (item && item.id !== selectedGalleryItemId) {
        setSelectedGalleryItemId(item.id);
      }
    };

    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, [gallery, isMobileGallery, selectedGalleryItemId]);

  useEffect(() => {
    if (!isMobileGallery) {
      return;
    }

    const viewport = mainImageViewportRef.current;
    if (!viewport) {
      return;
    }

    const slideWidth = viewport.clientWidth;
    if (!slideWidth) {
      return;
    }

    // Цель берём у самого слайда: из-за дробных пикселей позиция слайда
    // отличается от index * ширины, и браузер откатывает скролл, если
    // примапливание не совпало с точкой привязки.
    const slide = viewport.querySelectorAll<HTMLElement>(".site-product-detail__main-image-slide")[selectedGalleryIndex];
    const target = slide
      ? slide.getBoundingClientRect().left - viewport.getBoundingClientRect().left + viewport.scrollLeft
      : selectedGalleryIndex * slideWidth;
    if (Math.abs(viewport.scrollLeft - target) < 1) {
      return;
    }

    isProgrammaticScrollRef.current = true;
    // Мгновенный переход: плавный скролл браузер отменяет при обязательном
    // привязывании к слайдам (scroll-snap-type: mandatory).
    viewport.scrollTo({ left: target, behavior: "auto" });
    if (scrollGuardTimeoutRef.current !== null) {
      window.clearTimeout(scrollGuardTimeoutRef.current);
    }
    scrollGuardTimeoutRef.current = window.setTimeout(() => {
      scrollGuardTimeoutRef.current = null;
      isProgrammaticScrollRef.current = false;
    }, GALLERY_SCROLL_GUARD_MS);
  }, [isMobileGallery, selectedGalleryIndex]);

  useEffect(() => {
    return () => {
      if (scrollGuardTimeoutRef.current !== null) {
        window.clearTimeout(scrollGuardTimeoutRef.current);
        scrollGuardTimeoutRef.current = null;
      }
    };
  }, []);

  const handleGalleryWheel = useCallback(
    (deltaX: number, deltaY: number) => {
      if (wheelThrottleRef.current !== null) {
        return true;
      }

      if (Math.abs(deltaY) < Math.abs(deltaX) && Math.abs(deltaX) < 8) {
        return false;
      }

      if (deltaY === 0) {
        return false;
      }

      const nextIndex = deltaY > 0 ? selectedGalleryIndex + 1 : selectedGalleryIndex - 1;
      if (nextIndex < 0 || nextIndex >= gallery.length) {
        return true;
      }

      wheelThrottleRef.current = window.setTimeout(() => {
        wheelThrottleRef.current = null;
      }, GALLERY_WHEEL_THROTTLE_MS);
      setSelectedGalleryItemId(gallery[nextIndex]?.id ?? null);
      return true;
    },
    [gallery, selectedGalleryIndex],
  );

  useEffect(() => {
    const viewport = mainImageViewportRef.current;
    if (!viewport) {
      return undefined;
    }

    const handleViewportWheel = (event: globalThis.WheelEvent) => {
      if (isMobileGallery || !handleGalleryWheel(event.deltaX, event.deltaY)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    viewport.addEventListener("wheel", handleViewportWheel, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handleViewportWheel);
    };
  }, [handleGalleryWheel, isMobileGallery]);

  return {
    hasMultipleSourceVariants,
    isSourcesDialogOpen,
    mainImageViewportRef: setMainImageViewportRef,
    selectedGalleryIndex,
    selectedGalleryItem,
    selectedGalleryItemId,
    selectedSize,
    selectedSourceId,
    activeSource,
    gallery,
    closeSourcesDialog: () => setIsSourcesDialogOpen(false),
    openSourcesDialog: () => setIsSourcesDialogOpen(true),
    setSelectedGalleryItemId,
    setSelectedSize,
    setSelectedSourceId,
  };
}
