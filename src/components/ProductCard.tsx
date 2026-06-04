import Link from "next/link";
import type { Product } from "@/types/product";
import { DEFAULT_PRODUCT_IMAGE, productCoverPath } from "@/lib/assets";
import { FallbackImage } from "@/components/FallbackImage";
import { RatingStars } from "@/components/RatingStars";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const approvedReviews = product.reviews.filter((review) => review.approved);

  return (
    <Link className="card product-card" href={`/products/${product.slug}`}>
      <div className="product-card-media">
        <FallbackImage
          src={productCoverPath(product)}
          fallbackSrc={DEFAULT_PRODUCT_IMAGE}
          alt={product.name}
          width={600}
          height={600}
        />
        {product.badge ? <span className="badge">{product.badge}</span> : null}
      </div>
      <div className="product-card-body">
        <div>
          <h3>{product.name}</h3>
          <p className="muted" style={{ marginTop: 8 }}>{product.description}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span>
            <RatingStars rating={product.rating} />
          </span>
          <span className="muted" style={{ fontSize: 13 }}>
            {product.rating.toFixed(1)} ({approvedReviews.length})
          </span>
        </div>
      </div>
    </Link>
  );
}
