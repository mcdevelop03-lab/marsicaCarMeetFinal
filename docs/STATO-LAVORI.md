# STATO LAVORI — Punto di ripartenza

> **Questo è il file da consultare per riprendere.** Ultima modifica: **2026-07-13**.
> Quando riprendi, dimmi: *"vai in docs/STATO-LAVORI.md e controlla da cosa ripartire"*.
> Viene aggiornato ogni volta che ci fermiamo con gli sviluppi.

## 🔖 Dove siamo

- **Ultimo completato:** **micro-fase "rifiniture: stato 2FA + errori Supabase"** ✅ (2026-07-13). Collaudata, mergiata in `main`.
- **Prima ancora:** **micro-fase "memoizzazione dell'auth"** ✅ (2026-07-13) e **Fase 1B-1 — Profilo** ✅ (8 task su 8), entrambe collaudate e mergiate in `main`.
- **Prossimo:** **Fase 1B-2 — Garage** (non ancora iniziata).
- **Piano 1B-1:** [`superpowers/plans/2026-07-10-fase1b1-profilo.md`](./superpowers/plans/2026-07-10-fase1b1-profilo.md)
- **Design/spec 1B-1:** [`superpowers/specs/2026-07-10-fase1b1-profilo-design.md`](./superpowers/specs/2026-07-10-fase1b1-profilo-design.md)

## ✅ Esito Fase 1B-1 — Profilo (2026-07-12)

Rotte aggiunte (tutte sotto `(auth)`): **`/profilo`** (mio, modificabile + upload avatar), **`/membri`** (ricerca per nome/tag, `?q=`), **`/membri/[tag]`** (profilo altrui in sola lettura, con icone social e link "Torna ai membri"). **Avatar nell'header** accanto al menu, link a `/profilo`. Migrazioni nuove: **`0005`** (limiti 2 MB + MIME sul bucket `avatars`), **`0006`** (policy SELECT sullo storage, senza cui la pulizia degli avatar orfani non funzionava).

**Collaudo (tutto verde):** RLS profiles (un utente non modifica il profilo altrui né si promuove admin), storage negativo (cartella altrui / MIME non ammesso / file >2 MB tutti respinti HTTP 400), pulizia avatar (dopo 2 upload resta 1 solo file), escaping ricerca contro PostgREST reale (jolly `%`/`_` neutralizzati, filtro `.or()` non spezzabile), build/lint/tsc verdi. Review finale (opus): **pronto per il merge, 0 Critical**.

**5 bug/rifiniture emersi dal collaudo dal vivo, corretti (commit dedicati):**
1. `fix(profilo)` — **attributo `pattern` HTML ignorato**: il browser lo compila col flag `v`, dove il trattino in classe di caratteri va escapato (`[a-z0-9._\-]+`); senza escape la regex non compila e la spec impone di **ignorare l'attributo in silenzio**, quindi il tag accettava le maiuscole.
2. `fix(db)` — **policy SELECT mancante sul bucket `avatars`**: `storage.list()` tornava sempre `[]` e la pulizia dei file orfani non cancellava nulla (avatar vecchi accumulati nel bucket pubblico). Migrazione `0006`.
3. `feat(ui)` — **bordo rosso sui campi invalidi** (`user-invalid`): con 9 campi il solo submit disabilitato non diceva quale bloccava il salvataggio.
4. `fix(profilo)` — testo del tag riscritto: "minuscole, numeri…" si leggeva come elenco di caratteri ammessi, non come obbligo. Ora "deve essere tutto minuscolo".
5. `feat(membri)` — link "Torna ai membri" (Link vero, conserva `?q=`) su richiesta utente.

**Debito noto (follow-up, non bloccante):**
- Messaggi zod hardcoded in italiano + `locale:"it"` fisso in alcune redirect → da sistemare in Fase 3 (inglese).
- **Icone social marchi:** `lucide-react` v1 le ha rimosse; i path SVG sono vendorizzati da Simple Icons (CC0) in `src/components/ui/icons/SocialIcon.tsx`.

## ✅ Esito micro-fase — Memoizzazione dell'autenticazione (2026-07-13)

Debito **saldato**. Spec: [`superpowers/specs/2026-07-13-memoizzazione-auth-design.md`](./superpowers/specs/2026-07-13-memoizzazione-auth-design.md) · Piano: [`superpowers/plans/2026-07-13-memoizzazione-auth.md`](./superpowers/plans/2026-07-13-memoizzazione-auth.md)

Un solo file toccato (`src/lib/auth/index.ts`), nessuna migrazione, nessuna call-site modificata:
1. `getUser` e `getProfile` avvolte in **`cache()` di React** (dedup per render pass).
2. **`getProfile` ora passa dalla `getUser()` memoizzata** invece di chiamare `supabase.auth.getUser()` per conto suo. Era il punto decisivo: senza, i due `getProfile` avrebbero continuato a fare un round-trip GoTrue ciascuno anche con `getUser` cachata.
3. Il controllo AAL estratto in una **`getAal()`** memoizzata. `requireUser` **non** è memoizzabile: fa `redirect()`, che funziona lanciando un'eccezione.
4. Contatore **dev-only** (`traccia`) permanente: se una fase futura rompe la deduplica, il log del dev server lo mostra subito.

**Numeri misurati** su `/it/profilo` (baseline riprodotta rimettendo temporaneamente la vecchia implementazione, non stimata):

| una richiesta | getUser | getProfile | getAal |
|---|---|---|---|
| prima | **3** | **2** | 1 |
| dopo | **1** | **1** | 1 |
| dopo, con 2FA attivo (AAL2) | **1** | **1** | 1 |

**Collaudo (tutto verde):** salvataggio profilo + upload avatar → dopo `revalidatePath` header e dashboard mostrano i dati **nuovi** (nessuna lettura stantia: è il test diretto della trappola qui sotto); pulizia avatar orfani ancora funzionante; guardia `(auth)`, login/logout, pannello admin; **enforcement 2FA** attivato davvero via TOTP (con sola password → `/it/login?mfa=1`, poi sfida MFA → dashboard), che è il percorso passante dalla nuova `getAal()`. `tsc`/`lint`/`build` verdi.

> ⚠️ La trappola delle **letture stantie nelle server action** che questa micro-fase introduce è documentata nella sezione di ripartenza di 1B-2 (sotto) e in un commento in testa a `src/lib/auth/index.ts`.

## ✅ Esito micro-fase — Rifiniture: stato 2FA + errori Supabase (2026-07-13)

Due debiti **saldati**. Spec: [`superpowers/specs/2026-07-13-rifiniture-2fa-errori-design.md`](./superpowers/specs/2026-07-13-rifiniture-2fa-errori-design.md) · Piano: [`superpowers/plans/2026-07-13-rifiniture-2fa-errori.md`](./superpowers/plans/2026-07-13-rifiniture-2fa-errori.md)

**Tema A — Impostazioni riflette il 2FA reale.** `TwoFactorSetup` è un componente client e partiva da stato vuoto: la pagina mostrava "Attiva 2FA" **anche a 2FA attivo**, e premere quel bottone creava **un secondo fattore a ogni clic**; la disattivazione dalla UI **non esisteva** (`unenrollTotp` era codice morto, come la stringa `disable2fa`) — chi attivava il 2FA restava senza via d'uscita. Ora la fonte di verità è il server: `impostazioni/page.tsx` legge `listFactors()` (solo i `verified`) e passa `attivo` al componente, che dopo enroll/disattivazione fa `router.refresh()`. `unenrollTotp()` **non accetta più il `factorId` dal client** (lo cerca lato server fra i fattori della sessione) e non chiede un codice TOTP: chi è su quella pagina col 2FA attivo è per forza già in **AAL2**. `enrollTotp()` ripulisce i fattori non verificati residui.

**Tema B — errori Supabase non più silenziati.** In `membri/` un guasto veniva spacciato per "Nessun membro trovato" o per un **404**. Ora l'errore si logga e la UI lo distingue dal vuoto; `notFound()` resta solo per "query riuscita, nessuna riga". Stesso `console.error` aggiunto in `getProfile()`, origine del pattern.

**Collaudo (tutto verde):** 3 clic su "Attiva 2FA" → **1 solo** fattore, non 3; dopo il reload la pagina dice "2FA attiva" (prima diceva "Attiva 2FA"); Annulla non tocca il fattore, Conferma lo rimuove (0 fattori nel DB) e la pagina si aggiorna da sé. Per il Tema B il guasto è stato simulato **revocando `SELECT` su `profiles`** (il PostgREST fermo produce un *blocco*, non un errore: non è quel percorso): `/membri` mostra "Impossibile caricare i dati", `/membri/[tag]` non è più un 404, entrambi loggano il codice `42501`; ripristinato il GRANT tutto torna normale e un tag inesistente dà ancora **HTTP 404**. `tsc`/`lint`/`build` verdi.

## ▶️ DA COSA RIPARTIRE: Fase 1B-2 — Garage

Sotto-progetto successivo (vedi [ROADMAP.md](./ROADMAP.md) e [TODO.md](./TODO.md)):
- **Garage:** CRUD auto (marca/modello/anno/foto obbligatori; categoria/descrizione/specifiche opzionali) + upload foto; vista garage di un membro in sola lettura per gli altri loggati.
- **Spostare `/garage`** dal gruppo `(public)` a `(auth)` (i dati richiedono login; in 1B-1 non è stata toccata).
- **Riempire il segnaposto "Garage"** in `/membri/[tag]` (oggi mostra "In arrivo").

Prima di iniziare: brainstorming → spec → piano con checkbox (come per 1A e 1B-1).

### ⚠️ Trappola da conoscere PRIMA di scrivere le server action del garage

Dalla micro-fase di **memoizzazione dell'auth** (spec: [`superpowers/specs/2026-07-13-memoizzazione-auth-design.md`](./superpowers/specs/2026-07-13-memoizzazione-auth-design.md)), `getUser()` e `getProfile()` in `src/lib/auth/index.ts` sono avvolte in `cache()` di React.

`cache()` dura **un render pass**, e una server action gira **prima** del render che essa stessa innesca con `revalidatePath`. Quindi:

> **In una server action, non leggere il profilo (o altri dati) con una funzione memoizzata *prima* di mutarli e poi fidarti del valore memoizzato *dopo*: serviresti dati pre-update.**

Leggere l'**identità** (`requireUser()` → `getUser()`) è invece sempre sicuro: l'utente non cambia dentro una richiesta. È quello che fanno oggi `updateProfile` e `setAvatar` in `profilo/actions.ts`, ed è il motivo per cui la memoizzazione è innocua nel codice attuale — ma le action del garage sono il primo posto dove il rischio può armarsi davvero. Se una action del garage deve rileggere un dato che ha appena scritto, fa una query fresca con `createClient()`, non passa dal DAL memoizzato.

## 🧪 Esito collaudo 1A (Task 13) — 2026-07-09

Collaudo e2e dal vivo (browser via Playwright + Mailpit + SQL). **Tutto verde:**
registrazione→conferma email→auto-login, login/logout, guardie, admin, 2FA (attivazione+enforcement AAL2+codice errato), RLS `vehicles`, reset password. Build/lint/tsc verdi.

**7 bug trovati e corretti durante il collaudo** (commit dedicati sul branch):
1. `fix(db)` — **GRANT di tabella mancanti** per i ruoli Supabase: ogni accesso dati via sessione utente falliva (`getProfile` null → admin inaccessibile, dashboard senza nome). Migrazione `0004_grants.sql`.
2. `fix(auth)` — allow-list redirect + host: `additional_redirect_urls` non ammetteva `/it/auth/callback` → niente auto-login dopo la conferma. Allineato `site_url` a `localhost` + glob `**`.
3. `fix(auth)` — **Turnstile** render esplicito (il widget non partiva: "preloaded but not used").
4. `fix(2fa)` — **config MFA TOTP disabilitata** (`enroll/verify_enabled=false`) + **QR** rotto con `next/image` (SVG data-URI) + errore UI non mostrato nello stato iniziale.

## 🎨 Rifiniture UI/UX post-1A — 2026-07-09 (su `main`, pushate)

Dopo la chiusura di 1A, migliorie all'interfaccia auth e alla navigazione (non nuove fasi):
- **Pagine auth a card**: login/registrati/reset avvolte in `AuthShell` (card centrata su sfondo "racing": griglia + alone rosso), campi/bottoni full-width.
- **Validazione live** (`ValidatedInput`): hint sotto email (formato) e password (min 8), spariscono quando validi.
- **Submit disabilitato** finché il form non è valido (validazione nativa) + stile disabled.
- **Vista successo**: dopo registrazione/reset resta solo il messaggio (form e footer nascosti).
- **Link "Clicca qui per accedere"** dopo l'aggiornamento password.
- **Fix menu hamburger**: reso fratello dell'header (era compresso dal `backdrop-filter`).
- **Navigazione da loggato**: `Dashboard`/`Impostazioni`/`Logout` nel menu (o `Accedi` da sloggato). `isAuthenticated` passato dal layout.

> **Avatar profilo accanto al menu**: ✅ **fatto in Fase 1B-1** (display nell'header + upload da `/profilo`).

## 🔧 Come rimettere in moto l'ambiente

Dalla root del progetto Next (`marsicaCarMeetFinal/marsicaCarMeetFinal/`):
1. Avvia **Docker Desktop** e attendi "running".
2. `npx supabase start` (dati nel volume Docker). Se serve pulito: `npx supabase db reset` (riapplica migrazioni 0001–0004 + seed).
3. `npm run dev` → **http://localhost:3000/it** (usa `localhost`, non `127.0.0.1`: l'HMR dev è legato a localhost e le email puntano lì).
4. Casella email locale = **Mailpit** su http://127.0.0.1:54324 (API: `/api/v1/messages`).
5. `.env.local` presente (gitignored); se manca vedi [`SETUP.md`](./SETUP.md).

Per promuovere un utente ad admin dopo la registrazione: rieseguire la `update` in `supabase/seed.sql` (il seed promuove solo se l'utente esiste già).

**Credenziali di test locali (volatili — si azzerano con `db reset`):** admin `mcdevelop03@gmail.com` / `Marsica2026!` (2FA disattivo). Da loggato, il **2FA** si attiva da **Impostazioni** (link nel menu/header, non serve più digitare l'URL).

> ⚠️ **Trappola: non lanciare `npm run build` mentre gira `next dev`.** Corrompe `.next` (il manifest delle server action) e tutte le pagine con `<form action={serverAction}>` iniziano a dare 404/500. **Rimedio:** killare il dev server, `rm -rf .next`, riavviare.

## 📌 Decisioni e regole permanenti (non dimenticare)

- **Email:** MAI usare l'email dell'account (`aidev3@goproject.it`). Admin di seed = **`mcdevelop03@gmail.com`**. Chiedere sempre conferma prima di usare qualsiasi email.
- **Ritmo:** dopo ogni task completato (con review), **fermarsi e chiedere** se proseguire.
- **Stop = aggiornare questo file** col punto di ripartenza.
- **Next.js 16** (non 15): consultare `node_modules/next/dist/docs/` prima di toccare API Next; convenzione `proxy.ts` (non `middleware.ts`).
- **Solo token di tema** per i colori; stringhe UI via next-intl (IT).

## 🐞 Note aperte (non bloccanti)

- ✅ **Reset password con 2FA attivo — RISOLTO e collaudato (2026-07-09).** GoTrue esige AAL2 per cambiare password con MFA attivo: ora il link di recovery porta alla sfida MFA e, dopo la verifica, si torna alla pagina di reset (`/it/reset-password/aggiorna`, spostata fuori dal gruppo AAL2) per impostare la nuova password. Commit `fix(auth): reset password funzionante con 2FA attivo`.
- **Google OAuth / Turnstile reali + progetto Supabase cloud** da configurare (solo codice presente; guida in [`SETUP.md`](./SETUP.md) §6).
- ✅ **Impostazioni non rifletteva il 2FA attivo — RISOLTO e collaudato (2026-07-13).** Vedi l'esito della micro-fase di rifinitura.
- Logo header troppo piccolo (feedback 2026-07-08).
- Messaggi di validazione zod hardcoded in italiano + prefisso `/it/` fisso in alcune redirect → sistemare con l'inglese (Fase 3).
- In dev l'app va usata su `localhost:3000` (su `127.0.0.1:3000` l'HMR e il caricamento di script esterni falliscono: artefatto solo-dev).
