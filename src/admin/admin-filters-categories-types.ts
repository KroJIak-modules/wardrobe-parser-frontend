export type AdminRuleManualProduct = {
  product_id: number;
  source_name: string;
  source_product_url: string;
  vendor: string;
  title: string;
  image_url: string | null;
  is_hidden: boolean;
  matched_local_categories: string[];
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
  slug: string;
  display_label: string;
  is_enabled: boolean;
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
  slug: string;
  label: string;
  is_hidden: boolean;
  manual_products: AdminRuleManualProduct[];
};

export type AdminDesignerDirectoryItem = {
  id: string;
  label: string;
  product_count: number;
};

export type AdminFiltersCategoriesPayload = {
  filters: AdminFilterTreeNode[];
  categories: AdminCategoryTreeNode[];
  custom_catalogs: AdminCustomCatalog[];
  designer_directory: AdminDesignerDirectoryItem[];
  product_library: AdminRuleManualProduct[];
};
