import { useMemo } from "react";
import type { SourceRow } from "../admin-types";

export function useAdminSourceMap(sources: SourceRow[]) {
  return useMemo(() => {
    const map = new Map<number, SourceRow>();
    for (const source of sources) {
      if (source.source_id !== null) {
        map.set(source.source_id, source);
      }
    }
    return map;
  }, [sources]);
}
