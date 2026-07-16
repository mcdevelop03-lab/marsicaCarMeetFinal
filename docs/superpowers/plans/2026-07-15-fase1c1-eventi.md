# Fase 1C-1 — Eventi · Piano di implementazione

> **Per chi esegue:** **un task alla volta**, **un commit per task**, **fermarsi a chiedere** prima del successivo (workflow del progetto).

**Obiettivo:** il club pubblica i propri raduni e chiunque — anche senza login — può vederli; l'admin li crea e li gestisce dal pannello.

**Architettura:** stesso impianto di `/profilo` e `/garage` (server component + server action + form client con validazione nativa). Lo **stato dell'evento non è un campo**: si calcola dalle date a ogni render con una funzione pura; l'admin può solo **annullare**. La copertina va nello Storage, **compressa dal browser**, e il DB tiene URL **e** path del file.

**Stack:** Next.js 16.2.10 (App Router) · React 19 · TypeScript · Tailwind 4 · next-intl (solo IT) · Supabase (`@supabase/ssr`) · zod · **vitest** (nuovo, solo per la logica pura).

**Spec:** [`../specs/2026-07-15-fase1c1-eventi-design.md`](../specs/2026-07-15-fase1c1-eventi-design.md) · **Branch:** `feat/fase1c1-eventi`

## Vincoli globali

- **Colori solo da token** di tema; **stringhe UI solo via next-intl** (`src/messages/it.json`), mai testo hardcoded nei componenti.
- **Immagini utente con `<img>` semplice** (+ `eslint-disable-next-line @next/next/no-img-element`), **non** `next/image`: il progetto non configura `remotePatterns` (vedi `src/components/ui/Avatar.tsx`).
- **`useRouter`/`Link`/`redirect` da `@/i18n/navigation`**, mai da `next/navigation`. Eccezione: `notFound()` viene da `next/navigation`.
- **Test automatici solo sulla logica pura** (`statoEvento`, `mezzanotteSuccessiva`, `slugDa`). Pagine, form e action: `tsc` + `lint` + `build` + collaudo dal vivo (Task 10).
- **Lint pulito:** zero errori **e zero warning** (`no-unused-vars` scatta anche sugli argomenti con prefisso `_`).
- ⚠️ **Trappola letture stantie:** nelle server action **non** rileggere dal DAL memoizzato (`getProfile`) un dato appena scritto. Identità con `requireUser()`/`requireAdmin()` (sempre sicuro); per il resto query fresche con `createClient()`.
- ⚠️ **Trappola build:** non lanciare `npm run build` mentre gira `next dev` — corrompe `.next` e le pagine con form danno 404/500. Rimedio: killare il dev, `rm -rf .next`, ripartire.
- **Doppio controllo admin:** il layout `(admin)` chiama già `requireAdmin()`, ma le **server action non sono coperte da un layout**: ognuna deve chiamare `requireAdmin()` per conto proprio (ARCHITECTURE §6).
- **Next.js 16** (non 15): consultare `node_modules/next/dist/docs/` prima di toccare API Next.

## Struttura dei file

| File | Responsabilità | Task |
|---|---|---|
| `supabase/migrations/0008_events_setup.sql` | Bucket eventi (limiti+MIME), `cover_path`, `starts_at NOT NULL`, commento su `status` | 1 |
| `src/types/database.ts` | Tipi `Event`, `EventType`, `EventStatusDb` | 1 |
| `src/lib/date/fuso.ts` | `mezzanotteSuccessiva()` — confine di giornata italiano | 2 |
| `src/lib/events/stato.ts` | `statoEvento()` — unica fonte di verità dello stato | 2 |
| `src/lib/events/slug.ts` | `slugDa()` — slug dal titolo | 2 |
| `src/lib/date/format.ts` | Formattazione date it-IT | 3 |
| `src/lib/validation/event.ts` | Schema zod dell'evento | 3 |
| `src/messages/it.json` | Stringhe `events` e `adminEvents` | 3 |
| `src/app/[locale]/(admin)/admin/eventi/actions.ts` | Server action: crea/aggiorna/annulla/ripristina/elimina | 4 |
| `src/components/features/events/EventForm.tsx` | Form unico creazione/modifica (client) | 5 |
| `src/app/[locale]/(admin)/admin/eventi/nuovo/page.tsx` | Pagina di creazione | 5 |
| `src/components/features/events/EventAdminActions.tsx` | Annulla/Ripristina/Elimina (client) | 6 |
| `src/app/[locale]/(admin)/admin/eventi/page.tsx` | Elenco admin | 6 |
| `src/app/[locale]/(admin)/admin/eventi/[id]/modifica/page.tsx` | Pagina di modifica | 7 |
| `src/components/features/events/EventCard.tsx` | Scheda evento (lista pubblica) | 8 |
| `src/app/[locale]/(public)/eventi/page.tsx` | Elenco pubblico (sostituisce il segnaposto) | 8 |
| `src/app/[locale]/(public)/eventi/[slug]/page.tsx` | Dettaglio pubblico | 9 |

---

## Task 1 — Migrazione `0008` e tipi dell'evento

Chiude i difetti dei bucket **prima** di scrivere il codice che li usa (lezione di 0005/0006/0007), aggiunge la colonna che rende esatta la cancellazione della copertina e rende obbligatoria la data richiesta dallo stato derivato.

**File:**
- Crea: `supabase/migrations/0008_events_setup.sql`
- Modifica: `src/types/database.ts` (in fondo)

**Interfacce prodotte:** `Event`, `EventType`, `EVENT_TYPES`, `EventStatusDb` (usati da tutti i task successivi).

- [ ] **Passo 1: creare `supabase/migrations/0008_events_setup.sql`**

```sql
-- 1) Limiti di dimensione e vincolo MIME sui bucket degli eventi.
-- Come la 0005 per `avatars` e la 0007 per `vehicles`: il controllo nel browser è
-- solo feedback immediato, la difesa vera sta sul bucket.
--
-- ATTENZIONE: a differenza di `avatars`/`vehicles`, qui la policy SELECT NON manca.
-- La 0003 protegge questi due bucket con una policy `for all`, che in Postgres copre
-- anche la SELECT; `avatars`/`vehicles` usavano invece comandi espliciti
-- (`for insert`/`update`/`delete`) ed è per questo che servirono la 0006 e la 0007.
-- Aggiungere qui una policy SELECT sarebbe un duplicato inutile.
--
-- `event-media` si configura già ora, benché serva solo in 1C-3: D-171 ha stabilito
-- che i video sono link YouTube, quindi quel bucket ospiterà solo immagini. La
-- decisione è presa, rimandarla significherebbe solo rischiare di dimenticarla.
update storage.buckets
set file_size_limit = 2097152, -- 2 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('event-covers', 'event-media');

-- 2) Path della copertina nello storage, accanto all'URL pubblico.
-- Stessa lacuna che la 0007 ha colmato per `vehicles`: senza il path, per cancellare
-- il file giusto quando si sostituisce la copertina bisognerebbe ricavarlo
-- spezzettando l'URL pubblico, cosa fragile.
alter table public.events add column if not exists cover_path text;

-- 3) La data di inizio diventa obbligatoria.
-- Lo stato dell'evento è DERIVATO dalle date (spec 1C-1): senza `starts_at` non
-- esiste uno stato. La tabella è vuota, non c'è nulla da migrare.
alter table public.events alter column starts_at set not null;

-- 4) Semantica di `status` con lo stato derivato.
comment on column public.events.status is
  'Con lo stato derivato (spec 1C-1) qui si scrive SOLO ''upcoming'' (= non annullato) o ''canceled''. Lo stato mostrato (imminente/in corso/concluso) lo calcola statoEvento() in src/lib/events/stato.ts a partire da starts_at/ends_at: i valori ''ongoing'' e ''completed'' dell''enum non vengono mai scritti.';
```

- [ ] **Passo 2: applicare la migrazione**

```bash
npx supabase db reset
```
Atteso: le migrazioni `0001`–`0008` vengono riapplicate senza errori. ⚠️ Il reset ricrea il DB da zero: **le utenze di test vanno ricreate** (registrarsi e confermare da Mailpit su http://127.0.0.1:54324) e l'admin va ripromosso rieseguendo la `update` di `supabase/seed.sql`.

- [ ] **Passo 3: verificare che la migrazione abbia fatto quello che dice**

```bash
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select id, file_size_limit, allowed_mime_types from storage.buckets order by id;"
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "\d public.events" | grep -E "cover_path|starts_at"
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select col_description('public.events'::regclass, attnum) from pg_attribute where attrelid='public.events'::regclass and attname='status';"
```
Atteso: **tutti e quattro** i bucket hanno `file_size_limit = 2097152` e i tre MIME; `cover_path` esiste; `starts_at` è `not null`; il commento su `status` c'è.

- [ ] **Passo 4: aggiungere i tipi in fondo a `src/types/database.ts`**

```ts
export const EVENT_TYPES = ["raduno", "giro", "sociale"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// L'enum `event_status` del DB ha quattro valori, ma con lo stato derivato dalle date
// ne scriviamo solo due: 'upcoming' (= non annullato) e 'canceled'. Vedi la migrazione
// 0008 e `src/lib/events/stato.ts`.
export type EventStatusDb = "upcoming" | "ongoing" | "completed" | "canceled";

export type Event = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  // Riservato alla mappa interattiva della Fase 2: la 1C-1 non lo tocca.
  coords: unknown | null;
  starts_at: string; // NOT NULL dalla migrazione 0008
  ends_at: string | null;
  capacity: number | null;
  status: EventStatusDb;
  type: EventType;
  map_url: string | null;
  cover_url: string | null;
  cover_path: string | null; // colonna aggiunta dalla migrazione 0008
  created_by: string | null;
  created_at: string;
};
```

- [ ] **Passo 5: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add supabase/migrations/0008_events_setup.sql src/types/database.ts
git commit -m "feat(db): migrazione 0008 - bucket eventi, cover_path, starts_at obbligatoria"
```

**⏸ Fermarsi e chiedere prima del Task 2.**

---

## Task 2 — Logica pura: fuso, stato, slug (con vitest)

Il cuore della fase e il suo punto più insidioso. Introduce **vitest**, usato **solo** qui.

**File:**
- Modifica: `package.json` (dipendenza + script)
- Crea: `vitest.config.ts`
- Crea: `src/lib/date/fuso.ts` + `src/lib/date/fuso.test.ts`
- Crea: `src/lib/events/stato.ts` + `src/lib/events/stato.test.ts`
- Crea: `src/lib/events/slug.ts` + `src/lib/events/slug.test.ts`

**Interfacce prodotte:**
- `mezzanotteSuccessiva(d: Date): Date`
- `istanteDaOraItaliana(valore: string): string` — `"2026-07-12T10:00"` → ISO assoluto
- `type StatoEvento = "imminente" | "in-corso" | "concluso" | "annullato"`
- `statoEvento(e: Pick<Event,"status"|"starts_at"|"ends_at">, adesso?: Date): StatoEvento`
- `slugDa(titolo: string): string`

> **Tutta la matematica del fuso sta qui.** `istanteDaOraItaliana` serve alle server action (Task 4) ma vive in `fuso.ts`, non lì: è logica pura di data, riusa lo `scarto()` già scritto per `mezzanotteSuccessiva` invece di duplicarlo, ed è testabile in isolamento.

- [ ] **Passo 1: installare vitest e aggiungere lo script**

```bash
npm install -D vitest
```

In `package.json`, dentro `"scripts"`, aggiungere la riga `"test"` accanto alle esistenti:

```json
    "test": "vitest run",
```

- [ ] **Passo 2: creare `vitest.config.ts`**

L'alias `@` va ridichiarato: vitest non legge i `paths` di `tsconfig.json`.

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Solo la logica pura: niente ambiente DOM, niente componenti.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Passo 3: scrivere il test di `mezzanotteSuccessiva` (che deve fallire)**

Crea `src/lib/date/fuso.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { istanteDaOraItaliana, mezzanotteSuccessiva } from "./fuso";

describe("mezzanotteSuccessiva", () => {
  it("dà le 00:00 italiane del giorno dopo (ora solare: scarto +1)", () => {
    // 12 gen 2026, 10:00 italiane = 09:00 UTC. Atteso: 13 gen 00:00 italiane = 12 gen 23:00 UTC.
    const d = new Date("2026-01-12T09:00:00Z");
    expect(mezzanotteSuccessiva(d).toISOString()).toBe("2026-01-12T23:00:00.000Z");
  });

  it("dà le 00:00 italiane del giorno dopo (ora legale: scarto +2)", () => {
    // 12 lug 2026, 10:00 italiane = 08:00 UTC. Atteso: 13 lug 00:00 italiane = 12 lug 22:00 UTC.
    const d = new Date("2026-07-12T08:00:00Z");
    expect(mezzanotteSuccessiva(d).toISOString()).toBe("2026-07-12T22:00:00.000Z");
  });

  it("usa il giorno ITALIANO, non quello UTC", () => {
    // 12 lug 23:30 italiane = 21:30 UTC dello stesso giorno.
    // In Italia è ancora il 12: la fine è il 13 alle 00:00 (12 lug 22:00 UTC).
    const d = new Date("2026-07-12T21:30:00Z");
    expect(mezzanotteSuccessiva(d).toISOString()).toBe("2026-07-12T22:00:00.000Z");
  });

  it("gestisce il cambio di mese", () => {
    // 31 gen 2026, 12:00 italiane. Atteso: 1 feb 00:00 italiane = 31 gen 23:00 UTC.
    const d = new Date("2026-01-31T11:00:00Z");
    expect(mezzanotteSuccessiva(d).toISOString()).toBe("2026-01-31T23:00:00.000Z");
  });

  it("gestisce il cambio di anno", () => {
    // 31 dic 2026, 12:00 italiane. Atteso: 1 gen 2027 00:00 italiane = 31 dic 23:00 UTC.
    const d = new Date("2026-12-31T11:00:00Z");
    expect(mezzanotteSuccessiva(d).toISOString()).toBe("2026-12-31T23:00:00.000Z");
  });
});

describe("istanteDaOraItaliana", () => {
  it("interpreta il valore dell'input come ora ITALIANA, non UTC (ora legale)", () => {
    // L'admin scrive "12 luglio, 10:00" pensando all'ora italiana: sono le 08:00 UTC.
    expect(istanteDaOraItaliana("2026-07-12T10:00")).toBe("2026-07-12T08:00:00.000Z");
  });

  it("interpreta il valore come ora italiana anche in ora solare", () => {
    // 12 gennaio, 10:00 italiane = 09:00 UTC (scarto +1).
    expect(istanteDaOraItaliana("2026-01-12T10:00")).toBe("2026-01-12T09:00:00.000Z");
  });

  it("è l'inverso di perInputDatetime per un orario serale", () => {
    // 12 luglio, 23:30 italiane = 21:30 UTC dello stesso giorno.
    expect(istanteDaOraItaliana("2026-07-12T23:30")).toBe("2026-07-12T21:30:00.000Z");
  });
});
```

⚠️ **Ricordarsi di aggiungere `istanteDaOraItaliana` all'import in cima al file di test:**

```ts
import { istanteDaOraItaliana, mezzanotteSuccessiva } from "./fuso";
```

- [ ] **Passo 4: lanciare il test e verificare che fallisca**

```bash
npm test
```
Atteso: FAIL — `Failed to resolve import "./fuso"` (il file non esiste ancora). **8 test** attesi in totale in questo file (5 di `mezzanotteSuccessiva` + 3 di `istanteDaOraItaliana`).

- [ ] **Passo 5: creare `src/lib/date/fuso.ts`**

```ts
// Confine di giornata nel fuso italiano, senza librerie.
//
// Serve perché le date del DB sono `timestamptz` (istanti assoluti) e il server gira
// in UTC: "la fine del 12 luglio" per un club italiano è la mezzanotte di Roma, non
// quella di Greenwich. Lo scarto fra Italia e UTC cambia con l'ora legale (+1 o +2),
// quindi non si può sommare una costante: lo si chiede a `Intl`.

const FUSO = "Europe/Rome";

/** Le parti di data/ora di un istante, lette nel fuso italiano. */
function parti(d: Date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = dtf.formatToParts(d);
  const n = (tipo: string) => Number(p.find((x) => x.type === tipo)!.value);
  return {
    anno: n("year"),
    mese: n("month"),
    giorno: n("day"),
    // Con `hour12: false` alcuni runtime rendono la mezzanotte come "24": va normalizzata.
    ora: n("hour") % 24,
    minuti: n("minute"),
    secondi: n("second"),
  };
}

/** Scarto in ms fra l'ora italiana e UTC in un dato istante (ora legale inclusa). */
function scarto(d: Date): number {
  const p = parti(d);
  const comeSeFosseUtc = Date.UTC(p.anno, p.mese - 1, p.giorno, p.ora, p.minuti, p.secondi);
  return comeSeFosseUtc - d.getTime();
}

/**
 * L'istante delle 00:00 italiane del giorno DOPO quello (italiano) di `d`.
 *
 * È il confine di giornata: un evento senza ora di fine vale fino a qui.
 * NB: è la mezzanotte *successiva*, non quella del giorno stesso — quella sarebbe
 * l'inizio della giornata e darebbe il risultato opposto.
 */
export function mezzanotteSuccessiva(d: Date): Date {
  const p = parti(d);
  // `Date.UTC` normalizza da sé il cambio di mese e di anno (31 dic + 1 → 1 gen).
  const mezzanotteUtc = Date.UTC(p.anno, p.mese - 1, p.giorno + 1, 0, 0, 0);
  // `mezzanotteUtc` è mezzanotte a Greenwich: per ottenere la mezzanotte ITALIANA
  // come istante assoluto la si arretra dello scarto in vigore in quel momento.
  return new Date(mezzanotteUtc - scarto(new Date(mezzanotteUtc)));
}

/**
 * Il valore di un `<input type="datetime-local">` ("2026-07-12T10:00") come istante
 * assoluto ISO.
 *
 * Serve perché quell'input NON ha fuso: mostra e restituisce ora locale. Darlo in
 * pasto a `new Date("2026-07-12T10:00")` lo farebbe interpretare col fuso del SERVER,
 * che in produzione è UTC: l'admin scrive "10:00" pensando all'ora italiana e il
 * raduno verrebbe salvato con due ore di anticipo. Qui il valore viene esplicitamente
 * letto come ora di Roma.
 */
export function istanteDaOraItaliana(valore: string): string {
  // Si parte interpretandolo come UTC solo per scoprire quale scarto italiano è in
  // vigore in quella data (l'ora legale cambia fra +1 e +2).
  const ipotesi = new Date(`${valore}:00Z`);
  return new Date(ipotesi.getTime() - scarto(ipotesi)).toISOString();
}
```

- [ ] **Passo 6: lanciare il test e verificare che passi**

```bash
npm test
```
Atteso: **8 test passati** in `src/lib/date/fuso.test.ts` (5 di `mezzanotteSuccessiva` + 3 di `istanteDaOraItaliana`).

- [ ] **Passo 7: scrivere il test di `statoEvento` (che deve fallire)**

Crea `src/lib/events/stato.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { statoEvento } from "./stato";

// Helper locale: costruisce il minimo che `statoEvento` legge.
const ev = (starts_at: string, ends_at: string | null = null, status = "upcoming" as const) => ({
  status,
  starts_at,
  ends_at,
});

describe("statoEvento", () => {
  it("annullato vince su qualsiasi data", () => {
    const adesso = new Date("2026-07-12T10:00:00Z");
    const e = { status: "canceled" as const, starts_at: "2026-08-01T10:00:00Z", ends_at: null };
    expect(statoEvento(e, adesso)).toBe("annullato");
  });

  it("imminente se non è ancora iniziato", () => {
    const adesso = new Date("2026-07-12T10:00:00Z");
    expect(statoEvento(ev("2026-07-20T08:00:00Z"), adesso)).toBe("imminente");
  });

  it("in corso se siamo fra inizio e fine esplicita", () => {
    const adesso = new Date("2026-07-12T10:00:00Z");
    expect(statoEvento(ev("2026-07-12T08:00:00Z", "2026-07-12T16:00:00Z"), adesso)).toBe("in-corso");
  });

  it("concluso dopo la fine esplicita", () => {
    const adesso = new Date("2026-07-12T18:00:00Z");
    expect(statoEvento(ev("2026-07-12T08:00:00Z", "2026-07-12T16:00:00Z"), adesso)).toBe("concluso");
  });

  it("senza ora di fine resta IN CORSO per tutta la giornata italiana", () => {
    // Inizio: 12 lug 10:00 italiane (08:00 UTC). Adesso: 12 lug 23:30 italiane (21:30 UTC).
    // È il caso che smaschera sia la mezzanotte presa dal verso sbagliato sia il calcolo in UTC.
    const adesso = new Date("2026-07-12T21:30:00Z");
    expect(statoEvento(ev("2026-07-12T08:00:00Z"), adesso)).toBe("in-corso");
  });

  it("senza ora di fine è CONCLUSO il giorno dopo", () => {
    // Inizio: 12 lug 10:00 italiane. Adesso: 13 lug 00:30 italiane (12 lug 22:30 UTC).
    const adesso = new Date("2026-07-12T22:30:00Z");
    expect(statoEvento(ev("2026-07-12T08:00:00Z"), adesso)).toBe("concluso");
  });

  it("un raduno delle 10:00 non è concluso alle 10:01 (la regressione che ci interessa)", () => {
    const adesso = new Date("2026-07-12T08:01:00Z");
    expect(statoEvento(ev("2026-07-12T08:00:00Z"), adesso)).toBe("in-corso");
  });
});
```

- [ ] **Passo 8: lanciare il test e verificare che fallisca**

```bash
npm test
```
Atteso: FAIL — `Failed to resolve import "./stato"`.

- [ ] **Passo 9: creare `src/lib/events/stato.ts`**

```ts
import { mezzanotteSuccessiva } from "@/lib/date/fuso";
import type { Event } from "@/types/database";

export type StatoEvento = "imminente" | "in-corso" | "concluso" | "annullato";

/** Il minimo che serve per calcolare lo stato: comodo per i test e per le select parziali. */
type EventoPerStato = Pick<Event, "status" | "starts_at" | "ends_at">;

/**
 * L'unica fonte di verità dello stato mostrato di un evento.
 *
 * Lo stato NON è un campo del DB: si calcola dalle date a ogni render, così un raduno
 * passato non può restare scritto "imminente" perché nessuno ha aggiornato il campo.
 * L'unico stato che le date non possono sapere è l'annullamento, e quello sta in
 * `status` (vedi il commento sulla colonna, migrazione 0008).
 *
 * `adesso` è iniettabile per i test: in produzione non si passa.
 */
export function statoEvento(e: EventoPerStato, adesso: Date = new Date()): StatoEvento {
  if (e.status === "canceled") return "annullato";

  const inizio = new Date(e.starts_at);
  if (adesso < inizio) return "imminente";

  // Senza ora di fine l'evento vale per tutta la sua giornata italiana: è come si legge
  // "il raduno del 12 luglio". Altrimenti un raduno delle 10:00 sarebbe "concluso" alle 10:01.
  const fine = e.ends_at ? new Date(e.ends_at) : mezzanotteSuccessiva(inizio);
  return adesso <= fine ? "in-corso" : "concluso";
}
```

- [ ] **Passo 10: lanciare il test e verificare che passi**

```bash
npm test
```
Atteso: **15 test passati** (8 di `fuso` + 7 di `stato`).

- [ ] **Passo 11: scrivere il test di `slugDa` (che deve fallire)**

Crea `src/lib/events/slug.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { slugDa } from "./slug";

describe("slugDa", () => {
  it("mette in minuscolo e sostituisce gli spazi", () => {
    expect(slugDa("Raduno Estivo")).toBe("raduno-estivo");
  });

  it("toglie gli accenti", () => {
    expect(slugDa("Città di Avezzano")).toBe("citta-di-avezzano");
  });

  it("sostituisce l'apostrofo senza lasciare doppi trattini", () => {
    expect(slugDa("Raduno d'estate")).toBe("raduno-d-estate");
  });

  it("toglie la punteggiatura e i trattini alle estremità", () => {
    expect(slugDa("  Giro del Fucino!!!  ")).toBe("giro-del-fucino");
  });

  it("collassa i separatori multipli", () => {
    expect(slugDa("Cena   sociale / 2026")).toBe("cena-sociale-2026");
  });

  it("tiene i numeri", () => {
    expect(slugDa("Raduno 2026")).toBe("raduno-2026");
  });

  it("dà stringa vuota se non resta nulla di utile", () => {
    expect(slugDa("!!!")).toBe("");
  });
});
```

- [ ] **Passo 12: lanciare il test e verificare che fallisca**

```bash
npm test
```
Atteso: FAIL — `Failed to resolve import "./slug"`.

- [ ] **Passo 13: creare `src/lib/events/slug.ts`**

```ts
/**
 * Slug leggibile a partire dal titolo dell'evento.
 *
 * Lo slug è l'URL che le persone si scambiano: si genera UNA VOLTA alla creazione e
 * poi non cambia più, nemmeno correggendo il titolo (spec 1C-1). Qui c'è solo la
 * trasformazione: la gestione dei duplicati richiede il DB e vive nella server action.
 *
 * Può restituire stringa vuota (titolo di sola punteggiatura): chi chiama deve avere
 * un ripiego — vedi `creaEvento`.
 */
export function slugDa(titolo: string): string {
  return titolo
    .normalize("NFD") // separa le lettere dai segni diacritici…
    .replace(/[̀-ͯ]/g, "") // …e butta i segni: "à" → "a"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // tutto ciò che non è lettera o numero diventa separatore
    .replace(/^-+|-+$/g, ""); // via i trattini alle estremità
}
```

- [ ] **Passo 14: lanciare tutti i test, tipi, lint e commit**

```bash
npm test && npx tsc --noEmit && npm run lint
```
Atteso: **22 test passati** (8 fuso + 7 stato + 7 slug), tsc e lint verdi.

```bash
git add package.json package-lock.json vitest.config.ts src/lib/date/fuso.ts src/lib/date/fuso.test.ts src/lib/events/stato.ts src/lib/events/stato.test.ts src/lib/events/slug.ts src/lib/events/slug.test.ts
git commit -m "feat(eventi): stato derivato dalle date, slug e confine di giornata italiano (con test)"
```

**⏸ Fermarsi e chiedere prima del Task 3.**

---

## Task 3 — Formattazione date, validazione e stringhe

**File:**
- Crea: `src/lib/date/format.ts`
- Crea: `src/lib/validation/event.ts`
- Modifica: `src/messages/it.json` (sezioni `events` e `adminEvents`)

**Interfacce:**
- Consuma: `EVENT_TYPES` da `@/types/database` (Task 1).
- Produce: `formattaData`, `formattaIntervallo`, `perInputDatetime`; `eventSchema`, `EventInput`.

- [ ] **Passo 1: creare `src/lib/date/format.ts`**

```ts
// Formattazione date in italiano. Il progetto non aveva nulla del genere.
// Il fuso è fissato a Roma per lo stesso motivo di `fuso.ts`: le date sono istanti
// assoluti e il server gira in UTC, quindi senza `timeZone` un raduno serale
// verrebbe mostrato con la data del giorno prima.

const FUSO = "Europe/Rome";

const DATA_ORA = new Intl.DateTimeFormat("it-IT", {
  timeZone: FUSO,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DATA_BREVE = new Intl.DateTimeFormat("it-IT", {
  timeZone: FUSO,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const SOLO_ORA = new Intl.DateTimeFormat("it-IT", {
  timeZone: FUSO,
  hour: "2-digit",
  minute: "2-digit",
});

/** "12 luglio 2026, 10:00" — per il dettaglio. */
export function formattaData(iso: string): string {
  return DATA_ORA.format(new Date(iso));
}

/** "12 lug 2026" — per le schede. */
export function formattaDataBreve(iso: string): string {
  return DATA_BREVE.format(new Date(iso));
}

/**
 * "12 luglio 2026, 10:00 – 18:00" se finisce lo stesso giorno,
 * "12 luglio 2026, 10:00 – 13 luglio 2026, 18:00" altrimenti,
 * "12 luglio 2026, 10:00" se non c'è ora di fine.
 */
export function formattaIntervallo(inizioIso: string, fineIso: string | null): string {
  const inizio = formattaData(inizioIso);
  if (!fineIso) return inizio;

  const stessoGiorno = DATA_BREVE.format(new Date(inizioIso)) === DATA_BREVE.format(new Date(fineIso));
  return stessoGiorno
    ? `${inizio} – ${SOLO_ORA.format(new Date(fineIso))}`
    : `${inizio} – ${formattaData(fineIso)}`;
}

/**
 * ISO → il formato che vuole `<input type="datetime-local">`: "2026-07-12T10:00".
 * L'input non ha fuso: mostra e restituisce ORA LOCALE, quindi il valore va reso
 * nell'ora italiana, non in UTC (`toISOString()` qui sarebbe sbagliato).
 */
export function perInputDatetime(iso: string): string {
  const parti = new Intl.DateTimeFormat("sv-SE", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  // "sv-SE" rende "2026-07-12 10:00": all'input serve la "T".
  return parti.replace(" ", "T");
}
```

- [ ] **Passo 2: creare `src/lib/validation/event.ts`**

```ts
import * as z from "zod";
import { EVENT_TYPES } from "@/types/database";

// I campi non obbligatori arrivano dal form come "": vanno trattati come "assenti".
// (Stesso accorgimento di `src/lib/validation/profile.ts` e `vehicle.ts`.)
const vuotoAUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Titolo troppo corto (minimo 3 caratteri)")
      .max(80, "Titolo troppo lungo (massimo 80 caratteri)"),
    type: z.enum(EVENT_TYPES, { message: "Tipo di evento non valido" }),
    // `datetime-local` manda "2026-07-12T10:00": è ora ITALIANA senza fuso.
    // La conversione a istante assoluto la fa la action, non lo schema.
    starts_at: z.string().trim().min(1, "La data di inizio è obbligatoria"),
    ends_at: z.preprocess(vuotoAUndefined, z.string().trim().optional()),
    location: z.preprocess(
      vuotoAUndefined,
      z.string().trim().max(120, "Luogo troppo lungo (massimo 120 caratteri)").optional(),
    ),
    map_url: z.preprocess(
      vuotoAUndefined,
      z.url({ message: "Il link alla mappa non è un indirizzo valido" }).optional(),
    ),
    capacity: z.preprocess(
      vuotoAUndefined,
      z.coerce
        .number()
        .int()
        .min(1, "La capienza deve essere almeno 1")
        .max(10000, "Capienza non valida (massimo 10000)")
        .optional(),
    ),
    description: z.preprocess(
      vuotoAUndefined,
      z.string().trim().max(2000, "Descrizione troppo lunga (massimo 2000 caratteri)").optional(),
    ),
  })
  .refine((d) => !d.ends_at || new Date(d.ends_at) > new Date(d.starts_at), {
    message: "La fine deve venire dopo l'inizio",
    path: ["ends_at"],
  });

export type EventInput = z.infer<typeof eventSchema>;
```

- [ ] **Passo 3: aggiungere le sezioni in `src/messages/it.json`**

Inserire **dopo** la sezione `garage` (attenzione alla virgola: `garage` ora deve terminare con `},`):

```json
  "events": {
    "title": "Eventi",
    "upcoming": "Prossimi raduni",
    "past": "Conclusi",
    "empty": "Nessun raduno in programma al momento.",
    "emptyPast": "Nessun raduno concluso.",
    "loadError": "Impossibile caricare i dati. Riprova più tardi.",
    "capacity": "Capienza: {count} posti",
    "map": "Apri nella mappa",
    "backToEvents": "Torna agli eventi",
    "stato_imminente": "Imminente",
    "stato_in-corso": "In corso",
    "stato_concluso": "Concluso",
    "stato_annullato": "Annullato",
    "type_raduno": "Raduno",
    "type_giro": "Giro",
    "type_sociale": "Sociale"
  },
  "adminEvents": {
    "title": "Gestione eventi",
    "add": "Nuovo evento",
    "empty": "Nessun evento creato.",
    "newTitle": "Nuovo evento",
    "editTitle": "Modifica evento",
    "cover": "Foto di copertina",
    "coverRules": "JPG, PNG o WebP · viene compressa automaticamente · facoltativa",
    "coverChoose": "Scegli foto",
    "coverType": "Formato non ammesso: usa JPG, PNG o WebP.",
    "uploadFailed": "Caricamento della foto non riuscito. Riprova.",
    "titleField": "Titolo",
    "type": "Tipo",
    "startsAt": "Inizio",
    "endsAt": "Fine (facoltativa)",
    "endsAtHint": "Se la lasci vuota, l'evento resta \"in corso\" fino a fine giornata.",
    "location": "Luogo",
    "mapUrl": "Link alla mappa",
    "mapUrlHint": "Incolla il link di Google Maps del luogo.",
    "capacity": "Capienza",
    "description": "Descrizione",
    "descriptionCount": "{count}/2000",
    "save": "Salva",
    "edit": "Modifica",
    "view": "Vedi",
    "cancelEvent": "Annulla evento",
    "restoreEvent": "Ripristina",
    "confirmCancel": "Annullare questo evento? Resterà visibile, segnato come annullato.",
    "delete": "Elimina",
    "confirmDelete": "Sei sicuro? L'evento e la sua copertina verranno eliminati definitivamente.",
    "confirm": "Conferma",
    "cancel": "Annulla",
    "notEmpty": "Non si può eliminare un evento con iscritti o foto: annullalo invece.",
    "genericError": "Qualcosa è andato storto. Riprova."
  }
```

- [ ] **Passo 4: verificare il JSON, tipi, lint e commit**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/messages/it.json','utf8')); console.log('JSON OK')"
npx tsc --noEmit && npm run lint
git add src/lib/date/format.ts src/lib/validation/event.ts src/messages/it.json
git commit -m "feat(eventi): formattazione date italiane, validazione evento e stringhe"
```

**⏸ Fermarsi e chiedere prima del Task 4.**

---

## Task 4 — Server action dell'admin

**File:**
- Crea: `src/app/[locale]/(admin)/admin/eventi/actions.ts`

**Interfacce:**
- Consuma: `requireAdmin` da `@/lib/auth`; `eventSchema` (Task 3); `slugDa` (Task 2); `Event` (Task 1).
- Produce:
  - `type EventState = { error?: string }`
  - `creaEvento(state: EventState, formData: FormData): Promise<EventState>`
  - `aggiornaEvento(id: string, state: EventState, formData: FormData): Promise<EventState>` (l'`id` va legato con `.bind(null, id)`)
  - `annullaEvento(id: string): Promise<{ error?: string }>`
  - `ripristinaEvento(id: string): Promise<{ error?: string }>`
  - `eliminaEvento(id: string): Promise<{ error?: string }>`

- [ ] **Passo 1: creare `src/app/[locale]/(admin)/admin/eventi/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { istanteDaOraItaliana } from "@/lib/date/fuso";
import { slugDa } from "@/lib/events/slug";
import { eventSchema } from "@/lib/validation/event";

const BUCKET = "event-covers";

export type EventState = { error?: string };

/**
 * ⚠️ Nota sulla memoizzazione (vedi docs/STATO-LAVORI.md):
 * `cache()` di React vive UN RENDER PASS e una server action gira PRIMA del render che
 * essa stessa innesca con `revalidatePath`. Qui non si rilegge mai un dato appena
 * scritto passando dal DAL memoizzato: l'identità arriva da `requireAdmin()` e tutto
 * il resto sono query fresche fatte con `createClient()`.
 *
 * ⚠️ Il layout `(admin)` chiama già `requireAdmin()`, ma le server action NON sono
 * coperte da un layout: ognuna deve rifare il controllo per conto proprio.
 */

function campiDa(formData: FormData) {
  const testo = (chiave: string) => String(formData.get(chiave) ?? "");
  return {
    title: testo("title"),
    type: testo("type"),
    starts_at: testo("starts_at"),
    ends_at: testo("ends_at"),
    location: testo("location"),
    map_url: testo("map_url"),
    capacity: testo("capacity"),
    description: testo("description"),
  };
}

/** Slug libero a partire dal titolo: `raduno`, `raduno-2`, `raduno-3`… */
async function slugLibero(
  supabase: Awaited<ReturnType<typeof createClient>>,
  titolo: string,
): Promise<string> {
  // `slugDa` può tornare vuoto (titolo di sola punteggiatura): serve un ripiego.
  const base = slugDa(titolo) || "evento";
  for (let i = 1; i < 50; i++) {
    const candidato = i === 1 ? base : `${base}-${i}`;
    const { data } = await supabase.from("events").select("id").eq("slug", candidato).maybeSingle();
    if (!data) return candidato;
  }
  // Ripiego estremo: un suffisso casuale non collide in pratica.
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function creaEvento(_state: EventState, formData: FormData): Promise<EventState> {
  const t = await getTranslations("adminEvents");
  const profile = await requireAdmin();

  const parsed = eventSchema.safeParse(campiDa(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { title, type, starts_at, ends_at, location, map_url, capacity, description } = parsed.data;

  const path = String(formData.get("coverPath") ?? "");
  const cover = path
    ? { cover_url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, cover_path: path }
    : { cover_url: null, cover_path: null };

  const { error } = await supabase.from("events").insert({
    slug: await slugLibero(supabase, title),
    title,
    type,
    starts_at: istanteDaOraItaliana(starts_at),
    ends_at: ends_at ? istanteDaOraItaliana(ends_at) : null,
    location: location ?? null,
    map_url: map_url ?? null,
    capacity: capacity ?? null,
    description: description ?? null,
    created_by: profile.id,
    ...cover,
  });
  if (error) {
    // 23505 = unique_violation: `slugLibero` controlla prima, ma due creazioni
    // simultanee con lo stesso titolo passerebbero entrambe il controllo. Stesso
    // codice già gestito per il `tag` in profilo/actions.ts.
    if (error.code === "23505") return { error: t("genericError") };
    console.error("creaEvento: insert non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/admin/eventi");
  revalidatePath("/eventi");
  redirect({ href: "/admin/eventi", locale: "it" });
  // Il `redirect` di next-intl non è tipizzato `never`: senza questo return TypeScript
  // si lamenta che non tutti i rami restituiscono un valore. Mai eseguito.
  return {};
}

export async function aggiornaEvento(
  id: string,
  _state: EventState,
  formData: FormData,
): Promise<EventState> {
  const t = await getTranslations("adminEvents");
  await requireAdmin();

  const parsed = eventSchema.safeParse(campiDa(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: esistente, error: letturaError } = await supabase
    .from("events")
    .select("id, cover_path")
    .eq("id", id)
    .maybeSingle();
  if (letturaError) {
    console.error("aggiornaEvento: lettura non riuscita", letturaError);
    return { error: t("genericError") };
  }
  if (!esistente) return { error: t("genericError") };

  const { title, type, starts_at, ends_at, location, map_url, capacity, description } = parsed.data;
  const aggiornamento: Record<string, unknown> = {
    title,
    type,
    starts_at: istanteDaOraItaliana(starts_at),
    ends_at: ends_at ? istanteDaOraItaliana(ends_at) : null,
    location: location ?? null,
    map_url: map_url ?? null,
    capacity: capacity ?? null,
    description: description ?? null,
  };
  // Lo slug NON si tocca mai in modifica: è l'URL già condiviso (spec 1C-1).

  const nuovoPath = String(formData.get("coverPath") ?? "");
  if (nuovoPath) {
    aggiornamento.cover_url = supabase.storage.from(BUCKET).getPublicUrl(nuovoPath).data.publicUrl;
    aggiornamento.cover_path = nuovoPath;
  }

  const { error } = await supabase.from("events").update(aggiornamento).eq("id", id);
  if (error) {
    console.error("aggiornaEvento: update non riuscita", error);
    return { error: t("genericError") };
  }

  // Solo ORA la vecchia copertina è sostituibile: cancellarla prima e poi fallire
  // l'update lascerebbe l'evento con un'immagine rotta.
  if (nuovoPath && esistente.cover_path && esistente.cover_path !== nuovoPath) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([esistente.cover_path]);
    // Un orfano non è un errore per l'utente (l'evento è salvo e corretto), ma va
    // tracciato: una pulizia rotta è altrimenti indistinguibile dal silenzio.
    if (removeError) console.error("aggiornaEvento: vecchia copertina non rimossa", removeError);
  }

  revalidatePath("/admin/eventi");
  revalidatePath("/eventi");
  redirect({ href: "/admin/eventi", locale: "it" });
  return {};
}

/** Annullare è l'azione normale: l'evento resta visibile, segnato come annullato. */
export async function annullaEvento(id: string): Promise<{ error?: string }> {
  const t = await getTranslations("adminEvents");
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ status: "canceled" }).eq("id", id);
  if (error) {
    console.error("annullaEvento: update non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/admin/eventi");
  revalidatePath("/eventi");
  return {};
}

export async function ripristinaEvento(id: string): Promise<{ error?: string }> {
  const t = await getTranslations("adminEvents");
  await requireAdmin();

  const supabase = await createClient();
  // Si torna a 'upcoming', che con lo stato derivato significa solo "non annullato":
  // se la data è passata, la pagina lo mostrerà "concluso" da sé.
  const { error } = await supabase.from("events").update({ status: "upcoming" }).eq("id", id);
  if (error) {
    console.error("ripristinaEvento: update non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/admin/eventi");
  revalidatePath("/eventi");
  return {};
}

/**
 * Eliminare è permesso SOLO su un evento vuoto (niente iscritti, niente foto).
 * In 0001 le foreign key sono `on delete cascade`: senza questo controllo un clic
 * porterebbe via iscrizioni e album. Per tutto il resto esiste l'annullamento.
 */
export async function eliminaEvento(id: string): Promise<{ error?: string }> {
  const t = await getTranslations("adminEvents");
  await requireAdmin();

  const supabase = await createClient();
  const { data: esistente, error: letturaError } = await supabase
    .from("events")
    .select("id, cover_path")
    .eq("id", id)
    .maybeSingle();
  if (letturaError) {
    console.error("eliminaEvento: lettura non riuscita", letturaError);
    return { error: t("genericError") };
  }
  if (!esistente) return { error: t("genericError") };

  const { count: iscritti, error: contaIscrittiError } = await supabase
    .from("event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);
  const { count: foto, error: contaFotoError } = await supabase
    .from("event_media")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);
  if (contaIscrittiError || contaFotoError) {
    console.error("eliminaEvento: conteggio non riuscito", contaIscrittiError ?? contaFotoError);
    return { error: t("genericError") };
  }
  if ((iscritti ?? 0) > 0 || (foto ?? 0) > 0) return { error: t("notEmpty") };

  // Prima la riga, poi il file: se cancellassimo il file per primo e la delete
  // fallisse, resterebbe un evento con la copertina rotta.
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    console.error("eliminaEvento: delete non riuscita", error);
    return { error: t("genericError") };
  }

  if (esistente.cover_path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([esistente.cover_path]);
    if (removeError) console.error("eliminaEvento: copertina non rimossa", removeError);
  }

  revalidatePath("/admin/eventi");
  revalidatePath("/eventi");
  return {};
}
```

- [ ] **Passo 2: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add "src/app/[locale]/(admin)/admin/eventi/actions.ts"
git commit -m "feat(eventi): server action admin - crea/aggiorna/annulla/ripristina/elimina"
```

**⏸ Fermarsi e chiedere prima del Task 5.**

---

## Task 5 — `EventForm` e pagina `/admin/eventi/nuovo`

**File:**
- Crea: `src/components/features/events/EventForm.tsx`
- Crea: `src/app/[locale]/(admin)/admin/eventi/nuovo/page.tsx`

**Interfacce:**
- Consuma: `comprimiImmagine` (1B-2, già esistente); `perInputDatetime` (Task 3); `EventState`, `creaEvento` (Task 4); `Event`, `EVENT_TYPES` (Task 1).
- Produce: `<EventForm action={…} event={…}/>` — `event` assente = creazione.

- [ ] **Passo 1: creare `src/components/features/events/EventForm.tsx`**

L'upload parte **al salvataggio**, non alla scelta del file: un form abbandonato non deve lasciare file orfani nel bucket (stessa scelta di `VehicleForm`).

```tsx
"use client";
import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { comprimiImmagine } from "@/lib/images/compress";
import { createClient } from "@/lib/supabase/client";
import { perInputDatetime } from "@/lib/date/format";
import type { EventState } from "@/app/[locale]/(admin)/admin/eventi/actions";
import { EVENT_TYPES, type Event } from "@/types/database";

const labelClass = "font-mono text-[11px] uppercase tracking-widest text-white/60";
const hintClass = "block font-mono text-[11px] text-white/40";
const MIME_AMMESSI = ["image/jpeg", "image/png", "image/webp"];
const ESTENSIONI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function EventForm({
  action,
  event,
}: {
  action: (state: EventState, formData: FormData) => Promise<EventState>;
  event?: Event;
}) {
  const t = useTranslations("adminEvents");
  // Le etichette dei tipi (Raduno/Giro/Sociale) stanno nella sezione `events`, non in
  // `adminEvents`: sono le stesse mostrate al pubblico e non vanno duplicate.
  const te = useTranslations("events");
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [anteprima, setAnteprima] = useState<string | null>(event?.cover_url ?? null);
  const [errore, setErrore] = useState<string | null>(null);
  const [caricando, setCaricando] = useState(false);

  // Come in ProfileForm/VehicleForm: submit spento finché la validazione nativa non è
  // soddisfatta. Qui la copertina è facoltativa, quindi non entra nella condizione.
  const [valid, setValid] = useState(false);
  const revalidate = () => setValid(formRef.current?.checkValidity() ?? false);
  useEffect(revalidate, []);
  const [descLength, setDescLength] = useState((event?.description ?? "").length);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const scelto = e.target.files?.[0];
    e.target.value = ""; // permette di riselezionare lo stesso file
    if (!scelto) return;
    setErrore(null);
    if (!MIME_AMMESSI.includes(scelto.type)) return setErrore(t("coverType"));
    setFile(scelto);
    setAnteprima(URL.createObjectURL(scelto));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrore(null);

    if (file) {
      setCaricando(true);
      const daCaricare = await comprimiImmagine(file);
      const estensione = ESTENSIONI[daCaricare.type] ?? "webp";
      // Path piatto, NON `{uid}/` come per avatar e auto: lì la cartella per-utente è
      // la regola di sicurezza, qui invece scrive solo l'admin e la policy
      // `event_covers_admin_write` verifica `is_admin()`, non la cartella.
      // Nemmeno `{event-id}/`: in creazione l'evento non esiste ancora (l'upload
      // precede l'insert). Con `cover_path` che registra il file esatto e una sola
      // copertina per evento, una cartella non aggiungerebbe nulla.
      const path = `${crypto.randomUUID()}.${estensione}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("event-covers")
        .upload(path, daCaricare, { contentType: daCaricare.type });
      setCaricando(false);
      if (error) return setErrore(t("uploadFailed"));
      formData.set("coverPath", path);
    }

    startTransition(() => formAction(formData));
  }

  const busy = caricando || pending;

  return (
    <form ref={formRef} onSubmit={onSubmit} onInput={revalidate} className="space-y-6">
      <div className="space-y-2">
        <span className={labelClass}>{t("cover")}</span>
        {anteprima && (
          // Foto con <img>: il progetto non configura `remotePatterns` (come Avatar.tsx).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anteprima}
            alt=""
            className="h-48 w-full max-w-sm border border-white/10 object-cover"
          />
        )}
        <input
          ref={inputFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputFileRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Camera size={14} />
          {t("coverChoose")}
        </Button>
        <span className={hintClass}>{t("coverRules")}</span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("titleField")}</span>
          <Input name="title" defaultValue={event?.title ?? ""} required minLength={3} maxLength={80} />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("type")}</span>
          <Select name="type" defaultValue={event?.type ?? "raduno"} required>
            {EVENT_TYPES.map((tipo) => (
              <option key={tipo} value={tipo}>
                {te(`type_${tipo}`)}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("startsAt")}</span>
          <Input
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={event ? perInputDatetime(event.starts_at) : ""}
          />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("endsAt")}</span>
          <Input
            name="ends_at"
            type="datetime-local"
            defaultValue={event?.ends_at ? perInputDatetime(event.ends_at) : ""}
          />
          <span className={hintClass}>{t("endsAtHint")}</span>
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("location")}</span>
          <Input name="location" defaultValue={event?.location ?? ""} maxLength={120} />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("mapUrl")}</span>
          <Input name="map_url" type="url" defaultValue={event?.map_url ?? ""} />
          <span className={hintClass}>{t("mapUrlHint")}</span>
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("capacity")}</span>
          <Input name="capacity" type="number" min={1} max={10000} defaultValue={event?.capacity ?? ""} />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className={labelClass}>{t("description")}</span>
        <Textarea
          name="description"
          rows={6}
          maxLength={2000}
          defaultValue={event?.description ?? ""}
          onChange={(e) => setDescLength(e.target.value.length)}
        />
        <span className={hintClass}>{t("descriptionCount", { count: descLength })}</span>
      </label>

      {errore && <p className="font-mono text-xs text-accent-red">{errore}</p>}
      {state.error && <p className="font-mono text-xs text-accent-red">{state.error}</p>}

      <Button type="submit" disabled={busy || !valid}>
        {t("save")}
      </Button>
    </form>
  );
}
```

- [ ] **Passo 2: creare `src/app/[locale]/(admin)/admin/eventi/nuovo/page.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import EventForm from "@/components/features/events/EventForm";
import { creaEvento } from "../actions";

export default async function NuovoEventoPage() {
  const t = await getTranslations("adminEvents");

  return (
    <div className="space-y-8">
      <SectionHeading>{t("newTitle")}</SectionHeading>
      <Card className="p-6">
        <EventForm action={creaEvento} />
      </Card>
    </div>
  );
}
```

> Il layout `(admin)` chiama già `requireAdmin()`: la pagina non lo ripete.

- [ ] **Passo 3: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add src/components/features/events/EventForm.tsx "src/app/[locale]/(admin)/admin/eventi/nuovo/page.tsx"
git commit -m "feat(eventi): modulo evento e pagina di creazione admin"
```

**⏸ Fermarsi e chiedere prima del Task 6.**

---

## Task 6 — Elenco admin e azioni (annulla/ripristina/elimina)

**File:**
- Crea: `src/components/features/events/EventAdminActions.tsx`
- Crea: `src/app/[locale]/(admin)/admin/eventi/page.tsx`

**Interfacce:**
- Consuma: `annullaEvento`, `ripristinaEvento`, `eliminaEvento` (Task 4); `statoEvento` (Task 2); `formattaDataBreve` (Task 3); `Event` (Task 1).
- Produce: `<EventAdminActions id={…} annullato={…}/>`.

- [ ] **Passo 1: creare `src/components/features/events/EventAdminActions.tsx`**

Conferma **in linea a due passi**, lo stesso schema di `DeleteVehicleButton`: nessun componente modale nuovo.

```tsx
"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import {
  annullaEvento,
  eliminaEvento,
  ripristinaEvento,
} from "@/app/[locale]/(admin)/admin/eventi/actions";

type Conferma = "nessuna" | "annulla" | "elimina";

export default function EventAdminActions({ id, annullato }: { id: string; annullato: boolean }) {
  const t = useTranslations("adminEvents");
  const router = useRouter();
  const [conferma, setConferma] = useState<Conferma>("nessuna");
  const [errore, setErrore] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function esegui(azione: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const r = await azione();
      setConferma("nessuna");
      if (r.error) {
        setErrore(r.error);
        return;
      }
      setErrore(null);
      router.refresh();
    });
  }

  if (conferma !== "nessuna") {
    const messaggio = conferma === "annulla" ? t("confirmCancel") : t("confirmDelete");
    const azione = conferma === "annulla" ? () => annullaEvento(id) : () => eliminaEvento(id);
    return (
      <div className="space-y-2">
        <p className="font-mono text-[11px] text-white/60">{messaggio}</p>
        <div className="flex gap-2">
          <Button type="button" onClick={() => esegui(azione)} disabled={pending}>
            {t("confirm")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setConferma("nessuna")}
            disabled={pending}
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {errore && <p className="font-mono text-[11px] text-accent-red">{errore}</p>}
      <div className="flex flex-wrap gap-2">
        {annullato ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => esegui(() => ripristinaEvento(id))}
            disabled={pending}
          >
            {t("restoreEvent")}
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={() => setConferma("annulla")}>
            {t("cancelEvent")}
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={() => setConferma("elimina")}>
          {t("delete")}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Passo 2: creare `src/app/[locale]/(admin)/admin/eventi/page.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import EventAdminActions from "@/components/features/events/EventAdminActions";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { statoEvento } from "@/lib/events/stato";
import { formattaDataBreve } from "@/lib/date/format";
import type { Event } from "@/types/database";

export default async function AdminEventiPage() {
  const t = await getTranslations("adminEvents");
  const te = await getTranslations("events");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });

  // Un guasto non deve travestirsi da elenco vuoto (lezione della micro-fase
  // "errori Supabase silenziati").
  if (error) console.error("Admin eventi: lettura non riuscita", error);
  const eventi = (data ?? []) as Event[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <SectionHeading>{t("title")}</SectionHeading>
        <Link href="/admin/eventi/nuovo">
          <Button className="flex items-center gap-2">
            <Plus size={14} />
            {t("add")}
          </Button>
        </Link>
      </div>

      {error ? (
        <p className="font-mono text-xs text-accent-red">{t("genericError")}</p>
      ) : eventi.length === 0 ? (
        <p className="font-mono text-xs text-white/40">{t("empty")}</p>
      ) : (
        <div className="space-y-4">
          {eventi.map((evento) => {
            const stato = statoEvento(evento);
            return (
              <Card key={evento.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-display font-black italic uppercase tracking-tighter text-white">
                      {evento.title}
                    </p>
                    <Badge tone={stato === "annullato" ? "accent" : "muted"}>
                      {te(`stato_${stato}`)}
                    </Badge>
                    <Badge>{te(`type_${evento.type}`)}</Badge>
                  </div>
                  <p className="font-mono text-[11px] text-white/40">
                    {formattaDataBreve(evento.starts_at)}
                    {evento.location ? ` · ${evento.location}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/eventi/${evento.slug}`}
                    className="font-mono text-[11px] uppercase tracking-widest text-white/60 transition-colors hover:text-white"
                  >
                    {t("view")}
                  </Link>
                  <Link
                    href={`/admin/eventi/${evento.id}/modifica`}
                    className="font-mono text-[11px] uppercase tracking-widest text-white/60 transition-colors hover:text-white"
                  >
                    {t("edit")}
                  </Link>
                  <EventAdminActions id={evento.id} annullato={evento.status === "canceled"} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Passo 3: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add src/components/features/events/EventAdminActions.tsx "src/app/[locale]/(admin)/admin/eventi/page.tsx"
git commit -m "feat(eventi): elenco admin con annulla/ripristina/elimina"
```

**⏸ Fermarsi e chiedere prima del Task 7.**

---

## Task 7 — Pagina di modifica `/admin/eventi/[id]/modifica`

**File:**
- Crea: `src/app/[locale]/(admin)/admin/eventi/[id]/modifica/page.tsx`

**Interfacce:** consuma `aggiornaEvento` (Task 4, da legare con `.bind(null, id)`), `EventForm` (Task 5), `Event` (Task 1).

- [ ] **Passo 1: creare la pagina**

```tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import EventForm from "@/components/features/events/EventForm";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types/database";
import { aggiornaEvento } from "../../actions";

export default async function ModificaEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("adminEvents");
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();

  // Un guasto NON è un 404 (lezione della micro-fase sugli errori silenziati):
  // `notFound()` resta solo per "query riuscita, nessuna riga".
  if (error) {
    console.error("Modifica evento: lettura non riuscita", error);
    return <p className="font-mono text-xs text-accent-red">{t("genericError")}</p>;
  }
  if (!data) notFound();

  const evento = data as Event;
  // `id` legato alla action: `useActionState` chiama (state, formData).
  const azione = aggiornaEvento.bind(null, evento.id);

  return (
    <div className="space-y-8">
      <SectionHeading>{t("editTitle")}</SectionHeading>
      <Card className="p-6">
        <EventForm action={azione} event={evento} />
      </Card>
    </div>
  );
}
```

- [ ] **Passo 2: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add "src/app/[locale]/(admin)/admin/eventi/[id]"
git commit -m "feat(eventi): pagina di modifica dell'evento"
```

**⏸ Fermarsi e chiedere prima del Task 8.**

---

## Task 8 — `EventCard` ed elenco pubblico `/eventi`

**File:**
- Crea: `src/components/features/events/EventCard.tsx`
- **Sostituisce:** `src/app/[locale]/(public)/eventi/page.tsx` (oggi è il segnaposto "In arrivo")

**Interfacce:**
- Consuma: `statoEvento` (Task 2); `formattaDataBreve` (Task 3); `Event` (Task 1).
- Produce: `<EventCard event={…}/>`.

- [ ] **Passo 1: creare `src/components/features/events/EventCard.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import { statoEvento } from "@/lib/events/stato";
import { formattaDataBreve } from "@/lib/date/format";
import type { Event } from "@/types/database";

export default async function EventCard({ event }: { event: Event }) {
  const t = await getTranslations("events");
  const stato = statoEvento(event);

  return (
    <Link href={`/eventi/${event.slug}`} className="group block">
      <Card className="flex h-full flex-col overflow-hidden transition-colors group-hover:border-white/20">
        {event.cover_url ? (
          // Foto con <img>: il progetto non configura `remotePatterns` (come Avatar.tsx).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_url}
            alt=""
            className={`h-48 w-full object-cover ${stato === "concluso" ? "opacity-50" : ""}`}
          />
        ) : (
          // Segnaposto: la copertina è facoltativa (spec 1C-1), così si può annunciare
          // un raduno prima di avere una foto. Solo token di tema, nessun colore fisso.
          <div className="flex h-48 w-full items-center justify-center bg-surface-dim">
            <span className="font-display text-3xl font-black italic uppercase tracking-tighter text-white/10">
              {t(`type_${event.type}`)}
            </span>
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={stato === "annullato" ? "accent" : "muted"}>{t(`stato_${stato}`)}</Badge>
            <Badge>{t(`type_${event.type}`)}</Badge>
          </div>

          <p className="font-display font-black italic uppercase tracking-tighter text-white">
            {event.title}
          </p>

          <p className="font-mono text-[11px] text-white/40">
            {formattaDataBreve(event.starts_at)}
            {event.location ? ` · ${event.location}` : ""}
          </p>
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Passo 2: sostituire `src/app/[locale]/(public)/eventi/page.tsx`**

Il file esiste già come segnaposto: va **riscritto per intero** con questo contenuto.

```tsx
import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/ui/SectionHeading";
import EventCard from "@/components/features/events/EventCard";
import { createClient } from "@/lib/supabase/server";
import { statoEvento } from "@/lib/events/stato";
import type { Event } from "@/types/database";

export default async function EventiPage() {
  const t = await getTranslations("events");

  const supabase = await createClient();
  // Lettura pubblica: la policy `events_select_public` la consente anche da sloggati (D-146).
  const { data, error } = await supabase.from("events").select("*");

  // Un guasto non deve travestirsi da "nessun raduno" (lezione della micro-fase
  // "errori Supabase silenziati").
  if (error) console.error("Eventi: lettura non riuscita", error);
  const eventi = (data ?? []) as Event[];

  // Gli annullati con data futura restano fra i PROSSIMI, con il loro badge: chi
  // pensava di venire deve vederlo. Passata la data scendono fra i conclusi.
  const prossimi = eventi
    .filter((e) => statoEvento(e) !== "concluso")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const conclusi = eventi
    .filter((e) => statoEvento(e) === "concluso")
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));

  if (error) {
    return (
      <div className="space-y-8">
        <SectionHeading>{t("title")}</SectionHeading>
        <p className="font-mono text-xs text-accent-red">{t("loadError")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <SectionHeading>{t("upcoming")}</SectionHeading>
        {prossimi.length === 0 ? (
          <p className="font-mono text-xs text-white/40">{t("empty")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {prossimi.map((evento) => (
              <EventCard key={evento.id} event={evento} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <SectionHeading>{t("past")}</SectionHeading>
        {conclusi.length === 0 ? (
          <p className="font-mono text-xs text-white/40">{t("emptyPast")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {conclusi.map((evento) => (
              <EventCard key={evento.id} event={evento} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

> **Perché si filtra in TypeScript e non in SQL:** lo stato è derivato e la sua regola (confine di giornata italiano, ora legale) vive in `statoEvento`. Replicarla in SQL creerebbe una seconda fonte di verità che può divergere. Con pochi eventi per club il costo è nullo; se un giorno diventassero migliaia, si aggiunge un filtro grossolano per data nella query e si tiene comunque `statoEvento` per il badge.

- [ ] **Passo 3: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add src/components/features/events/EventCard.tsx "src/app/[locale]/(public)/eventi/page.tsx"
git commit -m "feat(eventi): elenco pubblico con prossimi e conclusi"
```

**⏸ Fermarsi e chiedere prima del Task 9.**

---

## Task 9 — Dettaglio pubblico `/eventi/[slug]`

**File:**
- Crea: `src/app/[locale]/(public)/eventi/[slug]/page.tsx`

**Interfacce:** consuma `statoEvento` (Task 2), `formattaIntervallo` (Task 3), `Event` (Task 1).

- [ ] **Passo 1: creare la pagina**

```tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { statoEvento } from "@/lib/events/stato";
import { formattaIntervallo } from "@/lib/date/format";
import type { Event } from "@/types/database";

export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = await getTranslations("events");
  const { slug } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();

  // Un guasto NON è un 404: rispondere "questo evento non esiste" quando in realtà non
  // siamo riusciti a controllare è una bugia. `notFound()` resta solo per
  // "query riuscita, nessuna riga".
  if (error) {
    console.error("Evento: lettura non riuscita", error);
    return (
      <div className="space-y-8">
        <Link
          href="/eventi"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/40 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {t("backToEvents")}
        </Link>
        <p className="font-mono text-xs text-accent-red">{t("loadError")}</p>
      </div>
    );
  }
  if (!data) notFound();

  const evento = data as Event;
  const stato = statoEvento(evento);

  return (
    <div className="space-y-8">
      <Link
        href="/eventi"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/40 transition-colors hover:text-white"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        {t("backToEvents")}
      </Link>

      {evento.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={evento.cover_url}
          alt=""
          className="h-64 w-full border border-white/10 object-cover md:h-80"
        />
      ) : (
        <div className="flex h-64 w-full items-center justify-center border border-white/10 bg-surface-dim md:h-80">
          <span className="font-display text-5xl font-black italic uppercase tracking-tighter text-white/10">
            {t(`type_${evento.type}`)}
          </span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={stato === "annullato" ? "accent" : "muted"}>{t(`stato_${stato}`)}</Badge>
          <Badge>{t(`type_${evento.type}`)}</Badge>
        </div>
        <h1 className="font-display text-3xl font-black italic uppercase tracking-tighter text-white">
          {evento.title}
        </h1>
        <p className="font-mono text-xs text-white/60">
          {formattaIntervallo(evento.starts_at, evento.ends_at)}
        </p>
      </div>

      <Card className="space-y-4 p-6">
        {evento.location && (
          <p className="flex items-center gap-2 font-mono text-xs text-white/60">
            <MapPin size={12} aria-hidden="true" />
            {evento.location}
            {evento.map_url && (
              <a
                href={evento.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="uppercase tracking-widest text-white/40 underline transition-colors hover:text-white"
              >
                {t("map")}
              </a>
            )}
          </p>
        )}
        {evento.capacity !== null && (
          <p className="flex items-center gap-2 font-mono text-xs text-white/60">
            <Users size={12} aria-hidden="true" />
            {t("capacity", { count: evento.capacity })}
          </p>
        )}
        {evento.description && (
          <p className="whitespace-pre-line text-sm text-white/70">{evento.description}</p>
        )}
      </Card>
    </div>
  );
}
```

> **Niente RSVP qui:** l'iscrizione è la Fase 1C-2. La capienza in 1C-1 si limita a essere **mostrata**.

- [ ] **Passo 2: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add "src/app/[locale]/(public)/eventi/[slug]"
git commit -m "feat(eventi): pagina di dettaglio pubblica dell'evento"
```

**⏸ Fermarsi e chiedere prima del Task 10.**

---

## Task 10 — Collaudo dal vivo e chiusura

Nessuna modifica attesa (se emergono bug: commit dedicati, come in 1B-1 e 1B-2).

**Ambiente:** Docker Desktop → `npx supabase start` → `npm run dev` → http://localhost:3000/it (usare `localhost`, mai `127.0.0.1`).
⚠️ Il Task 1 ha fatto `db reset`: **le utenze di test vanno ricreate** (registrarsi, confermare da Mailpit su http://127.0.0.1:54324). Per l'admin, rieseguire la `update` di `supabase/seed.sql`. **Servono DUE account** (un admin e un membro qualsiasi) per il Passo 5.

- [ ] **Passo 1: creazione**

Da `/it/admin/eventi` → "Nuovo evento" → compilare e salvare **con** copertina.
Atteso: si torna a `/admin/eventi` e l'evento compare.
```bash
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select slug, title, type, status, starts_at, ends_at, capacity, cover_path from public.events;"
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select name, metadata->>'size' as byte, metadata->>'mimetype' as mime from storage.objects where bucket_id='event-covers';"
```
Atteso: la riga ha `slug` e `cover_path` valorizzati; nel bucket c'è **un** file **`image/webp`**.

- [ ] **Passo 2: stato derivato (la prova che conta)**

Creare **quattro** eventi, tutti **senza ora di fine**:
1. inizio **fra una settimana** → atteso **Imminente**
2. inizio **oggi, un'ora fa** → atteso **In corso** (non "Concluso": è la regressione del raduno delle 10:00)
3. inizio **oggi alle 23:00** → atteso **In corso** — è il caso che smaschera il calcolo in UTC invece che `Europe/Rome`
4. inizio **ieri** → atteso **Concluso**

Verificare i badge su `/it/eventi` e su `/it/admin/eventi`. Nessuno dei quattro richiede di toccare `status` a mano.

- [ ] **Passo 3: copertina facoltativa e compressione**

Creare un evento **senza** foto → la scheda mostra il **segnaposto** col tipo, nessuna immagine rotta.
Creare un evento con una foto **grande** (≥ 3 MB).
```bash
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select name, metadata->>'size' as byte, metadata->>'mimetype' as mime from storage.objects where bucket_id='event-covers';"
```
Atteso: il file è **`image/webp`** e pesa molto meno dell'originale. Se il MIME non è webp, la compressione non è entrata in funzione.

- [ ] **Passo 4: slug immutabile e duplicati**

1. Aprire un evento esistente, **cambiare il titolo**, salvare.
```bash
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select slug, title from public.events;"
```
Atteso: lo `slug` **non è cambiato**; il vecchio URL `/it/eventi/<slug>` funziona ancora.
2. Creare **due** eventi con lo **stesso identico titolo**.
Atteso: due slug diversi (`titolo` e `titolo-2`), nessun errore.

- [ ] **Passo 5: pulizia della copertina**

Modificare un evento caricando una **nuova** copertina.
```bash
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select count(*) from storage.objects where bucket_id='event-covers';"
```
Atteso: il numero di file **non cresce** — la vecchia è stata cancellata via `cover_path`.

- [ ] **Passo 6: annulla, ripristina, elimina**

1. **Annulla** un evento **futuro** → resta su `/it/eventi` fra i **Prossimi**, con badge `Annullato`.
2. **Ripristina** → torna Imminente.
3. **Elimina** un evento **vuoto** → conferma a due passi; Annulla non tocca nulla, Conferma lo rimuove (riga **e** file).
```bash
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select count(*) from public.events;"
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select count(*) from storage.objects where bucket_id='event-covers';"
```

- [ ] **Passo 7: accesso e guardie**

1. Da **sloggato**: `/it/eventi` e `/it/eventi/<slug>` **funzionano** (D-146).
2. Da **sloggato**: `/it/admin/eventi` → rimanda al **login**.
3. Con il **secondo account** (membro non-admin): `/it/admin/eventi` → rimanda alla **dashboard**.

- [ ] **Passo 8: RLS dal vivo (non fidarsi della UI)**

Con la sessione del membro **non-admin** (token via `/auth/v1/token?grant_type=password`), tentare via PostgREST:
```bash
# atteso: [] su entrambe (0 righe toccate)
curl -s -X POST "http://127.0.0.1:54321/rest/v1/events" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "Prefer: return=representation" -d '{"slug":"hack","title":"Hack","type":"raduno","starts_at":"2026-09-01T10:00:00Z"}'
curl -s -X PATCH "http://127.0.0.1:54321/rest/v1/events?slug=eq.<slug-reale>" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "Prefer: return=representation" -d '{"title":"HACKED"}'
```
Atteso: entrambe respinte (`[]` o errore di policy); l'evento reale resta intatto.

- [ ] **Passo 9: storage negativo**

Tentare l'upload nel bucket `event-covers` (via client Supabase, aggirando la UI) con la sessione **admin**:
1. un file **> 2 MB** → respinto (HTTP 400, `Payload too large`);
2. un file con **MIME non ammesso** (es. `application/pdf`) → respinto (`invalid_mime_type`).

- [ ] **Passo 10: errore ≠ 404**

1. `/it/eventi/slug-inesistente` → **HTTP 404**.
2. Simulare un guasto revocando il `SELECT` su `events`:
```bash
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "revoke select on public.events from anon, authenticated;"
```
Atteso: `/it/eventi` mostra "Impossibile caricare i dati" (**non** un elenco vuoto) e `/it/eventi/<slug>` **non** è un 404; entrambi loggano il codice `42501`. Poi ripristinare:
```bash
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "grant select on public.events to anon, authenticated;"
```
Atteso dopo il ripristino: tutto torna normale e uno slug inesistente dà ancora **404**.

- [ ] **Passo 11: test, tipi, lint e build**

⚠️ Prima killare `next dev`, poi:
```bash
npm test && npx tsc --noEmit && npm run lint
rm -rf .next && npm run build
```
Atteso: 22 test verdi, tsc/lint verdi, build verde.

- [ ] **Passo 12: aggiornare `docs/STATO-LAVORI.md`**

1. "Dove siamo": **Fase 1C-1 completata**; prossimo **1C-2 (RSVP)**.
2. Esito della fase (rotte aggiunte, migrazione `0008`, stato derivato, vitest introdotto) + esito del collaudo.
3. Annotare che la 1C è divisa in **1C-1 / 1C-2 / 1C-3** e che 1C-2 dovrà affrontare i **due nodi noti**: la capienza non è contabile dal membro con la RLS attuale (`registrations_select_self_or_admin`), e `registrations_insert_self` **non controlla la capienza** (due iscrizioni simultanee all'ultimo posto passerebbero entrambe → serve una funzione DB).

- [ ] **Passo 13: aggiornare la ROADMAP**

Spuntare la voce `[1C]` degli eventi in `docs/ROADMAP.md`, lasciando aperte quelle di RSVP e album.

- [ ] **Passo 14: commit, merge, push**

```bash
git add docs/STATO-LAVORI.md docs/ROADMAP.md
git commit -m "docs: esito della Fase 1C-1 (Eventi)"
git checkout main
git merge --no-ff feat/fase1c1-eventi -m "Merge Fase 1C-1 (Eventi)"
git push origin main
```

**⏸ Chiedere conferma prima del merge e del push.**
