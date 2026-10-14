"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { CheckoutItem } from "@/lib/cart";
import { formatDollars } from "@/lib/format";
import { parseShippingAddress } from "@/lib/shipping";
import { useCart } from "@/components/cart-provider";

const emptyShipping = {
  name: "",
  address1: "",
  city: "",
  region: "",
  zip: "",
  country: "",
};

export function CheckoutForm() {
  const { lines } = useCart();
  const [shipping, setShipping] = useState(emptyShipping);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const subtotal = lines.reduce((total, line) => total + line.unitAmount * line.quantity, 0);

  function update(field: keyof typeof emptyShipping, value: string) {
    setShipping((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || lines.length === 0) return;
    const address = parseShippingAddress(shipping);
    if (!address) {
      setError("Enter a complete shipping address. Country is a two-letter code.");
      return;
    }
    setPending(true);
    setError(null);
    const items: CheckoutItem[] = lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
    }));
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, shipping: address }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || typeof payload.url !== "string") {
        setError(payload.error ?? "Checkout didn't start. Please try again.");
        setPending(false);
        return;
      }
      window.location.assign(payload.url);
    } catch {
      setError("Checkout didn't start. Please try again.");
      setPending(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="empty">
        <p>Your cart is empty.</p>
        <Link href="/" className="button link-button">
          Back to the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-layout">
      <ul className="checkout-lines">
        {lines.map((line) => (
          <li key={`${line.productId}-${line.variantId}`}>
            <span>
              {line.title}
              {line.variantTitle ? ` / ${line.variantTitle}` : ""} × {line.quantity}
            </span>
            <span>{formatDollars(line.unitAmount * line.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="subtotal">
        <span>Subtotal</span>
        <span>{formatDollars(subtotal)}</span>
      </p>
      <form className="product-form" onSubmit={submit}>
        <h2>Shipping address</h2>
        <label className="field">
          Name
          <input
            className="text-input"
            name="name"
            autoComplete="name"
            required
            value={shipping.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </label>
        <label className="field">
          Street address
          <input
            className="text-input"
            name="address1"
            autoComplete="address-line1"
            required
            value={shipping.address1}
            onChange={(event) => update("address1", event.target.value)}
          />
        </label>
        <div className="address-row">
          <label className="field">
            City
            <input
              className="text-input"
              name="city"
              autoComplete="address-level2"
              required
              value={shipping.city}
              onChange={(event) => update("city", event.target.value)}
            />
          </label>
          <label className="field">
            State
            <input
              className="text-input"
              name="region"
              autoComplete="address-level1"
              required
              value={shipping.region}
              onChange={(event) => update("region", event.target.value)}
            />
          </label>
          <label className="field">
            ZIP
            <input
              className="text-input"
              name="zip"
              autoComplete="postal-code"
              required
              value={shipping.zip}
              onChange={(event) => update("zip", event.target.value)}
            />
          </label>
        </div>
        <label className="field">
          Country
          <input
            className="text-input country-input"
            name="country"
            autoComplete="country"
            required
            maxLength={2}
            placeholder="US"
            value={shipping.country}
            onChange={(event) => update("country", event.target.value.toUpperCase())}
          />
          <span className="muted">Two-letter code, such as US.</span>
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" className="button" disabled={pending}>
          {pending ? "Starting checkout…" : "Continue to payment"}
        </button>
      </form>
    </div>
  );
}
