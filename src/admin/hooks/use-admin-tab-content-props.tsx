import type { ComponentProps } from "react";
import { AdminTabContent } from "../admin-tab-content";
import { getAdminProductStatusBadge } from "../admin-product-status";

type TabContentProps = ComponentProps<typeof AdminTabContent>;

type Params = Omit<TabContentProps, "productsTabProps" | "dedupTabProps" | "filtersCategoriesTabProps" | "designersTabProps" | "sourcesTabProps" | "pricingTabProps" | "weightTabProps" | "settingsTabProps"> & {
  productsTabProps: Omit<TabContentProps["productsTabProps"], "statusBadge">;
  designersTabProps: TabContentProps["designersTabProps"];
  filtersCategoriesTabProps: TabContentProps["filtersCategoriesTabProps"];
};

export function useAdminTabContentProps(params: Params): TabContentProps {
  const {
    tab,
    productsTabProps,
    dedupTabProps,
    filtersCategoriesTabProps,
    designersTabProps,
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
    filtersCategoriesTabProps,
    designersTabProps,
    sourcesTabProps,
    pricingTabProps,
    weightTabProps,
    settingsTabProps,
  };
}
