import Link from "next/link";

import type { ProductCardData } from "@/content/types";

export default function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <div className="item product-col col-6 col-md-4 col-lg-15">
      <div className="item_product_main">
        <div className="product-thumbnail pos-relative">
          <Link
            className="image_thumb pos-relative embed-responsive embed-responsive-1by1"
            href={product.href}
            title={product.title}
          >
            {product.imageUrl ? (
              <img
                loading="lazy"
                className="img-fetured"
                width={480}
                height={480}
                style={{ ["--image-scale" as never]: 1 }}
                src={product.imageUrl}
                alt={product.imageAlt}
              />
            ) : null}
          </Link>
        </div>

        <div className="product-info">
          {product.vendor ? <span className="product-vendor">{product.vendor}</span> : null}
          <span className="product-name">
            <Link className="link line-clamp-2" href={product.href} title={product.title}>
              {product.title}
            </Link>
          </span>
          <div className="product-item-cta position-relative">
            <div className="price-box">
              <span className="price">{product.price}</span>
              {product.comparePrice ? <span className="compare-price">{product.comparePrice}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
