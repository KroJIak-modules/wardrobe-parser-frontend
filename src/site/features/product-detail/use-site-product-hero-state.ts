import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteProductDetailItem } from "../../runtime/site-product-detail";
import { resolveSiteProductDetailSourceVariant } from "../../runtime/site-product-detail";

const GALLERY_WHEEL_THROTTLE_MS = 240;
const PRODUCT_GALLERY_MOBILE_MEDIA_QUERY = "(max-width: 640px)";
const PRODUCT_GALLERY_SWIPE_MIN_DISTANCE_PX = 32;
const PRODUCT_GALLERY_SWIPE_DISTANCE_RATIO = 0.1;
const PRODUCT_GALLERY_SWIPE_FAST_VELOCITY_PX_PER_MS = 0.35;
const PRODUCT_GALLERY_DRAG_LOCK_THRESHOLD_PX = 8;
const PRODUCT_GALLERY_HORIZONTAL_SWIPE_AXIS_RATIO = 0.65;
const PRODUCT_GALLERY_EDGE_RESISTANCE = 0.35;

export function useSiteProductHeroState(product: SiteProductDetailItem) {
  const [selectedGalleryItemId, setSelectedGalleryItemId] = useState(product.gallery[0]?.id ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes.length === 1 ? (product.sizes[0] ?? null) : null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isSourcesDialogOpen, setIsSourcesDialogOpen] = useState(false);
  const mainImageViewportRef = useRef<HTMLDivElement | null>(null);
  const wheelThrottleRef = useRef<number | null>(null);
  const swipeStateRef = useRef<{
    x: number;
    y: number;
    pointerId: number;
    startedAt: number;
    isHorizontal: boolean | null;
  } | null>(null);
  const [isMobileGallery, setIsMobileGallery] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);

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

      swipeStateRef.current = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
        startedAt: event.timeStamp,
        isHorizontal: null,
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      const start = swipeStateRef.current;
      if (!start || start.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;

      if (start.isHorizontal === null) {
        if (
          Math.abs(deltaX) < PRODUCT_GALLERY_DRAG_LOCK_THRESHOLD_PX &&
          Math.abs(deltaY) < PRODUCT_GALLERY_DRAG_LOCK_THRESHOLD_PX
        ) {
          return;
        }

        start.isHorizontal =
          Math.abs(deltaX) > Math.abs(deltaY) * PRODUCT_GALLERY_HORIZONTAL_SWIPE_AXIS_RATIO;
      }

      if (!start.isHorizontal) {
        return;
      }

      if (event.cancelable) {
        event.preventDefault();
      }

      const isAtLeftEdge = selectedGalleryIndex === 0 && deltaX > 0;
      const isAtRightEdge = selectedGalleryIndex === product.gallery.length - 1 && deltaX < 0;
      const nextOffset = isAtLeftEdge || isAtRightEdge ? deltaX * PRODUCT_GALLERY_EDGE_RESISTANCE : deltaX;

      setIsDraggingGallery(true);
      setDragOffsetPx(nextOffset);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const start = swipeStateRef.current;
      if (!start || start.pointerId !== event.pointerId) {
        return;
      }

      swipeStateRef.current = null;

      const deltaX = event.clientX - start.x;
      const viewportWidth = Math.max(1, viewport.clientWidth);
      const durationMs = Math.max(1, event.timeStamp - start.startedAt);
      const velocity = Math.abs(deltaX) / durationMs;
      const distanceThreshold = Math.min(
        Math.max(PRODUCT_GALLERY_SWIPE_MIN_DISTANCE_PX, viewportWidth * PRODUCT_GALLERY_SWIPE_DISTANCE_RATIO),
        viewportWidth * 0.32,
      );
      const shouldNavigate =
        start.isHorizontal === true &&
        (Math.abs(deltaX) >= distanceThreshold || velocity >= PRODUCT_GALLERY_SWIPE_FAST_VELOCITY_PX_PER_MS);

      setIsDraggingGallery(false);
      setDragOffsetPx(0);

      if (!shouldNavigate) {
        return;
      }

      const nextIndex = deltaX < 0 ? selectedGalleryIndex + 1 : selectedGalleryIndex - 1;
      if (nextIndex < 0 || nextIndex >= product.gallery.length) {
        return;
      }

      setSelectedGalleryItemId(product.gallery[nextIndex]?.id ?? null);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (swipeStateRef.current?.pointerId === event.pointerId) {
        swipeStateRef.current = null;
        setIsDraggingGallery(false);
        setDragOffsetPx(0);
      }
    };

    viewport.addEventListener("pointerdown", handlePointerDown);
    viewport.addEventListener("pointermove", handlePointerMove);
    viewport.addEventListener("pointerup", handlePointerUp);
    viewport.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      viewport.removeEventListener("pointerdown", handlePointerDown);
      viewport.removeEventListener("pointermove", handlePointerMove);
      viewport.removeEventListener("pointerup", handlePointerUp);
      viewport.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [isMobileGallery, product.gallery, selectedGalleryIndex]);

  return {
    dragOffsetPx,
    hasMultipleSourceVariants,
    isDraggingGallery,
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
