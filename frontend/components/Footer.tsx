import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-[#FAFAFA]">
      <div className="container-app grid gap-8 py-12 sm:grid-cols-3">
        <div>
          <div className="text-lg font-bold">風 Kaze</div>
          <p className="mt-2 text-sm text-muted">
            Японоос Монгол руу найдвартай прокси худалдан авалт ба далайн карго.
          </p>
        </div>
        <div className="text-sm">
          <div className="mb-3 font-semibold">Тусламж</div>
          <ul className="space-y-2 text-muted">
            <li><Link href="/how-it-works" className="hover:text-ink">Хэрхэн ажилладаг</Link></li>
            <li><Link href="/faq" className="hover:text-ink">Түгээмэл асуулт</Link></li>
            <li><Link href="/shipping-info" className="hover:text-ink">Хүргэлтийн мэдээлэл</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="mb-3 font-semibold">Холбоо барих</div>
          <ul className="space-y-2 text-muted">
            <li><a href="https://wa.me/97699000000" className="hover:text-ink">WhatsApp</a></li>
            <li><a href="https://m.me/kazeshop" className="hover:text-ink">Messenger</a></li>
            <li><a href="https://t.me/kazeshop" className="hover:text-ink">Telegram</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Kaze LLC. Бүх эрх хуулиар хамгаалагдсан.
      </div>
    </footer>
  );
}
