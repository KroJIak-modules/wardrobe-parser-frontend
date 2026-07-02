import type { SiteDesignersDirectoryEntry } from "../../runtime/site-designers";

export type SiteDesignersSection = {
  letter: string;
  entries: SiteDesignersDirectoryEntry[];
};

export function buildGroupedDesignerEntries(
  alphabet: readonly string[],
  entries: readonly SiteDesignersDirectoryEntry[],
) {
  const groups = new Map<string, SiteDesignersDirectoryEntry[]>();

  for (const letter of alphabet) {
    groups.set(letter, []);
  }

  for (const entry of entries) {
    const bucket = groups.get(entry.letter);
    if (bucket) {
      bucket.push(entry);
    }
  }

  return alphabet
    .map<SiteDesignersSection>((letter) => ({
      letter,
      entries: groups.get(letter) ?? [],
    }))
    .filter((section) => section.entries.length > 0);
}

export function buildDesignerGridRows(sections: readonly SiteDesignersSection[], columns: number) {
  const rows: SiteDesignersSection[][] = [];

  for (let index = 0; index < sections.length; index += columns) {
    rows.push(sections.slice(index, index + columns));
  }

  return rows;
}

export function buildDesignerLetterOffset(target: HTMLElement, topPadding: number) {
  const viewportTop = target.getBoundingClientRect().top + window.scrollY;
  return Math.max(0, viewportTop - topPadding);
}
