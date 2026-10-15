import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Small town artists from the Black Hills making rugs and custom mirrors.",
};

export default function AboutPage() {
  return (
    <main id="content" className="shop info-page">
      <h1>About Us</h1>
      <p className="muted">
        We&apos;re a couple of small town artists from the Black Hills trying to grow Skeleton Co
        any way we can. Rug making and custom mirrors are our things and we&apos;re just getting
        started. Every order means a lot to us.
      </p>
    </main>
  );
}
