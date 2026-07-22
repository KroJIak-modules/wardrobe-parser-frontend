import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { storefrontHomeState } from "../../app/site-home-entry";
import { siteTelegramHref } from "../../app/site-static-content";
import { SiteImage } from "../../features/image/site-image";
import {
  siteApiJson,
  type SiteApiAccessStatusResponse,
  type SiteApiMediaAsset,
} from "../../runtime/site-public-api";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import { useSiteImageTone } from "../../runtime/use-site-image-tone";
import "./site-password-page.css";

type Props = {
  status: SiteApiAccessStatusResponse;
  onUnlock: (password: string) => Promise<void>;
};

type HeroState = {
  desktop: SiteApiMediaAsset | null;
  mobile: SiteApiMediaAsset | null;
};

const EMPTY_HERO: HeroState = {
  desktop: null,
  mobile: null,
};

function LockIcon() {
  return (
    <svg viewBox="0 0 11 16" className="site-password-card__field-icon" aria-hidden="true">
      <path
        d="M2.2 6.7V4.2C2.2 1.9 3.6.5 5.5.5s3.3 1.4 3.3 3.7v2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="1" y="6.2" width="9" height="8.8" rx="2.1" fill="currentColor" opacity="0.72" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 9 18" className="site-password-card__arrow-icon" aria-hidden="true">
      <path d="M1 1.5L7.8 9L1 16.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SitePasswordPage({ status, onUnlock }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobileLayout = useSiteMediaQuery("(max-width: 640px)");
  const [hero, setHero] = useState<HeroState>(EMPTY_HERO);
  const [isHeroResolved, setIsHeroResolved] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    let disposed = false;
    Promise.all([
      siteApiJson<{ viewport: "desktop" | "mobile"; asset: SiteApiMediaAsset | null }>("/site/home/hero?viewport=desktop"),
      siteApiJson<{ viewport: "desktop" | "mobile"; asset: SiteApiMediaAsset | null }>("/site/home/hero?viewport=mobile"),
    ])
      .then(([desktop, mobile]) => {
        if (!disposed) {
          setHero({ desktop: desktop.asset, mobile: mobile.asset });
          setIsHeroResolved(true);
        }
      })
      .catch(() => {
        if (!disposed) {
          setHero(EMPTY_HERO);
          setIsHeroResolved(true);
        }
      });
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    document.title = status.title || "Anton Shell";
  }, [status.title]);

  const heroAsset = isMobileLayout ? hero.mobile ?? hero.desktop : hero.desktop;
  const imageAsset = useMemo(
    () => (
      heroAsset?.media_kind === "image"
        ? { url: heroAsset.url, widthPx: heroAsset.width_px, heightPx: heroAsset.height_px }
        : null
    ),
    [heroAsset],
  );
  const { tone, isResolved: isToneResolved } = useSiteImageTone({
    asset: imageAsset,
    targetRef: cardRef,
    surfaceSelector: ".site-password",
  });
  const isCardReady = isHeroResolved && (imageAsset === null || isToneResolved);
  const nextUrl = useMemo(() => searchParams.get("next") || "/", [searchParams]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onUnlock(password);
      navigate(nextUrl, {
        replace: true,
        state: nextUrl === "/" ? storefrontHomeState() : undefined,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Неверный пароль");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="site-password">
      {heroAsset ? (
        heroAsset.media_kind === "video" ? (
          <video className="site-password__hero" src={heroAsset.url} autoPlay loop muted playsInline preload="metadata" />
        ) : (
          <SiteImage src={heroAsset.url} alt="" className="site-password__hero-media" wrapperClassName="site-password__hero" fillContainer enableSkeleton={false} />
        )
      ) : (
        <div className="site-password__hero" aria-hidden="true" />
      )}
      <div className="site-password__scrim" aria-hidden="true" />
      <form
        ref={cardRef}
        className={isCardReady ? "site-password-card site-password-card--ready" : "site-password-card site-password-card--pending"}
        data-tone={tone}
        onSubmit={submit}
      >
        {status.title ? <h1 className="site-password-card__title">{status.title}</h1> : null}
        {status.description ? <p className="site-password-card__description">{status.description}</p> : null}
        <label className={error ? "site-password-card__field site-password-card__field--error" : "site-password-card__field"}>
          <LockIcon />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="text"
            name="site-access-code"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Введите пароль"
            disabled={submitting}
            aria-label="Введите пароль"
          />
          <button type="submit" disabled={submitting} aria-label="Войти">
            <ArrowIcon />
          </button>
        </label>
        {error ? <p className="site-password-card__error">{error}</p> : null}
        <a
          className="site-password-card__telegram"
          href={siteTelegramHref}
          target="_blank"
          rel="noreferrer"
        >
          Telegram
        </a>
      </form>
    </main>
  );
}
