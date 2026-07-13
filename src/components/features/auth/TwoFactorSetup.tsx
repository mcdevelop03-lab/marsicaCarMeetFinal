"use client";
import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { enrollTotp, verifyTotp, unenrollTotp } from "@/app/[locale]/(auth)/impostazioni/actions";

export default function TwoFactorSetup({
  labels,
  attivo,
}: {
  labels: Record<string, string>;
  attivo: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<{ factorId?: string; qr?: string; error?: string }>({});
  const [code, setCode] = useState("");
  const [conferma, setConferma] = useState(false);
  const [inCorso, setInCorso] = useState(false);

  async function start() {
    const r = await enrollTotp();
    if ("error" in r) return setState({ error: r.error });
    setState({ factorId: r.factorId, qr: r.qr });
  }

  async function confirm() {
    if (!state.factorId) return;
    const r = await verifyTotp(state.factorId, code);
    if ("error" in r) return setState((s) => ({ ...s, error: r.error }));
    // Lo stato 2FA lo conosce il server: invece di ricordarlo qui, si ricarica
    // la pagina. Così resta vero anche dopo un reload.
    setState({});
    setCode("");
    router.refresh();
  }

  async function disattiva() {
    setInCorso(true);
    const r = await unenrollTotp();
    setInCorso(false);
    setConferma(false);
    if (r.error) return setState({ error: r.error });
    router.refresh();
  }

  // 2FA attivo: stato reale + disattivazione (con conferma a due passi).
  if (attivo) {
    return (
      <div className="space-y-2">
        <p className="font-mono text-xs text-accent-orange">{labels.enabled2fa}</p>
        {state.error && <p className="font-mono text-xs text-accent-red">{state.error}</p>}
        {conferma ? (
          <div className="space-y-2">
            <p className="font-mono text-xs text-white/60">{labels.confirmDisable}</p>
            <div className="flex gap-2">
              <Button onClick={disattiva} disabled={inCorso}>
                {labels.confirm}
              </Button>
              <Button onClick={() => setConferma(false)} disabled={inCorso}>
                {labels.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setConferma(true)}>{labels.disable2fa}</Button>
        )}
      </div>
    );
  }

  // Attivazione in corso: QR + codice.
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

  // 2FA non attivo.
  return (
    <div className="space-y-2">
      {state.error && <p className="text-xs font-mono text-accent-red">{state.error}</p>}
      <Button onClick={start}>{labels.enable2fa}</Button>
    </div>
  );
}
