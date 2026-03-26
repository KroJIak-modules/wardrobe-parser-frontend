import type { Category, Product } from "./types";

export const initialCategories: Category[] = [
  {
    id: 1,
    name: "Tops",
    slug: "tops",
    description: "Shirts, hoodies and knitwear.",
  },
  {
    id: 2,
    name: "Bottoms",
    slug: "bottoms",
    description: "Denim, trousers and shorts.",
  },
  {
    id: 3,
    name: "Footwear",
    slug: "footwear",
    description: "Sneakers and boots.",
  },
];

export const initialProducts: Product[] = [
  {
    id: 1,
    title: "Distressed T-Shirt",
    slug: "distressed-t-shirt",
    description: "Relaxed fit cotton t-shirt with distressed detailing.",
    price: 120,
    currency: "USD",
    imageUrl: "https://picsum.photos/seed/p1/640/800",
    sku: "TOP-001",
    stock: 12,
    categoryId: 1,
  },
  {
    id: 2,
    title: "Waxed Flare Denim",
    slug: "waxed-flare-denim",
    description: "Bootcut waxed denim with pronounced flare.",
    price: 430,
    currency: "USD",
    imageUrl: "https://picsum.photos/seed/p2/640/800",
    sku: "BOT-001",
    stock: 6,
    categoryId: 2,
  },
  {
    id: 3,
    title: "Ramones Sneakers",
    slug: "ramones-sneakers",
    description: "High-top sneakers with signature extended tongue.",
    price: 560,
    currency: "USD",
    imageUrl: "https://picsum.photos/seed/p3/640/800",
    sku: "FTW-001",
    stock: 4,
    categoryId: 3,
  },
];
