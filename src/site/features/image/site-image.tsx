import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ImgHTMLAttributes,
  type SyntheticEvent,
} from "react";
import "./site-image.css";

export type SiteImageSkeletonVariant = "spotlight" | "admin-image" | "pulse" | "shine" | "wave";

type SiteImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "children"> & {
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
  fillContainer = false,
  forceSkeletonVisible = false,
  onError,
  onLoad,
  skeletonClassName = "",
  skeletonVariant = "wave",
  src,
  style,
  wrapperClassName = "",
  wrapperStyle,
  ...restProps
}: SiteImageProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useLayoutEffect(() => {
    if (forceSkeletonVisible) {
      setIsLoaded(false);
      setHasError(false);
      return;
    }

    setIsLoaded(false);
    setHasError(false);

    const imageNode = imageRef.current;
    if (!imageNode) {
      return;
    }

    if (imageNode.complete && imageNode.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [forceSkeletonVisible, src]);

  const wrapperCls = [
    "site-image",
    fillContainer ? "site-image--fill" : "",
    isLoaded ? "site-image--loaded" : "",
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
    setIsLoaded(true);
    onLoad?.(event);
  };

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoaded(false);
    onError?.(event);
  };

  return (
    <span className={wrapperCls} style={wrapperStyle}>
      {!isLoaded ? <span className={skeletonCls} aria-hidden="true" /> : null}
      <img
        ref={imageRef}
        src={src}
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
