# CODE ANALYSIS — Analisi del codice esistente (mockup VELOCITY)

> Documento vivo. Ultima modifica: 2026-07-07.
> **Fase 3 della [ROADMAP](./ROADMAP.md).** Analisi a sola lettura: *nessuna modifica al codice*.
> Obiettivo: capire cosa riusare, cosa correggere e cosa buttare prima del refactoring (Fase 4).

## 0. In una riga

Il mockup è una **base di partenza di buona qualità estetica e ben tipizzata**, ma è un
prototipo mono-utente senza routing, backend, i18n né componenti riutilizzabili. Il **design
si riusa quasi tutto**; la **logica va in gran parte ricostruita** sopra Next.js + Supabase.
Il grosso del lavoro di refactoring è: (1) estrarre colori/UI in token e componenti condivisi,
(2) sostituire la navigazione a `useState` con il routing, (3) collegare i dati reali.

## 1. Cosa è, in concreto

| Aspetto | Stato attuale |
|---|---|
| Origine | Applet esportata da **Google AI Studio** (brand "VELOCITY", tema racing/outlaw). |
| Stack | **Vite 6 + React 19 + TypeScript + TailwindCSS 4** (non Next.js). |
| Righe di codice `src/` | ~2.600 (6 viste da 237–495 righe, `App.tsx` 288, `data.ts` 351, `types.ts` 104). |
| Navigazione | `useState<AppView>` in `App.tsx`; 5 viste + overlay dettaglio prodotto. Nessun URL. |
| Dati | Tutti finti e sincroni in `src/data.ts` (un solo utente: "Dominic T."). |
| Stato globale | Solo il **carrello**, sollevato in `App.tsx` e passato via props. |
| Backend / Auth | Assenti. |
| i18n | Assente (stringhe inglesi hardcoded). |

### Mappa dei file

```
src/
  App.tsx                 # header, footer, nav mobile, router-a-useState, stato carrello
  main.tsx                # bootstrap React (StrictMode)
  types.ts                # interfacce condivise (ben fatte)
  data.ts                 # dati mock (profilo, eventi, prodotti, hotspot, feed)
  index.css               # @theme Tailwind + utility custom (glass, racing-grid, neon…)
  components/
    DashboardView.tsx     # 495 — home: hero, rally, mini-mappa, shop, feed, banner
    EventDetailView.tsx   # 446 — dettaglio "Canyon Run" (tutto hardcoded, evento singolo)
    GarageView.tsx        # 436 — profilo pilota + garage + telemetria simulata
    ShopView.tsx          # 380 — catalogo + filtri + carrello + finto checkout
    HotspotsMapView.tsx   # 326 — mappa radar + chat radio simulata
    ProductDetailView.tsx # 237 — dettaglio prodotto + correlati
```

## 2. Punti di forza (da conservare)

1. **TypeScript solido.** `types.ts` centralizza tutte le interfacce (`Vehicle`, `Product`,
   `Hotspot`, `DriverProfile`, `EventActivity`…). Nessun `any`, props tipizzate ovunque.
2. **Separazione dati/presentazione.** Tutti i dati vivono in `data.ts` e i componenti li
   importano: sostituirli con query Supabase è meccanico, non richiede riscrivere il markup.
3. **Design system coeso.** `index.css` definisce token di tema (`@theme`) e utility custom
   (`glass-panel`, `racing-grid`, `neon-glow-*`, `carbon-texture`). L'estetica è curata,
   coerente e distintiva — ottimo materiale per il rebranding.
4. **Pattern React corretti.** Derived state (`filteredProducts`, `activeVehicle`), controlled
   input, *lifting state up* del carrello, **cleanup degli `setInterval`** negli `useEffect`.
5. **Responsive sistematico.** Breakpoint `md`/`lg` usati con criterio, drawer mobile dedicato.
6. **Leggibilità.** Naming coerente, commenti descrittivi che spiegano l'intento di ogni sezione.
7. **Accessibilità di base presente.** `alt` sulle immagini, `label`+`input`, `type="submit"`.

## 3. Problemi (in ordine di impatto sul refactoring)

### 🔴 Critici / trasversali

1. **Colori hardcoded al posto dei token.** Il tema definisce `--color-accent-red`,
   `--color-surface-card`, ecc., ma i componenti scrivono ovunque i literal `#FF3E00`,
   `#111114`, `#050505`. Sono **centinaia di occorrenze su 6 file**: il rebranding
   VELOCITY→Marsica (nuova palette) oggi è un find/replace fragile. → Va reso *tutto* guidato
   dai token del tema.
2. **Navigazione a `useState`.** `App.tsx` gestisce le viste con uno stato locale
   (`AppView` = unione chiusa di 5 valori). Conseguenze: **niente URL, niente deep-link,
   niente back del browser, niente SSR/SEO**. Da sostituire con l'**App Router di Next**
   (già previsto in [ARCHITECTURE](./ARCHITECTURE.md) §9).
3. **Zero componenti UI riutilizzabili.** Card, heading di sezione, badge, bottoni, input
   sono re-scritti inline in ogni vista (vedi §4). `components/ui/` previsto in architettura
   **non esiste ancora**. È la causa principale della duplicazione.
4. **Nessuna i18n.** Tutte le stringhe sono inglesi e cablate nel JSX. Il progetto richiede
   **IT/EN**: le stringhe vanno estratte in file messaggi (`next-intl`).

### 🟠 Importanti

5. **Contenuti finti cablati nel markup (non solo in `data.ts`).** Molti valori sono scritti
   direttamente nel JSX: telemetria dell'hero, coordinate del footer (`34.0522° N`),
   `223`/`4 ACTIVE` nella mappa, e soprattutto **`EventDetailView` è interamente hardcoded
   su "Canyon Run"** (schedule, route SVG, requisiti). Non è guidato da dati → non scala a
   eventi reali.
6. **Navigazione fragile basata su id.** In `DashboardView` il bottone "Details" fa
   `if (rally.id === 'rally-1') → canyon-run, else → map`. Logica cablata su un id: non
   sopravvive a eventi reali con slug dinamici.
7. **Dipendenze morte / residui AI Studio.**
   - `@google/genai`: presente in `package.json`, **mai importata** → da rimuovere (in TODO).
   - `motion` (framer-motion): in dependencies, **mai importata** in nessun componente.
   - `express` + `dotenv`: presenti, ma **nessun `server.js`** nel repo (lo citano solo
     `metadata.json`/`.env.example`/script `clean`). Residui dell'ambiente AI Studio.
8. **Immagini in hotlink da Unsplash** con `referrerPolicy="no-referrer"`. Dipendenza da
   servizio esterno non controllato, nessuna ottimizzazione, rischio link rotti. → Supabase
   Storage / `next/image`.
9. **Font via `@import` Google Fonts nel CSS.** Blocca il rendering critico. Con Next si usa
   `next/font` (self-host, zero layout shift).
10. **`id` HTML fissi ovunque** (`id="dashboard-hero"`, `id="rally-card-${id}"`…). Retaggio del
    tool visuale, poco utili in React e **potenziali id duplicati** se un componente viene
    montato più volte (HTML non valido).

### 🟡 Minori / qualità

11. **Accessibilità da tastiera.** Diverse aree cliccabili sono `<div onClick>` (card prodotto,
    correlati, logo) invece di `<button>`/`<a>`: non focusabili, senza ruolo. Le checklist di
    `EventDetailView` usano `<label onClick>` con toggle manuale invece di checkbox reali.
12. **Contrasto.** Uso massiccio di testo `white/40` su fondo quasi nero: al limite dei minimi
    WCAG per testo piccolo. Da verificare in fase di rebranding palette.
13. **Simulatori decorativi sempre attivi.** `GarageView` (telemetria, `setInterval` 450 ms) e
    `HotspotsMapView` (speed/drift, 800 ms) fanno re-render continui a scopo puramente estetico.
    Con dati reali non hanno senso: **da rimuovere** (costo CPU costante).
14. **Nessuno stato async reale.** Non esistono stati di loading/errore/vuoto: i dati sono
    sincroni. Andranno introdotti con le query Supabase.
15. **Nessun tooling di qualità.** Solo `tsc --noEmit` come "lint". Manca ESLint/Prettier;
    nessun test.

## 4. Duplicazioni concrete da estrarre in `components/ui/`

Pattern ripetuti quasi identici in più file — ciascuno diventa **un componente**:

| Pattern | Dove si ripete | Componente proposto |
|---|---|---|
| Heading di sezione (barretta rossa + titolo display corsivo) | Dashboard (×4), Garage, EventDetail, ProductDetail, Shop | `<SectionHeading>` |
| Card contenitore (`bg-surface-card border border-white/5…`) | tutte le viste, decine di volte | `<Card>` / `<Panel>` |
| Bottone primario (bianco→rosso / rosso→nero) | tutte le viste | `<Button variant>` |
| Badge / pill (tipo, status, categoria) | Dashboard, Garage, Event, Shop, Map | `<Badge>` |
| Input testo mono con `focus:border-accent` | Dashboard, Shop, Event, Map | `<Input>` |
| Header "Back to…" | EventDetail, ProductDetail (identico) | `<BackButton>` |
| Overlay laterale (drawer) | menu mobile (`App`), carrello (`Shop`) | `<Drawer>` |
| Sfondo griglia/glow (`racing-grid`, `blur-3xl`) | tutte, inline | utility/wrapper condiviso |
| Pin mappa/radar | mini-mappa Dashboard (2 pin **hardcoded**) **e** Map (data-driven) | `<RadarMap>` unico |

> Nota: la mini-mappa in `DashboardView` è un **duplicato semplificato e hardcoded** della vera
> mappa in `HotspotsMapView`. Da unificare.

## 5. Performance

- **Peso morto**: `motion` e `@google/genai` non usate → vanno rimosse per non gonfiare il
  bundle. `lucide-react` è importata per singole icone (tree-shakeable, ok).
- **Re-render continui**: i due simulatori (`setInterval`) tengono attivi timer e aggiornamenti
  di stato a scopo decorativo → CPU costante su Garage e Map. Da eliminare.
- **GPU**: molti `blur-3xl` e `mix-blend-luminosity` in contemporanea pesano su mobile.
- **Rendering critico**: `@import` dei font blocca il CSS.
- **Immagini**: full-size da Unsplash senza strategia lazy/priority.
- **Dataset**: piccolo → nessuna memoizzazione necessaria *oggi*; diventerà rilevante con liste
  reali paginate.

## 6. Manutenibilità

**A favore:** tipizzazione forte, dati isolati, commenti chiari, naming coerente.

**Contro:** valori magici e colori cablati, viste monolitiche (400–500 righe), **zero componenti
condivisi**, contenuti non estratti. Risultato: ogni modifica è *trasversale e costosa* — cambiare
l'accento rosso significa toccare 6 file. Header/footer/nav vivono dentro `App.tsx` (288 righe) e
vanno estratti in `components/layout/`.

## 7. Allineamento con l'architettura target (crescita)

- **Modello dati troppo "da gioco".** `types.ts` è più ricco e gamificato dello schema DB
  target ([ARCHITECTURE](./ARCHITECTURE.md) §5): `telemetry`, `xp`/`level`, `trophies`,
  "S-Class Outlaw License", `driftScore`. Molti campi sono *flavour* non pertinenti a un club di
  raduni reale. → Va **riallineato** a `profiles/vehicles/events/…`. *(Decisione di prodotto:
  quanto tenere dell'estetica racing/outlaw nel brand Marsica.)*
- **Shop = sola vetrina "Gadget".** Deciso: **nessun acquisto, mai** (D-161): carrello e finto
  checkout di `ShopView` e lo stato `cart` in `App.tsx` vanno **rimossi del tutto**.
- **Nessun utente reale.** "Dominic T." è cablato: manca del tutto il concetto di utente
  autenticato/sessione (arriva con Supabase Auth).
- **Buona mappabilità sulle route.** La struttura a "viste" corrisponde bene alle route Next
  previste (`dashboard`, `eventi/[slug]`, `garage`, `shop`, `mappa`): ottimo punto di partenza
  per la migrazione viste → `components/features/`.

## 8. Verdetto per la migrazione (riuso vs riscrittura)

| Elemento | Riuso | Note |
|---|---|---|
| `index.css` / design system | ♻️ **Alto** | Tenere token e utility; ribrandizzare la palette. |
| `types.ts` | ♻️ Medio | Riallineare allo schema DB; togliere i campi "da gioco". |
| Markup/stile delle viste | ♻️ **Alto** | Estetica riusabile; va parametrizzata sui dati reali. |
| Logica di navigazione (`App.tsx`) | 🔁 **Riscrivere** | Sostituita dal routing Next. |
| Dati (`data.ts`) | 🔁 Sostituire | → query Supabase. |
| Carrello / checkout | ✂️ Rimuovere (MVP) | Vetrina senza pagamenti. |
| Simulatori telemetria/chat/speed | ✂️ Rimuovere | Decorativi, senza senso con dati reali. |
| `@google/genai`, `motion`, `express`, `dotenv` | ✂️ Rimuovere | Non utilizzate / residui AI Studio. |

**Stima soggettiva dello sforzo:** design ~20% da rifare, logica ~70% da (ri)costruire su
Next+Supabase. La qualità della base **abbassa il rischio** ma non elimina il lavoro strutturale.

## 9. Raccomandazioni prioritizzate (input alla Fase 4)

- **P0** — Migrare a Next App Router; estrarre header/footer/nav in `components/layout/`.
- **P0** — Introdurre `components/ui/` (Button, Card, Badge, Input, SectionHeading) e **spostare
  tutti i colori sui token** del tema prima di ribrandizzare.
- **P0** — Rendere `EventDetailView` e la mappa **data-driven**; eliminare la navigazione per id.
- **P0** — Rimuovere dipendenze morte (`@google/genai`, `motion`, `express`, `dotenv`) e i residui
  AI Studio (`metadata.json`, `server.js` fantasma).
- **P1** — Estrarre le stringhe per `next-intl`; sostituire immagini Unsplash con Storage/`next/image`;
  font via `next/font`.
- **P1** — Riallineare `types.ts` allo schema DB; rimuovere del tutto carrello/checkout (D-161).
- **P2** — Accessibilità (button/link al posto dei `div onClick`, checkbox reali, contrasto);
  aggiungere ESLint/Prettier; rimuovere i simulatori decorativi.

---

> **Prossimo passo:** presentare questa analisi e **attendere approvazione** prima di avviare la
> Fase 4 (Refactoring), come da [TODO](./TODO.md).
