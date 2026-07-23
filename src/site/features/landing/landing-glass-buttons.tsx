import { useRef } from "react";
import type { SiteShowcaseMediaAsset } from "../storefront/site-storefront-contracts";
import { useSiteImageTone } from "../../runtime/use-site-image-tone";
import "./landing-glass-buttons.css";

type LandingGlassButtonsProps = {
  label: string;
  onEnter: () => void;
  heroAsset: SiteShowcaseMediaAsset | null;
};

export function LandingGlassButtons({ label, onEnter, heroAsset }: LandingGlassButtonsProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const imageAsset = heroAsset?.mediaKind === "image" ? heroAsset : null;
  const { tone } = useSiteImageTone({
    asset: imageAsset,
    targetRef: buttonRef,
    surfaceSelector: ".site-landing__hero",
  });
  return (
    <div className="site-landing-cta site-landing-cta--ready">
      <button
        ref={buttonRef}
        type="button"
        className="site-landing-cta__button"
        data-tone={tone}
        onClick={onEnter}
        aria-label={label}
      >
        <span className="site-landing-cta__label">{label}</span>
      </button>
    </div>
  );
}
