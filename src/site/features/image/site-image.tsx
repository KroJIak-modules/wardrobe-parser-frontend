import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ImgHTMLAttributes,
  type SyntheticEvent,
} from "react";
import { resolveSitePublicAssetUrl } from "../../app/site-public-asset";
import "./site-image.css";

export type SiteImageSkeletonVariant = "spotlight" | "admin-image" | "pulse" | "shine" | "wave";

function clearTimer(timerRef: { current: number | null }) {
  if (timerRef.current === null) {
    return;
  }

  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

type SiteImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "children"> & {
  enableSkeleton?: boolean;
  fillContainer?: boolean;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
  skeletonClassName?: string;
  skeletonVariant?: SiteImageSkeletonVariant;
  forceSkeletonVisible?: boolean;
};

export function SiteImage({
  alt,
  className = "",
  decoding,
  enableSkeleton = true,
  fillContainer = false,
  forceSkeletonVisible = false,
  onError,
  onLoad,
  skeletonClassName = "",
  skeletonVariant = "pulse",
  src,
  style,
  wrapperClassName = "",
  wrapperStyle,
  ...restProps
}: SiteImageProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  const [isImageVisible, setIsImageVisible] = useState(false);
  const [isSkeletonVisible, setIsSkeletonVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = useMemo(() => (typeof src === "string" ? resolveSitePublicAssetUrl(src) : src), [src]);

  const showImage = (keepSkeleton = false) => {
    setIsImageVisible(true);
    if (!keepSkeleton) {
      setIsSkeletonVisible(false);
    }
  };

  useLayoutEffect(() => {
    clearTimer(revealTimeoutRef);

    if (forceSkeletonVisible) {
      setIsImageVisible(false);
      setIsSkeletonVisible(true);
      setHasError(false);
      return () => {
        clearTimer(revealTimeoutRef);
      };
    }

    setIsImageVisible(false);
    setIsSkeletonVisible(false);
    setHasError(false);

    const imageNode = imageRef.current;
    if (imageNode?.complete && imageNode.naturalWidth > 0) {
      showImage();
    } else {
      setIsSkeletonVisible(enableSkeleton);
    }

    return () => {
      clearTimer(revealTimeoutRef);
    };
  }, [enableSkeleton, forceSkeletonVisible, resolvedSrc]);

  const wrapperCls = [
    "site-image",
    fillContainer ? "site-image--fill" : "",
    isImageVisible ? "site-image--visible" : "",
    isSkeletonVisible ? "site-image--skeleton-visible" : "",
    hasError ? "site-image--error" : "",
    `site-image--${skeletonVariant}`,
    forceSkeletonVisible ? "site-image--forced-skeleton" : "",
    wrapperClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const skeletonCls = ["site-image__skeleton", skeletonClassName].filter(Boolean).join(" ");
  const imageCls = ["site-image__img", className].filter(Boolean).join(" ");

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    if (forceSkeletonVisible) {
      onLoad?.(event);
      return;
    }

    setHasError(false);
    clearTimer(revealTimeoutRef);

    showImage();
    onLoad?.(event);
  };

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    clearTimer(revealTimeoutRef);
    setHasError(true);
    setIsImageVisible(false);
    setIsSkeletonVisible(enableSkeleton);
    onError?.(event);
  };

  return (
    <span className={wrapperCls} style={wrapperStyle}>
      {isSkeletonVisible ? <span className={skeletonCls} aria-hidden="true" /> : null}
      <img
        ref={imageRef}
        src={resolvedSrc}
        alt={alt}
        className={imageCls}
        decoding={decoding}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        {...restProps}
      />
    </span>
  );
}
