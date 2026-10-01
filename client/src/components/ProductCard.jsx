import { useState } from "react";

const formatPrice = (priceMinor) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(priceMinor / 100);

export default function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false);

  const showImage = product.image_url && !imageFailed;

  return (
    <article className="product-card">
      <div className="product-card__image">
        {showImage ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="product-card__placeholder">
            JUWALE
          </span>
        )}
      </div>

      <div className="product-card__content">
        <h2>{product.name}</h2>

        <p className="product-card__description">
          {product.description}
        </p>

        <p className="product-card__price">
          {formatPrice(product.price_minor)}
        </p>

        <p
          className={
            product.stock > 0
              ? "product-card__stock"
              : "product-card__stock product-card__stock--empty"
          }
        >
          {product.stock > 0
            ? `${product.stock} in stock`
            : "Out of stock"}
        </p>
      </div>
    </article>
  );
}