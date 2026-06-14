"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { mnt, jpy } from "@/lib/format";
import { useWishlist } from "./WishlistProvider";

export default function ProductCard({ product }: { product: Product }) {
  const img = product.images[0]?.url;
  const price = product.price;
  const { has, toggle } = useWishlist();
  const saved = has(product.id);

  return (
    <div className="group block">
      <div className="card relative overflow-hidden">
        <button
          onClick={(e) => {
            e.preventDefault();
            toggle(product.id);
          }}
          aria-label={saved ? "Хадгалснаас хасах" : "Хадгалах"}
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm backdrop-blur hover:bg-white"
        >
          <span className={saved ? "text-accent" : "text-muted"}>{saved ? "♥" : "♡"}</span>
        </button>
        <Link href={`/product/${product.id}`}>
          <div className="aspect-square w-full overflow-hidden bg-[#F5F5F5]">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt={product.title_mn}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">Зураггүй</div>
            )}
          </div>
          <div className="p-3">
            {product.brand && (
              <div className="text-[11px] uppercase tracking-wide text-muted">{product.brand}</div>
            )}
            <div className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{product.title_mn}</div>
            {price && (
              <div className="mt-1">
                <div className="text-base font-bold text-ink">{mnt(price.unit_total_mnt)}</div>
                <div className="text-[11px] text-muted">{jpy(price.line_total_jpy)} (бүх төлбөр багтсан)</div>
              </div>
            )}
            {product.reference_price_mnt && price && (
              <div className="mt-1 text-[11px] text-accent">
                Зах зээлд ~{mnt(product.reference_price_mnt)} | Энд {mnt(price.unit_total_mnt)}
              </div>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
