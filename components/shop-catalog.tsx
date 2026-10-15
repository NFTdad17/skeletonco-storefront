"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { ProductCategory, ProductSummary } from "@/lib/product";

const TABS: { id: "all" | ProductCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "tees", label: "Tees" },
  { id: "long-sleeves", label: "Long Sleeves" },
  { id: "jackets", label: "Jackets" },
  { id: "headwear", label: "Headwear" },
  { id: "miscellaneous", label: "Miscellaneous" },
];

type PriceSort = "low-high" | "high-low";

function comparePrice(left: number | null, right: number | null, sort: PriceSort) {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return sort === "low-high" ? left - right : right - left;
}

export function ShopCatalog({ products }: { products: ProductSummary[] }) {
  const [category, setCategory] = useState<(typeof TABS)[number]["id"]>("all");
  const [sort, setSort] = useState<PriceSort>("low-high");
  const filtered =
    category === "all" ? products : products.filter((product) => product.category === category);
  const visible = [...filtered].sort((left, right) => comparePrice(left.price, right.price, sort));
  const selected = TABS.find((tab) => tab.id === category) ?? TABS[0];

  return (
    <>
      <div className="category-bar">
        <div className="category-tabs" role="group" aria-label="Filter products">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="category-tab"
              aria-pressed={category === tab.id}
              onClick={() => setCategory(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="category-sort">
          <select
            aria-label="Sort by price"
            value={sort}
            onChange={(event) => setSort(event.target.value as PriceSort)}
          >
            <option value="low-high">Low to high</option>
            <option value="high-low">High to low</option>
          </select>
        </label>
      </div>
      {visible.length === 0 ? (
        category === "all" ? (
          <div className="empty">
            <h2>Nothing is listed right now</h2>
            <p className="muted">
              New pieces will show up here when they&apos;re published in the shop.
            </p>
          </div>
        ) : (
          <p className="status">Nothing in {selected.label} right now.</p>
        )
      ) : (
        <ul className="grid">
          {visible.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
