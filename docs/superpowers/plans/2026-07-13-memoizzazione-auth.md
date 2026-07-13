# Micro-fase: memoizzazione dell'autenticazione — Piano di implementazione

> **Per chi esegue:** implementare **un task alla volta**, con **un commit per task**, e **fermarsi a chiedere** prima di passare al successivo (workflow del progetto). I passi usano checkbox (`- [ ]`).

**Obiettivo:** far scendere una pagina protetta da `3 getUser + 2 select profilo + 1 chiamata MFA` a `1 + 1 + 1`, senza alcun cambiamento funzionale visibile.

**Architettura:** `cache()` di React nel DAL (`src/lib/auth/index.ts`), che deduplica per *render pass*. È il pattern raccomandato dalla guida ufficiale di Next 16 per un Data Access Layer. Le firme pubbliche non cambiano: nessuna call-site viene toccata.

**Stack:** Next.js 16.2.10 (App Router) · React 19.2.4 · TypeScript · `@supabase/ssr`.

**Spec:** [`../specs/2026-07-13-memoizzazione-auth-design.md`](../specs/2026-07-13-memoizzazione-auth-design.md) · **Branch:** `feat/micro-memo-auth`

## Vincoli globali

- **Un solo file di codice toccato:** `src/lib/auth/index.ts`. Nessuna migrazione, nessuna pagina, nessuna firma pubblica modificata.
- **`requireUser` NON va memoizzata:** fa `redirect()`, e `redirect` funziona lanciando un'eccezione.
- **`createClient()` non si tocca** (vedi spec §5).
- **Niente test automatici:** il progetto non ha infrastruttura di test (`package.json` → solo `dev`/`build`/`start`/`lint`) e il DAL non ha superficie testabile a unità (dipende da `cookies()` e dal render pass di React). La verifica è: `tsc` + `lint` + `build` verdi, più il collaudo dal vivo del Task 2.
- **Italiano** in codice commentato, commit e docs.
- **Trappola `next dev` + `next build`:** non lanciare `npm run build` mentre gira `next dev` — corrompe `.next` (manifest delle server action) e tutte le pagine con `<form action={…}>` danno 404/500. Rimedio: killare il dev server, `rm -rf .next`, ripartire.

---

## Task 1 — Memoizzare il DAL

**File:**
- Modifica: `src/lib/auth/index.ts` (intero file, oggi 52 righe)

**Interfacce:**
- Consuma: `createClient()` da `@/lib/supabase/server`; `redirect` da `@/i18n/navigation`; `cache` da `react`.
- Produce (firme pubbliche, **invariate** rispetto a oggi):
  - `getUser(): Promise<User | null>`
  - `getProfile(): Promise<Profile | null>`
  - `requireUser(mfaNext?: string): Promise<User>`
  - `requireAdmin(): Promise<Profile>`
  - Nuova, **privata al modulo** (non esportata): `getAal()`.

- [ ] **Passo 1: sostituire il contenuto di `src/lib/auth/index.ts`**

```ts
import { cache } from "react";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import type { User } from "@supabase/supabase-js";

// Le letture di sessione sono avvolte in `cache()` di React: senza, ogni
// `getUser()` fa una richiesta di rete a GoTrue per validare il JWT (è così che
// funziona `@supabase/ssr`), e su una singola pagina protetta se ne accumulano
// tre — layout `[locale]` (avatar), layout `(auth)` (guardia), pagina.
//
// ⚠️ ATTENZIONE, letture stantie nelle SERVER ACTION. `cache()` vive per un
// render pass, e una server action gira PRIMA del render che essa stessa
// innesca con `revalidatePath`. Quindi: in una server action non leggere un
// dato con una funzione memoizzata, mutarlo, e poi fidarti del valore
// memoizzato — serviresti dati pre-update. Se una action deve rileggere ciò che
// ha appena scritto, fa una query fresca con `createClient()`.
// Leggere l'IDENTITÀ (`getUser`/`requireUser`) è invece sempre sicuro: l'utente
// non cambia dentro una richiesta.

/**
 * Traccia le esecuzioni reali delle funzioni memoizzate, solo in sviluppo.
 * Il corpo di una funzione avvolta in `cache()` gira una volta sola per render
 * pass: le righe stampate sono quindi le chiamate di rete davvero effettuate.
 * Su una pagina protetta ci si aspetta 1 getUser + 1 getProfile + 1 getAal; se
 * il conteggio risale, la deduplica si è rotta. In produzione è un no-op.
 */
const traccia =
  process.env.NODE_ENV === "development"
    ? (nome: string) => console.log(`[auth] ${nome}`)
    : (_nome: string) => {};

export const getUser = cache(async (): Promise<User | null> => {
  traccia("getUser");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  traccia("getProfile");
  // Passa dalla `getUser()` memoizzata, NON da `supabase.auth.getUser()`: è
  // questo che evita un secondo round-trip a GoTrue quando il layout e la
  // pagina chiedono entrambi il profilo. Memoizzare `getUser` senza questa
  // riga non deduplicherebbe nulla dei due `getProfile`.
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
});

/**
 * Il solo dato di rete del controllo MFA, memoizzato a parte.
 * `requireUser` non può essere avvolta in `cache()` perché fa `redirect()`, che
 * funziona lanciando un'eccezione: si memoizza il dato, non il flusso di
 * controllo.
 */
const getAal = cache(async () => {
  traccia("getAal");
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data;
});

export async function requireUser(mfaNext?: string): Promise<User> {
  const user = await getUser();
  if (!user) redirect({ href: "/login", locale: "it" });

  const data = await getAal();
  if (data?.nextLevel === "aal2" && data.currentLevel !== "aal2") {
    // User has a verified 2FA factor but has not completed the second
    // factor challenge in this session: bounce to the MFA prompt instead
    // of letting them through to protected pages. `mfaNext` (path senza
    // prefisso locale, es. "/reset-password/aggiorna") fa tornare l'utente
    // alla pagina di partenza dopo la sfida invece che alla dashboard.
    redirect({
      href: { pathname: "/login", query: mfaNext ? { mfa: "1", next: mfaNext } : { mfa: "1" } },
      locale: "it",
    });
  }

  return user!;
}

export async function requireAdmin(): Promise<Profile> {
  await requireUser();
  const profile = await getProfile();
  if (!profile) redirect({ href: "/login", locale: "it" });
  if (profile!.role !== "admin") redirect({ href: "/dashboard", locale: "it" });
  return profile!;
}
```

Cosa è cambiato rispetto a oggi, in sintesi:
1. `getUser` e `getProfile` da `async function` a `cache(async () => …)`.
2. `getProfile` non chiama più `supabase.auth.getUser()` ma la `getUser()` memoizzata.
3. Il controllo AAL esce da `requireUser` nella `getAal()` memoizzata; il flusso di `requireUser` (i due `redirect`) è **identico** a prima.
4. Aggiunti il commento sulla trappola e l'helper `traccia`.

- [ ] **Passo 2: verificare che i tipi reggano**

Comando: `npx tsc --noEmit`
Atteso: nessun errore. (In particolare `requireAdmin` e le pagine continuano a chiamare `getProfile()`/`getUser()` come prima: `cache()` restituisce una funzione con la stessa firma.)

- [ ] **Passo 3: lint**

Comando: `npm run lint`
Atteso: nessun errore. Se ESLint segnala il parametro inutilizzato `_nome` nel no-op di produzione, rispettare la convenzione del progetto per gli argomenti scartati (prefisso `_`, già usata in `updateProfile(_state, formData)`).

- [ ] **Passo 4: commit**

```bash
git add src/lib/auth/index.ts
git commit -m "perf(auth): memoizza getUser, getProfile e il controllo AAL con cache()"
```

**⏸ Fermarsi e chiedere prima del Task 2.**

---

## Task 2 — Collaudo dal vivo

Nessuna modifica di codice attesa (se emergono bug, si correggono con commit dedicati, come da workflow di 1B-1).

**Preparazione ambiente** (dalla root del progetto Next):
1. Docker Desktop avviato.
2. `npx supabase start`
3. `npm run dev` → **http://localhost:3000/it** (usare `localhost`, mai `127.0.0.1`).
4. Login con `mcdevelop03@gmail.com` / `Marsica2026!` (admin, 2FA disattivo).

- [ ] **Passo 1: il caso che conta — salvataggio del profilo (test diretto della trappola §4 dello spec)**

Da `/it/profilo`: cambiare il **nome**, salvare; poi caricare un **nuovo avatar**.
Atteso: dopo il salvataggio l'**header mostra i dati NUOVI** (nome e avatar aggiornati). L'header sta nel layout `[locale]`, rivalidato da `revalidatePath("/", "layout")` dentro `updateProfile`/`setAvatar`: se la memoizzazione servisse dati stantii, è **qui** che si romperebbe, mostrando ancora nome/avatar vecchi.

- [ ] **Passo 2: conteggio delle chiamate**

Ricaricare `/it/profilo` da loggato e guardare il log del dev server.
Atteso, **per ogni richiesta di pagina**:
```
[auth] getUser
[auth] getProfile
[auth] getAal
```
cioè **una riga ciascuno** (prima della modifica sarebbero state 3 `getUser` e 2 `getProfile`). Nota: durante una navigazione il dev server può servire più richieste (es. prefetch RSC); il criterio è che *dentro la stessa richiesta* ogni riga compaia una volta sola.

- [ ] **Passo 3: regressione auth**

- Logout → l'accesso a `/it/profilo` rimanda a `/it/login` (guardia `(auth)`).
- Login → si arriva alla dashboard, header con nome e avatar.
- Pagina admin (`requireAdmin`) raggiungibile dall'utente admin.
- **2FA:** attivare il 2FA da Impostazioni, fare logout/login e verificare che l'enforcement AAL2 rimandi alla sfida MFA (è il percorso che passa dalla nuova `getAal()`).

- [ ] **Passo 4: build**

⚠️ **Prima killare `next dev`** (vedi Vincoli globali), poi:
```bash
rm -rf .next && npm run build
```
Atteso: build verde.

**⏸ Fermarsi e riferire l'esito prima del Task 3.**

---

## Task 3 — Chiudere la micro-fase

**File:**
- Modifica: `docs/STATO-LAVORI.md`

- [ ] **Passo 1: aggiornare `docs/STATO-LAVORI.md`**

1. In **"Dove siamo"**: la micro-fase passa da *"in corso"* a **completata**, con l'esito del collaudo (conteggio sceso a 1/1/1).
2. **Rimuovere la scheda** "🔧 Follow-up tecnico: memoizzazione dell'autenticazione (candidato per una micro-fase)" — il debito è saldato; sostituirla con una riga di esito che rimanda allo spec.
3. **Lasciare intatti**: la scheda "Follow-up tecnico: errori di lettura Supabase silenziati" (ancora aperta) e l'avviso "⚠️ Trappola da conoscere PRIMA di scrivere le server action del garage" nella sezione 1B-2 (serve proprio da adesso in poi).
4. Il **prossimo** torna a essere **Fase 1B-2 — Garage**.

- [ ] **Passo 2: commit**

```bash
git add docs/STATO-LAVORI.md
git commit -m "docs: esito della micro-fase di memoizzazione dell'auth"
```

- [ ] **Passo 3: merge in `main`**

```bash
git checkout main
git merge --no-ff feat/micro-memo-auth -m "Merge micro-fase: memoizzazione dell'autenticazione"
git push
```

**⏸ Chiedere conferma prima del merge e del push.**
