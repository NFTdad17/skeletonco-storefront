"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import checkoutLabel from "@/art/checkoututton.webp";
import { SkellyModel } from "@/components/skelly-model";
import logo from "@/art/Logo.webp";
import skellyCheckout from "@/art/skellycheckout.webp";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { MAX_CART_ITEMS, MAX_CART_QUANTITY, clampQuantity, type CartLine } from "@/lib/cart";
import { formatDollars } from "@/lib/format";

const STORAGE_KEY = "synergy-co-cart";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  addItem: (item: CartLine) => void;
  setQuantity: (productId: string, variantId: number, quantity: number) => void;
  removeItem: (productId: string, variantId: number) => void;
  clear: () => void;
  openCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<CartLine>;
  return (
    typeof line.productId === "string" &&
    typeof line.variantId === "number" &&
    typeof line.title === "string" &&
    typeof line.variantTitle === "string" &&
    typeof line.unitAmount === "number" &&
    (typeof line.imageSrc === "string" || line.imageSrc === null) &&
    typeof line.quantity === "number"
  );
}

const EMPTY_CART: CartLine[] = [];
let cartLines: CartLine[] = EMPTY_CART;
let cartLoaded = false;
const cartListeners = new Set<() => void>();

function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CART;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_CART;
    const lines = parsed.filter(isCartLine).slice(0, MAX_CART_ITEMS);
    return lines.length === 0 ? EMPTY_CART : lines;
  } catch {
    return EMPTY_CART;
  }
}

function loadCart() {
  if (cartLoaded || typeof window === "undefined") return;
  cartLines = readCart();
  cartLoaded = true;
}

function subscribeCart(listener: () => void) {
  cartListeners.add(listener);
  return () => {
    cartListeners.delete(listener);
  };
}

function getCartSnapshot() {
  loadCart();
  return cartLines;
}

function getServerCartSnapshot() {
  return EMPTY_CART;
}

function commitCart(next: CartLine[]) {
  cartLines = next.length === 0 ? EMPTY_CART : next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cartLines));
  for (const listener of cartListeners) listener();
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used within CartProvider");
  }
  return value;
}

function RouteSkelly() {
  const pathname = usePathname();
  if (pathname !== "/" && pathname !== "/exclusive-drops" && pathname !== "/about") return null;
  return <SkellyModel />;
}

function HeaderCart({ count, openCart }: { count: number; openCart: () => void }) {
  return (
    <div className="header-mascot">
      <Image src={skellyCheckout} alt="" sizes="(max-width: 48rem) 16vw, 10rem" className="header-mascot-image" />
      <button
        type="button"
        className="cart-button"
        onClick={openCart}
        aria-label={`Checkout, ${count} items`}
      >
        <Image src={checkoutLabel} alt="" sizes="(max-width: 48rem) 12vw, 8rem" className="checkout-label" />
        {count > 0 ? <span className="count">{count}</span> : null}
      </button>
    </div>
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const addItem = useCallback((item: CartLine) => {
    const current = getCartSnapshot();
    const index = current.findIndex(
      (line) => line.productId === item.productId && line.variantId === item.variantId,
    );
    if (index === -1) {
      if (current.length >= MAX_CART_ITEMS) return;
      commitCart([...current, { ...item, quantity: clampQuantity(item.quantity) }]);
      return;
    }
    commitCart(
      current.map((line, lineIndex) =>
        lineIndex === index
          ? { ...item, quantity: clampQuantity(line.quantity + item.quantity) }
          : line,
      ),
    );
  }, []);

  const setQuantity = useCallback((productId: string, variantId: number, quantity: number) => {
    commitCart(
      getCartSnapshot().flatMap((line) => {
        if (line.productId !== productId || line.variantId !== variantId) return [line];
        if (quantity < 1) return [];
        return [{ ...line, quantity: clampQuantity(quantity) }];
      }),
    );
  }, []);

  const removeItem = useCallback((productId: string, variantId: number) => {
    commitCart(
      getCartSnapshot().filter(
        (line) => line.productId !== productId || line.variantId !== variantId,
      ),
    );
  }, []);

  const clear = useCallback(() => {
    commitCart(EMPTY_CART);
  }, []);

  const openCart = useCallback(() => {
    setOpen(true);
  }, []);

  const count = useMemo(
    () => lines.reduce((total, line) => total + line.quantity, 0),
    [lines],
  );
  const subtotal = useMemo(
    () => lines.reduce((total, line) => total + line.unitAmount * line.quantity, 0),
    [lines],
  );

  const value: CartContextValue = {
    lines,
    count,
    addItem,
    setQuantity,
    removeItem,
    clear,
    openCart,
  };

  return (
    <CartContext.Provider value={value}>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Skeleton Co">
          <span className="brand-logo">
            <Image
              src={logo}
              alt=""
              preload
              sizes="(max-width: 48rem) 46vw, 28rem"
              className="brand-logo-image"
            />
          </span>
        </Link>
        <nav className="header-tabs" aria-label="Shop">
          <Link className="header-tab" href="/exclusive-drops">
            Exclusive Drops
          </Link>
          <Link className="header-tab" href="/about">
            About Us
          </Link>
        </nav>
        <div className="header-tools">
          <Suspense fallback={null}>
            <HeaderCart count={count} openCart={openCart} />
          </Suspense>
        </div>
      </header>
      <Suspense fallback={null}>
        <RouteSkelly />
      </Suspense>
      {children}
      <dialog
        ref={dialogRef}
        className="cart-dialog"
        aria-labelledby="cart-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="cart-panel">
          <div className="cart-head">
            <h2 id="cart-title">Cart</h2>
            <button type="button" className="text-button" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          {lines.length === 0 ? (
            <p className="muted">Your cart is empty.</p>
          ) : (
            <>
              <ul className="cart-lines">
                {lines.map((line) => (
                  <li key={`${line.productId}-${line.variantId}`} className="cart-line">
                    {line.imageSrc ? (
                      // Printify returns image URLs from more than one host.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.imageSrc} alt="" className="cart-thumb" />
                    ) : (
                      <span className="cart-thumb cart-thumb-empty" aria-hidden="true" />
                    )}
                    <div className="cart-copy">
                      <p className="cart-name">{line.title}</p>
                      {line.variantTitle ? <p className="muted">{line.variantTitle}</p> : null}
                      <p>{formatDollars(line.unitAmount)}</p>
                      <div className="qty-row">
                        <button
                          type="button"
                          className="text-button"
                          onClick={() =>
                            setQuantity(line.productId, line.variantId, line.quantity - 1)
                          }
                          aria-label={`Decrease quantity of ${line.title}`}
                        >
                          −
                        </button>
                        <span>{line.quantity}</span>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() =>
                            setQuantity(line.productId, line.variantId, line.quantity + 1)
                          }
                          disabled={line.quantity >= MAX_CART_QUANTITY}
                          aria-label={`Increase quantity of ${line.title}`}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => removeItem(line.productId, line.variantId)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="cart-foot">
                <p className="subtotal">
                  <span>Subtotal</span>
                  <span>{formatDollars(subtotal)}</span>
                </p>
                <Link href="/checkout" className="button" onClick={() => setOpen(false)}>
                  Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      </dialog>
    </CartContext.Provider>
  );
}
