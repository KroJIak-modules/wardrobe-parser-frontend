import { useEffect } from "react";
import { SiteImage } from "../../features/image/site-image";
import "./site-logo-test-page.css";

type LogoTestBand = {
  id: string;
  label: string;
  background: string;
  tone: "light" | "dark" | "mixed";
};

const logoTestBands: LogoTestBand[] = [
  { id: "white", label: "Pure White", background: "#f8f8f3", tone: "light" },
  { id: "black", label: "Deep Black", background: "#090909", tone: "dark" },
  { id: "warm", label: "Warm Sand", background: "#c38d5a", tone: "mixed" },
  { id: "cool", label: "Cold Blue", background: "#4c6fff", tone: "mixed" },
  {
    id: "gradient-1",
    label: "Diagonal Gradient",
    background: "linear-gradient(135deg, #faf4e9 0%, #1d1b27 48%, #99633d 100%)",
    tone: "mixed",
  },
  {
    id: "gradient-2",
    label: "Split Screen",
    background: "linear-gradient(90deg, #ffffff 0 33%, #151515 33% 66%, #db5f2d 66% 100%)",
    tone: "mixed",
  },
  {
    id: "pattern-1",
    label: "Stripes",
    background:
      "repeating-linear-gradient(90deg, #f2efe7 0 80px, #101010 80px 160px, #7b5a43 160px 240px)",
    tone: "mixed",
  },
  {
    id: "pattern-2",
    label: "Checker",
    background:
      "linear-gradient(45deg, #ece7dd 25%, transparent 25%), linear-gradient(-45deg, #ece7dd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2f2f2f 75%), linear-gradient(-45deg, transparent 75%, #2f2f2f 75%)",
    tone: "mixed",
  },
  {
    id: "radial",
    label: "Radial Blend",
    background: "radial-gradient(circle at 50% 50%, #f7f4ee 0%, #b77a4c 35%, #101010 75%, #070707 100%)",
    tone: "mixed",
  },
  {
    id: "neon",
    label: "High Contrast",
    background: "linear-gradient(180deg, #fdfdfd 0%, #00ffa6 25%, #0a0a0a 55%, #ff3a2f 100%)",
    tone: "mixed",
  },
];

export function SiteLogoTestPage() {
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");

    if (!hash) {
      return;
    }

    const target = document.getElementById(hash);
    if (!target) {
      return;
    }

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start" });
    });
  }, []);

  return (
    <main className="site-logo-test-page">
      <div className="site-logo-test-page__logo-shell" aria-hidden="true">
        <div className="site-logo-test-page__blend-stage">
          <span className="site-logo-test-page__blend-stripe site-logo-test-page__blend-stripe--light" />
          <span className="site-logo-test-page__blend-stripe site-logo-test-page__blend-stripe--dark" />
          <span className="site-logo-test-page__blend-stripe site-logo-test-page__blend-stripe--green" />
          <span className="site-logo-test-page__blend-stripe site-logo-test-page__blend-stripe--red" />
        </div>
        <div className="site-logo-test-page__probe-stack">
          <div className="site-logo-test-page__probe site-logo-test-page__probe--text">DIFFERENCE TEXT</div>
          <div className="site-logo-test-page__probe site-logo-test-page__probe--shape">
            <svg viewBox="0 0 320 72" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="6" width="308" height="60" rx="30" fill="currentColor" />
            </svg>
          </div>
        </div>
        <div className="site-logo-test-page__logo-blend" aria-hidden="true">
          <SiteImage src="/logo_anton_shell.svg" alt="" loading="eager" decoding="sync" />
        </div>
      </div>

      <div className="site-logo-test-page__bands">
        {logoTestBands.map((band) => (
          <section
            key={band.id}
            id={band.id}
            className={`site-logo-test-page__band site-logo-test-page__band--${band.tone}`}
            style={{
              background: band.background,
              backgroundSize: band.id === "pattern-2" ? "72px 72px" : undefined,
              backgroundPosition: band.id === "pattern-2" ? "0 0, 0 36px, 36px -36px, -36px 0px" : undefined,
            }}
          >
            <div className="site-logo-test-page__band-meta">
              <span className="site-logo-test-page__band-kicker">Logo Blend Test</span>
              <h1 className="site-logo-test-page__band-title">{band.label}</h1>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
