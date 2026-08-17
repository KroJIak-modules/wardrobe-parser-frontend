import { memo, useLayoutEffect, useMemo, useRef, useState } from "react";

type ImageWithFallbackProps = {
  src: string | null | undefined;
  alt: string;
  className: string;
  placeholderClassName: string;
  placeholderText: string;
  loadingText?: string;
  fallbackText?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
};

function ImageWithFallbackBase({
  src,
  alt,
  className,
  placeholderClassName,
  placeholderText,
  loadingText,
  fallbackText,
  loading = "lazy",
  fetchPriority = "auto",
}: ImageWithFallbackProps) {
  const normalizedSrc = useMemo(() => {
    const raw = (src || "").trim();
    return raw.length > 0 ? raw : null;
  }, [src]);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);

  useLayoutEffect(() => {
    setLoaded(false);
    setFailed(false);

    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [normalizedSrc]);

  const loadingLabel = loadingText ?? placeholderText;
  const fallbackLabel = fallbackText ?? placeholderText;
  if (!normalizedSrc || failed) {
    return <div className={placeholderClassName}>{fallbackLabel}</div>;
  }

  return (
    <div style={{ position: "relative" }}>
      {!loaded ? (
        <div
          className={`${placeholderClassName} image-loading-placeholder image-loading-skeleton`}
          aria-label={loadingLabel}
        />
      ) : null}
      <img
        ref={imageRef}
        className={className}
        src={normalizedSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(true);
          setFailed(true);
        }}
        style={{
          position: loaded ? "static" : "absolute",
          inset: loaded ? undefined : 0,
          width: loaded ? undefined : "100%",
          height: loaded ? undefined : "100%",
          opacity: loaded ? 1 : 0,
          pointerEvents: loaded ? undefined : "none",
        }}
      />
    </div>
  );
}

export const ImageWithFallback = memo(ImageWithFallbackBase);
