import { Link } from "react-router-dom";
import { useLiveData } from "../shared/live-data-context";

export function HomePage() {
  const { categories, products, loading, error } = useLiveData();

  return (
    <section className="section">
      <h1>Products</h1>
      <p className="muted">Real parser products from service API.</p>

      {loading ? <p className="muted">Loading...</p> : null}
      {error ? <p className="muted">Error: {error}</p> : null}

      <div className="category-list">
        {categories.map((category) => (
          <Link key={category.slug} to={`/category/${category.slug}`} className="tag">
            {category.name} ({category.count})
          </Link>
        ))}
      </div>

      <div className="product-grid">
        {products.map((product) => (
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
