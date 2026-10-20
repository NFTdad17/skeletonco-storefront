"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MAX_CART_QUANTITY, clampQuantity } from "@/lib/cart";
import { formatDollars } from "@/lib/format";
import type { ProductImage, ProductView } from "@/lib/product";
import { extraViewSrcs, modelMockupSrc } from "@/lib/model-mockups";
import {
  enabledVariants,
  initialVariant,
  offeredOptions,
  productGallery,
  variantMatching,
} from "@/lib/variants";
import { useCart } from "@/components/cart-provider";
import { HoverZoom } from "@/components/hover-zoom";

export function ProductForm({ product }: { product: ProductView }) {
  const { addItem, openCart } = useCart();
  const starting = initialVariant(product);
  const [selectedIds, setSelectedIds] = useState<number[]>(starting?.optionIds ?? []);
  const [variantId, setVariantId] = useState<number | null>(starting?.id ?? null);
  const [quantity, setQuantity] = useState(1);

  const optionGroups = offeredOptions(product);
  const available = enabledVariants(product);
  const variant = useMemo(() => {
    if (optionGroups.length > 0) {
      return variantMatching(product, selectedIds);
    }
    return available.find((entry) => entry.id === variantId) ?? null;
  }, [available, optionGroups.length, product, selectedIds, variantId]);

  const gallery = useMemo(
    () =>
      productGallery(
        product,
        variant?.id ?? null,
        modelMockupSrc(product.id),
        extraViewSrcs(product.id, variant?.id ?? null),
      ),
    [product, variant?.id],
  );
  const [pickedSrc, setPickedSrc] = useState<string | null>(null);
  const imageSrc = gallery.some((image) => image.src === pickedSrc)
    ? pickedSrc
    : (gallery[0]?.src ?? null);
  const canAdd = variant != null && variant.enabled;

  function choose(valueId: number) {
    const candidates = available.filter((entry) => entry.optionIds.includes(valueId));
    const best = [...candidates].sort((left, right) => {
      const leftOverlap = left.optionIds.filter((id) => selectedIds.includes(id)).length;
      const rightOverlap = right.optionIds.filter((id) => selectedIds.includes(id)).length;
      return rightOverlap - leftOverlap;
    })[0];
    if (best) {
      setSelectedIds(best.optionIds);
      setPickedSrc(null);
    }
  }

  function addToCart() {
    if (!variant) return;
    addItem({
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      variantTitle: variant.title,
      unitAmount: variant.price,
      imageSrc,
      quantity: clampQuantity(quantity),
    });
    openCart();
  }

  return (
    <div className="product-layout">
      <div className="hero-stage">
        {imageSrc ? (
          <HoverZoom key={imageSrc} src={imageSrc} alt={product.title} className="hero" />
        ) : (
          <div className="hero hero-empty" role="img" aria-label={`${product.title}, no image yet`} />
        )}
        {gallery.length > 0 && imageSrc ? (
          <MockupCarousel
            images={gallery}
            title={product.title}
            selected={imageSrc}
            onSelect={setPickedSrc}
          />
        ) : null}
      </div>
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
                onChange={(event) => {
                  setVariantId(Number(event.target.value));
                  setPickedSrc(null);
                }}
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

function MockupCarousel({
  images,
  title,
  selected,
  onSelect,
}: {
  images: ProductImage[];
  title: string;
  selected: string;
  onSelect: (src: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(
    0,
    images.findIndex((image) => image.src === selected),
  );

  useEffect(() => {
    const track = trackRef.current;
    const thumb = track?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!track || !thumb) return;
    const left = thumb.offsetLeft - (track.clientWidth - thumb.offsetWidth) / 2;
    track.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [selected, images]);

  function step(direction: -1 | 1) {
    const next = images[selectedIndex + direction];
    if (next) onSelect(next.src);
  }

  return (
    <div className="mockup-carousel">
      <button
        type="button"
        className="mockup-arrow mockup-arrow-back"
        aria-label="Previous image"
        disabled={selectedIndex <= 0}
        onClick={() => step(-1)}
      >
        ‹
      </button>
      <button
        type="button"
        className="mockup-arrow mockup-arrow-forward"
        aria-label="Next image"
        disabled={selectedIndex >= images.length - 1}
        onClick={() => step(1)}
      >
        ›
      </button>
      <div className="mockup-track" ref={trackRef}>
        {images.map((image, index) => {
          const pressed = image.src === selected;
          return (
            <button
              key={`${image.src}-${index}`}
              type="button"
              className="mockup-thumb"
              aria-pressed={pressed}
              aria-label={`${title} mockup ${index + 1}`}
              onClick={() => onSelect(image.src)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt="" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
