import { Link, useParams } from "react-router-dom";
import { useCatalog } from "../shared/catalog-context";

export function CategoryPage() {
  const { slug } = useParams();
  const { categories, products } = useCatalog();

  const category = categories.find((item) => item.slug === slug);
  const filtered = category
    ? products.filter((product) => product.categoryId === category.id)
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
            <img src={product.imageUrl} alt={product.title} className="thumb" />
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
