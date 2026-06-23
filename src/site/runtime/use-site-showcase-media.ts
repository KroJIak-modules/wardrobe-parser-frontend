import { siteShowcaseMockMedia } from "./site-storefront-mock";

export function useSiteShowcaseMedia() {
  return {
    media: siteShowcaseMockMedia,
    loading: false,
    error: null,
  };
}
