export type AdminRuleManualProduct = {
  product_id: number;
  source_name: string;
  url: string;
  designer_name: string;
  title: string;
  image_url: string | null;
  visibility_status: "visible" | "hidden";
  orderability_status: "orderable" | "sold_out" | "unavailable";
  status_reason?: string | null;
  assigned_filter_titles: string[];
};

export type AdminCategoryBehavior = "new" | "designers" | "gender" | "sale";

export type AdminCategoryAttachmentKind = "filter" | "custom_catalog";

export type AdminCategoryAttachment = {
  id: string;
  kind: AdminCategoryAttachmentKind;
  ref_id: number;
  hidden_node_ids: number[];
};

export type AdminRuleSet = {
  local_category_keywords: string[];
  title_keywords: string[];
  manual_products: AdminRuleManualProduct[];
};

type AdminRuleTreeNodeBase = {
  id: number;
  label: string;
};

export type AdminFilterTreeNode = AdminRuleTreeNodeBase & {
  slug: string | null;
  display_label: string;
  mobile_pair_root_id: number | null;
  node_kind: "filter" | "multifilter";
  is_enabled: boolean;
  restrict_by_gender: boolean;
  product_count: number;
  rules: AdminRuleSet;
  children: AdminFilterTreeNode[];
};

export type AdminCategoryTreeNode = AdminRuleTreeNodeBase & {
  slug: string;
  behavior: AdminCategoryBehavior;
  system_filter_value?: string | null;
  attachments: AdminCategoryAttachment[];
  children: [];
};

export type AdminCustomCatalog = {
  id: number;
  slug: string | null;
  label: string;
  description: string;
  is_enabled: boolean;
  manual_products: AdminRuleManualProduct[];
};

export type AdminDesignerDirectoryItem = {
  id: string;
  label: string;
  product_count: number;
};

export type AdminFilterAssignmentRebuildStatus = {
  state: "idle" | "queued" | "running";
  target_revision: number;
  applied_revision: number;
  rebuild_requested_at: string | null;
  rebuild_started_at: string | null;
  rebuild_completed_at: string | null;
  last_error: string | null;
};

export type AdminFiltersCategoriesPayload = {
  filters: AdminFilterTreeNode[];
  categories: AdminCategoryTreeNode[];
  custom_catalogs: AdminCustomCatalog[];
  designer_directory: AdminDesignerDirectoryItem[];
  filter_assignment_rebuild: AdminFilterAssignmentRebuildStatus;
  hidden_product_ids: number[];
};
