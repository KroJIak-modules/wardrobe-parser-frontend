import { useEffect, useMemo, useState } from "react";
import { patchCatalogSearchParams, readCatalogListParam } from "../catalog/site-catalog-query";

export function useSiteDesignersSelection(searchParams: URLSearchParams) {
  const appliedDesignerIds = useMemo(() => readCatalogListParam(searchParams, "designer"), [searchParams]);
  const [selectedDesignerIds, setSelectedDesignerIds] = useState<string[]>(appliedDesignerIds);

  useEffect(() => {
    setSelectedDesignerIds(appliedDesignerIds);
  }, [appliedDesignerIds]);

  return {
    selectedDesignerIds,
    hasSelection: selectedDesignerIds.length > 0,
    setSelectedDesignerIds,
    toggleDesigner(designerId: string) {
      setSelectedDesignerIds((current) =>
        current.includes(designerId)
          ? current.filter((value) => value !== designerId)
          : [...current, designerId],
      );
    },
    clearSelectedDesigners() {
      setSelectedDesignerIds([]);
    },
    buildAppliedSearchParams() {
      return patchCatalogSearchParams(searchParams, {
        designer: selectedDesignerIds,
        page: null,
      });
    },
  };
}
