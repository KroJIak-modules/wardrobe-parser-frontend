import { Link, useParams } from "react-router-dom";
import { useLiveData } from "../shared/live-data-context";
import { toSlug } from "../shared/utils";

export function ProductPage() {
  const { id } = useParams();
  const { categories, products } = useLiveData();

  const product = products.find((item) => item.id === Number(id));

  if (!product) {
    return <p>Product not found.</p>;
  }

  const category = categories.find((item) => item.slug === toSlug(product.product_type || "Other"));

  return (
    <article className="section detail">
      <div className="detail-image detail-image--placeholder">No image</div>
      <div>
        <h1>{product.title}</h1>
        <p className="muted">Handle: {product.handle}</p>
        <p className="muted">Brand: {product.vendor || "-"}</p>
        <p className="muted">Status: {product.status}</p>
        <p className="muted">Images: {product.image_count}</p>
        <p className="muted">Category: {category?.name ?? "Unknown"}</p>
        <p className="price">
          {product.price} {product.currency}
        </p>
        <p className="muted">Updated: {new Date(product.updated_at).toLocaleString()}</p>
        <a className="btn-link" href={product.url} target="_blank" rel="noreferrer">
          Open source page
        </a>
        {category ? (
          <Link className="btn-link" to={`/category/${category.slug}`}>
            More from this category
          </Link>
        ) : null}
      </div>
    </article>
  );
}
