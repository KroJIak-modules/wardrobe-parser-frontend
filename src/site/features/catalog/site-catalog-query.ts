type CatalogPatchValue = string | readonly string[] | null | undefined;

export function readCatalogListParam(searchParams: URLSearchParams, key: string): string[] {
  const raw = String(searchParams.get(key) || "").trim();
  if (raw === "") {
    return [];
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function patchCatalogSearchParams(
  current: URLSearchParams,
  patch: Record<string, CatalogPatchValue>
): URLSearchParams {
  const next = new URLSearchParams(current);

  Object.entries(patch).forEach(([key, value]) => {
    if (value == null) {
      next.delete(key);
      return;
    }

    if (Array.isArray(value)) {
      const normalized = value.map((item) => String(item).trim()).filter(Boolean);
      if (normalized.length === 0) {
        next.delete(key);
      } else {
        next.set(key, normalized.join(","));
      }
      return;
    }

    const normalized = String(value).trim();
    if (normalized === "") {
      next.delete(key);
    } else {
      next.set(key, normalized);
    }
  });

  return next;
}

export function buildCatalogHref(patch: Record<string, CatalogPatchValue>): string {
  const next = patchCatalogSearchParams(new URLSearchParams(), patch);
  const search = next.toString();
  return search === "" ? "/catalog" : `/catalog?${search}`;
}

export function buildDesignerCatalogHref(designerId: string): string {
  return buildCatalogHref({
    top: "designers",
    collection: null,
    multi: null,
    availability: null,
    section: null,
    designer: [designerId],
    gender: null,
    sort: null,
    q: null,
  });
}
