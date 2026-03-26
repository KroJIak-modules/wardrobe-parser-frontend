import { Link, useParams } from "react-router-dom";
import { useLiveData } from "../shared/live-data-context";
import { toSlug } from "../shared/utils";

export function CategoryPage() {
  const { slug } = useParams();
  const { categories, products } = useLiveData();

  const category = categories.find((item) => item.slug === slug);
  const filtered = category
    ? products.filter((product) => toSlug(product.product_type || "Other") === category.slug)
    : [];

  if (!category) {
    return <p>Category not found.</p>;
  }

  return (
    <section className="section">
      <h1>{category.name}</h1>
      <p className="muted">{category.description}</p>

      <div className="product-grid">
        {filtered.map((product) => (
          <article key={product.id} className="card">
            <div className="thumb thumb--placeholder">No image</div>
            <h3>{product.title}</h3>
            <p className="muted">
              {product.price} {product.currency}
            </p>
            <Link to={`/product/${product.id}`} className="btn-link">
              Open
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
