import { renderToString } from "katex";

function escapeLatexText(value: string): string {
  return value.replace(/([\\{}$&#_%~^])/g, "\\$1");
}

function buildBrandLatex(value: string): string {
  return `\\text{${escapeLatexText(value)}}`;
}

export function renderBrandLatexHtml(value: string | null | undefined, fallback = "Без бренда"): string {
  const normalized = String(value || "").trim().replace(/\s+/g, " ");
  const text = normalized || fallback;
  return renderToString(buildBrandLatex(text), {
    throwOnError: false,
    displayMode: false,
    strict: "ignore",
  });
}

export function LatexBrand({
  value,
  fallback = "Без бренда",
  className = "",
}: {
  value: string | null | undefined;
  fallback?: string;
  className?: string;
}) {
  return (
    <span
      className={className ? `latex-brand ${className}` : "latex-brand"}
      dangerouslySetInnerHTML={{ __html: renderBrandLatexHtml(value, fallback) }}
    />
  );
}

