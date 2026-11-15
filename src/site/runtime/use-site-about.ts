import { useEffect, useMemo, useState } from "react";
import {
  buildSiteAboutTextPanelViewModel,
  type SiteAboutTextPanelViewModel,
} from "./site-about-model";
import type { SiteCarouselSlide } from "../features/storefront/site-storefront-contracts";
import { siteApiJson, type SiteApiAboutResponse } from "./site-public-api";
import { buildSiteImageSource } from "../features/image/site-image-source";

export function useSiteAbout() {
  const [payload, setPayload] = useState<SiteApiAboutResponse | null>(null);

  useEffect(() => {
    let isDisposed = false;

    siteApiJson<SiteApiAboutResponse>("/site/about")
      .then((nextPayload) => {
        if (!isDisposed) {
          setPayload(nextPayload);
        }
      })
      .catch(() => {
        if (!isDisposed) {
          setPayload({ text: "", photos: [] });
        }
      });

    return () => {
      isDisposed = true;
    };
  }, []);

  const photoSlides = useMemo<SiteCarouselSlide[]>(
    () =>
      (payload?.photos ?? []).map((photo) => {
        const image = buildSiteImageSource(photo.url, "showcaseSlide");
        return {
          id: String(photo.id),
          imageSrc: image.src ?? photo.url,
          imageSrcSet: image.srcSet,
          imageSizes: image.sizes,
          alt: "",
        };
      }),
    [payload],
  );

  const textPanel = useMemo<SiteAboutTextPanelViewModel | null>(() => {
    const rawText = payload?.text ?? "";
    if (rawText.trim() === "") {
      return null;
    }
    return buildSiteAboutTextPanelViewModel({
      id: "about-description",
      rawText,
    });
  }, [payload]);

  return {
    title: "ОБО МНЕ",
    photoSlides,
    textPanel,
    isEmpty: photoSlides.length === 0 && (!textPanel || textPanel.displayText === ""),
  };
}
