import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { SiteProductDetailItem } from "../../runtime/site-product-detail";
import { resolveSiteProductDetailSourceVariant } from "../../runtime/site-product-detail";

const GALLERY_WHEEL_THROTTLE_MS = 240;
const PRODUCT_GALLERY_MOBILE_MEDIA_QUERY = "(max-width: 640px)";

export function useSiteProductHeroState(product: SiteProductDetailItem) {
  const [selectedGalleryItemId, setSelectedGalleryItemId] = useState(product.gallery[0]?.id ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes.length === 1 ? (product.sizes[0] ?? null) : null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isSourcesDialogOpen, setIsSourcesDialogOpen] = useState(false);
  const mainImageViewportRef = useRef<HTMLDivElement | null>(null);
  const wheelThrottleRef = useRef<number | null>(null);
  const [isMobileGallery, setIsMobileGallery] = useState(false);
  const [emblaViewportRef, emblaApi] = useEmblaCarousel({
    active: false,
    containScroll: "trimSnaps",
    breakpoints: {
      [PRODUCT_GALLERY_MOBILE_MEDIA_QUERY]: { active: true },
    },
  });

  const setMainImageViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      mainImageViewportRef.current = node;
      emblaViewportRef(node);
    },
    [emblaViewportRef],
  );

  const selectedGalleryIndex = Math.max(
    0,
    product.gallery.findIndex((item) => item.id === selectedGalleryItemId),
  );
  const selectedGalleryItem =
    product.gallery.find((item) => item.id === selectedGalleryItemId) ?? product.gallery[0] ?? null;
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
    if (!emblaApi || !isMobileGallery) {
      return;
    }

    const syncSelectedGalleryItem = () => {
      const item = product.gallery[emblaApi.selectedScrollSnap()];
      if (item) {
        setSelectedGalleryItemId(item.id);
      }
    };

    emblaApi.on("select", syncSelectedGalleryItem);
    emblaApi.on("reInit", syncSelectedGalleryItem);
    return () => {
      emblaApi.off("select", syncSelectedGalleryItem);
      emblaApi.off("reInit", syncSelectedGalleryItem);
    };
  }, [emblaApi, isMobileGallery, product.gallery]);

  useEffect(() => {
    if (emblaApi && isMobileGallery) {
      emblaApi.scrollTo(selectedGalleryIndex);
    }
  }, [emblaApi, isMobileGallery, selectedGalleryIndex]);

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
      if (nextIndex < 0 || nextIndex >= product.gallery.length) {
        return true;
      }

      wheelThrottleRef.current = window.setTimeout(() => {
        wheelThrottleRef.current = null;
      }, GALLERY_WHEEL_THROTTLE_MS);
      setSelectedGalleryItemId(product.gallery[nextIndex]?.id ?? null);
      return true;
    },
    [product.gallery, selectedGalleryIndex],
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
    dragOffsetPx: 0,
    hasMultipleSourceVariants,
    isDraggingGallery: false,
    isSourcesDialogOpen,
    mainImageViewportRef: setMainImageViewportRef,
    selectedGalleryIndex,
    selectedGalleryItem,
    selectedGalleryItemId,
    selectedSize,
    selectedSourceId,
    closeSourcesDialog: () => setIsSourcesDialogOpen(false),
    openSourcesDialog: () => setIsSourcesDialogOpen(true),
    setSelectedGalleryItemId,
    setSelectedSize,
    setSelectedSourceId,
  };
}
