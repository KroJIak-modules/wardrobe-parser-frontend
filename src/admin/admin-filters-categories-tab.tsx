import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type {
  AdminCategoryTreeNode,
  AdminCustomCatalog,
  AdminDesignerDirectoryItem,
  AdminFilterTreeNode,
  AdminRuleManualProduct,
} from "./admin-filters-categories-types";
import { useAdminFiltersCategories } from "./hooks/use-admin-filters-categories";
import { AdminTaxonomySkeleton, SkeletonBlock } from "../shared/skeleton";
import { IconEye, IconEyeOff } from "../shared/mono-icons";
import { TagRemoveButton } from "../shared/tag-remove-button";
import "./admin-filters-categories-tab.css";

type TaxonomyNode = AdminFilterTreeNode | AdminCategoryTreeNode | AdminCustomCatalog;
type TaxonomyKind = "filter" | "multifilter" | "category" | "customCatalog";
type EditorMode = "filter" | "category" | "customCatalog" | "categoryLinked" | null;
type TreeDropMode = "before" | "inside" | "root";
type TreeDropTarget = {
  mode: TreeDropMode;
  targetId: number | null;
};
type CategoryTreeViewNode = {
  key: string;
  node: TaxonomyNode;
  kind: TaxonomyKind;
  categoryId: number;
  attachmentId: string | null;
  isAttachmentRoot: boolean;
  isNodeHidden: boolean;
  isHiddenByAncestor: boolean;
  children: CategoryTreeViewNode[];
};

const SHOWCASE_CATEGORY_ORDER = ["new", "designers", "men", "women", "sale"] as const;
const SHOWCASE_CATEGORY_ORDER_INDEX = new Map<string, number>(
  SHOWCASE_CATEGORY_ORDER.map((slug, index) => [slug, index]),
);

function isFilterNode(node: TaxonomyNode): node is AdminFilterTreeNode {
  return "rules" in node;
}

function isCategoryNode(node: TaxonomyNode): node is AdminCategoryTreeNode {
  return "behavior" in node;
}

function isCustomCatalogNode(node: TaxonomyNode): node is AdminCustomCatalog {
  return "manual_products" in node && !("rules" in node);
}

function getNodeKind(node: TaxonomyNode): TaxonomyKind {
  if (isFilterNode(node)) {
    return node.children.length > 0 ? "multifilter" : "filter";
  }
  if (isCustomCatalogNode(node)) {
    return "customCatalog";
  }
  return "category";
}

function getNodeKindLabel(kind: TaxonomyKind): string {
  if (kind === "multifilter") {
    return "Мультифильтр";
  }
  if (kind === "filter") {
    return "Фильтр";
  }
  if (kind === "customCatalog") {
    return "Кастомный каталог";
  }
  return "Категория";
}

function getSourceDomainLabel(sourceUrl: string, fallbackLabel: string): string {
  try {
    const hostname = new URL(sourceUrl).hostname.trim().replace(/^www\./, "");
    return hostname || fallbackLabel;
  } catch {
    return fallbackLabel;
  }
}

function getCategoryGenderLabel(category: AdminCategoryTreeNode): string {
  return category.system_filter_value === "women" ? "женское" : "мужское";
}

function unavailableReasonRu(reason: string | null | undefined): string {
  const normalized = String(reason || "").trim().toLowerCase();
  if (!normalized) {
    return "Причина недоступности не указана";
  }
  if (normalized === "missing_weight") {
    return "Товар недоступен: не указан вес";
  }
  if (normalized === "missing_images") {
    return "Товар недоступен: у него нет ни одной фотографии";
  }
  if (normalized === "missing_source_price") {
    return "Товар недоступен: у него не указана цена";
  }
  if (normalized === "missing_final_price") {
    return "Товар недоступен: не удалось рассчитать итоговую цену";
  }
  if (normalized === "missing_currency") {
    return "Товар недоступен: не указана валюта";
  }
  if (normalized === "unsupported_currency") {
    return "Товар недоступен: указана неподдерживаемая валюта";
  }
  if (normalized === "invalid_fx_settings") {
    return "Товар недоступен: не настроен курс валют для расчета цены";
  }
  if (normalized === "source_removed") {
    return "Товар недоступен: он пропал в источнике";
  }
  if (normalized === "missing_variants") {
    return "Товар недоступен: нет доступных вариантов";
  }
  if (normalized === "product_not_found") {
    return "Товар недоступен: он не найден";
  }
  if (normalized === "dedup_combined_source") {
    return "Товар недоступен: отключен после объединения дублей";
  }
  if (normalized === "dedup_hidden_by_keep") {
    return "Товар недоступен: отключен решением по дублям";
  }
  return `Товар недоступен: ${normalized}`;
}

function collectLeafFilters(nodes: readonly AdminFilterTreeNode[]): AdminFilterTreeNode[] {
  const result: AdminFilterTreeNode[] = [];
  for (const node of nodes) {
    if (node.children.length === 0) {
      result.push(node);
      continue;
    }
    result.push(...collectLeafFilters(node.children));
  }
  return result;
}

function countFilterProducts(filter: AdminFilterTreeNode): number {
  if (filter.children.length === 0) {
    return Math.max(0, Number(filter.product_count) || 0);
  }
  return filter.children.reduce((sum, child) => sum + countFilterProducts(child), 0);
}

function getFilterDisplayLabel(filter: Pick<AdminFilterTreeNode, "label" | "display_label">) {
  return filter.display_label.trim() || filter.label.trim();
}

function getFilterButtonLabel(filter: AdminFilterTreeNode): string {
  return `${getFilterDisplayLabel(filter)} (${countFilterProducts(filter)})`;
}

function getTopNewCategoryFilters(filters: readonly AdminFilterTreeNode[], limit = 9) {
  return collectLeafFilters(filters)
    .filter((filter) => filter.is_enabled)
    .sort((left, right) => {
      const countDiff = countFilterProducts(right) - countFilterProducts(left);
      if (countDiff !== 0) {
        return countDiff;
      }
      return getFilterDisplayLabel(left).localeCompare(getFilterDisplayLabel(right), "ru", { sensitivity: "base" });
    })
    .slice(0, limit);
}

function getItemOrderMap(items: { id: number }[]): Map<number, number> {
  return new Map(items.map((item, index) => [item.id, index]));
}

function compareByOrder(orderMap: Map<number, number>, leftId: number, rightId: number): number {
  const leftIndex = orderMap.get(leftId) ?? Number.MAX_SAFE_INTEGER;
  const rightIndex = orderMap.get(rightId) ?? Number.MAX_SAFE_INTEGER;
  return leftIndex - rightIndex;
}

function compareCategoriesByShowcaseOrder(left: AdminCategoryTreeNode, right: AdminCategoryTreeNode): number {
  const leftIndex = SHOWCASE_CATEGORY_ORDER_INDEX.get(left.slug) ?? Number.MAX_SAFE_INTEGER;
  const rightIndex = SHOWCASE_CATEGORY_ORDER_INDEX.get(right.slug) ?? Number.MAX_SAFE_INTEGER;
  if (leftIndex !== rightIndex) {
    return leftIndex - rightIndex;
  }
  return left.label.localeCompare(right.label, "ru", { sensitivity: "base" });
}

function isCategoryAttachmentAllowed(category: AdminCategoryTreeNode, attachment: AdminCategoryTreeNode["attachments"][number]): boolean {
  if (category.behavior === "new") {
    return attachment.kind === "custom_catalog";
  }
  if (category.behavior === "gender") {
    return attachment.kind === "filter";
  }
  return false;
}

function sortCategoryAttachments(
  category: AdminCategoryTreeNode,
  flatFilters: AdminFilterTreeNode[],
  customCatalogs: AdminCustomCatalog[]
) {
  const filterOrderMap = getItemOrderMap(flatFilters);
  const customCatalogOrderMap = getItemOrderMap(customCatalogs);

  return [...category.attachments].sort((left, right) => {
    if (category.behavior === "new" && left.kind !== right.kind) {
      return left.kind === "custom_catalog" ? -1 : 1;
    }
    if (left.kind === "filter" && right.kind === "filter") {
      return compareByOrder(filterOrderMap, left.ref_id, right.ref_id);
    }
    if (left.kind === "custom_catalog" && right.kind === "custom_catalog") {
      return compareByOrder(customCatalogOrderMap, left.ref_id, right.ref_id);
    }
    return 0;
  });
}

function buildCategoryLinkedFilterNode(
  filter: AdminFilterTreeNode,
  categoryId: number,
  attachmentId: string,
  hiddenNodeIds: Set<number>,
  isAttachmentRoot: boolean,
  isHiddenByAncestor: boolean
): CategoryTreeViewNode {
  const kind = getNodeKind(filter);
  const isNodeHidden = isHiddenByAncestor || hiddenNodeIds.has(filter.id);
  return {
    key: `${attachmentId}:filter:${filter.id}`,
    node: filter,
    kind,
    categoryId,
    attachmentId,
    isAttachmentRoot,
    isNodeHidden,
    isHiddenByAncestor,
    children: filter.children.map((child) =>
      buildCategoryLinkedFilterNode(child, categoryId, attachmentId, hiddenNodeIds, false, isNodeHidden)
    ),
  };
}

function buildCategoryTreeNodes(
  categories: AdminCategoryTreeNode[],
  flatFilters: AdminFilterTreeNode[],
  customCatalogs: AdminCustomCatalog[]
): CategoryTreeViewNode[] {
  return [...categories].sort(compareCategoriesByShowcaseOrder).map((category) => ({
    key: `category:${category.id}`,
    node: category,
    kind: "category",
    categoryId: category.id,
    attachmentId: null,
    isAttachmentRoot: false,
    isNodeHidden: false,
    isHiddenByAncestor: false,
    children: sortCategoryAttachments(category, flatFilters, customCatalogs)
      .filter((attachment) => isCategoryAttachmentAllowed(category, attachment))
      .flatMap((attachment) => {
      if (attachment.kind === "filter") {
        const filter = flatFilters.find((item) => item.id === attachment.ref_id);
        if (!filter) {
          return [];
        }
        return [buildCategoryLinkedFilterNode(filter, category.id, attachment.id, new Set(attachment.hidden_node_ids), true, false)];
      }
      const customCatalog = customCatalogs.find((item) => item.id === attachment.ref_id);
      if (!customCatalog) {
        return [];
      }
      const isNodeHidden = attachment.hidden_node_ids.includes(customCatalog.id);
      return [{
        key: `${attachment.id}:catalog:${customCatalog.id}`,
        node: customCatalog,
        kind: "customCatalog" as const,
        categoryId: category.id,
        attachmentId: attachment.id,
        isAttachmentRoot: true,
        isNodeHidden,
        isHiddenByAncestor: false,
        children: [],
      }];
    }),
  }));
}

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
  onCreate,
  showCreateButton,
  canDrag,
  dragActiveId,
  dropTarget,
  itemDropMode,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  node: TaxonomyNode;
  depth: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreate: (id: number) => void;
  showCreateButton: boolean | ((node: TaxonomyNode) => boolean);
  canDrag: boolean;
  dragActiveId: number | null;
  dropTarget: TreeDropTarget | null;
  itemDropMode: Exclude<TreeDropMode, "root">;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onDragOver: (draggedId: number, targetId: number | null, mode: TreeDropMode) => void;
  onDrop: (draggedId: number, targetId: number | null, mode: TreeDropMode) => void;
}) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);
  const kind = getNodeKind(node);
  const buttonClassName = [
    selectedId === node.id ? "tab tab--active cat-tree-btn taxonomy-tree-btn" : "tab cat-tree-btn taxonomy-tree-btn",
    `taxonomy-tree-btn--${kind}`,
  ].join(" ");
  const nodeButtonLabel = isFilterNode(node) ? getFilterButtonLabel(node) : node.label;
  const shouldShowCreateButton = typeof showCreateButton === "function" ? showCreateButton(node) : showCreateButton;
  const isBeforeDropTarget = dropTarget?.mode === "before" && dropTarget.targetId === node.id;
  const isInsideDropTarget = dropTarget?.mode === "inside" && dropTarget.targetId === node.id;
  const itemClassName = [
    "cat-tree-item taxonomy-tree-item",
    dragActiveId === node.id ? "taxonomy-tree-item--dragging" : "",
    isInsideDropTarget ? "taxonomy-tree-item--drop-target" : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    return () => {
      dragPreviewRef.current?.remove();
      dragPreviewRef.current = null;
    };
  }, []);

  return (
    <div ref={nodeRef} className="cat-tree-node" style={{ marginLeft: `${depth * 12}px` }}>
      {canDrag ? (
        <div
          className={isBeforeDropTarget ? "taxonomy-node-spacer taxonomy-drop-line taxonomy-drop-line--active" : "taxonomy-node-spacer taxonomy-drop-line"}
          onDragOver={(event) => {
            const draggedId = Number(event.dataTransfer.getData("text/plain"));
            if (!Number.isInteger(draggedId) || draggedId <= 0) {
              return;
            }
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            onDragOver(draggedId, node.id, "before");
          }}
          onDrop={(event) => {
            const draggedId = Number(event.dataTransfer.getData("text/plain"));
            if (!Number.isInteger(draggedId) || draggedId <= 0) {
              return;
            }
            event.preventDefault();
            onDrop(draggedId, node.id, "before");
          }}
        />
      ) : null}
      <div
        className={itemClassName}
        draggable={canDrag}
        onDragStart={(event) => {
          if (!canDrag) {
            return;
          }
          dragPreviewRef.current?.remove();
          dragPreviewRef.current = null;

          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", String(node.id));

          const nodeElement = nodeRef.current;
          if (nodeElement) {
            const rect = nodeElement.getBoundingClientRect();
            const preview = nodeElement.cloneNode(true);
            if (preview instanceof HTMLDivElement) {
              preview.style.position = "fixed";
              preview.style.top = "-10000px";
              preview.style.left = "-10000px";
              preview.style.margin = "0";
              preview.style.width = `${rect.width}px`;
              preview.style.pointerEvents = "none";
              preview.style.zIndex = "9999";
              preview.style.opacity = "0.96";
              preview.classList.add("taxonomy-drag-preview");
              document.body.appendChild(preview);
              dragPreviewRef.current = preview;
              const offsetX = Math.max(12, Math.min(rect.width - 12, event.clientX - rect.left));
              const offsetY = Math.max(12, Math.min(rect.height - 12, event.clientY - rect.top));
              event.dataTransfer.setDragImage(preview, offsetX, offsetY);
            }
          }

          onDragStart(node.id);
        }}
        onDragEnd={() => {
          if (!canDrag) {
            return;
          }
          dragPreviewRef.current?.remove();
          dragPreviewRef.current = null;
          onDragEnd();
        }}
        onDragOver={(event) => {
          if (!canDrag) {
            return;
          }
          const draggedId = Number(event.dataTransfer.getData("text/plain"));
          if (!Number.isInteger(draggedId) || draggedId <= 0) {
            return;
          }
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          onDragOver(draggedId, node.id, itemDropMode);
        }}
        onDrop={(event) => {
          if (!canDrag) {
            return;
          }
          const draggedId = Number(event.dataTransfer.getData("text/plain"));
          if (!Number.isInteger(draggedId) || draggedId <= 0) {
            return;
          }
          event.preventDefault();
          onDrop(draggedId, node.id, itemDropMode);
        }}
      >
        <button type="button" className={buttonClassName} onClick={() => onSelect(node.id)}>
          <span>{nodeButtonLabel}</span>
        </button>
        {shouldShowCreateButton ? (
          <button
            type="button"
            className="tree-plus taxonomy-tree-add-btn"
            onClick={(event) => {
              event.stopPropagation();
              onCreate(node.id);
            }}
            aria-label={`Добавить к ${nodeButtonLabel}`}
          >
            +
          </button>
        ) : null}
      </div>
      {isFilterNode(node) && node.children.length > 0 ? (
        <div className="cat-tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreate={onCreate}
              showCreateButton={showCreateButton}
              canDrag={canDrag}
              dragActiveId={dragActiveId}
              dropTarget={dropTarget}
              itemDropMode={itemDropMode}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TreeBlock({
  title,
  nodes,
  selectedId,
  onSelect,
  onCreate,
  note,
  showRootCreateButton,
  rootCreateLabel,
  showNodeCreateButton,
  canDrag,
  dragActiveId,
  dropTarget,
  itemDropMode,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  title: string;
  nodes: TaxonomyNode[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreate: (id: number | null) => void;
  note: string;
  showRootCreateButton: boolean;
  rootCreateLabel?: string;
  showNodeCreateButton: boolean | ((node: TaxonomyNode) => boolean);
  canDrag: boolean;
  dragActiveId: number | null;
  dropTarget: TreeDropTarget | null;
  itemDropMode: Exclude<TreeDropMode, "root">;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onDragOver: (draggedId: number, targetId: number | null, mode: TreeDropMode) => void;
  onDrop: (draggedId: number, targetId: number | null, mode: TreeDropMode) => void;
}) {
  const isRootDropTarget = dropTarget?.mode === "root";
  return (
    <div className="card taxonomy-tree-card">
      <div className="taxonomy-section-head">
        <div>
          <h3>{title}</h3>
          {note ? <p className="muted">{note}</p> : null}
        </div>
      </div>
      <div className="cat-tree-wrap">
        <div className="cat-tree-column">
          {nodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreate={(id) => onCreate(id)}
              showCreateButton={showNodeCreateButton}
              canDrag={canDrag}
              dragActiveId={dragActiveId}
              dropTarget={dropTarget}
              itemDropMode={itemDropMode}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
          {canDrag ? (
            <div
              className={isRootDropTarget ? "taxonomy-root-drop-zone taxonomy-root-drop-zone--active" : "taxonomy-root-drop-zone"}
              onDragOver={(event) => {
                const draggedId = Number(event.dataTransfer.getData("text/plain"));
                if (!Number.isInteger(draggedId) || draggedId <= 0) {
                  return;
                }
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                onDragOver(draggedId, null, "root");
              }}
              onDrop={(event) => {
                const draggedId = Number(event.dataTransfer.getData("text/plain"));
                if (!Number.isInteger(draggedId) || draggedId <= 0) {
                  return;
                }
                event.preventDefault();
                onDrop(draggedId, null, "root");
              }}
            />
          ) : null}
          {showRootCreateButton ? (
            <button type="button" className="tree-plus taxonomy-tree-root-add-btn" onClick={() => onCreate(null)}>
              {rootCreateLabel ?? "+ Добавить"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CategoryAttachMenu({
  category,
  customCatalogs,
  filters,
  onAttachCustomCatalog,
  onAttachFilter,
}: {
  category: AdminCategoryTreeNode;
  customCatalogs: AdminCustomCatalog[];
  filters: AdminFilterTreeNode[];
  onAttachCustomCatalog: (customCatalogId: number) => void;
  onAttachFilter: (filterId: number) => void;
}) {
  const attachedFilterIds = new Set(category.attachments.filter((item) => item.kind === "filter").map((item) => item.ref_id));
  const attachedCatalogIds = new Set(category.attachments.filter((item) => item.kind === "custom_catalog").map((item) => item.ref_id));
  const availableFilters = filters.filter((filter) => !attachedFilterIds.has(filter.id));
  const availableCustomCatalogs = customCatalogs.filter((catalog) => !attachedCatalogIds.has(catalog.id));

  return (
    <div className="taxonomy-attach-menu">
      {category.behavior === "new" ? (
        <div className="taxonomy-attach-menu-group">
          <strong>Кастомные каталоги</strong>
          <div className="taxonomy-attach-menu-list">
            {availableCustomCatalogs.length > 0 ? availableCustomCatalogs.map((catalog) => (
              <button
                key={catalog.id}
                type="button"
                className="taxonomy-attach-menu-item taxonomy-attach-menu-item--customCatalog"
                onClick={() => onAttachCustomCatalog(catalog.id)}
              >
                {catalog.label}
              </button>
            )) : <p className="muted">Свободных каталогов нет.</p>}
          </div>
        </div>
      ) : null}
      {category.behavior === "gender" ? (
        <div className="taxonomy-attach-menu-group">
          <strong>Фильтры и мультифильтры</strong>
          <div className="taxonomy-attach-menu-list">
            {availableFilters.length > 0 ? availableFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`taxonomy-attach-menu-item taxonomy-attach-menu-item--${getNodeKind(filter)}`}
                onClick={() => onAttachFilter(filter.id)}
              >
                {getFilterDisplayLabel(filter)}
              </button>
            )) : <p className="muted">Свободных фильтров нет.</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CategoryTreeNode({
  node,
  depth,
  selectedKey,
  onSelect,
  onToggleCreateMenu,
  attachableFilters,
  customCatalogs,
  onAttachCustomCatalog,
  onAttachFilter,
  showCreateButton,
  activeCreateMenuNodeId,
}: {
  node: CategoryTreeViewNode;
  depth: number;
  selectedKey: string | null;
  onSelect: (node: CategoryTreeViewNode) => void;
  onToggleCreateMenu: (categoryId: number | null) => void;
  attachableFilters: AdminFilterTreeNode[];
  customCatalogs: AdminCustomCatalog[];
  onAttachCustomCatalog: (categoryId: number, customCatalogId: number) => void;
  onAttachFilter: (categoryId: number, filterId: number) => void;
  showCreateButton: (node: CategoryTreeViewNode) => boolean;
  activeCreateMenuNodeId: number | null;
}) {
  const createButtonRef = useRef<HTMLButtonElement | null>(null);
  const shouldShowCreateButton = showCreateButton(node);
  const buttonClassName = [
    selectedKey === node.key ? "tab tab--active cat-tree-btn taxonomy-tree-btn" : "tab cat-tree-btn taxonomy-tree-btn",
    `taxonomy-tree-btn--${node.kind}`,
    node.isNodeHidden ? "taxonomy-tree-btn--linked-hidden" : "",
  ].filter(Boolean).join(" ");
  const sourceNode = node.node;

  return (
    <div className="cat-tree-node" style={{ marginLeft: `${depth * 12}px` }}>
      <div className="taxonomy-node-spacer" aria-hidden="true" />
      <div className="cat-tree-item taxonomy-tree-item">
        <button type="button" className={buttonClassName} onClick={() => onSelect(node)}>
          <span>{sourceNode.label}</span>
        </button>
        {shouldShowCreateButton ? (
          <button
            ref={createButtonRef}
            type="button"
            className="tree-plus taxonomy-tree-add-btn"
            onClick={(event) => {
              event.stopPropagation();
              onToggleCreateMenu(node.categoryId);
            }}
            aria-label={`Добавить к ${sourceNode.label}`}
          >
            +
          </button>
        ) : null}
      </div>
      {isCategoryNode(sourceNode) ? (
        <FloatingPopover
          anchorRef={createButtonRef}
          open={activeCreateMenuNodeId === sourceNode.id}
          className="taxonomy-attach-menu-popover"
          onClose={() => onToggleCreateMenu(null)}
        >
          <CategoryAttachMenu
            category={sourceNode}
            customCatalogs={customCatalogs}
            filters={attachableFilters}
            onAttachCustomCatalog={(customCatalogId) => onAttachCustomCatalog(sourceNode.id, customCatalogId)}
            onAttachFilter={(filterId) => onAttachFilter(sourceNode.id, filterId)}
          />
        </FloatingPopover>
      ) : null}
      {node.children.length > 0 ? (
        <div className="cat-tree-children">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.key}
              node={child}
              depth={depth + 1}
              selectedKey={selectedKey}
              onSelect={onSelect}
              onToggleCreateMenu={onToggleCreateMenu}
              attachableFilters={attachableFilters}
              customCatalogs={customCatalogs}
              onAttachCustomCatalog={onAttachCustomCatalog}
              onAttachFilter={onAttachFilter}
              showCreateButton={showCreateButton}
              activeCreateMenuNodeId={activeCreateMenuNodeId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CategoryTreeBlock({
  title,
  nodes,
  selectedKey,
  onSelect,
  onToggleCreateMenu,
  attachableFilters,
  customCatalogs,
  onAttachCustomCatalog,
  onAttachFilter,
  activeCreateMenuNodeId,
}: {
  title: string;
  nodes: CategoryTreeViewNode[];
  selectedKey: string | null;
  onSelect: (node: CategoryTreeViewNode) => void;
  onToggleCreateMenu: (categoryId: number | null) => void;
  attachableFilters: AdminFilterTreeNode[];
  customCatalogs: AdminCustomCatalog[];
  onAttachCustomCatalog: (categoryId: number, customCatalogId: number) => void;
  onAttachFilter: (categoryId: number, filterId: number) => void;
  activeCreateMenuNodeId: number | null;
}) {
  return (
    <div className="card taxonomy-tree-card">
      <div className="taxonomy-section-head">
        <div>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="cat-tree-wrap">
        <div className="cat-tree-column">
          {nodes.map((node) => (
            <CategoryTreeNode
              key={node.key}
              node={node}
              depth={0}
              selectedKey={selectedKey}
              onSelect={onSelect}
              onToggleCreateMenu={onToggleCreateMenu}
              attachableFilters={attachableFilters}
              customCatalogs={customCatalogs}
              onAttachCustomCatalog={onAttachCustomCatalog}
              onAttachFilter={onAttachFilter}
              showCreateButton={(item) => isCategoryNode(item.node) && (item.node.behavior === "new" || item.node.behavior === "gender")}
              activeCreateMenuNodeId={activeCreateMenuNodeId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function KeywordField({
  title,
  items,
  placeholder,
  onAdd,
  onRemove,
  disabled,
}: {
  title: string;
  items: string[];
  placeholder: string;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState<string>("");
  const blockClassName = disabled ? "taxonomy-panel-block taxonomy-panel-block--disabled" : "taxonomy-panel-block";
  const normalizedDraft = draft.trim().toLowerCase();
  const canAdd = !disabled && normalizedDraft.length > 0 && !items.includes(normalizedDraft);

  return (
    <div className={blockClassName}>
      <h4 className="taxonomy-panel-title">{title}</h4>
      <div className="chip-list">
        {items.map((item) => (
          <span key={item} className={disabled ? "tag tag--muted" : "tag tag--with-action"}>
            <span>{item}</span>
            {!disabled ? (
              <TagRemoveButton onClick={() => onRemove(item)} aria-label={`Удалить ${item}`} />
            ) : null}
          </span>
        ))}
      </div>
      <div className="taxonomy-keyword-row taxonomy-keyword-row--compact">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onKeyDown={(event) => {
            if (!canAdd) {
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd(draft);
              setDraft("");
            }
          }}
        />
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => {
            if (!canAdd) {
              return;
            }
            onAdd(draft);
            setDraft("");
          }}
        >
          Добавить
        </button>
      </div>
    </div>
  );
}

function ManualProductList({
  items,
  actionLabel,
  onAction,
  onToggleHidden,
  disabled,
}: {
  items: AdminRuleManualProduct[];
  actionLabel: string;
  onAction: (productId: number) => void;
  onToggleHidden: (productId: number) => void;
  disabled: boolean;
}) {
  return (
    <>
      {items.map((item) => {
        const isUnavailable = String(item.orderability_status || "").trim().toLowerCase() === "unavailable";
        const unavailableTitle = isUnavailable ? unavailableReasonRu(item.status_reason) : null;

        return (
          <div
            key={`${actionLabel}-${item.product_id}`}
            className={[
              "manual-product-row",
              disabled ? "manual-product-row--disabled" : "",
              item.visibility_status === "hidden" ? "manual-product-row--hidden" : "",
            ].filter(Boolean).join(" ")}
          >
            <Link className="manual-product-thumb-link" to={`/product/${item.product_id}?from=admin`} title={unavailableTitle || undefined}>
              <div className="manual-product-media">
                {item.image_url ? <img src={item.image_url} alt={item.title} loading="lazy" decoding="async" /> : <span className="manual-product-media-placeholder photo-placeholder">Нет фото</span>}
              </div>
            </Link>
            <div className="manual-product-main">
              <a className="btn-link manual-product-title-link" href={`/product/${item.product_id}?from=admin`} target="_blank" rel="noreferrer" title={unavailableTitle || undefined}>
                {item.designer_name} {item.title}
              </a>
              <div className="manual-product-meta-stack">
                <a className="manual-product-meta-link" href={item.url} target="_blank" rel="noreferrer">
                  {getSourceDomainLabel(item.url, item.source_name)}
                </a>
                {item.assigned_filter_titles.length > 0 ? (
                  <span className="manual-product-meta-link manual-product-meta-link--muted">
                    {item.assigned_filter_titles.join(" / ")}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="manual-product-actions">
              <button
                type="button"
                className={[
                  "manual-product-action-btn",
                  actionLabel === "Удалить" && isUnavailable ? "manual-product-action-btn--danger" : "",
                ].filter(Boolean).join(" ")}
                disabled={disabled}
                onClick={() => onAction(item.product_id)}
              >
                {actionLabel}
              </button>
              <button type="button" className="manual-product-action-btn manual-product-action-btn--secondary" disabled={disabled} onClick={() => onToggleHidden(item.product_id)}>
                {item.visibility_status === "hidden" ? <IconEye className="icon-svg icon-svg--sm" /> : <IconEyeOff className="icon-svg icon-svg--sm" />}
                {item.visibility_status === "hidden" ? "Показать" : "Скрыть"}
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}

function ManualProductListSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="manual-product-list-skeleton" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`manual-product-skeleton-${index}`} className="manual-product-row manual-product-row--skeleton">
          <SkeletonBlock className="manual-product-media manual-product-media--skeleton" />
          <div className="manual-product-main">
            <SkeletonBlock className="manual-product-title-link manual-product-title-link--skeleton" />
            <div className="manual-product-meta-stack">
              <SkeletonBlock className="manual-product-meta-link manual-product-meta-link--skeleton" />
              <SkeletonBlock className="manual-product-meta-link manual-product-meta-link--muted manual-product-meta-link--skeleton manual-product-meta-link--wide-skeleton" />
            </div>
          </div>
          <div className="manual-product-actions">
            <SkeletonBlock className="manual-product-action-btn manual-product-action-btn--skeleton" />
            <SkeletonBlock className="manual-product-action-btn manual-product-action-btn--secondary manual-product-action-btn--skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FloatingPopover({
  anchorRef,
  open,
  className,
  onClose,
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  className: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) {
        return;
      }
      const margin = 12;
      const offset = 8;
      const anchorRect = anchor.getBoundingClientRect();
      const popoverWidth = Math.min(popoverRef.current?.offsetWidth ?? 340, window.innerWidth - margin * 2);
      const popoverHeight = popoverRef.current?.offsetHeight ?? 136;
      const left = Math.min(
        Math.max(margin, anchorRect.left),
        Math.max(margin, window.innerWidth - popoverWidth - margin)
      );
      const fitsBelow = anchorRect.bottom + offset + popoverHeight <= window.innerHeight - margin;
      const top = fitsBelow
        ? anchorRect.bottom + offset
        : Math.max(margin, anchorRect.top - popoverHeight - offset);

      setPosition({ top, left });
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (anchorRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const firstFrame = window.requestAnimationFrame(updatePosition);
    const secondFrame = window.requestAnimationFrame(updatePosition);

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={popoverRef}
      className={className}
      role="dialog"
      aria-live="polite"
      style={
        position
          ? { top: `${position.top}px`, left: `${position.left}px`, visibility: "visible" }
          : { top: "0", left: "0", visibility: "hidden" }
      }
    >
      {children}
    </div>,
    document.body
  );
}

function DeleteConfirmPopover({
  anchorRef,
  open,
  message,
  onConfirm,
  onClose,
}: {
  anchorRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  message: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <FloatingPopover
      anchorRef={anchorRef}
      open={open}
      className="taxonomy-delete-popover"
      onClose={onClose}
    >
      <p className="taxonomy-delete-popover-text">{message}</p>
      <div className="taxonomy-delete-popover-actions">
        <button type="button" className="taxonomy-action-btn taxonomy-action-btn--danger" onClick={onConfirm}>
          Да, удалить
        </button>
        <button type="button" className="taxonomy-action-btn" onClick={onClose}>
          Отмена
        </button>
      </div>
    </FloatingPopover>
  );
}

function FilterEditor({
  filter,
  rootMultifilterOptions,
  manualSearchInput,
  setManualSearchInput,
  manualSearchLoading,
  manualSearchResults,
  updateFilterLabel,
  updateFilterDisplayLabel,
  setFilterMobilePairRootId,
  setFilterEnabled,
  deleteSelectedFilter,
  onDelete,
  addKeyword,
  removeKeyword,
  addManualProduct,
  removeManualProduct,
  toggleManualProductHidden,
}: {
  filter: AdminFilterTreeNode | null;
  rootMultifilterOptions: Array<{ id: number; label: string }>;
  manualSearchInput: string;
  setManualSearchInput: (value: string) => void;
  manualSearchLoading: boolean;
  manualSearchResults: AdminRuleManualProduct[];
  updateFilterLabel: (value: string) => void;
  updateFilterDisplayLabel: (value: string) => void;
  setFilterMobilePairRootId: (value: number | null) => void;
  setFilterEnabled: (value: boolean) => void;
  deleteSelectedFilter: () => void;
  onDelete: () => void;
  addKeyword: (scope: "local_category_keywords" | "title_keywords", value: string) => void;
  removeKeyword: (scope: "local_category_keywords" | "title_keywords", value: string) => void;
  addManualProduct: (productId: number) => void;
  removeManualProduct: (productId: number) => void;
  toggleManualProductHidden: (productId: number) => void;
}) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const deleteConfirmRef = useRef<HTMLDivElement | null>(null);

  if (!filter) {
    return <p className="muted">Выбери фильтр слева.</p>;
  }

  const kind = getNodeKind(filter);
  const isRootMultifilter = kind === "multifilter" && rootMultifilterOptions.some((item) => item.id === filter.id);
  const mobilePairOptions = rootMultifilterOptions.filter((item) => item.id !== filter.id);
  const rulesLocked = kind === "multifilter";
  const requiresDeleteConfirm =
    kind === "multifilter"
    || filter.rules.local_category_keywords.length > 0
    || filter.rules.title_keywords.length > 0
    || filter.rules.manual_products.length > 0;

  useEffect(() => {
    setDeleteConfirmOpen(false);
  }, [filter.id]);

  return (
    <>
      <div className={`taxonomy-kind-pill taxonomy-kind-pill--${kind}`}>{getNodeKindLabel(kind)}</div>
      <div className="taxonomy-fields-grid taxonomy-fields-grid--editor">
        <div className="taxonomy-field-stack">
          <label className="taxonomy-field">
            <span>Название</span>
            <input type="text" value={filter.label} onChange={(event) => updateFilterLabel(event.target.value)} />
          </label>
          <div className="taxonomy-field-actions">
            <label className="ui-switch ui-switch--compact">
              <input
                type="checkbox"
                checked={filter.is_enabled}
                onChange={(event) => setFilterEnabled(Boolean(event.target.checked))}
              />
              <span className="ui-switch-track">
                <span className="ui-switch-thumb" />
              </span>
              <span className="ui-switch-text">Включен</span>
            </label>
            <div ref={deleteConfirmRef} className="taxonomy-delete-confirm">
              <button
                type="button"
                className="taxonomy-action-btn taxonomy-action-btn--danger"
                onClick={() => {
                  if (!requiresDeleteConfirm) {
                    deleteSelectedFilter();
                    onDelete();
                    return;
                  }
                  setDeleteConfirmOpen((prev) => !prev);
                }}
              >
                Удалить
              </button>
              <DeleteConfirmPopover
                anchorRef={deleteConfirmRef}
                open={deleteConfirmOpen}
                message="Вы точно хотите удалить? Это действие затронет текущий фильтр и его настройки."
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={() => {
                  setDeleteConfirmOpen(false);
                  deleteSelectedFilter();
                  onDelete();
                }}
              />
            </div>
          </div>
        </div>
        <label className="taxonomy-field">
          <span>Отображаемое имя</span>
          <input
            type="text"
            value={filter.display_label}
            onChange={(event) => updateFilterDisplayLabel(event.target.value)}
            placeholder={filter.label}
            disabled={kind === "multifilter"}
            readOnly={kind === "multifilter"}
          />
        </label>
        {isRootMultifilter ? (
          <label className="taxonomy-field">
            <span>Пара в мобильном меню</span>
            <select
              value={filter.mobile_pair_root_id ? String(filter.mobile_pair_root_id) : ""}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                setFilterMobilePairRootId(Number.isFinite(nextValue) && nextValue > 0 ? nextValue : null);
              }}
            >
              <option value="">Без объединения</option>
              {mobilePairOptions.map((option) => (
                <option key={option.id} value={String(option.id)}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <KeywordField
        title="Ключевые слова локальных категорий и тегов"
        items={filter.rules.local_category_keywords}
        placeholder="Например: outerwear"
        onAdd={(value) => addKeyword("local_category_keywords", value)}
        onRemove={(value) => removeKeyword("local_category_keywords", value)}
        disabled={rulesLocked}
      />

      <KeywordField
        title="Ключевые слова по названию товара"
        items={filter.rules.title_keywords}
        placeholder="Например: bomber"
        onAdd={(value) => addKeyword("title_keywords", value)}
        onRemove={(value) => removeKeyword("title_keywords", value)}
        disabled={rulesLocked}
      />

      <div className={rulesLocked ? "taxonomy-panel-block taxonomy-panel-block--disabled" : "taxonomy-panel-block"}>
        <h4 className="taxonomy-panel-title">Ручное добавление товаров</h4>
        <div className="taxonomy-keyword-row taxonomy-keyword-row--single">
          <input
            value={manualSearchInput}
            onChange={(event) => setManualSearchInput(event.target.value)}
            placeholder="Искать по бренду, названию товара, источнику или локальной категории"
            disabled={rulesLocked}
          />
        </div>
        {manualSearchLoading ? <ManualProductListSkeleton rows={2} /> : null}
        {!manualSearchLoading && manualSearchInput.trim() && manualSearchResults.length === 0 ? (
          <p className="muted">По текущему запросу ничего не найдено.</p>
        ) : null}
        <ManualProductList
          items={manualSearchResults}
          actionLabel="Добавить"
          onAction={addManualProduct}
          onToggleHidden={toggleManualProductHidden}
          disabled={rulesLocked}
        />
        {filter.rules.manual_products.length > 0 ? <h4 className="taxonomy-panel-title taxonomy-panel-title--manual-products">Добавленные товары</h4> : null}
        <ManualProductList
          items={filter.rules.manual_products}
          actionLabel="Удалить"
          onAction={removeManualProduct}
          onToggleHidden={toggleManualProductHidden}
          disabled={rulesLocked}
        />
      </div>
    </>
  );
}

function CategoryEditor({
  category,
  designerDirectory,
  filters,
}: {
  category: AdminCategoryTreeNode | null;
  designerDirectory: AdminDesignerDirectoryItem[];
  filters: AdminFilterTreeNode[];
}) {
  const [designerQuery, setDesignerQuery] = useState<string>("");
  const [designersExpanded, setDesignersExpanded] = useState<boolean>(false);

  useEffect(() => {
    setDesignerQuery("");
    setDesignersExpanded(false);
  }, [category?.id]);

  if (!category) {
    return <p className="muted">Выбери категорию слева.</p>;
  }
  const filteredDesigners = designerDirectory.filter((designer) =>
    designer.label.toLowerCase().includes(designerQuery.trim().toLowerCase())
  );
  const visibleDesigners = designersExpanded ? filteredDesigners : filteredDesigners.slice(0, 10);
  const hasMoreDesigners = filteredDesigners.length > visibleDesigners.length;
  const topNewCategoryFilters = getTopNewCategoryFilters(filters);

  return (
    <>
      <div className="taxonomy-kind-pill taxonomy-kind-pill--category">Категория</div>
      <label className="taxonomy-field taxonomy-field--single">
        <span>Название</span>
        <input type="text" value={category.label} disabled readOnly />
      </label>

      {category.behavior === "new" ? (
        <>
          <div className="taxonomy-info-card">
            <strong>Категория «Новинки»</strong>
            <p>Здесь вручную добавляются только кастомные каталоги для блока «Коллекции». Блок «Разделы» собирается автоматически из топ-9 фильтров по количеству товаров.</p>
          </div>
          <div className="taxonomy-panel-block">
            <h4 className="taxonomy-panel-title">Автоматические фильтры в «Разделах»</h4>
            <div className="taxonomy-designer-chip-list">
              {topNewCategoryFilters.map((filter) => (
                <span key={filter.id} className="taxonomy-designer-chip">
                  <span>{getFilterDisplayLabel(filter)}</span>
                  <strong>{countFilterProducts(filter)}</strong>
                </span>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {category.behavior === "designers" ? (
        <>
          <div className="taxonomy-info-card">
            <strong>Категория «Дизайнеры»</strong>
            <p>Список дизайнеров пополняется автоматически. Ручные привязки здесь не используются: витрина читает общий каталог брендов и строит раздел сама.</p>
          </div>
          <div className="taxonomy-panel-block">
            <h4 className="taxonomy-panel-title">Список дизайнеров</h4>
            <div className="taxonomy-keyword-row taxonomy-keyword-row--single">
              <input
                value={designerQuery}
                onChange={(event) => setDesignerQuery(event.target.value)}
                placeholder="Искать по названию дизайнера"
              />
            </div>
            <div className="taxonomy-designer-chip-list">
              {visibleDesigners.map((designer) => (
                <span key={designer.id} className="taxonomy-designer-chip">
                  <span>{designer.label}</span>
                  <strong>{designer.product_count}</strong>
                </span>
              ))}
            </div>
            {hasMoreDesigners ? (
              <div className="taxonomy-panel-actions">
                <button type="button" className="taxonomy-action-btn" onClick={() => setDesignersExpanded(true)}>
                  Показать еще
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {category.behavior === "gender" ? (
        <div className="taxonomy-info-card">
          <strong>{`Категория «${category.label}»`}</strong>
          <p>{`Все привязанные здесь фильтры автоматически работают вместе с системным фильтром «${getCategoryGenderLabel(category)}». Привязки добавляются только на первом уровне дерева категории слева.`}</p>
        </div>
      ) : null}

      {category.behavior === "sale" ? (
        <div className="taxonomy-info-card">
          <strong>Категория «Скидки»</strong>
          <p>Эта категория не хранит ручные привязки. Кнопка в верхней панели сразу открывает страницу каталога со скидками, где действует глобальное ограничение по товарам с активной скидкой.</p>
        </div>
      ) : null}
    </>
  );
}

function CategoryLinkedEditor({
  item,
  category,
  onToggleHidden,
  onRemove,
}: {
  item: CategoryTreeViewNode | null;
  category: AdminCategoryTreeNode | null;
  onToggleHidden: () => void;
  onRemove: () => void;
}) {
  if (!item || !category) {
    return <p className="muted">Выбери привязанную сущность слева.</p>;
  }

  const sourceNode = item.node;
  const kind = item.kind;
  const hasAttachment = Boolean(item.attachmentId);
  const canRemoveAttachment = Boolean(item.isAttachmentRoot && item.attachmentId);
  const canToggleHidden = hasAttachment && !item.isHiddenByAncestor;

  return (
    <>
      <div className={`taxonomy-kind-pill taxonomy-kind-pill--${kind}`}>{getNodeKindLabel(kind)}</div>
      <div className="taxonomy-info-card">
        <strong>{`Категория «${category.label}»`}</strong>
        <p>
          Эта сущность показана как связанная копия из базового дерева.
          {item.isNodeHidden ? " Сейчас она скрыта внутри категории." : " Сейчас она включена внутри категории."}
        </p>
      </div>

      {"display_label" in sourceNode ? (
        <div className="taxonomy-fields-grid taxonomy-fields-grid--editor">
          <label className="taxonomy-field">
            <span>Название</span>
            <input type="text" value={sourceNode.label} disabled readOnly />
          </label>
          <label className="taxonomy-field">
            <span>Отображаемое имя</span>
            <input type="text" value={sourceNode.display_label} placeholder={sourceNode.label} disabled readOnly />
          </label>
        </div>
      ) : (
        <label className="taxonomy-field taxonomy-field--single">
          <span>Название</span>
          <input type="text" value={sourceNode.label} disabled readOnly />
        </label>
      )}

      {hasAttachment ? (
        <div className="taxonomy-linked-actions">
          <label className="ui-switch ui-switch--compact">
            <input type="checkbox" checked={item.isNodeHidden} onChange={() => onToggleHidden()} disabled={!canToggleHidden} />
            <span className="ui-switch-track">
              <span className="ui-switch-thumb" />
            </span>
            <span className="ui-switch-text">Скрыть</span>
          </label>
          <button
            type="button"
            className="taxonomy-action-btn taxonomy-action-btn--danger"
            onClick={onRemove}
            disabled={!canRemoveAttachment}
          >
            Убрать
          </button>
        </div>
      ) : null}

      {item.isHiddenByAncestor ? (
        <p className="muted">Этот узел уже скрыт родительским элементом, поэтому его собственный переключатель сейчас недоступен.</p>
      ) : item.attachmentId && !item.isAttachmentRoot ? (
        <p className="muted">Если скрыть этот узел, вместе с ним скроются и все его дочерние элементы внутри категории.</p>
      ) : null}

      {isFilterNode(sourceNode) ? (
        <>
          <KeywordField
            title="Ключевые слова локальных категорий и тегов"
            items={sourceNode.rules.local_category_keywords}
            placeholder=""
            onAdd={() => {}}
            onRemove={() => {}}
            disabled
          />
          <KeywordField
            title="Ключевые слова по названию товара"
            items={sourceNode.rules.title_keywords}
            placeholder=""
            onAdd={() => {}}
            onRemove={() => {}}
            disabled
          />
          <div className="taxonomy-panel-block taxonomy-panel-block--disabled">
            {sourceNode.rules.manual_products.length > 0 ? <h4 className="taxonomy-panel-title">Добавленные товары</h4> : <p className="muted">Добавленных товаров нет.</p>}
            <ManualProductList
              items={sourceNode.rules.manual_products}
              actionLabel="Удалить"
              onAction={() => {}}
              onToggleHidden={() => {}}
              disabled
            />
          </div>
        </>
      ) : null}

      {isCustomCatalogNode(sourceNode) ? (
        <div className="taxonomy-panel-block taxonomy-panel-block--disabled">
          {sourceNode.manual_products.length > 0 ? <h4 className="taxonomy-panel-title">Добавленные товары</h4> : <p className="muted">Добавленных товаров нет.</p>}
          <ManualProductList
            items={sourceNode.manual_products}
            actionLabel="Удалить"
            onAction={() => {}}
            onToggleHidden={() => {}}
            disabled
          />
        </div>
      ) : null}
    </>
  );
}

function CustomCatalogEditor({
  customCatalog,
  catalogSearchInput,
  setCatalogSearchInput,
  catalogSearchLoading,
  catalogSearchResults,
  updateCustomCatalogLabel,
  updateCustomCatalogDescription,
  setCustomCatalogEnabled,
  deleteSelectedCustomCatalog,
  onDelete,
  addCustomCatalogProduct,
  removeCustomCatalogProduct,
  toggleManualProductHidden,
}: {
  customCatalog: AdminCustomCatalog | null;
  catalogSearchInput: string;
  setCatalogSearchInput: (value: string) => void;
  catalogSearchLoading: boolean;
  catalogSearchResults: AdminRuleManualProduct[];
  updateCustomCatalogLabel: (value: string) => void;
  updateCustomCatalogDescription: (value: string) => void;
  setCustomCatalogEnabled: (value: boolean) => void;
  deleteSelectedCustomCatalog: () => void;
  onDelete: () => void;
  addCustomCatalogProduct: (productId: number) => void;
  removeCustomCatalogProduct: (productId: number) => void;
  toggleManualProductHidden: (productId: number) => void;
}) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const deleteConfirmRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDeleteConfirmOpen(false);
  }, [customCatalog?.id]);

  if (!customCatalog) {
    return <p className="muted">Выбери кастомный каталог слева.</p>;
  }

  return (
    <>
      <div className="taxonomy-kind-pill taxonomy-kind-pill--customCatalog">Кастомный каталог</div>
      <div className="taxonomy-fields-grid taxonomy-fields-grid--editor">
        <div className="taxonomy-field-stack">
          <label className="taxonomy-field">
            <span>Название</span>
            <input type="text" value={customCatalog.label} onChange={(event) => updateCustomCatalogLabel(event.target.value)} />
          </label>
          <label className="taxonomy-field">
            <span>Описание</span>
            <textarea
              rows={4}
              value={customCatalog.description}
              onChange={(event) => updateCustomCatalogDescription(event.target.value)}
            />
          </label>
          <div className="taxonomy-field-actions">
            <label className="ui-switch ui-switch--compact">
              <input
                type="checkbox"
                checked={customCatalog.is_enabled}
                onChange={(event) => setCustomCatalogEnabled(Boolean(event.target.checked))}
              />
              <span className="ui-switch-track">
                <span className="ui-switch-thumb" />
              </span>
              <span className="ui-switch-text">Включен</span>
            </label>
            <div ref={deleteConfirmRef} className="taxonomy-delete-confirm">
              <button type="button" className="taxonomy-action-btn taxonomy-action-btn--danger" onClick={() => setDeleteConfirmOpen((prev) => !prev)}>
                Удалить
              </button>
              <DeleteConfirmPopover
                anchorRef={deleteConfirmRef}
                open={deleteConfirmOpen}
                message="Вы точно хотите удалить кастомный каталог? Это действие снимет его со всех категорий витрины."
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={() => {
                  setDeleteConfirmOpen(false);
                  deleteSelectedCustomCatalog();
                  onDelete();
                }}
              />
            </div>
          </div>
        </div>
        <div className="taxonomy-info-card taxonomy-info-card--compact">
          <strong>Применение</strong>
          <p>Кастомный каталог может быть привязан к категории «Новинки» и появляется в блоке «Коллекции» между «Под заказ» и «Все товары».</p>
        </div>
      </div>

      <div className="taxonomy-panel-block">
        <h4 className="taxonomy-panel-title">Ручное добавление товаров</h4>
        <div className="taxonomy-keyword-row taxonomy-keyword-row--single">
          <input
            value={catalogSearchInput}
            onChange={(event) => setCatalogSearchInput(event.target.value)}
            placeholder="Искать по бренду, названию товара, источнику или локальной категории"
          />
        </div>
        {catalogSearchLoading ? <ManualProductListSkeleton rows={2} /> : null}
        {!catalogSearchLoading && catalogSearchInput.trim() && catalogSearchResults.length === 0 ? (
          <p className="muted">По текущему запросу ничего не найдено.</p>
        ) : null}
        <ManualProductList
          items={catalogSearchResults}
          actionLabel="Добавить"
          onAction={addCustomCatalogProduct}
          onToggleHidden={toggleManualProductHidden}
          disabled={false}
        />
        {customCatalog.manual_products.length > 0 ? <h4 className="taxonomy-panel-title taxonomy-panel-title--manual-products">Добавленные товары</h4> : null}
        <ManualProductList
          items={customCatalog.manual_products}
          actionLabel="Удалить"
          onAction={removeCustomCatalogProduct}
          onToggleHidden={toggleManualProductHidden}
          disabled={false}
        />
      </div>
    </>
  );
}

export function AdminFiltersCategoriesTab({ onToast }: { onToast?: (message: string) => void }) {
  const {
    loading,
    filters,
    flatFilters,
    categories,
    customCatalogs,
    designerDirectory,
    selectedFilterId,
    setSelectedFilterId,
    selectedFilter,
    rootMultifilterOptions,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCategory,
    selectedCustomCatalogId,
    setSelectedCustomCatalogId,
    selectedCustomCatalog,
    manualSearchInput,
    setManualSearchInput,
    manualSearchLoading,
    manualSearchResults,
    catalogSearchInput,
    setCatalogSearchInput,
    catalogSearchLoading,
    catalogSearchResults,
    updateFilterLabel,
    updateFilterDisplayLabel,
    setFilterMobilePairRootId,
    setFilterEnabled,
    deleteSelectedFilter,
    createFilterNode,
    createCustomCatalog,
    moveFilterNodeBefore,
    moveFilterNodeInside,
    moveFilterNodeToRoot,
    moveCustomCatalogBefore,
    moveCustomCatalogToEnd,
    addKeyword,
    removeKeyword,
    addManualProduct,
    removeManualProduct,
    addCustomCatalogProduct,
    removeCustomCatalogProduct,
    toggleManualProductHidden,
    updateCustomCatalogLabel,
    updateCustomCatalogDescription,
    setCustomCatalogEnabled,
    deleteSelectedCustomCatalog,
    attachFilterToCategory,
    attachCustomCatalogToCategory,
    removeCategoryAttachment,
    toggleCategoryAttachmentNodeHidden,
  } = useAdminFiltersCategories(onToast);

  const [activeEditor, setActiveEditor] = useState<EditorMode>(null);
  const [draggedFilterId, setDraggedFilterId] = useState<number | null>(null);
  const [dropTargetFilter, setDropTargetFilter] = useState<TreeDropTarget | null>(null);
  const [draggedCustomCatalogId, setDraggedCustomCatalogId] = useState<number | null>(null);
  const [dropTargetCustomCatalog, setDropTargetCustomCatalog] = useState<TreeDropTarget | null>(null);
  const [attachMenuCategoryId, setAttachMenuCategoryId] = useState<number | null>(null);
  const [selectedCategoryTreeKey, setSelectedCategoryTreeKey] = useState<string | null>(null);

  const attachableFilters = useMemo(() => flatFilters, [flatFilters]);
  const categoryTreeNodes = useMemo(
    () => buildCategoryTreeNodes(categories, flatFilters, customCatalogs),
    [categories, flatFilters, customCatalogs]
  );
  const selectedCategoryTreeNode = useMemo(() => {
    const stack = [...categoryTreeNodes];
    while (stack.length > 0) {
      const current = stack.pop() ?? null;
      if (!current) {
        continue;
      }
      if (current.key === selectedCategoryTreeKey) {
        return current;
      }
      stack.push(...current.children);
    }
    return null;
  }, [categoryTreeNodes, selectedCategoryTreeKey]);

  const handleSelectFilter = (id: number) => {
    setSelectedFilterId(id);
    setSelectedCategoryId(null);
    setSelectedCustomCatalogId(null);
    setSelectedCategoryTreeKey(null);
    setActiveEditor("filter");
    setAttachMenuCategoryId(null);
  };

  const handleSelectCategory = (id: number) => {
    setSelectedCategoryId(id);
    setSelectedFilterId(null);
    setSelectedCustomCatalogId(null);
    setSelectedCategoryTreeKey(`category:${id}`);
    setActiveEditor("category");
  };

  const handleSelectCategoryTreeNode = (node: CategoryTreeViewNode) => {
    setSelectedCategoryId(node.categoryId);
    setSelectedFilterId(null);
    setSelectedCustomCatalogId(null);
    setSelectedCategoryTreeKey(node.key);
    setActiveEditor(isCategoryNode(node.node) ? "category" : "categoryLinked");
    setAttachMenuCategoryId(null);
  };

  const handleSelectCustomCatalog = (id: number) => {
    setSelectedCustomCatalogId(id);
    setSelectedCategoryId(null);
    setSelectedFilterId(null);
    setSelectedCategoryTreeKey(null);
    setActiveEditor("customCatalog");
    setAttachMenuCategoryId(null);
  };

  const handleCreateFilterNode = (id: number | null) => {
    createFilterNode(id);
    setActiveEditor("filter");
    setSelectedCategoryTreeKey(null);
    setAttachMenuCategoryId(null);
  };

  const handleCreateCustomCatalog = () => {
    createCustomCatalog();
    setActiveEditor("customCatalog");
    setSelectedCategoryTreeKey(null);
    setAttachMenuCategoryId(null);
  };

  const handleFilterDragStart = (id: number) => {
    setDraggedFilterId(id);
    setDropTargetFilter(null);
  };

  const handleFilterDragEnd = () => {
    setDraggedFilterId(null);
    setDropTargetFilter(null);
  };

  const handleFilterDragOver = (draggedId: number, targetId: number | null, mode: TreeDropMode) => {
    if (targetId !== null && draggedId === targetId) {
      return;
    }
    setDropTargetFilter({ mode, targetId });
  };

  const handleFilterDrop = (draggedId: number, targetId: number | null, mode: TreeDropMode) => {
    if (targetId !== null && draggedId === targetId) {
      handleFilterDragEnd();
      return;
    }
    if (mode === "root") {
      moveFilterNodeToRoot(draggedId);
    } else if (mode === "before" && targetId !== null) {
      moveFilterNodeBefore(draggedId, targetId);
    } else if (mode === "inside" && targetId !== null) {
      moveFilterNodeInside(draggedId, targetId);
    }
    handleFilterDragEnd();
  };

  const handleCustomCatalogDragStart = (id: number) => {
    setDraggedCustomCatalogId(id);
    setDropTargetCustomCatalog(null);
  };

  const handleCustomCatalogDragEnd = () => {
    setDraggedCustomCatalogId(null);
    setDropTargetCustomCatalog(null);
  };

  const handleCustomCatalogDragOver = (draggedId: number, targetId: number | null, mode: TreeDropMode) => {
    if (targetId !== null && draggedId === targetId) {
      return;
    }
    setDropTargetCustomCatalog({ mode, targetId });
  };

  const handleCustomCatalogDrop = (draggedId: number, targetId: number | null, mode: TreeDropMode) => {
    if (targetId !== null && draggedId === targetId) {
      handleCustomCatalogDragEnd();
      return;
    }
    if (mode === "root") {
      moveCustomCatalogToEnd(draggedId);
    } else if (targetId !== null) {
      moveCustomCatalogBefore(draggedId, targetId);
    }
    handleCustomCatalogDragEnd();
  };

  const handleToggleCategoryAttachMenu = (categoryId: number | null) => {
    setAttachMenuCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  return (
    <div className="card">
      <h2>Структура витрины</h2>

      {loading && filters.length === 0 && categories.length === 0 && customCatalogs.length === 0 ? (
        <AdminTaxonomySkeleton />
      ) : (
        <div className="taxonomy-shell">
          <div className="taxonomy-sidebar">
            <TreeBlock
              title="Дерево фильтров"
              nodes={filters}
              selectedId={selectedFilterId}
              onSelect={handleSelectFilter}
              onCreate={handleCreateFilterNode}
              note=""
              showRootCreateButton
              showNodeCreateButton
              canDrag
              dragActiveId={draggedFilterId}
              dropTarget={dropTargetFilter}
              itemDropMode="inside"
              onDragStart={handleFilterDragStart}
              onDragEnd={handleFilterDragEnd}
              onDragOver={handleFilterDragOver}
              onDrop={handleFilterDrop}
            />
            <TreeBlock
              title="Кастомные каталоги"
              nodes={customCatalogs}
              selectedId={selectedCustomCatalogId}
              onSelect={handleSelectCustomCatalog}
              onCreate={() => handleCreateCustomCatalog()}
              note=""
              showRootCreateButton
              rootCreateLabel="+ Добавить"
              showNodeCreateButton={false}
              canDrag
              dragActiveId={draggedCustomCatalogId}
              dropTarget={dropTargetCustomCatalog}
              itemDropMode="before"
              onDragStart={handleCustomCatalogDragStart}
              onDragEnd={handleCustomCatalogDragEnd}
              onDragOver={handleCustomCatalogDragOver}
              onDrop={handleCustomCatalogDrop}
            />
            <CategoryTreeBlock
              title="Дерево категорий"
              nodes={categoryTreeNodes}
              selectedKey={selectedCategoryTreeKey}
              onSelect={handleSelectCategoryTreeNode}
              onToggleCreateMenu={(categoryId) => {
                if (categoryId !== null) {
                  handleSelectCategory(categoryId);
                }
                handleToggleCategoryAttachMenu(categoryId);
              }}
              attachableFilters={attachableFilters}
              customCatalogs={customCatalogs}
              onAttachCustomCatalog={(categoryId, customCatalogId) => {
                attachCustomCatalogToCategory(categoryId, customCatalogId);
                setAttachMenuCategoryId(null);
              }}
              onAttachFilter={(categoryId, filterId) => {
                attachFilterToCategory(categoryId, filterId);
                setAttachMenuCategoryId(null);
              }}
              activeCreateMenuNodeId={attachMenuCategoryId}
            />
          </div>

          {activeEditor ? (
            <div className="card taxonomy-editor-card">
              {activeEditor === "filter" ? (
                <FilterEditor
                  filter={selectedFilter}
                  rootMultifilterOptions={rootMultifilterOptions}
                  manualSearchInput={manualSearchInput}
                  setManualSearchInput={setManualSearchInput}
                  manualSearchLoading={manualSearchLoading}
                  manualSearchResults={manualSearchResults}
                  updateFilterLabel={updateFilterLabel}
                  updateFilterDisplayLabel={updateFilterDisplayLabel}
                  setFilterMobilePairRootId={setFilterMobilePairRootId}
                  setFilterEnabled={setFilterEnabled}
                  deleteSelectedFilter={deleteSelectedFilter}
                  onDelete={() => setActiveEditor(null)}
                  addKeyword={addKeyword}
                  removeKeyword={removeKeyword}
                  addManualProduct={addManualProduct}
                  removeManualProduct={removeManualProduct}
                  toggleManualProductHidden={toggleManualProductHidden}
                />
              ) : null}
              {activeEditor === "category" ? (
                <CategoryEditor
                  category={selectedCategory}
                  designerDirectory={designerDirectory}
                  filters={filters}
                />
              ) : null}
              {activeEditor === "categoryLinked" ? (
                <CategoryLinkedEditor
                  item={selectedCategoryTreeNode}
                  category={selectedCategory}
                  onToggleHidden={() => {
                    if (!selectedCategoryTreeNode?.attachmentId) {
                      return;
                    }
                    toggleCategoryAttachmentNodeHidden(
                      selectedCategoryTreeNode.categoryId,
                      selectedCategoryTreeNode.attachmentId,
                      selectedCategoryTreeNode.node.id
                    );
                  }}
                  onRemove={() => {
                    if (!selectedCategoryTreeNode?.attachmentId) {
                      return;
                    }
                    removeCategoryAttachment(selectedCategoryTreeNode.categoryId, selectedCategoryTreeNode.attachmentId);
                    setSelectedCategoryTreeKey(`category:${selectedCategoryTreeNode.categoryId}`);
                    setActiveEditor("category");
                  }}
                />
              ) : null}
              {activeEditor === "customCatalog" ? (
                <CustomCatalogEditor
                  customCatalog={selectedCustomCatalog}
                  catalogSearchInput={catalogSearchInput}
                  setCatalogSearchInput={setCatalogSearchInput}
                  catalogSearchLoading={catalogSearchLoading}
                  catalogSearchResults={catalogSearchResults}
                  updateCustomCatalogLabel={updateCustomCatalogLabel}
                  updateCustomCatalogDescription={updateCustomCatalogDescription}
                  setCustomCatalogEnabled={setCustomCatalogEnabled}
                  deleteSelectedCustomCatalog={deleteSelectedCustomCatalog}
                  onDelete={() => setActiveEditor(null)}
                  addCustomCatalogProduct={addCustomCatalogProduct}
                  removeCustomCatalogProduct={removeCustomCatalogProduct}
                  toggleManualProductHidden={toggleManualProductHidden}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
