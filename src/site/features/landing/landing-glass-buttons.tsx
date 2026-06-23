import "./landing-glass-buttons.css";

type LandingGlassButtonsProps = {
  label: string;
  onEnter: () => void;
};

export function LandingGlassButtons({ label, onEnter }: LandingGlassButtonsProps) {
  return (
    <div className="site-landing-cta">
      <button
        type="button"
        className="site-landing-cta__button"
        onClick={onEnter}
        aria-label={label}
      >
        <span>{label}</span>
      </button>
    </div>
  );
}
