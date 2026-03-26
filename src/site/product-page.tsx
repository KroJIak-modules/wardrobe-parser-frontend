import { Link, useParams } from "react-router-dom";
import { useCatalog } from "../shared/catalog-context";

export function ProductPage() {
  const { id } = useParams();
  const { categories, products } = useCatalog();

  const product = products.find((item) => item.id === Number(id));

  if (!product) {
    return <p>Product not found.</p>;
  }

  const category = categories.find((item) => item.id === product.categoryId);

  return (
    <article className="section detail">
      <img src={product.imageUrl} alt={product.title} className="detail-image" />
      <div>
        <h1>{product.title}</h1>
        <p className="muted">SKU: {product.sku}</p>
        <p className="muted">Category: {category?.name ?? "Unknown"}</p>
        <p className="price">
          {product.price} {product.currency}
        </p>
        <p>{product.description}</p>
        <p className="muted">Stock: {product.stock}</p>
        {category ? (
          <Link className="btn-link" to={`/category/${category.slug}`}>
            More from this category
          </Link>
        ) : null}
      </div>
    </article>
  );
}
