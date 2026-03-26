import { Link } from "react-router-dom";
import { useCatalog } from "../shared/catalog-context";

export function HomePage() {
  const { categories, products } = useCatalog();

  return (
    <section className="section">
      <h1>Products</h1>
      <p className="muted">Browse categories and open product details.</p>

      <div className="category-list">
        {categories.map((category) => (
          <Link key={category.id} to={`/category/${category.slug}`} className="tag">
            {category.name}
          </Link>
        ))}
      </div>

      <div className="product-grid">
        {products.map((product) => (
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
