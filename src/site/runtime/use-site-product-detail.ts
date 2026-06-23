import { useMemo } from "react";
import {
  getDefaultSiteProductDetail,
  getSiteProductDetailById,
  getSiteProductRecommendations,
} from "./site-product-detail-mock";

export function useSiteProductDetail(productId?: string) {
  const product = useMemo(() => {
    if (productId) {
      return getSiteProductDetailById(productId);
    }
    return getDefaultSiteProductDetail();
  }, [productId]);

  const recommendations = useMemo(() => {
    if (!product) {
      return [];
    }

    return getSiteProductRecommendations(product, 8);
  }, [product]);

  return {
    product,
    recommendations,
    isEmpty: product === null,
  };
}
