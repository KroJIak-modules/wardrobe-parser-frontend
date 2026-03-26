import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initialCategories, initialProducts } from "./seed";
import type { Category, Product } from "./types";
import { toSlug } from "./utils";

type CategoryInput = {
  name: string;
  slug?: string;
  description: string;
};

type ProductInput = {
  title: string;
  slug?: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  sku: string;
  stock: number;
  categoryId: number;
};

type CatalogContextValue = {
  categories: Category[];
  products: Product[];
  createCategory: (input: CategoryInput) => void;
  updateCategory: (id: number, input: CategoryInput) => void;
  deleteCategory: (id: number) => void;
  createProduct: (input: ProductInput) => void;
  updateProduct: (id: number, input: ProductInput) => void;
  deleteProduct: (id: number) => void;
};

type CatalogState = {
  categories: Category[];
  products: Product[];
};

const STORAGE_KEY = "wardrobe-catalog-v1";

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

function normalizeCategory(input: CategoryInput): Omit<Category, "id"> {
  return {
    name: input.name.trim(),
    slug: input.slug?.trim() ? toSlug(input.slug) : toSlug(input.name),
    description: input.description.trim(),
  };
}

function normalizeProduct(input: ProductInput): Omit<Product, "id"> {
  return {
    title: input.title.trim(),
    slug: input.slug?.trim() ? toSlug(input.slug) : toSlug(input.title),
    description: input.description.trim(),
    price: Number(input.price),
    currency: input.currency.trim().toUpperCase() || "USD",
    imageUrl: input.imageUrl.trim(),
    sku: input.sku.trim(),
    stock: Number(input.stock),
    categoryId: Number(input.categoryId),
  };
}

function loadInitialState(): CatalogState {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { categories: initialCategories, products: initialProducts };
  }

  try {
    const parsed = JSON.parse(raw) as CatalogState;
    if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.products)) {
      return { categories: initialCategories, products: initialProducts };
    }
    return parsed;
  } catch {
    return { categories: initialCategories, products: initialProducts };
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogState>(loadInitialState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const createCategory = useCallback((input: CategoryInput) => {
    setState((prev) => {
      const nextId = prev.categories.length
        ? Math.max(...prev.categories.map((c) => c.id)) + 1
        : 1;
      const category = { id: nextId, ...normalizeCategory(input) };
      return { ...prev, categories: [...prev.categories, category] };
    });
  }, []);

  const updateCategory = useCallback((id: number, input: CategoryInput) => {
    setState((prev) => {
      const normalized = normalizeCategory(input);
      return {
        ...prev,
        categories: prev.categories.map((category) =>
          category.id === id ? { ...category, ...normalized } : category
        ),
      };
    });
  }, []);

  const deleteCategory = useCallback((id: number) => {
    setState((prev) => ({
      categories: prev.categories.filter((category) => category.id !== id),
      products: prev.products.filter((product) => product.categoryId !== id),
    }));
  }, []);

  const createProduct = useCallback((input: ProductInput) => {
    setState((prev) => {
      const nextId = prev.products.length
        ? Math.max(...prev.products.map((p) => p.id)) + 1
        : 1;
      const product = { id: nextId, ...normalizeProduct(input) };
      return { ...prev, products: [...prev.products, product] };
    });
  }, []);

  const updateProduct = useCallback((id: number, input: ProductInput) => {
    setState((prev) => {
      const normalized = normalizeProduct(input);
      return {
        ...prev,
        products: prev.products.map((product) =>
          product.id === id ? { ...product, ...normalized } : product
        ),
      };
    });
  }, []);

  const deleteProduct = useCallback((id: number) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((product) => product.id !== id),
    }));
  }, []);

  const value = useMemo<CatalogContextValue>(
    () => ({
      categories: state.categories,
      products: state.products,
      createCategory,
      updateCategory,
      deleteCategory,
      createProduct,
      updateProduct,
      deleteProduct,
    }),
    [
      state.categories,
      state.products,
      createCategory,
      updateCategory,
      deleteCategory,
      createProduct,
      updateProduct,
      deleteProduct,
    ]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used inside CatalogProvider");
  }
  return context;
}
