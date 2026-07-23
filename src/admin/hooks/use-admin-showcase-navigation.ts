import { useEffect, useState } from "react";
import { fetchShowcaseNavigation } from "../showcase-api";
import type { ShowcaseNavigationSection } from "../showcase-contracts";
import { mergeShowcaseNavigationSections, SHOWCASE_TOP_NAV_SHELL } from "../showcase-nav-shell";

// Session-runtime cache: tabs are static shell, menus hydrate once and are reused
// by nav + catalog header for immediate menu_filter titles (public parity).
let cachedSections: readonly ShowcaseNavigationSection[] | null = null;
let loadPromise: Promise<readonly ShowcaseNavigationSection[]> | null = null;

async function loadShowcaseNavigationSections(): Promise<readonly ShowcaseNavigationSection[]> {
  if (cachedSections) {
    return cachedSections;
  }
  if (!loadPromise) {
    loadPromise = fetchShowcaseNavigation()
      .then((response) => {
        cachedSections = mergeShowcaseNavigationSections(response.sections);
        return cachedSections;
      })
      .catch(() => {
        loadPromise = null;
        return SHOWCASE_TOP_NAV_SHELL;
      });
  }
  return loadPromise;
}

export function useAdminShowcaseNavigation() {
  const [sections, setSections] = useState<readonly ShowcaseNavigationSection[]>(
    () => cachedSections ?? SHOWCASE_TOP_NAV_SHELL,
  );

  useEffect(() => {
    let aborted = false;
    void loadShowcaseNavigationSections().then((next) => {
      if (!aborted) {
        setSections(next);
      }
    });
    return () => {
      aborted = true;
    };
  }, []);

  return { sections };
}
