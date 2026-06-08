import { useParams } from "react-router-dom";
import { ShowcaseCatalogPage } from "./showcase-catalog-page";

export function ShowcaseCategoryPage() {
  const { slug } = useParams();
  return <ShowcaseCatalogPage forcedCategorySlug={slug || null} />;
}
