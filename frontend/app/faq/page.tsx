export const metadata = { title: "Түгээмэл асуулт — Kaze Shop" };

const FAQ = [
  { q: "Хүргэлт хэр удах вэ?", a: "Хайрцаг дүүрмэгц (25 кг) далайн каргоор явна. Дунджаар захиалгаас хойш 3-5 долоо хоног." },
  { q: "Төлбөрөө хэрхэн төлөх вэ?", a: "QPay-ээр QR код уншуулан төлнө. Удахгүй LendMN-ийг нэмнэ." },
  { q: "Бараа жинхэнэ үү?", a: "Тийм. Бид зөвхөн албан ёсны Япон дэлгүүр болон Amazon Japan-аас худалдан авдаг." },
  { q: "Үнэд юу багтсан бэ?", a: "Барааны үнэ, үйлчилгээний шимтгэл, бараа авах шимтгэл, хүргэлт бүгд багтсан. Нэмэлт нуугдсан төлбөр байхгүй." },
  { q: "Захиалгаа цуцлах боломжтой юу?", a: "Бид Японоос бараа худалдан авахаас өмнө (PURCHASING_IN_JP төлвөөс өмнө) цуцлах боломжтой." },
  { q: "Хэдэн кг хүртэл захиалж болох вэ?", a: "Нэг хайрцаг 25 кг. Түүнээс их бол хэд хэдэн хайрцагт хуваагдана." },
];

export default function FaqPage() {
  return (
    <div className="container-app max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Түгээмэл асуулт</h1>
      <div className="mt-8 space-y-3">
        {FAQ.map((item, i) => (
          <details key={i} className="card p-5">
            <summary className="cursor-pointer font-medium">{item.q}</summary>
            <p className="mt-2 text-sm text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
