import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteProductDetailItem } from "../../runtime/site-product-detail-mock";
import { resolveSiteProductDetailSourceVariant } from "../../runtime/site-product-detail-mock";

const GALLERY_WHEEL_THROTTLE_MS = 240;
const PRODUCT_GALLERY_MOBILE_MEDIA_QUERY = "(max-width: 640px)";
const PRODUCT_GALLERY_SWIPE_THRESHOLD_PX = 36;

export function useSiteProductHeroState(product: SiteProductDetailItem) {
  const [selectedGalleryItemId, setSelectedGalleryItemId] = useState(product.gallery[0]?.id ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isSourcesDialogOpen, setIsSourcesDialogOpen] = useState(false);
  const mainImageViewportRef = useRef<HTMLDivElement | null>(null);
  const wheelThrottleRef = useRef<number | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const [isMobileGallery, setIsMobileGallery] = useState(false);

  const selectedGalleryIndex = Math.max(
    0,
    product.gallery.findIndex((item) => item.id === selectedGalleryItemId),
  );
  const selectedGalleryItem =
    product.gallery.find((item) => item.id === selectedGalleryItemId) ?? product.gallery[0] ?? null;
  const hasMultipleSourceVariants = Boolean(product.sourceVariants?.some((variant) => variant.sources.length > 1));

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
      if (isMobileGallery) {
        return;
      }

      if (!handleGalleryWheel(event.deltaX, event.deltaY)) {
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

  useEffect(() => {
    const viewport = mainImageViewportRef.current;
    if (!viewport || !isMobileGallery || product.gallery.length <= 1) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      swipeStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
      };
      viewport.setPointerCapture?.(event.pointerId);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const start = swipeStartRef.current;
      if (!start || start.pointerId !== event.pointerId) {
        return;
      }

      swipeStartRef.current = null;
      viewport.releasePointerCapture?.(event.pointerId);

      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;
      if (Math.abs(deltaX) < PRODUCT_GALLERY_SWIPE_THRESHOLD_PX || Math.abs(deltaX) <= Math.abs(deltaY)) {
        return;
      }

      const nextIndex = deltaX < 0 ? selectedGalleryIndex + 1 : selectedGalleryIndex - 1;
      if (nextIndex < 0 || nextIndex >= product.gallery.length) {
        return;
      }

      setSelectedGalleryItemId(product.gallery[nextIndex]?.id ?? null);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (swipeStartRef.current?.pointerId === event.pointerId) {
        swipeStartRef.current = null;
      }
    };

    viewport.addEventListener("pointerdown", handlePointerDown);
    viewport.addEventListener("pointerup", handlePointerUp);
    viewport.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      viewport.removeEventListener("pointerdown", handlePointerDown);
      viewport.removeEventListener("pointerup", handlePointerUp);
      viewport.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [isMobileGallery, product.gallery, selectedGalleryIndex]);

  return {
    hasMultipleSourceVariants,
    isSourcesDialogOpen,
    mainImageViewportRef,
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
