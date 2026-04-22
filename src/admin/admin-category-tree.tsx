import { IconPlus } from "../shared/mono-icons";

type CategoryNode = {
  id: number;
  name: string;
  children: CategoryNode[];
  is_designers_root?: boolean;
  is_in_designers_branch?: boolean;
  is_fallback?: boolean;
  is_enabled?: boolean;
  is_system?: boolean;
  keywords_editable?: boolean;
  keywords?: string[];
  product_count?: number;
};

type Props = {
  nodes: CategoryNode[];
  selectedCategoryId: number | null;
  loadingCategoryCounts: boolean;
  onSelectCategory: (id: number) => void;
  onStartCategoryCreate: (parentId: number | null) => void;
};

function CategoryTreeNode({
  node,
  depth,
  selectedCategoryId,
  loadingCategoryCounts,
  onSelectCategory,
  onStartCategoryCreate,
}: {
  node: CategoryNode;
  depth: number;
  selectedCategoryId: number | null;
  loadingCategoryCounts: boolean;
  onSelectCategory: (id: number) => void;
  onStartCategoryCreate: (parentId: number | null) => void;
}) {
  const hideChildrenInTree = Boolean(node.is_designers_root);
  const canCreateChild = !node.is_designers_root && !node.is_in_designers_branch && !node.is_fallback;

  return (
    <div className="cat-tree-node" style={{ marginLeft: `${depth * 12}px` }}>
      <div className="cat-tree-item">
        <button
          type="button"
          className={selectedCategoryId === node.id ? "tab tab--active cat-tree-btn" : "tab cat-tree-btn"}
          onClick={() => onSelectCategory(node.id)}
        >
          <span>{node.name}</span>
        </button>
        {canCreateChild ? (
          <button
            type="button"
            className="tree-plus"
            title="Добавить дочернюю категорию"
            onClick={() => onStartCategoryCreate(node.id)}
          >
            <IconPlus className="icon-svg icon-svg--sm" />
          </button>
        ) : null}
        <span className="muted">
          {!node.is_enabled ? "выключена" : node.is_system ? "системная" : node.keywords_editable ? `${node.keywords?.length || 0} ключей` : "ветка"} • {loadingCategoryCounts ? "..." : node.product_count || 0} товаров
        </span>
      </div>
      {node.children.length > 0 && !hideChildrenInTree ? (
        <div className="cat-tree-children">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedCategoryId={selectedCategoryId}
              loadingCategoryCounts={loadingCategoryCounts}
              onSelectCategory={onSelectCategory}
              onStartCategoryCreate={onStartCategoryCreate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AdminCategoryTree(props: Props) {
  const { nodes, selectedCategoryId, loadingCategoryCounts, onSelectCategory, onStartCategoryCreate } = props;
  return (
    <div className="cat-tree-column">
      {nodes.map((node) => (
        <CategoryTreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedCategoryId={selectedCategoryId}
          loadingCategoryCounts={loadingCategoryCounts}
          onSelectCategory={onSelectCategory}
          onStartCategoryCreate={onStartCategoryCreate}
        />
      ))}
    </div>
  );
}
