import { useEffect, useState, type RefObject } from "react";

export type SiteImageTone = "light" | "dark";

export type SiteImageToneAsset = {
  url: string;
  widthPx?: number | null;
  heightPx?: number | null;
};

type UseSiteImageToneOptions = {
  asset: SiteImageToneAsset | null;
  targetRef: RefObject<HTMLElement | null>;
  surfaceSelector: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sampleImageTone(
  image: HTMLImageElement,
  surfaceRect: DOMRect,
  targetRect: DOMRect,
  assetWidth: number,
  assetHeight: number,
): SiteImageTone {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return "light";
  }

  const coverScale = Math.max(surfaceRect.width / assetWidth, surfaceRect.height / assetHeight);
  const renderedWidth = assetWidth * coverScale;
  const renderedHeight = assetHeight * coverScale;
  const cropOffsetX = (renderedWidth - surfaceRect.width) / 2;
  const cropOffsetY = (renderedHeight - surfaceRect.height) / 2;
  const sampleWidthOnSurface = Math.min(targetRect.width * 0.52, surfaceRect.width);
  const sampleHeightOnSurface = Math.min(targetRect.height * 0.82, surfaceRect.height);
  const sampleCenterX = targetRect.left + targetRect.width / 2 - surfaceRect.left;
  const sampleCenterY = targetRect.top + targetRect.height / 2 - surfaceRect.top;
  const sourceWidth = clamp(sampleWidthOnSurface / coverScale, 1, assetWidth);
  const sourceHeight = clamp(sampleHeightOnSurface / coverScale, 1, assetHeight);
  const sourceX = clamp((sampleCenterX + cropOffsetX) / coverScale - sourceWidth / 2, 0, assetWidth - sourceWidth);
  const sourceY = clamp((sampleCenterY + cropOffsetY) / coverScale - sourceHeight / 2, 0, assetHeight - sourceHeight);

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const luminances: number[] = [];
  let weightedLuminance = 0;
  let totalWeight = 0;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = (y * canvas.width + x) * 4;
      const alpha = data[index + 3] / 255;
      if (alpha <= 0) {
        continue;
      }
      const r = data[index] / 255;
      const g = data[index + 1] / 255;
      const b = data[index + 2] / 255;
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const distanceX = (x + 0.5 - canvas.width / 2) / (canvas.width / 2);
      const distanceY = (y + 0.5 - canvas.height / 2) / (canvas.height / 2);
      const radialWeight = Math.max(0.15, 1 - Math.sqrt(distanceX * distanceX + distanceY * distanceY));
      const weight = alpha * radialWeight;
      weightedLuminance += luminance * weight;
      totalWeight += weight;
      luminances.push(luminance);
    }
  }

  const averageLuminance = totalWeight > 0 ? weightedLuminance / totalWeight : 1;
  luminances.sort((left, right) => left - right);
  const medianLuminance = luminances.length > 0 ? luminances[Math.floor(luminances.length / 2)] : averageLuminance;
  return averageLuminance * 0.45 + medianLuminance * 0.55 < 0.5 ? "dark" : "light";
}

export function useSiteImageTone({ asset, targetRef, surfaceSelector }: UseSiteImageToneOptions) {
  const [tone, setTone] = useState<SiteImageTone>("dark");
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    const surface = target?.closest(surfaceSelector);
    if (!target || !(surface instanceof HTMLElement) || !asset?.url || !asset.widthPx || !asset.heightPx) {
      setTone("dark");
      setIsResolved(true);
      return;
    }

    let animationFrame = 0;
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";
    setIsResolved(false);

    const resolveFallback = () => {
      if (!cancelled) {
        setTone("dark");
        setIsResolved(true);
      }
    };

    const updateTone = () => {
      if (cancelled || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        return;
      }

      try {
        setTone(sampleImageTone(image, surface.getBoundingClientRect(), target.getBoundingClientRect(), asset.widthPx, asset.heightPx));
        setIsResolved(true);
      } catch {
        resolveFallback();
      }
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateTone);
    };

    image.onload = scheduleUpdate;
    image.onerror = resolveFallback;
    image.src = asset.url;
    if (image.complete) {
      scheduleUpdate();
    }

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(target);
    resizeObserver.observe(surface);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
    };
  }, [asset, surfaceSelector, targetRef]);

  return { tone, isResolved };
}
