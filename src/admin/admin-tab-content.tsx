import type { ComponentProps } from "react";
import { AdminProductsTab } from "./admin-products-tab";
import { AdminDedupTab } from "./admin-dedup-tab";
import { AdminCategoriesTab } from "./admin-categories-tab";
import { AdminSourcesTab } from "./admin-sources-tab";
import { AdminPricingTab } from "./admin-pricing-tab";
import { AdminWeightTab } from "./admin-weight-tab";
import { AdminSettingsTab } from "./admin-settings-tab";
import type { AdminTab } from "./admin-types";

type AdminTabContentProps = {
  tab: AdminTab;
  productsTabProps: ComponentProps<typeof AdminProductsTab>;
  dedupTabProps: ComponentProps<typeof AdminDedupTab>;
  categoriesTabProps: ComponentProps<typeof AdminCategoriesTab>;
  sourcesTabProps: ComponentProps<typeof AdminSourcesTab>;
  pricingTabProps: ComponentProps<typeof AdminPricingTab>;
  weightTabProps: ComponentProps<typeof AdminWeightTab>;
  settingsTabProps: ComponentProps<typeof AdminSettingsTab>;
};

export function AdminTabContent({
  tab,
  productsTabProps,
  dedupTabProps,
  categoriesTabProps,
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
  if (tab === "categories") {
    return <AdminCategoriesTab {...categoriesTabProps} />;
  }
  if (tab === "sources") {
    return <AdminSourcesTab {...sourcesTabProps} />;
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
