import { useEffect, useRef, useState } from "react";

function buildMeasurementNode(width: number, textClassName: string) {
  const measurementNode = document.createElement("p");
  measurementNode.className = textClassName;
  measurementNode.style.position = "absolute";
  measurementNode.style.visibility = "hidden";
  measurementNode.style.pointerEvents = "none";
  measurementNode.style.inset = "0 auto auto 0";
  measurementNode.style.height = "auto";
  measurementNode.style.minHeight = "0";
  measurementNode.style.maxHeight = "none";
  measurementNode.style.margin = "0";
  measurementNode.style.overflow = "visible";
  measurementNode.style.whiteSpace = "normal";
  measurementNode.style.display = "block";
  measurementNode.style.width = `${width}px`;
  return measurementNode;
}

function appendCollapsedMeasurement(measurementNode: HTMLParagraphElement, previewText: string, readMoreClassName: string) {
  measurementNode.textContent = "";
  measurementNode.append(document.createTextNode(previewText));

  const suffix = document.createElement("span");
  suffix.className = readMoreClassName;
  suffix.textContent = "...Читать дальше";
  measurementNode.append(suffix);
}

function resolveCollapsedDescription({
  description,
  availableWidth,
  lineHeight,
  textClassName,
  readMoreClassName,
}: {
  description: string;
  availableWidth: number;
  lineHeight: number;
  textClassName: string;
  readMoreClassName: string;
}) {
  const collapsedHeight = lineHeight * 2 + 1;
  const measurementNode = buildMeasurementNode(availableWidth, textClassName);
  document.body.appendChild(measurementNode);

  measurementNode.textContent = description;
  const fullHeight = measurementNode.getBoundingClientRect().height;

  if (fullHeight <= collapsedHeight) {
    measurementNode.remove();
    return {
      isExpandable: false,
      collapsedDescription: description,
    };
  }

  let low = 0;
  let high = description.length;
  let bestLength = 0;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    appendCollapsedMeasurement(measurementNode, description.slice(0, middle).trimEnd(), readMoreClassName);

    if (measurementNode.getBoundingClientRect().height <= collapsedHeight) {
      bestLength = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  let bestPreview = description.slice(0, bestLength).trimEnd();
  const safeSpaceIndex = bestPreview.lastIndexOf(" ");
  if (safeSpaceIndex >= bestPreview.length - 24) {
    bestPreview = bestPreview.slice(0, safeSpaceIndex).trimEnd();
  }

  measurementNode.remove();
  return {
    isExpandable: true,
    collapsedDescription: bestPreview.trimEnd(),
  };
}

export function useSiteCatalogExpandableDescription({
  description,
  isEnabled,
  resetKey,
  textClassName = "site-catalog-shell__description",
  readMoreClassName = "site-catalog-shell__read-more-inline",
}: {
  description: string;
  isEnabled: boolean;
  resetKey?: string;
  textClassName?: string;
  readMoreClassName?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpandable, setIsExpandable] = useState(false);
  const [collapsedDescription, setCollapsedDescription] = useState(description);
  const textRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    setIsExpanded(false);
    setCollapsedDescription(description);
  }, [description, isEnabled, resetKey]);

  useEffect(() => {
    if (!isEnabled) {
      setIsExpandable(false);
      return undefined;
    }

    const element = textRef.current;
    if (!element) {
      return undefined;
    }

    let isDisposed = false;
    let firstFrameId = 0;
    let secondFrameId = 0;

    const measureExpandableState = () => {
      const availableWidth = element.clientWidth;
      if (availableWidth <= 0) {
        return;
      }

      const computedStyle = window.getComputedStyle(element);
      const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 18;
      const nextState = resolveCollapsedDescription({
        description,
        availableWidth,
        lineHeight,
        textClassName,
        readMoreClassName,
      });

      setIsExpandable(nextState.isExpandable);
      setCollapsedDescription(nextState.collapsedDescription);
    };

    const scheduleMeasurement = () => {
      cancelAnimationFrame(firstFrameId);
      cancelAnimationFrame(secondFrameId);
      firstFrameId = window.requestAnimationFrame(() => {
        secondFrameId = window.requestAnimationFrame(() => {
          if (!isDisposed) {
            measureExpandableState();
          }
        });
      });
    };

    scheduleMeasurement();

    const resizeObserver = new ResizeObserver(() => {
      scheduleMeasurement();
    });
    resizeObserver.observe(element);
    if (element.parentElement) {
      resizeObserver.observe(element.parentElement);
    }

    const handleWindowResize = () => {
      scheduleMeasurement();
    };
    window.addEventListener("resize", handleWindowResize);

    const fontFaceSet = "fonts" in document ? document.fonts : null;
    const handleFontsLoaded = () => {
      scheduleMeasurement();
    };

    fontFaceSet?.ready.then(() => {
      if (!isDisposed) {
        scheduleMeasurement();
      }
    });
    fontFaceSet?.addEventListener?.("loadingdone", handleFontsLoaded);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(firstFrameId);
      cancelAnimationFrame(secondFrameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
      fontFaceSet?.removeEventListener?.("loadingdone", handleFontsLoaded);
    };
  }, [description, isEnabled, readMoreClassName, textClassName]);

  return {
    collapsedDescription,
    isExpanded,
    isExpandable,
    textRef,
    expand: () => setIsExpanded(true),
  };
}
