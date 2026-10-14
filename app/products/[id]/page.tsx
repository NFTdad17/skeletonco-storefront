import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { metaDescription } from "@/lib/format";
import { getProduct } from "@/lib/printify";

type ProductRouteProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProductRouteProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return { title: "Product not found" };
  }
  const description = metaDescription(product.description);
  return {
    title: product.title,
    ...(description ? { description } : {}),
  };
}

export default function ProductPage({ params }: ProductRouteProps) {
  return (
    <main id="content" className="product-page">
      <p className="back">
        <Link href="/">Back to shop</Link>
      </p>
      <Suspense fallback={<p className="status">Loading product…</p>}>
        <ProductDetails params={params} />
      </Suspense>
    </main>
  );
}

async function ProductDetails({ params }: ProductRouteProps) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  return <ProductForm product={product} />;
}
