import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClearCart } from "@/components/clear-cart";

export const metadata: Metadata = {
  title: "Payment received",
  robots: { index: false, follow: false },
};

type SuccessProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default function SuccessPage({ searchParams }: SuccessProps) {
  return (
    <main id="content" className="success">
      <h1>Payment received</h1>
      <p className="muted">Thanks for shopping with Skeleton Co. Your payment went through.</p>
      <Link href="/" className="button link-button">
        Back to the shop
      </Link>
      <Suspense fallback={null}>
        <PaidReturn searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function PaidReturn({ searchParams }: SuccessProps) {
  const params = await searchParams;
  if (!params.session_id) return null;
  return <ClearCart />;
}
