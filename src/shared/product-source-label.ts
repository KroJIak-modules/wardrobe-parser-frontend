import type { SourceMode } from "./live-data-types";

type SourceLabelInput = {
  sourceName?: string | null;
  sourceMode?: SourceMode | null;
  emptyLabel?: string;
};

export function getProductSourceLabel({ sourceName, sourceMode, emptyLabel = "—" }: SourceLabelInput): string {
  const normalizedName = String(sourceName || "").trim();
  if (normalizedName) {
    return normalizedName;
  }
  if (sourceMode === "personal") {
    return "Личный источник";
  }
  if (sourceMode === "manual") {
    return "Ручной источник";
  }
  if (sourceMode === "auto") {
    return "Источник";
  }
  return emptyLabel;
}
