import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exclusive Drops",
  description: "Limited Skeleton Co pieces, released in small runs.",
};

export default function ExclusiveDropsPage() {
  return (
    <main id="content" className="shop info-page">
      <h1>Exclusive Drops</h1>
      <p className="muted">Limited pieces show up here when a drop goes live.</p>
    </main>
  );
}
