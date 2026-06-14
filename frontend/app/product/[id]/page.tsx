"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Api, getToken } from "@/lib/api";
import type { Product } from "@/lib/types";
import { mnt, jpy, kg } from "@/lib/format";
import { useCart } from "@/components/CartProvider";
import { useWishlist } from "@/components/WishlistProvider";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { refresh } = useCart();
  const { has, toggle } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    Api.product(params.id).then(setProduct).catch(() => setProduct(null));
  }, [params.id]);

  if (!product) {
    return <div className="container-app py-20 text-center text-muted">Ачааллаж байна...</div>;
  }

  const price = product.price!;

  async function addToCart() {
    if (!getToken()) {
      router.push("/login?next=/product/" + params.id);
      return;
    }
    setAdding(true);
    try {
      await Api.addToCart(product!.id, qty, note || undefined);
      await refresh();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="container-app grid gap-10 py-8 md:grid-cols-2">
      {/* gallery */}
      <div>
        <div className="aspect-square w-full overflow-hidden rounded-2xl bg-[#F5F5F5]">
          {product.images[activeImg] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[activeImg].url} alt={product.title_mn} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">Зураггүй</div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {product.images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImg(i)}
                className={`h-16 w-16 overflow-hidden rounded-lg border ${i === activeImg ? "border-ink" : "border-line"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* info */}
      <div>
        {product.brand && <div className="text-sm uppercase tracking-wide text-muted">{product.brand}</div>}
        <h1 className="mt-1 text-2xl font-bold">{product.title_mn}</h1>
        {product.title_ja && <p className="text-sm text-muted">{product.title_ja}</p>}

        <div className="mt-5 text-3xl font-bold">{mnt(price.unit_total_mnt)}</div>
        <div className="text-sm text-muted">{jpy(price.line_total_jpy)} — бүх төлбөр багтсан</div>

        {/* transparent price breakdown */}
        <div className="card mt-5 p-4 text-sm">
          <div className="mb-2 font-semibold">Үнийн задаргаа</div>
          <Row label="Барааны үнэ" value={jpy(price.base_price_jpy)} />
          <Row label="Үйлчилгээний шимтгэл" value={jpy(price.markup_jpy)} />
          <Row label="Бараа авах шимтгэл" value={jpy(price.service_fee_jpy)} />
          <Row label={`Хүргэлт (${kg(product.weight_grams)})`} value={jpy(price.shipping_fee_jpy)} />
          <div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold">
            <span>Нийт (1 ширхэг)</span>
            <span>{mnt(price.unit_total_mnt)}</span>
          </div>
        </div>

        {product.reference_price_mnt && (
          <div className="mt-3 rounded-xl bg-accent-light px-4 py-2 text-sm text-accent-dark">
            Монголын зах зээлд ~{mnt(product.reference_price_mnt)} | Энд {mnt(price.unit_total_mnt)}
          </div>
        )}

        {/* qty + bag note */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-full border border-line">
            <button className="px-4 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span className="w-8 text-center">{qty}</span>
            <button className="px-4 py-2" onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
          <span className="text-xs text-muted">{product.in_stock ? "Захиалга авах боломжтой" : "Дууссан"}</span>
        </div>

        <textarea
          className="input mt-3"
          rows={2}
          placeholder="Уутны тэмдэглэл (өнгө, размер гэх мэт)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="mt-4 flex gap-3">
          <button onClick={addToCart} disabled={adding} className="btn-primary flex-1">
            {added ? "Сагсанд нэмэгдлээ ✓" : adding ? "Нэмж байна..." : "Сагсанд нэмэх"}
          </button>
          <button
            onClick={() => toggle(product.id)}
            aria-label="Хадгалах"
            className="btn-outline px-5 text-lg"
          >
            <span className={has(product.id) ? "text-accent" : "text-muted"}>
              {has(product.id) ? "♥" : "♡"}
            </span>
          </button>
        </div>

        {product.source_url && (
          <a href={product.source_url} target="_blank" rel="noreferrer" className="mt-3 block text-center text-xs text-muted underline">
            Эх сурвалж ({product.source})
          </a>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5 text-muted">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
