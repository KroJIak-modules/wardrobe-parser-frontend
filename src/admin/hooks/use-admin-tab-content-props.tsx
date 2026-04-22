import type { ComponentProps } from "react";
import type { AdminCategoryNode } from "../../shared/live-data-context";
import { AdminCategoryTree } from "../admin-category-tree";
import { AdminTabContent } from "../admin-tab-content";
import { getAdminProductStatusBadge } from "../admin-product-status";

type TabContentProps = ComponentProps<typeof AdminTabContent>;

type Params = Omit<TabContentProps, "productsTabProps" | "dedupTabProps" | "categoriesTabProps" | "sourcesTabProps" | "pricingTabProps" | "weightTabProps" | "settingsTabProps"> & {
  productsTabProps: Omit<TabContentProps["productsTabProps"], "statusBadge">;
  categoriesPropsTree: {
    adminCategories: AdminCategoryNode[];
    selectedCategoryId: number | null;
    loadingCategoryCounts: boolean;
    setCreateFormOpen: (open: boolean) => void;
    setSelectedCategoryId: (id: number | null) => void;
    onStartCategoryCreate: (parentId: number | null) => void;
  };
  categoriesTabRest: Omit<TabContentProps["categoriesTabProps"], "renderTreeElement">;
};

export function useAdminTabContentProps(params: Params): TabContentProps {
  const {
    tab,
    productsTabProps,
    dedupTabProps,
    categoriesPropsTree,
    categoriesTabRest,
    sourcesTabProps,
    pricingTabProps,
    weightTabProps,
    settingsTabProps,
  } = params;

  return {
    tab,
    productsTabProps: {
      ...productsTabProps,
      statusBadge: getAdminProductStatusBadge,
    },
    dedupTabProps,
    categoriesTabProps: {
      ...categoriesTabRest,
      renderTreeElement: (
        <AdminCategoryTree
          nodes={categoriesPropsTree.adminCategories}
          selectedCategoryId={categoriesPropsTree.selectedCategoryId}
          loadingCategoryCounts={categoriesPropsTree.loadingCategoryCounts}
          onSelectCategory={(id) => {
            categoriesPropsTree.setCreateFormOpen(false);
            categoriesPropsTree.setSelectedCategoryId(id);
          }}
          onStartCategoryCreate={categoriesPropsTree.onStartCategoryCreate}
        />
      ),
    },
    sourcesTabProps,
    pricingTabProps,
    weightTabProps,
    settingsTabProps,
  };
}
