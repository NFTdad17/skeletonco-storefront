import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { ProductCard } from "@/components/product-card";
import { SkellyModel } from "@/components/skelly-model";
import { listProducts } from "@/lib/printify";

export const metadata: Metadata = {
  title: "Shop",
  description: "Printed goods from Skeleton Co.",
};

export default function HomePage() {
  return (
    <>
      <main id="content" className="shop">
        <Suspense fallback={<p className="status">Loading the shop…</p>}>
          <Catalog />
        </Suspense>
      </main>
      <SkellyModel />
    </>
  );
}

async function Catalog() {
  await connection();
  const products = await listProducts();
  if (products.length === 0) {
    return (
      <div className="empty">
        <h2>Nothing is listed right now</h2>
        <p className="muted">
          New pieces will show up here when they&apos;re published in the shop.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
