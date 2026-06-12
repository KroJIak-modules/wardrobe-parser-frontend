import type { ComponentProps } from "react";
import { AdminProductsTab } from "./admin-products-tab";
import { AdminDedupTab } from "./admin-dedup-tab";
import { AdminFiltersCategoriesTab } from "./admin-filters-categories-tab";
import { AdminDesignersTab } from "./admin-designers-tab";
import { AdminSourcesTab } from "./admin-sources-tab";
import { AdminPricingTab } from "./admin-pricing-tab";
import { AdminWeightTab } from "./admin-weight-tab";
import { AdminSettingsTab } from "./admin-settings-tab";
import type { AdminTab } from "./admin-types";

type AdminTabContentProps = {
  tab: AdminTab;
  productsTabProps: ComponentProps<typeof AdminProductsTab>;
  dedupTabProps: ComponentProps<typeof AdminDedupTab>;
  filtersCategoriesTabProps: ComponentProps<typeof AdminFiltersCategoriesTab>;
  designersTabProps: ComponentProps<typeof AdminDesignersTab>;
  sourcesTabProps: ComponentProps<typeof AdminSourcesTab>;
  pricingTabProps: ComponentProps<typeof AdminPricingTab>;
  weightTabProps: ComponentProps<typeof AdminWeightTab>;
  settingsTabProps: ComponentProps<typeof AdminSettingsTab>;
};

export function AdminTabContent({
  tab,
  productsTabProps,
  dedupTabProps,
  filtersCategoriesTabProps,
  designersTabProps,
  sourcesTabProps,
  pricingTabProps,
  weightTabProps,
  settingsTabProps,
}: AdminTabContentProps) {
  if (tab === "products") {
    return <AdminProductsTab {...productsTabProps} />;
  }
  if (tab === "dedup") {
    return <AdminDedupTab {...dedupTabProps} />;
  }
  if (tab === "showcase-structure") {
    return <AdminFiltersCategoriesTab {...filtersCategoriesTabProps} />;
  }
  if (tab === "sources") {
    return <AdminSourcesTab {...sourcesTabProps} />;
  }
  if (tab === "designers") {
    return <AdminDesignersTab {...designersTabProps} />;
  }
  if (tab === "pricing") {
    return <AdminPricingTab {...pricingTabProps} />;
  }
  if (tab === "weight") {
    return <AdminWeightTab {...weightTabProps} />;
  }
  if (tab === "settings") {
    return <AdminSettingsTab {...settingsTabProps} />;
  }
  return null;
}
