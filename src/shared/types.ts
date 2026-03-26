export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
};

export type Product = {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  sku: string;
  stock: number;
  categoryId: number;
};
