"use client";

import { useMemo, useState } from "react";
import { MAX_CART_QUANTITY, clampQuantity } from "@/lib/cart";
import { formatDollars } from "@/lib/format";
import type { ProductView } from "@/lib/product";
import {
  enabledVariants,
  imageForVariant,
  initialVariant,
  variantMatching,
} from "@/lib/variants";
import { useCart } from "@/components/cart-provider";

export function ProductForm({ product }: { product: ProductView }) {
  const { addItem, openCart } = useCart();
  const starting = initialVariant(product);
  const [selectedIds, setSelectedIds] = useState<number[]>(starting?.optionIds ?? []);
  const [variantId, setVariantId] = useState<number | null>(starting?.id ?? null);
  const [quantity, setQuantity] = useState(1);

  const optionGroups = product.options.filter((option) => option.values.length > 0);
  const available = enabledVariants(product);
  const variant = useMemo(() => {
    if (optionGroups.length > 0) {
      return variantMatching(product, selectedIds);
    }
    return available.find((entry) => entry.id === variantId) ?? null;
  }, [available, optionGroups.length, product, selectedIds, variantId]);

  const imageSrc = imageForVariant(product, variant?.id ?? null);
  const canAdd = variant != null && variant.enabled;

  function choose(valueId: number) {
    const candidates = available.filter((entry) => entry.optionIds.includes(valueId));
    const best = [...candidates].sort((left, right) => {
      const leftOverlap = left.optionIds.filter((id) => selectedIds.includes(id)).length;
      const rightOverlap = right.optionIds.filter((id) => selectedIds.includes(id)).length;
      return rightOverlap - leftOverlap;
    })[0];
    if (best) setSelectedIds(best.optionIds);
  }

  function addToCart() {
    if (!variant) return;
    addItem({
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      variantTitle: variant.title,
      unitAmount: variant.price,
      imageSrc: imageForVariant(product, variant.id),
      quantity: clampQuantity(quantity),
    });
    openCart();
  }

  return (
    <div className="product-layout">
      {imageSrc ? (
        // Printify returns image URLs from more than one host.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt={product.title} className="hero" />
      ) : (
        <div className="hero hero-empty" role="img" aria-label={`${product.title}, no image yet`} />
      )}
      <div className="product-copy">
        <h1>{product.title}</h1>
        <p className="price">{variant ? formatDollars(variant.price) : "Unavailable"}</p>
        {product.description ? <p className="description">{product.description}</p> : null}
        <form
          className="product-form"
          onSubmit={(event) => {
            event.preventDefault();
            addToCart();
          }}
        >
          {optionGroups.length > 0
            ? optionGroups.map((option) => (
                <fieldset key={option.name}>
                  <legend>{option.name}</legend>
                  <div className="choice-row">
                    {option.values.map((value) => {
                      const allowed = available.some((entry) => entry.optionIds.includes(value.id));
                      return (
                        <button
                          key={value.id}
                          type="button"
                          className="choice"
                          aria-pressed={selectedIds.includes(value.id)}
                          disabled={!allowed}
                          onClick={() => choose(value.id)}
                        >
                          {value.colors[0] ? (
                            <span
                              className="swatch"
                              style={{ background: value.colors[0] }}
                              aria-hidden="true"
                            />
                          ) : null}
                          {value.title}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))
            : null}
          {optionGroups.length === 0 && available.length > 1 ? (
            <label className="field">
              Variant
              <select
                value={variant?.id ?? ""}
                onChange={(event) => setVariantId(Number(event.target.value))}
              >
                {available.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.title || "Standard"}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {optionGroups.length === 0 && available.length === 1 && available[0]?.title ? (
            <p className="muted">{available[0].title}</p>
          ) : null}
          <label className="field">
            Quantity
            <input
              className="qty"
              type="number"
              min={1}
              max={MAX_CART_QUANTITY}
              value={quantity}
              onChange={(event) => setQuantity(clampQuantity(Number(event.target.value)))}
            />
          </label>
          <button type="submit" className="button" disabled={!canAdd}>
            Add to cart
          </button>
          {!canAdd ? <p className="muted">This piece isn&apos;t available to order right now.</p> : null}
        </form>
      </div>
    </div>
  );
}
