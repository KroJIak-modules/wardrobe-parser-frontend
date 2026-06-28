import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import type { SiteDesignersEntryMode } from "./site-designers-navigation";
import type { SiteDesignersDirectoryEntry } from "../../runtime/site-designers-mock";
import { SITE_DESIGNERS_MOBILE_MEDIA_QUERY } from "./site-designers-constants";
import { SiteDesignersDesktopDirectory } from "./site-designers-desktop";
import { SiteDesignersMobileDirectory } from "./site-designers-mobile";

export function SiteDesignersDirectory({
  alphabet,
  entries,
  mode,
  searchParams,
  onApply,
  onBrowseSelect,
}: {
  alphabet: readonly string[];
  entries: readonly SiteDesignersDirectoryEntry[];
  mode: SiteDesignersEntryMode;
  searchParams: URLSearchParams;
  onApply: (next: URLSearchParams) => void;
  onBrowseSelect: (designerId: string) => void;
}) {
  const isMobileLayout = useSiteMediaQuery(SITE_DESIGNERS_MOBILE_MEDIA_QUERY);

  return isMobileLayout ? (
    <SiteDesignersMobileDirectory
      alphabet={alphabet}
      entries={entries}
      mode={mode}
      searchParams={searchParams}
      onApply={onApply}
      onBrowseSelect={onBrowseSelect}
    />
  ) : (
    <SiteDesignersDesktopDirectory
      alphabet={alphabet}
      entries={entries}
      mode={mode}
      searchParams={searchParams}
      onApply={onApply}
      onBrowseSelect={onBrowseSelect}
    />
  );
}
