import { API_BASE } from "../../shared/api-base";

export class SiteApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function extractErrorMessage(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null;
  const detail = payload?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  return `Ошибка: ${response.status}`;
}

export async function siteApiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { ...init, credentials: init?.credentials ?? "include" });
  if (!response.ok) {
    throw new SiteApiError(await extractErrorMessage(response), response.status);
  }
  return (await response.json()) as T;
}

export type SiteApiRouteTarget = {
  pathname: string;
  query?: Record<string, string | string[]> | null;
};

export type SiteApiMediaAsset = {
  id: number;
  url: string;
  media_kind: "image" | "video";
  mime_type: string;
  byte_size: number;
  width_px: number | null;
  height_px: number | null;
};

export type SiteApiNavigationMenuEntry = {
  id: string;
  label: string;
  presentation: "heading" | "item";
  description: string | null;
  target: SiteApiRouteTarget | null;
};

export type SiteApiNavigationMenuColumn = {
  id: string;
  align: "start" | "center";
  title: { label: string; target: SiteApiRouteTarget | null } | null;
  entries: SiteApiNavigationMenuEntry[];
};

export type SiteApiNavigationMenu = {
  key: "new" | "designers" | "men" | "women";
  columns: SiteApiNavigationMenuColumn[];
  footer_link: SiteApiNavigationMenuEntry | null;
};

export type SiteApiNavigation = {
  top_sections: Array<{
    key: "new" | "designers" | "men" | "women" | "sale";
    label: string;
    target: SiteApiRouteTarget | null;
  }>;
  desktop_menus: Partial<Record<"new" | "designers" | "men" | "women", SiteApiNavigationMenu>>;
  mobile_menu: {
    groups_by_gender: Partial<Record<"men" | "women", Array<{
      id: string;
      label: string;
      entries: SiteApiNavigationMenuEntry[];
    }>>>;
  };
  catalog_contexts: {
    designers: Array<{
      slug: string;
      label: string;
      description: string | null;
    }>;
    custom_catalogs: Array<{
      slug: string;
      label: string;
      description: string | null;
    }>;
  };
};

export type SiteApiCatalogExperience = {
  header: {
    title: string;
    description: string | null;
    source: "search" | "sale" | "custom_catalog" | "designer" | "menu_filter" | "all_products" | "multiple_designers" | "catalog";
  };
  filter_groups: Array<{
    key: string;
    label: string;
    query_param: string;
    selection_mode: "single" | "multiple";
    options: Array<{ id: string; label: string; value: string }>;
    panel_width: "compact" | "wide" | null;
    max_visible_options: number | null;
    prioritize_selected: boolean | null;
  }>;
};

export type SiteApiCatalogProduct = {
  id: number;
  path: string;
  brand: { name: string; slug: string | null };
  name: string;
  price_rub: number | null;
  old_price_rub: number | null;
  status: "in_stock" | "preorder" | "sold_out";
  image_url: string | null;
};

export type SiteApiCatalogProductsResponse = {
  items: SiteApiCatalogProduct[];
  total: number;
  limit: number;
  offset: number;
};

export type SiteApiDesignersResponse = {
  alphabet: string[];
  entries: Array<{ slug: string; label: string; letter: string }>;
};

export type SiteApiProductResponse = {
  id: number;
  path: string;
  handle: string;
  brand: { name: string; slug: string | null };
  name: string;
  description: { format: "text"; content: string } | null;
  status: "in_stock" | "preorder" | "sold_out";
  photos: string[];
  variants: Array<{
    id: number;
    size: string;
    price_rub: number | null;
    old_price_rub: number | null;
    source: {
      id: number;
      name: string;
      url: string | null;
      logo_url: string | null;
    };
  }>;
  primary_source_url: string | null;
  recommendation_context: {
    designer_slug: string | null;
    section_slug: string | null;
    gender: "men" | "women" | null;
  };
};

export type SiteApiCartQuoteRequest = {
  items: Array<{ product_id: number; variant_id: number; quantity: number }>;
};

export type SiteApiCartQuoteResponse = {
  items: Array<{
    variant_id: number;
    quantity: number;
    availability: "in_stock" | "preorder";
    original_line_total_rub: number;
    old_line_total_rub: number | null;
    final_line_total_rub: number;
  }>;
  unavailable_variant_ids: number[];
  original_total_rub: number;
  final_total_rub: number;
  total_rub: number;
  svc_tiers: Array<{
    min_rub: number;
    max_rub: number | null;
    mode: "fixed_rub" | "percent";
    value: number;
    amount_rub: number | null;
    is_applied: boolean;
  }>;
  svc_progress: {
    preorder_subtotal_rub: number;
    applied_amount_rub: number;
    next_threshold_rub: number | null;
    amount_to_next_threshold_rub: number | null;
  };
};

export type SiteApiAboutResponse = {
  text: string;
  photos: SiteApiMediaAsset[];
};

export type SiteApiQuestionsResponse = {
  items: Array<{
    id: number;
    question: string;
    answer: string;
    is_expanded_by_default: boolean;
  }>;
};

export type SiteApiHomeNotificationResponse = {
  id: string;
  version: string;
  enabled: boolean;
  delay_ms: number;
  title: string;
  description: string;
  image_src: string;
  cta_label: string;
  cta_href: string;
};

export type SiteApiAccessStatusResponse = {
  enabled: boolean;
  unlocked: boolean;
  title: string;
  description: string;
};

export type SiteApiAccessUnlockResponse = {
  ok: boolean;
  unlocked: boolean;
};

export type SiteApiAdminSiteAboutResponse = {
  text: string;
  photos: SiteApiMediaAsset[];
};

export type SiteApiAdminSiteQuestionsResponse = {
  items: Array<{
    id: number;
    question: string;
    answer: string;
    is_enabled: boolean;
  }>;
};
