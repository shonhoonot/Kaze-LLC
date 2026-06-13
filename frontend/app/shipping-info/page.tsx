export const metadata = { title: "Хүргэлтийн мэдээлэл — Kaze Shop" };

export default function ShippingInfoPage() {
  return (
    <div className="container-app max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Хүргэлтийн мэдээлэл</h1>

      <div className="mt-6 space-y-4 text-sm text-muted">
        <Section title="Тээврийн арга">
          Япон → Монгол далайн карго. Бараа Японы агуулахад хүлээн авагдаж, таны нэр дээр
          тусдаа уутанд савлагдаж, 25 кг хайрцагт нэгтгэгдэн илгээгдэнэ.
        </Section>
        <Section title="Хугацаа">
          Хайрцаг дүүрмэгц явна. Захиалгаас Монголд хүрэх хүртэл дунджаар 3-5 долоо хоног.
          Нүүр хуудсан дээрх ачааны хайрцгийн дүүргэлтийг хараарай.
        </Section>
        <Section title="Хүргэлтийн төлбөр">
          Жинд суурилсан: 1 кг тутамд тогтсон тариф. Барааны жинг харгалзан үнийн задаргаанд харагдана.
        </Section>
        <Section title="Авах / хүргүүлэх">
          Монголд ирсний дараа таны хаягаар хүргэх эсвэл салбараас авах боломжтой.
          Захиалгын төлвийг бодит хугацаанд хянаж болно.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-ink">{title}</h2>
      <p className="mt-2">{children}</p>
    </div>
  );
}
