"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Api, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { mnt } from "@/lib/format";
import AddressBook from "@/components/AddressBook";

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, loading, refresh } = useAuth();
  const [copied, setCopied] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", city: "", district: "", default_address: "" });

  useEffect(() => {
    if (!loading && !getToken()) router.push("/login?next=/account");
  }, [loading, router]);

  function startEdit() {
    if (!user) return;
    setError("");
    setForm({
      name: user.name || "",
      email: user.email || "",
      city: user.city || "",
      district: user.district || "",
      default_address: user.default_address || "",
    });
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      await Api.updateProfile({
        name: form.name || null,
        email: form.email || null,
        city: form.city || null,
        district: form.district || null,
        default_address: form.default_address || null,
      });
      await refresh();
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) return <div className="container-app py-20 text-center text-muted">Ачааллаж байна...</div>;

  const referralLink =
    typeof window !== "undefined" && user.referral_code
      ? `${window.location.origin}/login?ref=${user.referral_code}`
      : "";

  async function copyLink() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="container-app max-w-2xl py-8">
      <h1 className="mb-5 text-2xl font-bold">Миний профайл</h1>

      <div className="card p-5">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted">Нэр</label>
              <input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted">И-мэйл</label>
              <input className="input mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted">Хот / аймаг</label>
                <input className="input mt-1" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted">Дүүрэг</label>
                <input className="input mt-1" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted">Үндсэн хаяг</label>
              <textarea className="input mt-1" rows={2} value={form.default_address} onChange={(e) => setForm({ ...form, default_address: e.target.value })} />
            </div>
            {error && <p className="text-sm text-accent">{error}</p>}
            <div className="flex gap-2">
              <button className="btn-primary px-5 py-2 text-sm" onClick={save} disabled={saving}>
                {saving ? "Хадгалж байна..." : "Хадгалах"}
              </button>
              <button className="btn-outline px-4 py-2 text-sm" onClick={() => setEditing(false)} disabled={saving}>
                Болих
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-semibold">Хувийн мэдээлэл</span>
              <button className="text-xs text-accent hover:underline" onClick={startEdit}>Засах</button>
            </div>
            <div className="space-y-2">
              <Field label="Нэр" value={user.name || "—"} />
              <Field label="Утас" value={user.phone || "—"} />
              <Field label="И-мэйл" value={user.email || "—"} />
              <Field label="Хот / Дүүрэг" value={[user.city, user.district].filter(Boolean).join(", ") || "—"} />
              <Field label="Хаяг" value={user.default_address || "—"} />
            </div>
          </>
        )}
      </div>

      <AddressBook />

      <div className="card mt-4 p-5">
        <h2 className="font-semibold">Урилгын код</h2>
        <p className="mt-1 text-sm text-muted">
          Найзаа урих кодоо хуваалцаарай. Найз тань үйлчилгээний шимтгэлийн хөнгөлөлт авах ба та урамшуулал авна.
        </p>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-[#FAFAFA] px-4 py-3">
          <span className="font-mono text-lg font-bold tracking-widest">{user.referral_code || "—"}</span>
          <span className="text-sm text-muted">Урамшуулал: {mnt(user.referral_credit_jpy * 22.5)}</span>
        </div>
        {referralLink && (
          <div className="mt-3 space-y-2">
            <div className="truncate rounded-xl border border-line px-4 py-3 text-xs text-muted">{referralLink}</div>
            <div className="flex gap-2">
              <button className="btn-outline flex-1 py-2 text-sm" onClick={copyLink}>
                {copied ? "Хуулагдлаа ✓" : "Линк хуулах"}
              </button>
              <a
                className="btn-outline flex-1 py-2 text-sm"
                href={`https://wa.me/?text=${encodeURIComponent("Kaze Shop-оос Япон бараа захиал! " + referralLink)}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp-аар илгээх
              </a>
            </div>
          </div>
        )}
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
