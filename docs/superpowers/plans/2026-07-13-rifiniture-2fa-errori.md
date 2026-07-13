# Micro-fase di rifinitura (2FA + errori Supabase) — Piano di implementazione

> **Per chi esegue:** **un task alla volta**, **un commit per task**, e **fermarsi a chiedere** prima del successivo (workflow del progetto).

**Obiettivo:** (A) far riflettere a Impostazioni lo stato reale del 2FA e renderlo disattivabile; (B) smettere di far passare un guasto Supabase per "nessun risultato" o per un 404.

**Architettura:** i due temi sono indipendenti e non si toccano. Il Tema A sposta la fonte di verità sullo stato 2FA dal client (che non la conosceva) al server. Il Tema B è osservabilità + una distinzione UI fra "vuoto" e "rotto".

**Stack:** Next.js 16.2.10 · React 19 · TypeScript · `@supabase/ssr` · next-intl (solo IT).

**Spec:** [`../specs/2026-07-13-rifiniture-2fa-errori-design.md`](../specs/2026-07-13-rifiniture-2fa-errori-design.md) · **Branch:** `feat/micro-rifiniture-2fa-errori`

## Vincoli globali

- **Nessuna migrazione.**
- **Colori solo da token** di tema; **stringhe UI solo via next-intl** (`src/messages/it.json`), mai testo hardcoded nei componenti.
- **Niente test automatici:** il progetto non ha infrastruttura di test (`package.json` → solo `dev`/`build`/`start`/`lint`). Verifica = `tsc` + `lint` + `build` + collaudo dal vivo (Task 3).
- **`useRouter` va importato da `@/i18n/navigation`** (non da `next/navigation`): è la convenzione del progetto, vedi `src/i18n/navigation.ts`.
- **Debito noto, non peggiorarlo:** i messaggi d'errore dentro le server action sono già hardcoded in italiano (`actions.ts` attuale). Restiamo coerenti con l'esistente; la traduzione arriverà in Fase 3 (inglese).
- **Trappola:** non lanciare `npm run build` mentre gira `next dev` — corrompe `.next` (manifest delle server action) e le pagine con `<form action={…}>` danno 404/500. Rimedio: killare il dev server, `rm -rf .next`, ripartire.

---

## Task 1 — Tema A: Impostazioni riflette il 2FA reale

**File:**
- Modifica: `src/app/[locale]/(auth)/impostazioni/actions.ts` (intero file)
- Modifica: `src/app/[locale]/(auth)/impostazioni/page.tsx`
- Modifica: `src/components/features/auth/TwoFactorSetup.tsx` (intero file)
- Modifica: `src/messages/it.json` (sezione `settings`)

**Interfacce:**
- `enrollTotp(): Promise<{ error: string } | { factorId: string; qr: string; secret: string }>` — invariata nella firma, ma ora ripulisce prima i fattori non verificati.
- `verifyTotp(factorId: string, code: string): Promise<{ error: string } | { success: true }>` — invariata.
- **`unenrollTotp(): Promise<{ error?: string; success?: boolean }>` — CAMBIA: non accetta più `factorId`.**
- `TwoFactorSetup` — nuova prop: `{ labels: Record<string, string>; attivo: boolean }`.

- [ ] **Passo 1: nuove stringhe in `src/messages/it.json`, sezione `settings`**

`enable2fa`, `disable2fa`, `enabled2fa`, `scanQr`, `verify`, `code` **esistono già** (`disable2fa` ed `enabled2fa` non erano usate da nessuno). Aggiungere solo queste tre, dentro l'oggetto `settings`:

```json
    "confirmDisable": "Sei sicuro? Senza 2FA il tuo account sarà protetto dalla sola password.",
    "confirm": "Conferma",
    "cancel": "Annulla"
```

- [ ] **Passo 2: sostituire `src/app/[locale]/(auth)/impostazioni/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * I fattori TOTP dell'utente DELLA SESSIONE, divisi per stato.
 * `verified` = 2FA davvero attivo. `unverified` = tentativi di attivazione
 * abbandonati (QR aperto e mai confermato).
 */
async function totpFactors() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) {
    console.error("2FA: elenco dei fattori non riuscito", error);
    return { verified: [], unverified: [] };
  }
  const totp = data.all.filter((f) => f.factor_type === "totp");
  return {
    verified: totp.filter((f) => f.status === "verified"),
    unverified: totp.filter((f) => f.status !== "verified"),
  };
}

export async function enrollTotp() {
  const supabase = await createClient();

  // Ogni clic su "Attiva 2FA" creava un nuovo fattore: i tentativi abbandonati
  // restavano `unverified` e si accumulavano. Si ripuliscono prima di enrollare.
  const { unverified } = await totpFactors();
  for (const factor of unverified) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error || !data) return { error: "Impossibile avviare l'attivazione 2FA." };
  return {
    factorId: data.id,
    qr: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function verifyTotp(factorId: string, code: string) {
  const supabase = await createClient();
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error) return { error: "Codice non valido." };
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  });
  if (error) return { error: "Codice non valido." };
  // Lo stato 2FA è ora letto dal server (impostazioni/page.tsx): va rivalidato,
  // altrimenti la pagina continuerebbe a mostrare "Attiva 2FA".
  revalidatePath("/", "layout");
  return { success: true };
}

export async function unenrollTotp(): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  // Difesa in profondità: NESSUN `factorId` dal client. Se lo accettassimo dal
  // browser ci fideremmo di un id che non controlliamo; qui lo cerchiamo fra i
  // fattori dell'utente della sessione.
  // Nota: chi arriva qui col 2FA attivo è per forza in sessione AAL2 (il layout
  // `(auth)` chiama requireUser, che impone la sfida MFA), quindi il possesso
  // del telefono è già dimostrato: non serve richiedere un altro codice.
  const { verified } = await totpFactors();
  if (verified.length === 0) return { error: "Nessun 2FA attivo da disattivare." };

  for (const factor of verified) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) {
      console.error("2FA: disattivazione non riuscita", error);
      return { error: "Impossibile disattivare il 2FA." };
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}
```

- [ ] **Passo 3: `src/app/[locale]/(auth)/impostazioni/page.tsx` legge lo stato reale**

Sostituire il contenuto con:

```tsx
import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/ui/SectionHeading";
import TwoFactorSetup from "@/components/features/auth/TwoFactorSetup";
import { createClient } from "@/lib/supabase/server";

export default async function ImpostazioniPage() {
  const t = await getTranslations("settings");
  const labels = {
    enable2fa: t("enable2fa"),
    disable2fa: t("disable2fa"),
    scanQr: t("scanQr"),
    verify: t("verify"),
    enabled2fa: t("enabled2fa"),
    code: t("code"),
    confirmDisable: t("confirmDisable"),
    confirm: t("confirm"),
    cancel: t("cancel"),
  };

  // La fonte di verità sullo stato 2FA sta qui, sul server: `TwoFactorSetup` è
  // un componente client e da solo non può conoscere i fattori già esistenti.
  // Senza questa lettura la pagina mostrava "Attiva 2FA" anche a 2FA attivo, e
  // premere quel bottone creava un SECONDO fattore.
  // Contano solo i fattori `verified`: gli `unverified` sono tentativi abbandonati.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) console.error("Impostazioni: elenco dei fattori 2FA non riuscito", error);
  const attivo = (data?.all ?? []).some(
    (factor) => factor.factor_type === "totp" && factor.status === "verified",
  );

  return (
    <div className="space-y-6">
      <SectionHeading>{t("title")}</SectionHeading>
      <div className="space-y-3">
        <h3 className="font-mono text-xs uppercase tracking-widest text-white/60">{t("twoFactor")}</h3>
        <TwoFactorSetup labels={labels} attivo={attivo} />
      </div>
    </div>
  );
}
```

- [ ] **Passo 4: sostituire `src/components/features/auth/TwoFactorSetup.tsx`**

```tsx
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
    if (r.error) {
      setConferma(false);
      return setState({ error: r.error });
    }
    setConferma(false);
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
```

- [ ] **Passo 5: tipi e lint**

```bash
npx tsc --noEmit
npm run lint
```
Atteso: nessun errore, **nessun warning**. (Il progetto tiene il lint pulito: `no-unused-vars` scatta anche sugli argomenti con prefisso `_`.)

- [ ] **Passo 6: commit**

```bash
git add src/app/"[locale]"/"(auth)"/impostazioni src/components/features/auth/TwoFactorSetup.tsx src/messages/it.json
git commit -m "fix(2fa): Impostazioni riflette lo stato reale e permette di disattivare"
```

**⏸ Fermarsi e chiedere prima del Task 2.**

---

## Task 2 — Tema B: errori Supabase non più silenziati

**File:**
- Modifica: `src/app/[locale]/(auth)/membri/page.tsx`
- Modifica: `src/app/[locale]/(auth)/membri/[tag]/page.tsx`
- Modifica: `src/lib/auth/index.ts` (solo `getProfile`)
- Modifica: `src/messages/it.json` (sezione `members`)

**Interfacce:** nessuna firma cambia. `getProfile()` continua a tornare `Profile | null`.

- [ ] **Passo 1: nuova stringa in `src/messages/it.json`, sezione `members`**

Aggiungere dentro l'oggetto `members` (accanto a `empty`, che resta e mantiene il suo significato di "nessun risultato"):

```json
    "loadError": "Impossibile caricare i dati. Riprova più tardi."
```

- [ ] **Passo 2: `src/app/[locale]/(auth)/membri/page.tsx` distingue guasto da vuoto**

Sostituire il blocco della query (oggi righe ~33-38):

```tsx
  const pattern = q ? quoteOrValue(ilikePattern(q)) : null;
  const { data } = pattern
    ? await base.or(`name.ilike.${pattern},tag.ilike.${pattern}`).order("name").limit(SEARCH_LIMIT)
    : await base.order("created_at", { ascending: false }).limit(LATEST_LIMIT);

  const members = (data ?? []) as MemberSummary[];
```

con:

```tsx
  const pattern = q ? quoteOrValue(ilikePattern(q)) : null;
  const { data, error } = pattern
    ? await base.or(`name.ilike.${pattern},tag.ilike.${pattern}`).order("name").limit(SEARCH_LIMIT)
    : await base.order("created_at", { ascending: false }).limit(LATEST_LIMIT);

  // Senza questo, una query fallita (rete, RLS, DB giù) mostrava "Nessun membro
  // trovato": un guasto indistinguibile da una community davvero vuota, e senza
  // traccia nei log.
  if (error) console.error("Membri: lettura dei profili non riuscita", error);

  const members = (data ?? []) as MemberSummary[];
```

E sostituire il blocco finale del rendering (oggi righe ~63-71):

```tsx
      {members.length === 0 ? (
        <p className="font-mono text-xs text-white/40">{t("empty")}</p>
      ) : (
```

con:

```tsx
      {error ? (
        <p className="font-mono text-xs text-accent-red">{t("loadError")}</p>
      ) : members.length === 0 ? (
        <p className="font-mono text-xs text-white/40">{t("empty")}</p>
      ) : (
```

- [ ] **Passo 3: `src/app/[locale]/(auth)/membri/[tag]/page.tsx` non spaccia un guasto per 404**

Sostituire (oggi righe ~40-45):

```tsx
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("tag", wantedTag).maybeSingle();
  if (!data) notFound();

  const member = data as Profile;
```

con:

```tsx
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("tag", wantedTag)
    .maybeSingle();

  // Un guasto NON è un 404: rispondere "questo membro non esiste" quando in
  // realtà non siamo riusciti a controllare è una bugia. `notFound()` resta solo
  // per il caso "query riuscita, nessuna riga".
  if (error) {
    console.error("Membro: lettura del profilo non riuscita", error);
    return (
      <div className="space-y-8">
        <Link
          href="/membri"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/40 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {t("back")}
        </Link>
        <p className="font-mono text-xs text-accent-red">{t("loadError")}</p>
      </div>
    );
  }
  if (!data) notFound();

  const member = data as Profile;
```

- [ ] **Passo 4: `getProfile` in `src/lib/auth/index.ts` smette di ingoiare l'errore**

Sostituire, dentro `getProfile`, la sola query (comportamento invariato: continua a tornare `null`):

```ts
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
```

con:

```ts
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  // Comportamento invariato (si continua a tornare null), ma un profilo che non
  // si riesce a leggere non deve più essere indistinguibile da un profilo assente:
  // è questo il pattern da cui nasceva il silenzio anche in membri/.
  if (error) console.error("getProfile: lettura del profilo non riuscita", error);
  return (data as Profile) ?? null;
```

- [ ] **Passo 5: tipi e lint**

```bash
npx tsc --noEmit
npm run lint
```
Atteso: nessun errore, nessun warning.

- [ ] **Passo 6: commit**

```bash
git add src/app/"[locale]"/"(auth)"/membri src/lib/auth/index.ts src/messages/it.json
git commit -m "fix(membri): un errore Supabase non e' piu' 'nessun risultato' ne' un 404"
```

**⏸ Fermarsi e chiedere prima del Task 3.**

---

## Task 3 — Collaudo dal vivo e chiusura

Nessuna modifica di codice attesa (se emergono bug, commit dedicati).

**Ambiente:** Docker Desktop → `npx supabase start` → `npm run dev` → http://localhost:3000/it (usare `localhost`, non `127.0.0.1`). Admin: `mcdevelop03@gmail.com` / `Marsica2026!`.

- [ ] **Passo 1: Tema A — stato e disattivazione del 2FA**

1. Da `/it/impostazioni`, attivare il 2FA (serve un codice TOTP dall'app authenticator).
2. **Ricaricare la pagina** → deve mostrare **"2FA attiva"** e il bottone **"Disattiva 2FA"**. *(Prima del fix mostrava "Attiva 2FA".)*
3. Cliccare "Disattiva 2FA" → appare la conferma → **Annulla** → non deve succedere nulla; verificare nel DB che il fattore sia ancora lì:
   ```bash
   docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select status, factor_type from auth.mfa_factors;"
   ```
   Atteso: 1 riga `verified | totp`.
4. Cliccare "Disattiva 2FA" → **Conferma** → la pagina torna a "Attiva 2FA"; rieseguire la query sopra → **0 righe**.
5. **Niente accumulo:** cliccare "Attiva 2FA" tre volte di fila (senza mai verificare), ricaricando la pagina in mezzo, poi rieseguire la query → deve esserci **al massimo 1 fattore `unverified`**, non tre.
6. **Nessuna regressione sull'enforcement:** riattivare il 2FA, fare logout e login con la sola password → si deve finire su `/it/login?mfa=1` (sfida MFA), e dopo il codice → dashboard. Poi disattivare il 2FA dalla UI per lasciare l'ambiente com'era documentato.

- [ ] **Passo 2: Tema B — guasto Supabase distinguibile dal vuoto**

Con il dev server acceso e da loggato:
```bash
npx supabase stop
```
1. Aprire `/it/membri` → deve comparire **"Impossibile caricare i dati. Riprova più tardi."** (non "Nessun membro trovato"), e nel log del dev server la riga `Membri: lettura dei profili non riuscita`.
2. Aprire `/it/membri/luca_verdi` → **non** deve essere un 404: deve comparire lo stesso messaggio d'errore, con il link "Torna ai membri".

Poi rimettere in moto e verificare che tutto torni normale:
```bash
npx supabase start
```
3. `/it/membri` torna a elencare i membri; `/it/membri/luca_verdi` mostra il profilo.
4. **Il 404 vero funziona ancora:** `/it/membri/tag-che-non-esiste` → 404 (query riuscita, nessuna riga).

- [ ] **Passo 3: build**

⚠️ **Prima killare `next dev`**, poi:
```bash
rm -rf .next && npm run build
```
Atteso: build verde.

- [ ] **Passo 4: aggiornare `docs/STATO-LAVORI.md`**

1. In "Dove siamo": micro-fase di rifinitura **completata**.
2. **Rimuovere** dalle "Note aperte" la voce "Impostazioni non riflette il 2FA già attivo" (risolta) e, dalla sezione dei follow-up, la scheda "errori di lettura Supabase silenziati" (risolta), sostituendole con una riga di esito che rimanda allo spec.
3. Il **prossimo** resta **Fase 1B-2 — Garage**.

- [ ] **Passo 5: commit e merge**

```bash
git add docs/STATO-LAVORI.md
git commit -m "docs: esito della micro-fase di rifinitura (2FA + errori Supabase)"
git checkout main
git merge --no-ff feat/micro-rifiniture-2fa-errori -m "Merge micro-fase: rifiniture 2FA + errori Supabase"
git push
```

**⏸ Chiedere conferma prima del merge e del push.**
