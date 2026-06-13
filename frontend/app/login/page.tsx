"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";
  const { login } = useAuth();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestOtp() {
    setError("");
    setBusy(true);
    try {
      const res = await Api.requestOtp(phone);
      setDevCode(res.dev_code);
      setStep("code");
    } catch (e) {
      setError("Код илгээхэд алдаа гарлаа. Дугаараа шалгана уу.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setError("");
    setBusy(true);
    try {
      const res = await Api.verifyOtp(phone, code, name || undefined);
      login(res.access_token, res.user);
      router.push(next);
    } catch {
      setError("Код буруу эсвэл хугацаа дууссан байна.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-app flex justify-center py-16">
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-xl font-bold">Нэвтрэх / Бүртгүүлэх</h1>
        <p className="mt-1 text-sm text-muted">Утасны дугаараар нэвтэрнэ үү (+976).</p>

        {step === "phone" ? (
          <div className="mt-5 space-y-3">
            <input
              className="input"
              placeholder="Нэр (заавал биш)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input"
              placeholder="99112233"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button className="btn-primary w-full" onClick={requestOtp} disabled={busy || !phone}>
              {busy ? "Илгээж байна..." : "Код авах"}
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {devCode && (
              <div className="rounded-lg bg-accent-light px-3 py-2 text-xs text-accent-dark">
                Хөгжүүлэлтийн код: <b>{devCode}</b>
              </div>
            )}
            <input
              className="input text-center text-lg tracking-widest"
              placeholder="______"
              maxLength={6}
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button className="btn-primary w-full" onClick={verify} disabled={busy || code.length < 4}>
              {busy ? "Шалгаж байна..." : "Баталгаажуулах"}
            </button>
            <button className="w-full text-xs text-muted" onClick={() => setStep("phone")}>
              ← Дугаар солих
            </button>
          </div>
        )}

        {error && <div className="mt-3 text-sm text-accent">{error}</div>}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-app py-16 text-center text-muted">Ачааллаж байна...</div>}>
      <LoginInner />
    </Suspense>
  );
}
