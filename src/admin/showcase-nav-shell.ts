import type { ShowcaseNavigationSection, ShowcaseTopSectionKey } from "./showcase-contracts";

/**
 * Static top-bar tabs for admin showcase.
 * Labels/targets match AdminShowcasePreviewService.navigation() contract;
 * dropdown menus are filled from GET /admin/showcase/navigation.
 */
export const SHOWCASE_TOP_NAV_SHELL: readonly ShowcaseNavigationSection[] = [
  {
    key: "new",
    label: "НОВИНКИ",
    target: null,
  },
  {
    key: "designers",
    label: "ДИЗАЙНЕРЫ",
    target: { pathname: "/catalog/designers", query: null },
  },
  {
    key: "men",
    label: "МУЖСКОЕ",
    target: { pathname: "/catalog", query: { gender: "men" } },
  },
  {
    key: "women",
    label: "ЖЕНСКОЕ",
    target: { pathname: "/catalog", query: { gender: "women" } },
  },
  {
    key: "sale",
    label: "СКИДКИ",
    // Public uses clean /sale; admin mirrors that path without query junk.
    target: { pathname: "/sale", query: null },
  },
] as const;

const SHELL_BY_KEY = new Map(SHOWCASE_TOP_NAV_SHELL.map((section) => [section.key, section]));

export function mergeShowcaseNavigationSections(
  remoteSections: readonly ShowcaseNavigationSection[],
): ShowcaseNavigationSection[] {
  const remoteByKey = new Map(remoteSections.map((section) => [section.key, section]));

  return SHOWCASE_TOP_NAV_SHELL.map((shell) => {
    const remote = remoteByKey.get(shell.key);
    if (!remote) {
      return shell;
    }

    return {
      key: shell.key,
      // Keep shell labels as the stable top-bar contract.
      label: shell.label,
      // Sale must stay a clean /sale route (public parity), not /catalog/sale?ctx=sale.
      target: shell.key === "sale" ? shell.target : remote.target ?? shell.target,
      menu: remote.menu,
    };
  });
}

export function getShowcaseTopNavShellSection(key: ShowcaseTopSectionKey): ShowcaseNavigationSection | undefined {
  return SHELL_BY_KEY.get(key);
}
