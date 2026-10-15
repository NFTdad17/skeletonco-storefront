import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { ShopCatalog } from "@/components/shop-catalog";
import { listProducts } from "@/lib/printify";

export const metadata: Metadata = {
  title: "Shop",
  description: "Printed goods from Skeleton Co.",
};

export default function HomePage() {
  return (
    <main id="content" className="shop">
      <Suspense fallback={<p className="status">Loading the shop…</p>}>
        <Catalog />
      </Suspense>
    </main>
  );
}

async function Catalog() {
  await connection();
  const products = await listProducts();
  return <ShopCatalog products={products} />;
}
