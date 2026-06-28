import { resolveSitePublicAssetUrl } from "../../app/site-public-asset";

const SITE_QUESTION_TOGGLE_ARROW_URL = resolveSitePublicAssetUrl("/site-mock/questions/toggle-arrow.svg");

export function SiteQuestionToggleIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <>
      <svg
        className="site-question__toggle-svg"
        viewBox="0 0 47 37"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g filter="url(#site-question-toggle-filter)">
          <rect width="46.5631" height="36.1797" rx="10" fill="white" fillOpacity="0.15" />
        </g>
        <g className={isOpen ? "site-question__toggle-chevron site-question__toggle-chevron--open" : "site-question__toggle-chevron"}>
          <path
            d="M23.2812 12C23.561 11.9923 23.8397 12.1213 24.0146 12.3682L31.4004 22.7881C31.6801 23.1829 31.5893 23.733 31.1982 24.0156C30.8073 24.2978 30.2632 24.2068 29.9834 23.8125L23.2812 14.3555L16.5791 23.8115C16.2994 24.2062 15.7553 24.2978 15.3643 24.0156C14.9733 23.733 14.8834 23.1829 15.1631 22.7881L22.5479 12.3672C22.7228 12.1204 23.0015 11.9923 23.2812 12Z"
            fill="black"
            fillOpacity="0.8"
          />
        </g>
        <defs>
          <filter
            id="site-question-toggle-filter"
            x="0"
            y="-2"
            width="46.5631"
            height="40.1797"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="2" />
            <feGaussianBlur stdDeviation="2.5" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
            <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_4" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="-2" />
            <feGaussianBlur stdDeviation="2.5" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
            <feBlend mode="normal" in2="effect1_innerShadow_0_4" result="effect2_innerShadow_0_4" />
          </filter>
        </defs>
      </svg>
      <img
        className={isOpen ? "site-question__toggle-icon site-question__toggle-icon--open" : "site-question__toggle-icon"}
        src={SITE_QUESTION_TOGGLE_ARROW_URL}
        alt=""
        aria-hidden="true"
      />
    </>
  );
}
