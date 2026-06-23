import type { SiteCatalogDesigner } from "../features/catalog/site-catalog-contracts";
import { siteCatalogDesigners } from "./site-catalog-mock";

export type SiteDesignersDirectoryEntry = {
  id: string;
  label: string;
  letter: string;
};

const DESIGNERS_ALPHABET = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "#",
] as const;

function resolveDesignerLetter(label: string) {
  const normalized = label.trim().charAt(0).toUpperCase();

  if (normalized >= "A" && normalized <= "Z") {
    return normalized;
  }

  if (normalized >= "0" && normalized <= "9") {
    return "#";
  }

  return "#";
}

function sortDesigners(left: SiteCatalogDesigner, right: SiteCatalogDesigner) {
  const leftLetterIndex = DESIGNERS_ALPHABET.indexOf(resolveDesignerLetter(left.label));
  const rightLetterIndex = DESIGNERS_ALPHABET.indexOf(resolveDesignerLetter(right.label));

  if (leftLetterIndex !== rightLetterIndex) {
    return leftLetterIndex - rightLetterIndex;
  }

  return left.label.localeCompare(right.label, "en", {
    numeric: true,
    sensitivity: "base",
  });
}

export const siteDesignersAlphabet = [...DESIGNERS_ALPHABET];

export const siteDesignersDirectoryEntries: readonly SiteDesignersDirectoryEntry[] = [...siteCatalogDesigners]
  .sort(sortDesigners)
  .map((designer) => ({
    id: designer.id,
    label: designer.label,
    letter: resolveDesignerLetter(designer.label),
  }));
