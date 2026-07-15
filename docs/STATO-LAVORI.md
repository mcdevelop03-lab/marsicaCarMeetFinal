# STATO LAVORI — Punto di ripartenza

> **Questo è il file da consultare per riprendere.** Ultima modifica: **2026-07-15**.
> Quando riprendi, dimmi: *"vai in docs/STATO-LAVORI.md e controlla da cosa ripartire"*.
> Viene aggiornato ogni volta che ci fermiamo con gli sviluppi.

## 🔖 Dove siamo

- 🟢 **Fase 1B-2 — Garage ✅ COMPLETATA** (9 task su 9, collaudata dal vivo). Con essa si chiude **l'intera Fase 1B (Profilo + Garage)**. Branch **`feat/fase1b2-garage`**.
- ▶️ **PROSSIMO: Fase 1C — Eventi + RSVP + media** (ancora da progettare: brainstorming → spec → piano).
- **Ultimo completato:** **Fase 1B-2 — Garage** ✅ (2026-07-15). Collaudata dal vivo (vedi esito sotto).
- **Prima ancora:** micro-fase **"rifiniture: stato 2FA + errori Supabase"** ✅ (2026-07-13), micro-fase **"memoizzazione dell'auth"** ✅ (2026-07-13) e **Fase 1B-1 — Profilo** ✅ (8 task su 8), tutte collaudate e mergiate in `main`.
- **Piano 1B-2:** [`superpowers/plans/2026-07-13-fase1b2-garage.md`](./superpowers/plans/2026-07-13-fase1b2-garage.md) · **Spec:** [`superpowers/specs/2026-07-13-fase1b2-garage-design.md`](./superpowers/specs/2026-07-13-fase1b2-garage-design.md)
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

## ✅ Esito Fase 1B-2 — Garage (2026-07-15) — chiude la Fase 1B

**Cosa fa:** ogni membro ha un garage di auto (con foto) che può creare, modificare ed eliminare; il garage altrui è visibile in **sola lettura** agli altri loggati.

**Rotte aggiunte (tutte sotto `(auth)`):** **`/garage`** (il mio garage, griglia di schede con Modifica/Elimina), **`/garage/nuova`** (creazione), **`/garage/[id]/modifica`** (404 se l'auto non è tua). Il **garage del membro** è ora mostrato in sola lettura in **`/membri/[tag]`** (al posto del vecchio segnaposto "in arrivo"). Rimosso il segnaposto pubblico `(public)/garage`: la voce "Garage" dell'header ora punta alla rotta `(auth)` (da sloggato → login).

**Migrazione `0007_vehicles_storage.sql`:** chiude sul bucket `vehicles` gli stessi due difetti già pagati per `avatars` in 1B-1 — **policy SELECT `vehicles_select_own`** (senza, la cancellazione delle foto falliva in silenzio) + **limite 2 MB e vincolo MIME** — e aggiunge la colonna **`vehicles.image_path`** per cancellare il file giusto.

**Compressione immagini (richiesta utente):** utilità condivisa `src/lib/images/compress.ts` — ogni foto è ridotta a 1600px di lato lungo e riscritta in **WebP dal browser** prima dell'upload (nessuna libreria). Usata sia dal `VehicleForm` sia dall'avatar (regressione verificata). L'upload dell'auto parte **al salvataggio** (non alla scelta del file), perché `image_url` è `NOT NULL` e caricare prima seminerebbe orfani.

**Collaudo dal vivo (tutto verde, 2026-07-15, browser via Playwright + Mailpit + psql), 2 account (admin `mcdevelop03@gmail.com` + membro `membro.test@example.com`):**
1. **Creazione:** riga con `image_path` valorizzato, `specs` jsonb corretto, 1 file in `{uid}/`.
2. **Compressione:** foto realistica **6.75 MB → WebP 158 KB** (−98%); il MIME salvato è sempre `image/webp` (con rumore puro incomprimibile 3.44 MB → 756 KB, comunque WebP e −78%: caso peggiore di test).
3. **Sostituzione foto:** il conteggio file **non cresce** — la vecchia foto è cancellata (prova che la policy SELECT della `0007` funziona), nuovo `image_path` aggiornato.
4. **Eliminazione:** conferma in-linea a due passi; **Annulla** non tocca nulla, **Conferma** rimuove riga **e** file (0 orfani).
5. **Sola lettura e guardie:** dal 2° account il garage del 1° si vede **senza** Modifica/Elimina; `/garage/[id-altrui]/modifica` → **HTTP 404**; il proprio `/garage` mostra solo le proprie auto; da **sloggato** `/garage` → login.
6. **RLS dal vivo:** con la sessione del 2° utente, `UPDATE`/`DELETE` via PostgREST su un veicolo altrui → **0 righe** (auto integra).
7. **Storage negativo:** upload nel bucket `vehicles` di file >2 MB → **413**, MIME `application/pdf` → **415**, cartella di un altro utente → **403** (RLS).
8. **Regressione avatar:** foto profilo grande → salvata come **WebP 158 KB**, un solo file (nessun orfano).
9. **Build:** `rm -rf .next && npm run build` **verde** (`tsc`/`lint` verdi a ogni task).

**Debito noto (follow-up, non bloccante):** un **admin** può cancellare l'auto altrui (policy `vehicles_delete_owner_or_admin` sulla tabella) ma **non il file** nello storage — le policy dello storage limitano ciascuno alla propria cartella `{uid}/`, quindi resta un **file orfano** nel bucket. Fix possibile: policy admin sullo storage o funzione `SECURITY DEFINER` per la pulizia.

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
