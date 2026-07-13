# Spec — Micro-fase di rifinitura: stato 2FA + errori Supabase non silenziati

> Data: **2026-07-13** · Branch: `feat/micro-rifiniture-2fa-errori`
> Due temi **indipendenti**, un commit ciascuno. Nessuna migrazione. Da chiudere prima di entrare in **Fase 1B-2 (Garage)**.

---

## Tema A — Impostazioni deve riflettere il 2FA reale

### A.1 Problema

`impostazioni/page.tsx` monta `TwoFactorSetup`, un componente **client** che parte da `useState({})`: non sa nulla dei fattori MFA già esistenti. Conseguenze:

1. **A 2FA attivo la pagina mostra comunque "Attiva 2FA".** Lo stato mostrato è falso.
2. **Premere quel bottone crea un SECONDO fattore** (`enrollTotp` → `mfa.enroll`). Ogni clic ne accumula uno nuovo, non verificato.
3. **Non esiste alcun modo, dalla UI, di disattivare il 2FA.** L'action `unenrollTotp` **esiste già in `actions.ts` ma non è importata da nessuno**: è codice morto. Anche la stringa `disable2fa` è già nelle traduzioni e non è usata. Un utente che attiva il 2FA resta senza via d'uscita.

Emerso dal collaudo della micro-fase di memoizzazione (2026-07-13): per rimettere l'ambiente a posto è stato necessario cancellare il fattore **direttamente dal database**. Un utente reale non può farlo.

È una lacuna **preesistente** (nasce in Fase 1A), non causata dalla memoizzazione.

### A.2 Soluzione

**`impostazioni/page.tsx`** (Server Component) legge lo stato vero e lo passa al componente:
- `supabase.auth.mfa.listFactors()`, tenendo **solo i fattori TOTP con `status === "verified"`** (i non verificati sono tentativi abbandonati, non un 2FA attivo).
- Passa a `TwoFactorSetup` una prop **`attivo: boolean`**.

**`TwoFactorSetup.tsx`** — tre stati, non più uno:
- **2FA attivo** (`attivo === true`): mostra "2FA attivo" + bottone **"Disattiva"**.
- **Conferma** (dopo il clic su "Disattiva"): la conferma è **in linea, a due passi** — il bottone lascia il posto a "Sei sicuro?" con **Conferma** / **Annulla**, nello stesso riquadro. Niente `window.confirm` (ignora il tema e non passa da next-intl), niente componente modale nuovo (YAGNI: lo introdurremo semmai in 1B-2, che avrà la cancellazione di un'auto).
- **2FA non attivo:** flusso di enroll attuale (bottone → QR → codice → verifica), invariato.

Dopo **enroll riuscito** e dopo **disattivazione** il componente chiama **`router.refresh()`**: la pagina rilegge lo stato dal server invece di fidarsi dello stato locale. Senza, l'interfaccia tornerebbe a mentire al primo ricaricamento.

**`impostazioni/actions.ts`:**
- **`unenrollTotp()` non accetta più `factorId` dal client.** Se lo ricevesse dal browser, l'app si fiderebbe di un id arrivato da fuori. La action cerca da sé, lato server, il fattore TOTP verificato dell'utente **della sessione** e rimuove quello. È la stessa "difesa in profondità" già applicata in `setAvatar` (`profilo/actions.ts`). Al termine: `revalidatePath`.
- **`enrollTotp()` ripulisce prima i fattori TOTP non verificati** rimasti da tentativi abbandonati, così non si accumulano.

**Stringhe** (`src/messages/it.json`, sezione `settings`): servono le nuove `confirmDisable`, `confirm`, `cancel`. **`disable2fa` e `enabled2fa` esistono già** e finalmente verranno usate.

### A.3 Perché NON chiediamo un codice TOTP per disattivare

Chi si trova su Impostazioni con il 2FA attivo **è già in sessione AAL2**, perché il layout `(auth)` chiama `requireUser()`, che impone la sfida MFA a chiunque abbia un fattore verificato. Il possesso del telefono è quindi **già dimostrato**: richiedere di nuovo un codice sarebbe attrito senza guadagno di sicurezza. La conferma esplicita serve invece a proteggere dal **clic distratto**, che è il rischio reale.

---

## Tema B — Errori di lettura Supabase non più silenziati

### B.1 Problema

In `membri/page.tsx` e `membri/[tag]/page.tsx` il risultato di Supabase è destrutturato scartando `error` (`const { data } = await …`). Se la query fallisce (rete, RLS, DB giù):

- `/membri` mostra **"Nessun membro trovato"** — indistinguibile da una community davvero vuota;
- `/membri/[tag]` risponde **404** — cioè l'app *afferma* che quel membro non esiste, quando in realtà non è riuscita a controllare.

In nessuno dei due casi resta traccia nei log del server.

### B.2 Soluzione

In entrambe le pagine si cattura `error`. Se presente:
1. **`console.error` lato server** (stesso pattern già usato da `setAvatar` in `profilo/actions.ts`);
2. **la UI distingue il guasto dal vuoto**: messaggio d'errore al posto di "Nessun membro trovato" su `/membri`; su `/membri/[tag]` **niente più 404** — `notFound()` resta solo per il caso "query riuscita, nessuna riga".

Nuova stringa `loadError` (sezione `members` di `it.json`).

**In più:** `getProfile()` in `src/lib/auth/index.ts` — origine di questo pattern — ingoia l'errore allo stesso modo. Si aggiunge **solo il `console.error`**, senza cambiare il comportamento (continua a tornare `null`).

---

## Fuori scope

- Componente modale riutilizzabile (semmai in 1B-2, con la cancellazione delle auto).
- Qualunque modifica al flusso di enroll/verifica del 2FA, che funziona.
- Le altre destrutturazioni che scartano `error` fuori da `membri/` e `getProfile`.

## Collaudo

**Tema A** (dal vivo, con ambiente in moto):
1. Attivare il 2FA, **ricaricare** Impostazioni → deve dire **"2FA attivo"** con il bottone "Disattiva" (oggi direbbe "Attiva 2FA").
2. Cliccare "Disattiva" → appare la conferma → **Annulla** non disattiva nulla.
3. Cliccare "Disattiva" → **Conferma** → il 2FA sparisce; ricaricando, la pagina torna a "Attiva 2FA".
4. **DB:** `select status from auth.mfa_factors` → nessun fattore residuo; e ripetuti clic su "Attiva 2FA" non devono accumulare fattori non verificati.
5. Con 2FA attivo, il login continua a esigere la sfida MFA (nessuna regressione sull'enforcement AAL2).

**Tema B:** fermare Supabase (`npx supabase stop`) e verificare che `/membri` mostri il **messaggio d'errore** invece di "Nessun membro trovato", e che `/membri/[tag]` **non risponda 404**; in entrambi i casi l'errore deve comparire nei log del server. Poi `npx supabase start` e controllare che tutto torni normale.

**Sempre:** `tsc`, `lint`, `build` verdi.

## Rischio

**Basso.** Il Tema B è quasi solo osservabilità. Il Tema A tocca un flusso di sicurezza, ma **rimuove** un buco (2FA non disattivabile) invece di aprirne uno, e la disattivazione resta protetta dal fatto che la sessione è per forza AAL2.
