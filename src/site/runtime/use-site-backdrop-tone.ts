import { useEffect, useState, type RefObject } from "react";

export type SiteBackdropTone = "light" | "dark";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function matchesSource(image: HTMLImageElement, assetSrc: string) {
  try {
    const expected = new URL(assetSrc, window.location.href).href;
    return image.currentSrc === expected || image.src === expected;
  } catch {
    return false;
  }
}

function sampleImageTone(source: HTMLImageElement, rendered: HTMLImageElement, targetRect: DOMRect): SiteBackdropTone | null {
  if (source.naturalWidth <= 0 || source.naturalHeight <= 0) {
    return null;
  }

  const renderedRect = rendered.getBoundingClientRect();
  if (renderedRect.width <= 0 || renderedRect.height <= 0) {
    return null;
  }

  const objectFit = getComputedStyle(rendered).objectFit;
  const scale = objectFit === "cover"
    ? Math.max(renderedRect.width / source.naturalWidth, renderedRect.height / source.naturalHeight)
    : Math.min(renderedRect.width / source.naturalWidth, renderedRect.height / source.naturalHeight);
  const contentWidth = source.naturalWidth * scale;
  const contentHeight = source.naturalHeight * scale;
  const contentLeft = renderedRect.left + (renderedRect.width - contentWidth) / 2;
  const contentTop = renderedRect.top + (renderedRect.height - contentHeight) / 2;
  const sourceWidth = clamp((targetRect.width * 0.52) / scale, 1, source.naturalWidth);
  const sourceHeight = clamp((targetRect.height * 0.82) / scale, 1, source.naturalHeight);
  const sourceCenterX = (targetRect.left + targetRect.width / 2 - contentLeft) / scale;
  const sourceCenterY = (targetRect.top + targetRect.height / 2 - contentTop) / scale;

  if (sourceCenterX < 0 || sourceCenterX > source.naturalWidth || sourceCenterY < 0 || sourceCenterY > source.naturalHeight) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  try {
    context.drawImage(
      source,
      clamp(sourceCenterX - sourceWidth / 2, 0, source.naturalWidth - sourceWidth),
      clamp(sourceCenterY - sourceHeight / 2, 0, source.naturalHeight - sourceHeight),
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let totalLuminance = 0;
    for (let index = 0; index < data.length; index += 4) {
      totalLuminance += (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]) / 255;
    }
    return totalLuminance / (data.length / 4) < 0.5 ? "dark" : "light";
  } catch {
    return null;
  }
}

export function useSiteBackdropTone(
  targetRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  assetSrc: string | null,
) {
  const [tone, setTone] = useState<SiteBackdropTone>("light");

  useEffect(() => {
    if (!enabled || !assetSrc) {
      setTone("light");
      return;
    }

    let frameId = 0;
    let cancelled = false;
    const source = new Image();
    source.crossOrigin = "anonymous";
    const updateTone = () => {
      const target = targetRef.current;
      const rendered = Array.from(document.images).find((candidate) => matchesSource(candidate, assetSrc));
      const nextTone = target && rendered ? sampleImageTone(source, rendered, target.getBoundingClientRect()) : null;
      if (!cancelled) {
        setTone((current) => (current === (nextTone ?? "light") ? current : (nextTone ?? "light")));
      }
    };
    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateTone);
    };

    source.onload = scheduleUpdate;
    source.onerror = () => !cancelled && setTone("light");
    source.src = assetSrc;
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [assetSrc, enabled, targetRef]);

  return tone;
}
