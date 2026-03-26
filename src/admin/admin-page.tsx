import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../shared/catalog-context";
import type { Category, Product } from "../shared/types";

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
};

type ProductForm = {
  title: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  imageUrl: string;
  sku: string;
  stock: string;
  categoryId: string;
};

const emptyCategoryForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
};

const emptyProductForm: ProductForm = {
  title: "",
  slug: "",
  description: "",
  price: "",
  currency: "USD",
  imageUrl: "",
  sku: "",
  stock: "0",
  categoryId: "",
};

export function AdminPage() {
  const {
    categories,
    products,
    createCategory,
    updateCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useCatalog();

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategoryForm);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  const onCategorySubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryForm.name.trim()) {
      return;
    }

    if (editingCategoryId) {
      updateCategory(editingCategoryId, {
        name: categoryForm.name,
        slug: categoryForm.slug,
        description: categoryForm.description,
      });
    } else {
      createCategory({
        name: categoryForm.name,
        slug: categoryForm.slug,
        description: categoryForm.description,
      });
    }

    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
  };

  const onProductSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!productForm.title.trim() || !productForm.categoryId) {
      return;
    }

    const payload = {
      title: productForm.title,
      slug: productForm.slug,
      description: productForm.description,
      price: Number(productForm.price || 0),
      currency: productForm.currency || "USD",
      imageUrl: productForm.imageUrl,
      sku: productForm.sku,
      stock: Number(productForm.stock || 0),
      categoryId: Number(productForm.categoryId),
    };

    if (editingProductId) {
      updateProduct(editingProductId, payload);
    } else {
      createProduct(payload);
    }

    setEditingProductId(null);
    setProductForm(emptyProductForm);
  };

  const startCategoryEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
    });
  };

  const startProductEdit = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      currency: product.currency,
      imageUrl: product.imageUrl,
      sku: product.sku,
      stock: String(product.stock),
      categoryId: String(product.categoryId),
    });
  };

  return (
    <section className="section admin">
      <div className="admin-head">
        <h1>Admin Panel</h1>
        <p className="muted">Full CRUD for categories and products.</p>
        <Link className="btn-link" to="/">
          Open storefront
        </Link>
      </div>

      <div className="admin-grid">
        <div className="card">
          <h2>{editingCategoryId ? "Edit category" : "Create category"}</h2>
          <form className="form" onSubmit={onCategorySubmit}>
            <input
              placeholder="Name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              placeholder="Slug (optional)"
              value={categoryForm.slug}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))}
            />
            <textarea
              placeholder="Description"
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <button type="submit">{editingCategoryId ? "Update" : "Create"}</button>
          </form>

          <div className="list">
            {categories.map((category) => (
              <div key={category.id} className="list-row">
                <div>
                  <strong>{category.name}</strong>
                  <p className="muted">/{category.slug}</p>
                </div>
                <div className="actions">
                  <button type="button" onClick={() => startCategoryEdit(category)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteCategory(category.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>{editingProductId ? "Edit product" : "Create product"}</h2>
          <form className="form" onSubmit={onProductSubmit}>
            <input
              placeholder="Title"
              value={productForm.title}
              onChange={(e) => setProductForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <input
              placeholder="Slug (optional)"
              value={productForm.slug}
              onChange={(e) => setProductForm((prev) => ({ ...prev, slug: e.target.value }))}
            />
            <textarea
              placeholder="Description"
              value={productForm.description}
              onChange={(e) =>
                setProductForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <div className="row2">
              <input
                placeholder="Price"
                type="number"
                value={productForm.price}
                onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))}
              />
              <input
                placeholder="Currency"
                value={productForm.currency}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, currency: e.target.value }))
                }
              />
            </div>
            <div className="row2">
              <input
                placeholder="SKU"
                value={productForm.sku}
                onChange={(e) => setProductForm((prev) => ({ ...prev, sku: e.target.value }))}
              />
              <input
                placeholder="Stock"
                type="number"
                value={productForm.stock}
                onChange={(e) => setProductForm((prev) => ({ ...prev, stock: e.target.value }))}
              />
            </div>
            <input
              placeholder="Image URL"
              value={productForm.imageUrl}
              onChange={(e) => setProductForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
            />
            <select
              value={productForm.categoryId}
              onChange={(e) => setProductForm((prev) => ({ ...prev, categoryId: e.target.value }))}
            >
              <option value="">Choose category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button type="submit">{editingProductId ? "Update" : "Create"}</button>
          </form>

          <div className="list">
            {products.map((product) => (
              <div key={product.id} className="list-row">
                <div>
                  <strong>{product.title}</strong>
                  <p className="muted">
                    {product.price} {product.currency} • {categoryMap[product.categoryId] ?? "Unknown"}
                  </p>
                </div>
                <div className="actions">
                  <button type="button" onClick={() => startProductEdit(product)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteProduct(product.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
