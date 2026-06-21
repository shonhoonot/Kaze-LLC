import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/components/CartProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Kaze Shop — Японоос Монгол руу",
  description:
    "Япон бараагаа (Amazon Japan, Uniqlo, GU) шууд захиалж, Kaze LLC-ээр дамжуулан Монголд хүлээн аваарай. Жинхэнэ бараа, ил тод үнэ, дугаар хөтлөлт.",
  openGraph: {
    title: "Kaze Shop",
    description: "Японоос Монгол руу — найдвартай прокси худалдан авалт ба карго.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body>
        <AuthProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
