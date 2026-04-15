import { useParams } from "react-router-dom";
import { CatalogPage } from "./catalog-page";

export function CategoryPage() {
  const { slug } = useParams();
  return <CatalogPage forcedCategorySlug={slug || null} />;
}
