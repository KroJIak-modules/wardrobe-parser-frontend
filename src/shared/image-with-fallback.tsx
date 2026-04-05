import { useEffect, useMemo, useState } from "react";

type ImageWithFallbackProps = {
  src: string | null | undefined;
  alt: string;
  className: string;
  placeholderClassName: string;
  placeholderText: string;
  loadingText?: string;
  fallbackText?: string;
  loading?: "lazy" | "eager";
};

export function ImageWithFallback({
  src,
  alt,
  className,
  placeholderClassName,
  placeholderText,
  loadingText,
  fallbackText,
  loading = "lazy",
}: ImageWithFallbackProps) {
  const normalizedSrc = useMemo(() => {
    const raw = (src || "").trim();
    return raw.length > 0 ? raw : null;
  }, [src]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [normalizedSrc]);

  const loadingLabel = loadingText ?? placeholderText;
  const fallbackLabel = fallbackText ?? placeholderText;

  if (!normalizedSrc || failed) {
    return <div className={placeholderClassName}>{fallbackLabel}</div>;
  }

  return (
    <>
      {!loaded ? <div className={`${placeholderClassName} image-loading-placeholder`}>{loadingLabel}</div> : null}
      <img
        className={className}
        src={normalizedSrc}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(true);
          setFailed(true);
        }}
        style={loaded ? undefined : { display: "none" }}
      />
    </>
  );
}
