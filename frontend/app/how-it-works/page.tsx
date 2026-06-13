import Link from "next/link";

export const metadata = { title: "Хэрхэн ажилладаг вэ? — Kaze Shop" };

const STEPS = [
  { n: 1, icon: "🛍️", title: "Сонгох", text: "Япон бараагаа (Amazon JP, Uniqlo, GU) сонгож сагсандаа нэмээд захиална." },
  { n: 2, icon: "🇯🇵", title: "Бид Японоос авна", text: "Kaze LLC Японд бараагаа худалдан авч, агуулахдаа хүлээн авч, таны нэр дээр тусдаа уутанд савлана." },
  { n: 3, icon: "🚢", title: "Монголд хүргэнэ", text: "Уутнуудыг 25 кг хайрцагт нэгтгэн далайн каргоор Монгол руу илгээж, танд хүргэнэ." },
];

export default function HowItWorksPage() {
  return (
    <div className="container-app max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Хэрхэн ажилладаг вэ?</h1>
      <p className="mt-2 text-muted">Гурван энгийн алхамаар Япон бараагаа Монголд аваарай.</p>

      <div className="mt-8 space-y-6">
        {STEPS.map((s) => (
          <div key={s.n} className="card flex items-start gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-light text-2xl">
              {s.icon}
            </div>
            <div>
              <div className="text-sm font-semibold text-accent">Алхам {s.n}</div>
              <h2 className="text-lg font-bold">{s.title}</h2>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-[#FAFAFA] p-6">
        <h2 className="font-bold">Үнэ хэрхэн тооцогддог вэ?</h2>
        <p className="mt-2 text-sm text-muted">
          Барааны үнэ + үйлчилгээний шимтгэл (10%) + бараа авах шимтгэл (барааны тоогоор) +
          жинд суурилсан хүргэлтийн төлбөр. Бүх төлбөр ил тод, барааны хуудсан дээр харагдана.
        </p>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="btn-primary">Бараа үзэх</Link>
      </div>
    </div>
  );
}
