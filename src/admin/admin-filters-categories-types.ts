export type AdminRuleManualProduct = {
  product_id: number;
  source_id: number;
  source_name: string;
  vendor: string;
  title: string;
  url: string;
  status: "active" | "draft" | "archived";
  image_url: string | null;
  matched_local_categories: string[];
  price_label: string;
  inventory_hint: string;
  last_seen_at: string;
};

export type AdminRuleMatchPreview = {
  product_id: number;
  vendor: string;
  title: string;
  reason: "local_category_keyword" | "title_keyword" | "manual_product";
};

export type AdminRuleSet = {
  local_category_keywords: string[];
  title_keywords: string[];
  manual_products: AdminRuleManualProduct[];
};

export type AdminRuleAudit = {
  updated_at: string;
  updated_by: string;
  source_note: string;
};

type AdminRuleTreeNodeBase = {
  id: number;
  label: string;
  slug: string;
  parent_id: number | null;
  is_enabled: boolean;
  product_count: number;
  rules: AdminRuleSet;
  sample_hits: AdminRuleMatchPreview[];
  audit: AdminRuleAudit;
};

export type AdminFilterTreeNode = AdminRuleTreeNodeBase & {
  entity: "filter";
  placement: "showcase_navigation" | "catalog_toolbar" | "search_refinement";
  selection_mode: "single" | "multiple";
  children: AdminFilterTreeNode[];
};

export type AdminCategoryTreeNode = AdminRuleTreeNodeBase & {
  entity: "category";
  visibility: "public" | "hidden" | "internal";
  route_path: string;
  children: AdminCategoryTreeNode[];
};

export type AdminRuleTreeNode = AdminFilterTreeNode | AdminCategoryTreeNode;

export type AdminFiltersCategoriesPayload = {
  endpoint: string;
  filters_endpoint: string;
  categories_endpoint: string;
  fetched_at: string;
  filters: AdminFilterTreeNode[];
  categories: AdminCategoryTreeNode[];
  product_library: AdminRuleManualProduct[];
};
