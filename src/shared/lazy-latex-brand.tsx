import { useEffect, useRef, useState } from "react";
import { LatexBrand } from "./latex-brand";

export function LazyLatexBrand({
  value,
  fallback = "Без бренда",
  className = "",
}: {
  value: string | null | undefined;
  fallback?: string;
  className?: string;
}) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) {
      return;
    }
    const node = anchorRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setReady(true);
        }
      },
      { root: null, rootMargin: "160px 0px", threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready]);

  if (ready) {
    return <LatexBrand value={value} fallback={fallback} className={className} />;
  }

  const text = String(value || "").trim() || fallback;
  return <span ref={anchorRef} className={className}>{text}</span>;
}

