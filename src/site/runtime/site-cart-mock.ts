import { siteCatalogProducts } from "./site-catalog-mock";

export type SiteCartItem = {
  id: string;
  productId: string;
  designerId: string;
  brand: string;
  name: string;
  imageSrc: string | null;
  imageAlt: string;
  availabilityLabel: string;
  availabilityCode: "in-stock" | "preorder";
  priceRub: number;
  size: string;
  quantity: number;
  sourceUrl: string;
  productUrl: string;
};

function getCatalogProduct(productId: string) {
  const product = siteCatalogProducts.find((entry) => entry.id === productId);
  if (!product) {
    throw new Error(`Unknown mock catalog product: ${productId}`);
  }

  return product;
}

const trucker = getCatalogProduct("product-trucker");

export const siteCartMockItems: readonly SiteCartItem[] = [
  {
    id: "cart-trucker-l",
    productId: trucker.id,
    designerId: trucker.designerId,
    brand: trucker.brand,
    name: trucker.name,
    imageSrc: trucker.imageSrc,
    imageAlt: trucker.imageAlt,
    availabilityLabel: "Под заказ",
    availabilityCode: "preorder",
    priceRub: trucker.priceRub,
    size: "L",
    quantity: 1,
    sourceUrl: "https://nofaithstudios.com/products/dust-trucker-jacket-1",
    productUrl: "https://anton-shell.cloudpub.ru/show",
  },
  {
    id: "cart-trucker-m",
    productId: trucker.id,
    designerId: trucker.designerId,
    brand: trucker.brand,
    name: trucker.name,
    imageSrc: trucker.imageSrc,
    imageAlt: trucker.imageAlt,
    availabilityLabel: "Под заказ",
    availabilityCode: "preorder",
    priceRub: trucker.priceRub,
    size: "L",
    quantity: 1,
    sourceUrl: "https://nofaithstudios.com/products/dust-trucker-jacket-1",
    productUrl: "https://anton-shell.cloudpub.ru/show",
  },
];
