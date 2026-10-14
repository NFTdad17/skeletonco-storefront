import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main id="content" className="empty">
      <h1>That page isn&apos;t here</h1>
      <p className="muted">The product may have been removed, or the link is out of date.</p>
      <Link href="/" className="button link-button">
        Back to the shop
      </Link>
    </main>
  );
}
