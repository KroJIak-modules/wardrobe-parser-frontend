import { formatSiteRubles } from "../../app/site-format";
import "./site-old-price.css";

export function SiteOldPrice({ valueRub, className }: { valueRub: number; className?: string }) {
  return (
    <span className={["site-old-price", className].filter(Boolean).join(" ")}>
      <span className="site-old-price__value">{formatSiteRubles(valueRub)} ₽</span>
      <svg className="site-old-price__strike" viewBox="0 0 99 15" fill="none" preserveAspectRatio="none" aria-hidden="true">
        <path d="M5.70001.75c.08805 0 .1761 0 14.79349.08412 14.6174.08412 43.7619.25235 59.5236.29696 15.762.04461 17.2589-.03951 17.7218-.04079.1762-.00048-1.6689.42187-4.4558 1.01451-1.8931.40257-4.8119.76089-21.189 1.73461-16.377.97373-46.1375 2.48785-61.0284 3.39402-14.89085.90618-14.01037 1.15853 4.9334 1.49883 18.9438.34029 55.9243.76088 59.5663 1.4402 3.642.6793-27.175 1.6046-43.7549 2.2074-16.5798.6028-17.9888.8552-18.8464.9852-.8578.13-1.1219.13-1.3941.385" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
