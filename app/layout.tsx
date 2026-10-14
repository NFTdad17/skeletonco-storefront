import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Skeleton Co",
    template: "%s | Skeleton Co",
  },
  description: "Printed goods from Skeleton Co.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
