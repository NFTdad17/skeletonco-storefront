import Link from "next/link";
import type { ProductSummary } from "@/lib/product";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link href={`/products/${encodeURIComponent(product.id)}`} className="card">
      {product.imageSrc ? (
        // Printify returns image URLs from more than one host.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.imageSrc} alt="" className="card-image" />
      ) : (
        <span className="card-image card-image-empty" aria-hidden="true" />
      )}
      <span className="card-copy">
        <span className="card-title">{product.title}</span>
        {product.priceLabel ? <span className="muted">{product.priceLabel}</span> : null}
      </span>
    </Link>
  );
}
