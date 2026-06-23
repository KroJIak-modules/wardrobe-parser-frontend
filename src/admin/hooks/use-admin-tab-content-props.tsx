import type { ComponentProps } from "react";
import { AdminTabContent } from "../admin-tab-content";

type TabContentProps = ComponentProps<typeof AdminTabContent>;

type Params = Omit<TabContentProps, "productsTabProps" | "dedupTabProps" | "filtersCategoriesTabProps" | "designersTabProps" | "sourcesTabProps" | "pricingTabProps" | "weightTabProps" | "settingsTabProps"> & {
  productsTabProps: TabContentProps["productsTabProps"];
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
    productsTabProps,
    dedupTabProps,
    filtersCategoriesTabProps,
    designersTabProps,
    sourcesTabProps,
    pricingTabProps,
    weightTabProps,
    settingsTabProps,
  };
}
