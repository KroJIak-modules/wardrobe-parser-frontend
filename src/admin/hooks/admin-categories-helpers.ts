type CategoryNode = {
  id: number;
  name: string;
  children: CategoryNode[];
  has_children: boolean;
  keywords_editable: boolean;
  keywords_locked_reason: string | null;
};

export function flattenCategoryOptions(adminCategories: CategoryNode[]): Array<{ id: number; name: string }> {
  const rows: Array<{ id: number; name: string }> = [];
  const walk = (nodes: CategoryNode[], prefix: string) => {
    for (const node of nodes) {
      rows.push({ id: node.id, name: `${prefix}${node.name}` });
      walk(node.children, `${prefix}  `);
    }
  };
  walk(adminCategories, "");
  return rows;
}

export function findCategoryById(adminCategories: CategoryNode[], categoryId: number | null): CategoryNode | null {
  if (categoryId === null) {
    return null;
  }
  let found: CategoryNode | null = null;
  const walk = (nodes: CategoryNode[]) => {
    for (const node of nodes) {
      if (node.id === categoryId) {
        found = node;
        return;
      }
      walk(node.children);
    }
  };
  walk(adminCategories);
  return found;
}

export function parseCategoryKeywords(rawKeywords: string): string[] {
  return rawKeywords
    .split(/[\n,;]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}
