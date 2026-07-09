"use client";
import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { enrollTotp, verifyTotp } from "@/app/[locale]/(auth)/impostazioni/actions";

export default function TwoFactorSetup({ labels }: { labels: Record<string, string> }) {
  const [state, setState] = useState<{ factorId?: string; qr?: string; done?: boolean; error?: string }>({});
  const [code, setCode] = useState("");

  async function start() {
    const r = await enrollTotp();
    if ("error" in r) return setState({ error: r.error });
    setState({ factorId: r.factorId, qr: r.qr });
  }
  async function confirm() {
    if (!state.factorId) return;
    const r = await verifyTotp(state.factorId, code);
    setState((s) => ("error" in r ? { ...s, error: r.error } : { done: true }));
  }

  if (state.done) return <p className="text-xs font-mono text-accent-orange">{labels.enabled2fa}</p>;
  if (state.qr) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-mono text-white/60">{labels.scanQr}</p>
        {/* qr_code è un SVG data-URI generato da Supabase: next/image non lo accetta,
            usiamo un <img> semplice. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={state.qr} alt="QR 2FA" width={180} height={180} />
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={labels.code} inputMode="numeric" />
        {state.error && <p className="text-xs font-mono text-accent-red">{state.error}</p>}
        <Button onClick={confirm}>{labels.verify}</Button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {state.error && <p className="text-xs font-mono text-accent-red">{state.error}</p>}
      <Button onClick={start}>{labels.enable2fa}</Button>
    </div>
  );
}
