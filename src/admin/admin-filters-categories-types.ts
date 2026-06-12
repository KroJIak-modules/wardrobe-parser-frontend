export type AdminRuleManualProduct = {
  product_id: number;
  source_name: string;
  vendor: string;
  title: string;
  image_url: string | null;
  matched_local_categories: string[];
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
  rules: AdminRuleSet;
  children: AdminFilterTreeNode[];
};

export type AdminCategoryTreeNode = AdminRuleTreeNodeBase & {
  children: AdminCategoryTreeNode[];
};

export type AdminFiltersCategoriesPayload = {
  filters: AdminFilterTreeNode[];
  categories: AdminCategoryTreeNode[];
  product_library: AdminRuleManualProduct[];
};
