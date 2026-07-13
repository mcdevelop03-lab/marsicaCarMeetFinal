# Spec — Micro-fase: memoizzazione dell'autenticazione

> Data: **2026-07-13** · Branch: `feat/micro-memo-auth` · Origine: scheda "Follow-up tecnico" in [`STATO-LAVORI.md`](../../STATO-LAVORI.md).

## 1. Problema

Ogni chiamata a `getUser()` in `src/lib/auth/index.ts` fa una richiesta di rete a GoTrue (il servizio auth di Supabase) per validare il JWT: `@supabase/ssr` funziona così, e non c'è nessuna deduplica all'interno della stessa richiesta HTTP.

Aprendo una singola pagina protetta (es. `/it/profilo`) si accumulano:

| Chiamante | Costo |
|---|---|
| `getProfile()` nel layout `[locale]/layout.tsx` (avatar + nome nell'header) | 1 getUser + 1 select su `profiles` |
| `requireUser()` nel layout `(auth)/layout.tsx` (guardia) | 1 getUser + 1 chiamata MFA (`getAuthenticatorAssuranceLevel`) |
| `getProfile()` di nuovo nella pagina, es. `profilo/page.tsx` | 1 getUser + 1 select su `profiles` |

**Totale: 3 getUser + 2 select + 1 chiamata MFA per pagina.** In locale non si nota; in produzione è latenza inutile a ogni navigazione.

È architettura ereditata dalla Fase 1A, amplificata dalla 1B-1 (il `getProfile` della pagina duplica quello del layout). Segnalata dalla review finale di 1B-1 come *Important, non bloccante*.

## 2. Obiettivo

Scendere a **1 getUser + 1 select + 1 chiamata MFA** per richiesta, **senza alcun cambiamento funzionale visibile** e senza toccare le call-site.

## 3. Soluzione

`cache()` di React nel DAL (`src/lib/auth/index.ts`), che deduplica per *render pass*. È il pattern raccomandato dalla guida ufficiale di Next 16 (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`, sezione DAL) e dalla guida sul deduplicare le richieste non-`fetch`.

### 3.1 Le tre modifiche (tutte in `src/lib/auth/index.ts`)

1. **`getUser` diventa `cache(async () => …)`.**

2. **`getProfile` diventa `cache(...)` e passa dal `getUser()` memoizzato.**
   Oggi `getProfile` chiama `supabase.auth.getUser()` per conto suo, *non* la nostra `getUser()`. **Questo è il punto decisivo:** memoizzare la sola `getUser` non deduplicherebbe nulla dei due `getProfile`, che continuerebbero a fare un round-trip GoTrue ciascuno. Instradare `getProfile` sulla `getUser()` cachata è ciò che porta il conteggio da 3 a 1.

3. **Il controllo AAL esce da `requireUser` in una `getAal()` cachata.**
   `requireUser` **resta non memoizzata**: fa `redirect()`, e `redirect` funziona lanciando un'eccezione — memoizzarla significherebbe memoizzare un'eccezione. Si memoizza quindi il solo dato di rete (`getAuthenticatorAssuranceLevel`), lasciando fuori il flusso di controllo.
   Guadagno immediato: zero (oggi `requireUser` è chiamata una volta per render). Serve a non ripagare il round-trip se in 1B-2 una pagina la richiama. Costo: nullo.

Le firme pubbliche non cambiano: le call-site continuano a scrivere `await getUser()` / `await getProfile()` / `await requireUser()`.

### 3.2 Contatore dev-only

Un helper `traccia(nome)` invocato nel corpo delle funzioni cachate, attivo solo se `NODE_ENV === "development"`; in produzione è un no-op.

Siccome il corpo di una funzione cachata viene eseguito **una volta sola per render pass**, il numero di righe stampate *è* il numero di chiamate di rete realmente effettuate. Resta permanentemente nel codice: se una fase futura rompe la deduplica, il log lo rende visibile subito, invece di far ricomparire in silenzio le chiamate.

## 4. Il rischio da presidiare: letture stantie nelle server action

`cache()` vive per **un render pass**, e una server action gira *prima* del render che essa stessa innesca con `revalidatePath`.

Una action che (a) leggesse il profilo, (b) lo mutasse, (c) e poi si fidasse del valore memoizzato, servirebbe dati **pre-update**.

**Oggi il rischio non è armato:** `profilo/actions.ts` (`updateProfile`, `setAvatar`) chiama solo `requireUser()` — cioè l'*identità* dell'utente, che dentro una richiesta non può cambiare — e mai `getProfile()`. Nessuna entry di `getProfile` viene quindi popolata durante la action.

Ma è una trappola per le action del **garage in 1B-2**. → **Va lasciato un commento esplicito nel DAL** che avverta: in una server action non leggere il profilo memoizzato prima di una mutazione e poi fidarsene dopo.

## 5. Fuori scope

- **`createClient()` non si tocca.** Non è una chiamata di rete (solo costruzione di un oggetto), quindi non è il collo di bottiglia; e condividere un unico client fra la server action e il render successivo toccherebbe la scrittura dei cookie (`setAll`), la parte più delicata dell'auth. Rischio sproporzionato al guadagno.
- **Niente profilo passato come prop dal layout** (opzione 2 della scheda): dopo la memoizzazione non risparmierebbe più nessuna chiamata, e obbligherebbe a cambiare la firma di ogni pagina.
- **Errori Supabase silenziati** in `membri/page.tsx` e `membri/[tag]/page.tsx`: follow-up separato, resta aperto in `STATO-LAVORI.md`.

## 6. Collaudo

Non c'è una superficie testabile a unità (il DAL dipende da `cookies()` e dal render pass di React): la verifica è dal vivo.

1. **Il caso che conta davvero — salvataggio del profilo.** Modificare nome e avatar da `/it/profilo`, salvare, e verificare che l'header (che sta nel layout `[locale]`, rivalidato da `revalidatePath("/", "layout")`) mostri i dati **nuovi**. Se la memoizzazione servisse dati stantii, è qui che si romperebbe — è il test diretto del rischio §4.
2. **Conteggio:** caricare `/it/profilo` da loggato e verificare nel log del dev server **1 getUser + 1 getProfile + 1 getAal** per richiesta (contro 3 / 2 / 1 di oggi).
3. **Regressione auth:** login, logout, guardia `(auth)` da sloggato, pagina admin, enforcement 2FA (AAL2).
4. **Verdi:** `tsc`, `lint`, `build`.

## 7. Rischio complessivo

**Basso.** Ottimizzazione trasparente al comportamento: nessun cambiamento funzionale visibile, un solo file toccato, nessuna migrazione, nessuna call-site modificata.
