"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { mnt } from "@/lib/format";

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !getToken()) router.push("/login?next=/account");
  }, [loading, router]);

  if (loading || !user) return <div className="container-app py-20 text-center text-muted">Ачааллаж байна...</div>;

  return (
    <div className="container-app max-w-2xl py-8">
      <h1 className="mb-5 text-2xl font-bold">Миний профайл</h1>

      <div className="card space-y-2 p-5">
        <Field label="Нэр" value={user.name || "—"} />
        <Field label="Утас" value={user.phone} />
        <Field label="И-мэйл" value={user.email || "—"} />
        <Field label="Хот / Дүүрэг" value={[user.city, user.district].filter(Boolean).join(", ") || "—"} />
        <Field label="Хаяг" value={user.default_address || "—"} />
      </div>

      <div className="card mt-4 p-5">
        <h2 className="font-semibold">Урилгын код</h2>
        <p className="mt-1 text-sm text-muted">
          Найзаа урих кодоо хуваалцаарай. Найз тань үйлчилгээний шимтгэлийн хөнгөлөлт авах ба та урамшуулал авна.
        </p>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-[#FAFAFA] px-4 py-3">
          <span className="font-mono text-lg font-bold tracking-widest">{user.referral_code || "—"}</span>
          <span className="text-sm text-muted">Урамшуулал: {mnt(user.referral_credit_jpy * 22.5)}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Link href="/orders" className="btn-outline">Захиалгын түүх</Link>
        <button onClick={logout} className="btn-outline text-accent">Гарах</button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line py-2 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
